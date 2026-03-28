/**
 * @component BulkAthleteUploader
 * @description Módulo de carga masiva de deportistas vía CSV/delimitado.
 * Permite registrar N jugadores en un solo flujo al configurar un club.
 *
 * FLUJO:
 *   1. Drop/select de archivo CSV o TXT (delimitado por coma o punto y coma)
 *   2. Parse + validación de cada fila contra el schema de Athlete
 *   3. Preview interactivo con errores por fila resaltados
 *   4. Commit: inserción atómica con club_id inyectado en cada registro
 *
 * FORMATO CSV ESPERADO (header obligatorio):
 *   name,pos,posCode,dob,contact
 *   Carlos Pérez,Delantero,ST,2001-05-14,3001234567
 *   Ana Gómez,Portera,GK,2003-08-22,
 *
 * COLUMNAS:
 *   - name     (requerido) Nombre completo
 *   - pos      (requerido) Posición legible
 *   - posCode  (requerido) Código corto 2-3 chars
 *   - dob      (requerido) Fecha nacimiento YYYY-MM-DD
 *   - contact  (opcional)  Teléfono
 *
 * @props
 *   onCommit   {(athletes: AthleteRow[]) => void} — callback con registros válidos
 *   onCancel   {() => void}                       — cancelar y cerrar
 *   clubId     {string|number}                    — id del club para integridad referencial
 *
 * @author @Arquitecto (Carlos) — Sprint Bulk Onboarding
 * @version 1.0.0
 */

import { useState, useRef, useCallback } from "react";
import { PALETTE as C } from "../constants/palette";
import { sanitizeText, sanitizePhone } from "../utils/sanitize";

// ─── Constantes ───────────────────────────────────────────────────────────────

const REQUIRED_HEADERS = ["name", "pos", "posCode", "dob"];
const OPTIONAL_HEADERS  = ["contact"];
const ALL_HEADERS       = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];

const MAX_ROWS    = 200;  // Límite de seguridad por lote
const MAX_FILE_MB = 2;    // Máximo 2 MB

/** Posiciones válidas (posCode) — alineado con constants/formations.js */
const VALID_POS_CODES = new Set([
  "GK","CB","LB","RB","LWB","RWB",
  "CDM","CM","CAM","LM","RM",
  "LW","RW","SS","ST","CF",
]);

/** ISO date YYYY-MM-DD regex */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ─── Parser y validador ───────────────────────────────────────────────────────

/**
 * Detecta el delimitador dominante entre coma y punto y coma.
 * @param {string} firstLine - Primera línea del CSV
 * @returns {"," | ";"}
 */
function detectDelimiter(firstLine) {
  const commas     = (firstLine.match(/,/g)     || []).length;
  const semicolons = (firstLine.match(/;/g)     || []).length;
  return semicolons > commas ? ";" : ",";
}

/**
 * Parsea una línea CSV respetando campos entre comillas dobles.
 * @param {string} line
 * @param {string} delimiter
 * @returns {string[]}
 */
function parseLine(line, delimiter) {
  const result = [];
  let current  = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Valida una fila ya mapeada como objeto.
 * @param {Object} row - Fila con campos de Athlete
 * @param {number} rowIndex - Número de fila (1-based, sin header)
 * @returns {{ errors: string[] }}
 */
function validateRow(row, rowIndex) {
  const errors = [];
  const label  = `Fila ${rowIndex}`;

  if (!row.name || row.name.trim().length < 2) {
    errors.push(`${label}: "name" es requerido (mínimo 2 caracteres)`);
  }
  if (!row.pos || row.pos.trim().length < 2) {
    errors.push(`${label}: "pos" es requerido`);
  }
  if (!row.posCode) {
    errors.push(`${label}: "posCode" es requerido`);
  } else if (!VALID_POS_CODES.has(row.posCode.toUpperCase())) {
    errors.push(`${label}: "posCode" inválido (${row.posCode}). Válidos: ${[...VALID_POS_CODES].join(", ")}`);
  }
  if (!row.dob) {
    errors.push(`${label}: "dob" es requerido (YYYY-MM-DD)`);
  } else if (!ISO_DATE_RE.test(row.dob)) {
    errors.push(`${label}: "dob" debe tener formato YYYY-MM-DD (recibido: "${row.dob}")`);
  } else {
    const d = new Date(row.dob);
    const year = d.getFullYear();
    if (isNaN(d.getTime()) || year < 1940 || year > new Date().getFullYear()) {
      errors.push(`${label}: "dob" tiene una fecha fuera de rango`);
    }
  }

  return { errors };
}

/**
 * Parsea el contenido completo del CSV.
 * @param {string} content - Contenido del archivo como string
 * @returns {{ rows: ParsedRow[], parseErrors: string[], headers: string[] }}
 */
function parseCSV(content) {
  const lines       = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const parseErrors = [];

  if (lines.length < 2) {
    return { rows: [], parseErrors: ["El archivo debe tener al menos una fila de encabezado y una de datos."], headers: [] };
  }

  const delimiter  = detectDelimiter(lines[0]);
  const rawHeaders = parseLine(lines[0], delimiter).map(h => h.toLowerCase().trim());

  // Validar headers mínimos
  const missingHeaders = REQUIRED_HEADERS.filter(h => !rawHeaders.includes(h));
  if (missingHeaders.length > 0) {
    return {
      rows: [],
      parseErrors: [`Columnas requeridas faltantes: ${missingHeaders.join(", ")}. Encabezados encontrados: ${rawHeaders.join(", ")}`],
      headers: rawHeaders,
    };
  }

  const dataLines = lines.slice(1);

  if (dataLines.length > MAX_ROWS) {
    parseErrors.push(`El archivo tiene ${dataLines.length} filas. El límite por lote es ${MAX_ROWS}. Se procesarán solo las primeras ${MAX_ROWS}.`);
  }

  const rows = dataLines.slice(0, MAX_ROWS).map((line, idx) => {
    const values = parseLine(line, delimiter);
    const raw    = {};
    rawHeaders.forEach((h, i) => { raw[h] = values[i] ?? ""; });

    const mapped = {
      name:     sanitizeText(raw.name    || ""),
      pos:      sanitizeText(raw.pos     || ""),
      posCode:  (raw.poscode || raw.posCode || "").toUpperCase().trim(),
      dob:      (raw.dob || "").trim(),
      contact:  sanitizePhone(raw.contact || ""),
      // Defaults para campos no presentes en el CSV
      status:   "P",
      available: true,
      rpe:      null,
      photo:    null,
      goals:       0,
      yellowCards: 0,
      redCards:    0,
    };

    const { errors } = validateRow(mapped, idx + 1);
    return { ...mapped, _rowIndex: idx + 1, _errors: errors, _valid: errors.length === 0 };
  });

  return { rows, parseErrors, headers: rawHeaders };
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * @typedef {Object} AthleteRow
 * @property {string}  name
 * @property {string}  pos
 * @property {string}  posCode
 * @property {string}  dob
 * @property {string}  contact
 * @property {string}  status
 * @property {boolean} available
 * @property {number|null} rpe
 * @property {number}  goals
 * @property {number}  yellowCards
 * @property {number}  redCards
 * @property {number}  _rowIndex
 * @property {string[]} _errors
 * @property {boolean} _valid
 */

/**
 * @param {{ onCommit: Function, onCancel: Function, clubId: string|number }} props
 * @returns {JSX.Element}
 */
export default function BulkAthleteUploader({ onCommit, onCancel, clubId }) {
  const [stage,       setStage]       = useState("upload");   // upload | preview | committing | done
  const [dragOver,    setDragOver]    = useState(false);
  const [fileName,    setFileName]    = useState(null);
  const [rows,        setRows]        = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [headers,     setHeaders]     = useState([]);
  const [commitError, setCommitError] = useState(null);
  const fileInputRef = useRef(null);

  // ── Handlers de archivo ──────────────────────────────────────────────────

  const processFile = useCallback((file) => {
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setParseErrors([`El archivo supera el límite de ${MAX_FILE_MB} MB.`]);
      setStage("preview");
      return;
    }

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "txt"].includes(ext)) {
      setParseErrors(["Solo se aceptan archivos .csv o .txt"]);
      setStage("preview");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows: parsed, parseErrors: errs, headers: hdrs } = parseCSV(e.target.result);
      setRows(parsed);
      setParseErrors(errs);
      setHeaders(hdrs);
      setStage("preview");
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  // ── Commit ───────────────────────────────────────────────────────────────

  const handleCommit = useCallback(async () => {
    const validRows = rows.filter(r => r._valid);
    if (validRows.length === 0) return;

    setStage("committing");
    setCommitError(null);

    try {
      // Strip internal meta-fields antes de enviar
      const payload = validRows.map(({ _rowIndex, _errors, _valid, ...athlete }) => ({
        ...athlete,
        club_id: clubId,
      }));
      await onCommit(payload);
      setStage("done");
    } catch (err) {
      setCommitError(err?.message ?? "Error al importar. Intenta de nuevo.");
      setStage("preview");
    }
  }, [rows, onCommit, clubId]);

  // ── Estilos compartidos ───────────────────────────────────────────────────

  const validCount   = rows.filter(r => r._valid).length;
  const invalidCount = rows.length - validCount;

  const s = {
    overlay: {
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(5,5,10,0.85)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    },
    panel: {
      width: "100%", maxWidth: 760,
      background: "rgba(14,14,22,0.98)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderTop: `3px solid ${C.neon}`,
      borderRadius: 14,
      padding: 28,
      boxShadow: `0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(57,255,20,0.06)`,
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      gap: 20,
    },
    header: {
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    },
    title: {
      fontSize: 18, fontWeight: 800, color: "white",
      textTransform: "uppercase", letterSpacing: "-0.3px",
    },
    subtitle: {
      fontSize: 10, color: C.textMuted, textTransform: "uppercase",
      letterSpacing: "1.5px", marginTop: 4,
    },
    closeBtn: {
      fontSize: 18, color: C.textMuted, cursor: "pointer",
      padding: "2px 8px", borderRadius: 4,
      transition: "color 0.15s",
    },
  };

  // ── STAGE: upload ────────────────────────────────────────────────────────

  if (stage === "upload") {
    return (
      <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
        <div style={s.panel}>
          <div style={s.header}>
            <div>
              <div style={s.title}>Carga Masiva de Deportistas</div>
              <div style={s.subtitle}>Importa tu plantel completo desde un archivo CSV</div>
            </div>
            <div style={s.closeBtn} onClick={onCancel}>✕</div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? C.neon : "rgba(255,255,255,0.15)"}`,
              borderRadius: 10,
              padding: "40px 24px",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "rgba(57,255,20,0.04)" : "rgba(255,255,255,0.02)",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>
              {/* Upload icon SVG */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto", display: "block" }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={dragOver ? C.neon : "rgba(255,255,255,0.4)"} strokeWidth="1.5" strokeLinecap="round"/>
                <polyline points="17 8 12 3 7 8" stroke={dragOver ? C.neon : "rgba(255,255,255,0.4)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke={dragOver ? C.neon : "rgba(255,255,255,0.4)"} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: dragOver ? C.neon : "white", marginBottom: 6 }}>
              {dragOver ? "Suelta el archivo aquí" : "Arrastra tu archivo CSV aquí"}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted }}>
              o haz clic para seleccionar — .csv o .txt, máx {MAX_FILE_MB} MB
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileInput}
              style={{ display: "none" }}
            />
          </div>

          {/* Formato esperado */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            padding: "14px 16px",
          }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: C.textHint, marginBottom: 10 }}>
              Formato esperado
            </div>
            <pre style={{
              fontSize: 10, color: C.textMuted, margin: 0,
              fontFamily: "'Courier New', monospace", lineHeight: 1.7,
              overflowX: "auto",
            }}>
{`name,pos,posCode,dob,contact
Carlos Pérez,Delantero,ST,2001-05-14,3001234567
Ana Gómez,Portera,GK,2003-08-22,
Luis Torres,Defensa Central,CB,2000-11-30,3157654321`}
            </pre>
          </div>

          {/* Códigos de posición válidos */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textHint, width: "100%", marginBottom: 4 }}>
              Códigos posCode válidos
            </div>
            {[...VALID_POS_CODES].map(code => (
              <span key={code} style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
                color: C.neon, background: `${C.neon}12`,
                border: `1px solid ${C.neon}30`,
                padding: "2px 7px", borderRadius: 4,
              }}>
                {code}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── STAGE: committing ────────────────────────────────────────────────────

  if (stage === "committing") {
    return (
      <div style={s.overlay}>
        <div style={{ ...s.panel, alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{
            width: 40, height: 40,
            border: `3px solid ${C.neon}`, borderTop: "3px solid transparent",
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
          }} />
          <div style={{ fontSize: 13, color: "white", fontWeight: 600 }}>
            Importando {validCount} deportistas...
          </div>
          <div style={{ fontSize: 10, color: C.textMuted }}>
            No cierres esta ventana
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // ── STAGE: done ──────────────────────────────────────────────────────────

  if (stage === "done") {
    return (
      <div style={s.overlay}>
        <div style={{ ...s.panel, alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 44 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke={C.neon} strokeWidth="1.5"/>
              <path d="M7 12l4 4 6-7" stroke={C.neon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "-0.3px" }}>
            Importacion completada
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center" }}>
            {validCount} deportistas agregados al plantel exitosamente.
          </div>
          <button
            onClick={onCancel}
            style={{
              marginTop: 8, padding: "10px 32px",
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px",
              background: C.neon, color: "#0a0a0f",
              border: "none", borderRadius: 6, cursor: "pointer",
            }}
          >
            Listo
          </button>
        </div>
      </div>
    );
  }

  // ── STAGE: preview ───────────────────────────────────────────────────────

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.title}>
              Vista previa — {fileName}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
              <span style={{ fontSize: 10, color: C.neon, fontWeight: 700 }}>
                {validCount} válidos
              </span>
              {invalidCount > 0 && (
                <span style={{ fontSize: 10, color: C.danger, fontWeight: 700 }}>
                  {invalidCount} con errores
                </span>
              )}
              <span style={{ fontSize: 10, color: C.textMuted }}>
                {rows.length} total
              </span>
            </div>
          </div>
          <div style={s.closeBtn} onClick={onCancel}>✕</div>
        </div>

        {/* Errores de parsing globales */}
        {parseErrors.length > 0 && (
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 8, padding: "12px 16px",
          }}>
            {parseErrors.map((err, i) => (
              <div key={i} style={{ fontSize: 11, color: "#f87171", lineHeight: 1.6 }}>
                {err}
              </div>
            ))}
          </div>
        )}

        {/* Error de commit */}
        {commitError && (
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 8, padding: "12px 16px",
          }}>
            <div style={{ fontSize: 11, color: "#f87171" }}>{commitError}</div>
          </div>
        )}

        {/* Tabla de preview */}
        {rows.length > 0 && (
          <div style={{ overflowY: "auto", flex: 1, borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)", position: "sticky", top: 0 }}>
                  {["#", "Nombre", "Posición", "Cód.", "Nacimiento", "Contacto", "Estado"].map(h => (
                    <th key={h} style={{
                      padding: "8px 12px", textAlign: "left",
                      fontSize: 9, textTransform: "uppercase", letterSpacing: "1.5px",
                      color: C.textHint, fontWeight: 700,
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row._rowIndex}
                    style={{
                      background: row._valid
                        ? "transparent"
                        : "rgba(239,68,68,0.05)",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                    title={row._errors.join(" | ")}
                  >
                    <td style={{ padding: "7px 12px", color: C.textHint }}>{row._rowIndex}</td>
                    <td style={{ padding: "7px 12px", color: row._valid ? "white" : "#f87171", fontWeight: 500 }}>
                      {row.name || "—"}
                    </td>
                    <td style={{ padding: "7px 12px", color: C.textMuted }}>{row.pos || "—"}</td>
                    <td style={{ padding: "7px 12px" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "2px 6px",
                        borderRadius: 3,
                        background: row._valid ? `${C.neon}15` : "rgba(239,68,68,0.15)",
                        color: row._valid ? C.neon : "#f87171",
                        border: `1px solid ${row._valid ? `${C.neon}30` : "rgba(239,68,68,0.3)"}`,
                      }}>
                        {row.posCode || "?"}
                      </span>
                    </td>
                    <td style={{ padding: "7px 12px", color: C.textMuted }}>{row.dob || "—"}</td>
                    <td style={{ padding: "7px 12px", color: C.textMuted }}>{row.contact || "—"}</td>
                    <td style={{ padding: "7px 12px" }}>
                      {row._valid ? (
                        <span style={{ fontSize: 9, color: C.neon }}>OK</span>
                      ) : (
                        <span style={{ fontSize: 9, color: "#f87171" }} title={row._errors.join("\n")}>
                          Error ({row._errors.length})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 4 }}>
          <button
            onClick={() => { setStage("upload"); setRows([]); setParseErrors([]); setFileName(null); }}
            style={{
              padding: "9px 20px", fontSize: 11, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "1px",
              background: "transparent", color: C.textMuted,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6, cursor: "pointer",
            }}
          >
            Cargar otro archivo
          </button>
          <button
            disabled={validCount === 0}
            onClick={handleCommit}
            style={{
              padding: "9px 24px", fontSize: 11, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "1.5px",
              background: validCount > 0 ? C.neon : "rgba(255,255,255,0.1)",
              color: validCount > 0 ? "#0a0a0f" : C.textHint,
              border: "none", borderRadius: 6,
              cursor: validCount > 0 ? "pointer" : "not-allowed",
              transition: "background 0.2s",
            }}
          >
            Importar {validCount > 0 ? `${validCount} deportistas` : "(sin registros válidos)"}
          </button>
        </div>
      </div>
    </div>
  );
}
