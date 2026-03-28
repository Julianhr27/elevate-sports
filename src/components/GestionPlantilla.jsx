/**
 * @component GestionPlantilla
 * @description Módulo de gestión del plantel con dos vistas:
 *   1. LISTA   — tabla estilo FIFA con stats por jugador + panel de edición
 *   2. PIZARRA — campo táctico con formaciones + cuadro de notas lateral
 *
 * @architecture
 * GestionPlantilla (estado: tab activo, jugador seleccionado, formación, notas)
 * ├── PlayerListView   → tabla FIFA con PlayerRow + PlayerEditPanel
 * └── TacticalBoardView → campo SVG + tokens + sidebar formaciones + notas
 *
 * @props
 * - athletes    {Array}    Plantel completo desde App.jsx
 * - setAthletes {Function} Actualizador de estado global del plantel
 *
 * @state-decisions
 * - selectedPlayer se eleva a GestionPlantilla (no a cada vista)
 *   para que ambas vistas compartan el jugador seleccionado.
 * - editMode vive en PlayerEditPanel para no contaminar el estado global.
 *
 * @palette  Ver PALETTE (heredada del proyecto)
 * @version  2.0
 * @author   Elevate Sports
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TacticalBoard from "./TacticalBoard";
import BulkAthleteUploader from "./BulkAthleteUploader";
import { PALETTE } from "../constants/palette";
import { FORMATIONS_VERTICAL as FORMATIONS } from "../constants/formations";
import { getAvatarUrl, getStatusStyle } from "../utils/helpers";
import { sanitizeText, sanitizeTextFinal } from "../utils/sanitize";
import { showToast } from "./Toast";
import { insertAthlete, bulkInsertAthletes, saveTacticalData } from "../services/supabaseService";


// ─────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────
const listVariants = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const rowVariant = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 340, damping: 28 } },
};

const panelVariant = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 320, damping: 28 } },
  exit:    { opacity: 0, x: 20, transition: { duration: 0.18 } },
};

// ─────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────

/**
 * @component PlayerRow
 * @description Fila de jugador en la lista estilo FIFA.
 * Muestra: posición, número, nombre, fecha nacimiento,
 * tarjetas amarillas/rojas, goles y estado.
 *
 * @why-separate-component
 * Encapsular la fila permite aplicar hover state local
 * sin re-renderizar toda la lista.
 */
function PlayerRow({ athlete, isSelected, onSelect, index }) {
  const [hovered, setHovered] = useState(false);
  const statusStyle = getStatusStyle(athlete.status);
  const isActive = isSelected || hovered;

  return (
    <div
      onClick={() => onSelect(athlete)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         "grid",
        gridTemplateColumns: "32px 28px 1fr 80px 30px 30px 30px 60px",
        alignItems:      "center",
        padding:         "0 12px",
        height:          38,
        cursor:          "pointer",
        background:      isSelected
          ? "rgba(200,255,0,0.08)"
          : hovered
            ? "rgba(255,255,255,0.04)"
            : index % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
        borderLeft:      isSelected ? `3px solid ${PALETTE.neon}` : "3px solid transparent",
        borderBottom:    `1px solid ${PALETTE.border}`,
        transition:      "background 150ms ease",
      }}
    >
      {/* Posición */}
      <div style={{ fontSize:10, color: isActive ? PALETTE.neon : PALETTE.textMuted, fontWeight:700, textTransform:"uppercase" }}>
        {athlete.posCode}
      </div>

      {/* Número de dorsal */}
      <div style={{ fontSize:12, fontWeight:700, color: isActive ? PALETTE.text : PALETTE.textMuted, textAlign:"center" }}>
        {athlete.id}
      </div>

      {/* Nombre completo */}
      <div style={{ fontSize:11, color: isActive ? PALETTE.text : "rgba(255,255,255,0.7)", fontWeight: isSelected ? 600 : 400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {athlete.name}
      </div>

      {/* Fecha de nacimiento */}
      <div style={{ fontSize:9, color: PALETTE.textMuted, textAlign:"center" }}>
        {athlete.dob || "—"}
      </div>

      {/* Tarjetas amarillas */}
      <div style={{ display:"flex", justifyContent:"center" }}>
        <div style={{ width:10, height:14, background: (athlete.yellowCards||0) > 0 ? "#f0c030" : "rgba(255,255,255,0.1)", borderRadius:1, fontSize:8, color:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
          {athlete.yellowCards || 0}
        </div>
      </div>

      {/* Tarjetas rojas */}
      <div style={{ display:"flex", justifyContent:"center" }}>
        <div style={{ width:10, height:14, background: (athlete.redCards||0) > 0 ? PALETTE.danger : "rgba(255,255,255,0.1)", borderRadius:1, fontSize:8, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
          {athlete.redCards || 0}
        </div>
      </div>

      {/* Goles */}
      <div style={{ fontSize:11, color: (athlete.goals||0) > 0 ? PALETTE.neon : PALETTE.textMuted, textAlign:"center", fontWeight:700 }}>
        {athlete.goals || 0}
      </div>

      {/* Estado */}
      <div style={{ fontSize:9, color: statusStyle.color, textTransform:"uppercase", letterSpacing:"0.5px", textAlign:"right" }}>
        {statusStyle.label}
      </div>
    </div>
  );
}

/**
 * @component PlayerEditPanel
 * @description Panel lateral derecho para ver y editar
 * la ficha completa de un jugador seleccionado.
 * Tiene dos modos: vista (lectura) y edición.
 *
 * @why-edit-mode-local
 * El modo de edición es transitorio y solo relevante
 * para este panel — no necesita subir al estado global.
 * Solo al "Guardar" se propaga el cambio hacia arriba.
 */
function PlayerEditPanel({ athlete, onUpdate, onClose }) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft]       = useState({ ...athlete });

  if (!athlete) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color: PALETTE.textHint, gap:12 }}>
      <div style={{ fontSize:28, opacity:0.3 }}>👤</div>
      <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"1.5px" }}>Selecciona un jugador</div>
    </div>
  );

  const statusStyle = getStatusStyle(draft.status);

  /** Persiste los cambios del draft hacia App.jsx */
  const handleSave = () => {
    onUpdate(draft);
    setEditMode(false);
  };

  /** Descarta cambios y vuelve al modo vista */
  const handleCancel = () => {
    setDraft({ ...athlete });
    setEditMode(false);
  };

  const fieldStyle = {
    background:  editMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
    border:      editMode ? `1px solid ${PALETTE.neonBorder}` : "1px solid rgba(255,255,255,0.06)",
    padding:     "6px 10px",
    fontSize:    11,
    color:       PALETTE.text,
    fontFamily:  "inherit",
    outline:     "none",
    width:       "100%",
    transition:  "border 200ms",
  };

  const sectionTitle = {
    fontSize:      9,
    textTransform: "uppercase",
    letterSpacing: "2px",
    color:         PALETTE.textHint,
    marginBottom:  10,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>

      {/* Header del panel */}
      <div style={{ padding:"14px 16px", background:"rgba(0,0,0,0.5)", borderBottom:`1px solid ${PALETTE.border}`, display:"flex", alignItems:"flex-start", gap:12 }}>
        <img
          src={getAvatarUrl(draft.photo)}
          alt={draft.name}
          style={{ width:64, height:64, borderRadius:"50%", border:`2px solid ${PALETTE.neon}`, objectFit:"cover", flexShrink:0 }}
        />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:PALETTE.text, textTransform:"uppercase", letterSpacing:"-0.3px", lineHeight:1.1 }}>{draft.name}</div>
          <div style={{ fontSize:10, color: PALETTE.neon, textTransform:"uppercase", letterSpacing:"1px", marginTop:3 }}>{draft.pos}</div>
          <div style={{ fontSize:9, color: statusStyle.color, textTransform:"uppercase", letterSpacing:"0.5px", marginTop:2 }}>{statusStyle.label}</div>
        </div>
        <div onClick={onClose} style={{ fontSize:16, color: PALETTE.textMuted, cursor:"pointer", padding:"2px 6px" }}>✕</div>
      </div>

      {/* Valoración (V2 con partidos) */}
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${PALETTE.border}` }}>
        <div style={sectionTitle}>Valoración general</div>
        <div style={{ background:"rgba(200,255,0,0.06)", border:`1px solid ${PALETTE.neonBorder}`, padding:"8px 12px", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:28, fontWeight:900, color: PALETTE.neon, lineHeight:1 }}>—</div>
          <div style={{ fontSize:9, color: PALETTE.textMuted, lineHeight:1.6 }}>
            Se genera automáticamente<br/>con partidos registrados (V2)
          </div>
        </div>
      </div>

      {/* Métricas del ciclo */}
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${PALETTE.border}` }}>
        <div style={sectionTitle}>Métricas del ciclo</div>
        {[
          { label:"Asistencia", value:"100%", pct:100, color: PALETTE.green  },
          { label:"RPE prom.",  value: draft.rpe ?? "—", pct:(draft.rpe||0)*10, color: PALETTE.amber  },
        ].map(m => (
          <div key={m.label} style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:10, color: PALETTE.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{m.label}</span>
              <span style={{ fontSize:11, fontWeight:600, color:m.color }}>{m.value}</span>
            </div>
            <div style={{ height:3, background:"rgba(255,255,255,0.08)", borderRadius:2 }}>
              <div style={{ width:`${m.pct}%`, height:"100%", background:m.color, borderRadius:2 }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Ficha editable */}
      <div style={{ padding:"12px 16px", flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={sectionTitle}>Información del jugador</div>
          {!editMode && (
            <div
              onClick={() => setEditMode(true)}
              style={{ fontSize:9, color: PALETTE.neon, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", border:`1px solid ${PALETTE.neonBorder}`, padding:"3px 10px" }}
            >
              Editar
            </div>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { label:"Nombre completo", key:"name",    type:"text"   },
            { label:"Posición",        key:"pos",     type:"text"   },
            { label:"Número dorsal",   key:"id",      type:"number" },
            { label:"Fecha nacimiento",key:"dob",     type:"date"   },
            { label:"Contacto",        key:"contact", type:"text"   },
            { label:"Goles",           key:"goals",   type:"number" },
            { label:"T. Amarillas",    key:"yellowCards", type:"number" },
            { label:"T. Rojas",        key:"redCards",    type:"number" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color: PALETTE.textHint, marginBottom:3 }}>{label}</div>
              {editMode ? (
                <input
                  type={type}
                  value={draft[key] ?? ""}
                  onChange={e => setDraft(prev => ({ ...prev, [key]: type === "number" ? +e.target.value : e.target.value }))}
                  style={fieldStyle}
                />
              ) : (
                <div style={{ ...fieldStyle, color: draft[key] ? PALETTE.text : PALETTE.textHint }}>
                  {draft[key] || "—"}
                </div>
              )}
            </div>
          ))}

          {/* Estado — siempre editable como select */}
          <div>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color: PALETTE.textHint, marginBottom:3 }}>Estado</div>
            {editMode ? (
              <select
                value={draft.status}
                onChange={e => setDraft(prev => ({ ...prev, status: e.target.value }))}
                style={{ ...fieldStyle, background:"rgba(255,255,255,0.06)" }}
              >
                <option value="P">Disponible</option>
                <option value="A">Ausente</option>
                <option value="L">Lesionado</option>
              </select>
            ) : (
              <div style={{ ...fieldStyle, color: statusStyle.color }}>{statusStyle.label}</div>
            )}
          </div>
        </div>

        {/* Acciones de edición */}
        {editMode && (
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <div
              onClick={handleSave}
              style={{ flex:1, padding:9, background: PALETTE.neon, color:"#0a0a0a", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", textAlign:"center" }}
            >
              Guardar
            </div>
            <div
              onClick={handleCancel}
              style={{ flex:1, padding:9, background:"transparent", border:`1px solid rgba(255,255,255,0.15)`, color: PALETTE.textMuted, fontSize:10, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", textAlign:"center" }}
            >
              Cancelar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Posiciones disponibles (16 pos_codes del dominio) ───────────────────────
const POS_OPTIONS = [
  { code: "GK",  label: "Portero (GK)"            },
  { code: "CB",  label: "Defensa central (CB)"    },
  { code: "LB",  label: "Lateral izquierdo (LB)"  },
  { code: "RB",  label: "Lateral derecho (RB)"    },
  { code: "LWB", label: "Carrilero izq. (LWB)"    },
  { code: "RWB", label: "Carrilero der. (RWB)"    },
  { code: "CDM", label: "Mediocampista def. (CDM)" },
  { code: "CM",  label: "Mediocampista (CM)"       },
  { code: "CAM", label: "Mediapunta (CAM)"         },
  { code: "LM",  label: "Extremo izq. med. (LM)"  },
  { code: "RM",  label: "Extremo der. med. (RM)"  },
  { code: "LW",  label: "Extremo izquierdo (LW)"  },
  { code: "RW",  label: "Extremo derecho (RW)"    },
  { code: "SS",  label: "Segundo delantero (SS)"  },
  { code: "ST",  label: "Delantero centro (ST)"   },
  { code: "CF",  label: "Centro delantero (CF)"   },
];

const EMPTY_DRAFT = {
  nombre: "", apellido: "", posCode: "ST",
  dorsal: "", dob: "", contacto: "", documento: "",
};

/**
 * @component AddAthleteModal
 * @description Modal glassmorphism para crear un deportista individual.
 * Usa sanitizeText en onChange y sanitizeTextFinal en submit.
 * Llama a insertAthlete() de supabaseService y actualiza estado local.
 */
function AddAthleteModal({ onClose, onSave }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    const value = (field === "dob")
      ? e.target.value
      : sanitizeText(e.target.value);
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    const nombre   = sanitizeTextFinal(draft.nombre);
    const apellido = sanitizeTextFinal(draft.apellido);
    if (!nombre || nombre.length < 2) errs.nombre = "Obligatorio";
    if (!apellido || apellido.length < 2) errs.apellido = "Obligatorio";
    if (!draft.posCode) errs.posCode = "Obligatorio";
    if (draft.dorsal && (isNaN(+draft.dorsal) || +draft.dorsal < 1 || +draft.dorsal > 99))
      errs.dorsal = "1–99";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    const posOpt = POS_OPTIONS.find((p) => p.code === draft.posCode);
    const newAthlete = {
      name:               `${sanitizeTextFinal(draft.nombre)} ${sanitizeTextFinal(draft.apellido)}`.trim(),
      pos:                posOpt?.label || draft.posCode,
      posCode:            draft.posCode,
      id:                 draft.dorsal ? +draft.dorsal : Math.floor(Math.random() * 900) + 100,
      dob:                draft.dob || null,
      contact:            sanitizeTextFinal(draft.contacto) || "",
      documento_identidad: sanitizeTextFinal(draft.documento) || "",
      status:             "P",
      available:          true,
      goals:              0,
      yellowCards:        0,
      redCards:           0,
    };

    // Intentar persistir en Supabase; si no hay conexion, solo local
    const saved = await insertAthlete(newAthlete);
    if (saved) {
      onSave(saved);
      showToast(`Deportista ${newAthlete.name} creado en la nube`, "success");
    } else {
      // Fallback offline-first
      onSave({ ...newAthlete, _localOnly: true });
      showToast(`Deportista ${newAthlete.name} guardado localmente`, "info");
    }
    setSaving(false);
    onClose();
  };

  const fieldStyle = (hasErr) => ({
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${hasErr ? PALETTE.danger : "rgba(255,255,255,0.12)"}`,
    padding: "8px 12px", fontSize: 12,
    color: PALETTE.text, fontFamily: "inherit",
    outline: "none", width: "100%", boxSizing: "border-box",
    borderRadius: 4, transition: "border-color 200ms",
  });

  const labelStyle = (hasErr) => ({
    fontSize: 8, textTransform: "uppercase", letterSpacing: "1.2px",
    color: hasErr ? PALETTE.danger : PALETTE.textHint,
    marginBottom: 5, fontWeight: 600,
    display: "block",
  });

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        style={{
          background: "rgba(12,12,22,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderTop: `2px solid ${PALETTE.neon}`,
          borderRadius: 10,
          width: "100%", maxWidth: 520,
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "18px 24px 14px",
          borderBottom: `1px solid ${PALETTE.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: PALETTE.text }}>
              Agregar deportista
            </div>
            <div style={{ fontSize: 9, color: PALETTE.textHint, textTransform: "uppercase", letterSpacing: "1.5px", marginTop: 3 }}>
              Nuevo registro en el plantel
            </div>
          </div>
          <div
            onClick={onClose}
            style={{ fontSize: 16, color: PALETTE.textMuted, cursor: "pointer", padding: "4px 8px" }}
          >
            ✕
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle(!!errors.nombre)}>Nombre *</label>
              <input type="text" placeholder="Julian" value={draft.nombre} onChange={set("nombre")} style={fieldStyle(!!errors.nombre)} />
              {errors.nombre && <div style={{ fontSize: 9, color: PALETTE.danger, marginTop: 4 }}>{errors.nombre}</div>}
            </div>
            <div>
              <label style={labelStyle(!!errors.apellido)}>Apellido *</label>
              <input type="text" placeholder="Perez" value={draft.apellido} onChange={set("apellido")} style={fieldStyle(!!errors.apellido)} />
              {errors.apellido && <div style={{ fontSize: 9, color: PALETTE.danger, marginTop: 4 }}>{errors.apellido}</div>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 16 }}>
            <div>
              <label style={labelStyle(!!errors.posCode)}>Posicion *</label>
              <select
                value={draft.posCode}
                onChange={set("posCode")}
                style={{ ...fieldStyle(!!errors.posCode), background: "rgba(20,20,32,0.95)", cursor: "pointer" }}
              >
                {POS_OPTIONS.map((p) => (
                  <option key={p.code} value={p.code}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle(!!errors.dorsal)}>Dorsal</label>
              <input type="number" min="1" max="99" placeholder="10" value={draft.dorsal} onChange={set("dorsal")} style={fieldStyle(!!errors.dorsal)} />
              {errors.dorsal && <div style={{ fontSize: 9, color: PALETTE.danger, marginTop: 4 }}>{errors.dorsal}</div>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle(false)}>Fecha de nacimiento</label>
              <input type="date" value={draft.dob} onChange={set("dob")} style={fieldStyle(false)} />
            </div>
            <div>
              <label style={labelStyle(false)}>Contacto</label>
              <input type="text" placeholder="+57 300 0000000" value={draft.contacto} onChange={set("contacto")} style={fieldStyle(false)} />
            </div>
          </div>

          <div>
            <label style={labelStyle(false)}>Documento de identidad</label>
            <input type="text" placeholder="1234567890" value={draft.documento} onChange={set("documento")} style={fieldStyle(false)} />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px 18px",
          borderTop: `1px solid ${PALETTE.border}`,
          display: "flex", gap: 10,
        }}>
          <motion.div
            onClick={saving ? undefined : handleSave}
            whileHover={saving ? {} : { scale: 1.02 }}
            whileTap={saving ? {} : { scale: 0.98 }}
            style={{
              flex: 1, padding: "10px 0",
              background: saving ? `${PALETTE.neon}60` : PALETTE.neon,
              color: "#0a0a0a", fontSize: 11, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "1.5px",
              cursor: saving ? "not-allowed" : "pointer",
              textAlign: "center", borderRadius: 4,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: 12, height: 12,
                  border: "2px solid #0a0a0a",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                Guardando...
              </>
            ) : "Guardar deportista"}
          </motion.div>
          <div
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: `1px solid rgba(255,255,255,0.15)`,
              color: PALETTE.textMuted, fontSize: 11,
              textTransform: "uppercase", letterSpacing: "1px",
              cursor: "pointer", textAlign: "center", borderRadius: 4,
            }}
          >
            Cancelar
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * @component BulkUploaderModal
 * @description Wrapper modal para BulkAthleteUploader.
 * Conecta onCommit con bulkInsertAthletes() de supabaseService.
 */
function BulkUploaderModal({ onClose, onSaveAll }) {
  const handleCommit = async (validRows) => {
    if (!validRows.length) { showToast("No hay filas validas para importar", "warning"); return; }

    const result = await bulkInsertAthletes(validRows, "import.csv", 0);
    if (result.success) {
      showToast(`${result.inserted} deportistas importados correctamente`, "success");
      // Convertir filas al schema local y propagar al estado
      const newAthletes = validRows.map((r, i) => ({
        name: `${r.nombre || ""} ${r.apellido || ""}`.trim() || r.name || "",
        pos: r.posicion || r.pos || "General",
        posCode: r.posicion || r.posCode || "GEN",
        id: r.dorsal || (200 + i),
        dob: r.fecha_nacimiento || r.dob || null,
        contact: r.contacto_emergencia || r.contact || "",
        status: "P", available: true,
        goals: 0, yellowCards: 0, redCards: 0,
      }));
      onSaveAll(newAthletes);
    } else {
      showToast(`Error en importacion: ${result.errors.join(", ")}`, "error");
    }
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.80)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        style={{
          width: "100%", maxWidth: 760,
          background: "rgba(12,12,22,0.98)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderTop: `2px solid ${PALETTE.purple}`,
          borderRadius: 10,
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 22px",
          borderBottom: `1px solid ${PALETTE.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: PALETTE.text }}>
            Importar deportistas desde CSV
          </div>
          <div onClick={onClose} style={{ fontSize: 16, color: PALETTE.textMuted, cursor: "pointer", padding: "2px 8px" }}>✕</div>
        </div>
        <div style={{ padding: "16px 22px 22px" }}>
          <BulkAthleteUploader
            onCommit={handleCommit}
            onCancel={onClose}
          />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * @component PlayerListView
 * @description Vista de lista completa del plantel estilo FIFA.
 * Columnas: posición, número, nombre, fecha nacimiento,
 * tarjetas amarillas/rojas, goles, estado.
 * Panel derecho: edición del jugador seleccionado.
 */
function PlayerListView({ athletes, onUpdateAthlete, onAddAthlete, onAddBulk }) {
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [sortKey, setSortKey]                 = useState("posCode");
  const [filterStatus, setFilterStatus]       = useState("all");
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showBulkModal, setShowBulkModal]     = useState(false);

  // Ordena y filtra la lista de forma derivada (sin estado extra)
  const displayedAthletes = [...athletes]
    .filter(a => filterStatus === "all" || a.status === filterStatus)
    .sort((a, b) => {
      if (sortKey === "name")    return a.name.localeCompare(b.name);
      if (sortKey === "posCode") return a.posCode.localeCompare(b.posCode);
      if (sortKey === "goals")   return (b.goals || 0) - (a.goals || 0);
      return 0;
    });

  const headerCell = (label, key) => ({
    fontSize:      8,
    textTransform: "uppercase",
    letterSpacing: "1px",
    color:         sortKey === key ? PALETTE.neon : PALETTE.textHint,
    cursor:        "pointer",
    fontWeight:    sortKey === key ? 700 : 400,
  });

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", height:"100%", minHeight:0 }}>

      {/* ── LISTA ─────────────────────────────── */}
      <div style={{ display:"flex", flexDirection:"column", minHeight:0 }}>

        {/* Controles de filtro, orden y acciones */}
        <div style={{ padding:"8px 12px", background:"rgba(10,10,15,0.85)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${PALETTE.border}`, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ fontSize:9, color: PALETTE.textMuted, textTransform:"uppercase", letterSpacing:"1px" }}>
            {displayedAthletes.length} jugadores
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {[["all","Todos"],["P","Disponibles"],["L","Lesionados"],["A","Ausentes"]].map(([v,l]) => (
              <div
                key={v}
                onClick={() => setFilterStatus(v)}
                style={{ fontSize:9, padding:"3px 10px", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.5px", background: filterStatus===v ? PALETTE.neonDim : "transparent", border:`1px solid ${filterStatus===v ? PALETTE.neon : "rgba(255,255,255,0.12)"}`, color: filterStatus===v ? PALETTE.neon : PALETTE.textMuted }}
              >
                {l}
              </div>
            ))}
          </div>
          {/* Action buttons — pushed to the right */}
          <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
            <motion.div
              onClick={() => setShowBulkModal(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                fontSize: 9, padding: "4px 12px", cursor: "pointer",
                textTransform: "uppercase", letterSpacing: "1px",
                background: "transparent",
                border: `1px solid ${PALETTE.purple}`,
                color: PALETTE.purple, borderRadius: 3,
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={PALETTE.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Importar CSV
            </motion.div>
            <motion.div
              onClick={() => setShowAddModal(true)}
              whileHover={{ scale: 1.03, boxShadow: `0 0 12px ${PALETTE.neonGlow}` }}
              whileTap={{ scale: 0.97 }}
              style={{
                fontSize: 9, padding: "4px 14px", cursor: "pointer",
                textTransform: "uppercase", letterSpacing: "1px",
                background: PALETTE.neon,
                border: "none",
                color: "#0a0a0a", borderRadius: 3, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Agregar deportista
            </motion.div>
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showAddModal && (
            <AddAthleteModal
              onClose={() => setShowAddModal(false)}
              onSave={(newAthlete) => {
                onAddAthlete(newAthlete);
                setShowAddModal(false);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showBulkModal && (
            <BulkUploaderModal
              onClose={() => setShowBulkModal(false)}
              onSaveAll={(newAthletes) => {
                onAddBulk(newAthletes);
                setShowBulkModal(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Cabecera de la tabla */}
        <div style={{ display:"grid", gridTemplateColumns:"32px 28px 1fr 80px 30px 30px 30px 60px", padding:"6px 12px", background:"rgba(0,0,0,0.6)", borderBottom:`1px solid ${PALETTE.border}` }}>
          <div onClick={() => setSortKey("posCode")} style={headerCell("POS","posCode")}>POS</div>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color: PALETTE.textHint, textAlign:"center" }}>#</div>
          <div onClick={() => setSortKey("name")} style={headerCell("Nombre","name")}>Nombre</div>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color: PALETTE.textHint, textAlign:"center" }}>Nacimiento</div>
          <div style={{ fontSize:8, color:"#f0c030", textAlign:"center" }}>🟨</div>
          <div style={{ fontSize:8, color: PALETTE.danger, textAlign:"center" }}>🟥</div>
          <div onClick={() => setSortKey("goals")} style={{ ...headerCell("GOL","goals"), textAlign:"center" }}>GOL</div>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color: PALETTE.textHint, textAlign:"right" }}>Estado</div>
        </div>

        {/* Filas de jugadores — staggered entry */}
        <motion.div
          variants={listVariants}
          initial="initial"
          animate="animate"
          style={{ flex:1, overflowY:"auto" }}
        >
          {displayedAthletes.map((a, i) => (
            <motion.div key={a.id} variants={rowVariant}>
              <PlayerRow
                athlete={a}
                index={i}
                isSelected={selectedAthlete?.id === a.id}
                onSelect={setSelectedAthlete}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── PANEL EDICIÓN — slide in from right ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedAthlete?.id ?? "empty"}
          variants={panelVariant}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderLeft:`1px solid ${PALETTE.border}` }}
        >
          <PlayerEditPanel
            athlete={selectedAthlete}
            onUpdate={(updated) => {
              onUpdateAthlete(updated);
              setSelectedAthlete(updated);
            }}
            onClose={() => setSelectedAthlete(null)}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * @component TacticalBoardView
 * @description Vista de pizarra táctica con campo de fútbol,
 * tokens de jugadores, selector de formaciones y cuadro de notas.
 */
function TacticalBoardView({ athletes }) {
  const [formation,    setFormation]    = useState("4-3-3");
  const [selectedIdx,  setSelectedIdx]  = useState(null);
  const [tacticalNote, setTacticalNote] = useState("");
  const [savingTactics, setSavingTactics] = useState(false);
  const [exportingPDF,  setExportingPDF]  = useState(false);
  const fieldRef = useRef(null);

  /** Guarda formacion y notas en Supabase */
  const handleSaveFormation = async () => {
    if (savingTactics) return;
    setSavingTactics(true);
    const starters = athletes.filter(a => a.available).slice(0, 11);
    const rolesData = starters.reduce((acc, a, i) => {
      acc[i] = { id: a.id, name: a.name, posCode: a.posCode };
      return acc;
    }, {});
    const ok = await saveTacticalData(rolesData, tacticalNote, formation);
    showToast(ok ? "Formacion guardada correctamente" : "Guardado localmente (sin conexion)", ok ? "success" : "info");
    setSavingTactics(false);
  };

  /** Exporta el campo tactico como imagen PNG usando html2canvas */
  const handleExportPDF = async () => {
    if (exportingPDF) return;
    setExportingPDF(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const target = document.getElementById("tactical-field-capture");
      if (!target) { showToast("No se encontro el campo para exportar", "error"); setExportingPDF(false); return; }
      const canvas = await html2canvas(target, { backgroundColor: "#0a1f08", scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `formacion-${formation}-${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast("Imagen exportada correctamente", "success");
    } catch (err) {
      showToast("Error al exportar — intenta de nuevo", "error");
    }
    setExportingPDF(false);
  };

  const starters   = athletes.filter(a => a.available).slice(0, 11);
  const bench      = athletes.filter((_, i) => i >= 11).slice(0, 7);
  const positions  = FORMATIONS[formation];
  const selected   = selectedIdx !== null ? starters[selectedIdx] : null;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"170px 1fr 220px", height:"100%", minHeight:0 }}>

      {/* ── SIDEBAR IZQ: formaciones + suplentes ── */}
      <div style={{ background: PALETTE.surface, borderRight:`1px solid ${PALETTE.border}`, display:"flex", flexDirection:"column", overflowY:"auto" }}>

        <div style={{ padding:"10px 14px 6px" }}>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textHint, marginBottom:8 }}>Formación activa</div>
          {Object.keys(FORMATIONS).map(f => (
            <div
              key={f}
              onClick={() => { setFormation(f); setSelectedIdx(null); }}
              style={{ padding:"7px 10px", fontSize:11, color: formation===f ? PALETTE.neon : PALETTE.textMuted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${PALETTE.border}`, background: formation===f ? PALETTE.neonDim : "transparent", borderLeft: formation===f ? `2px solid ${PALETTE.neon}` : "2px solid transparent", marginBottom:1 }}
            >
              {f}
              {formation===f && <span style={{ fontSize:8, color: PALETTE.neon }}>●</span>}
            </div>
          ))}
        </div>

        <div style={{ padding:"10px 14px 6px", borderTop:`1px solid ${PALETTE.border}`, marginTop:4 }}>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textHint, marginBottom:8 }}>Suplentes</div>
          {bench.map(a => (
            <div key={a.id} style={{ padding:"6px 8px", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid rgba(255,255,255,0.04)`, cursor:"pointer" }}>
              <img
                src={getAvatarUrl(a.photo)}
                alt={a.name}
                style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover", border:`1px solid ${a.status==="L" ? PALETTE.danger : "rgba(255,255,255,0.12)"}` }}
              />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name.split(" ")[0]}</div>
                <div style={{ fontSize:7, color: PALETTE.textHint, textTransform:"uppercase" }}>{a.posCode}</div>
              </div>
              <div style={{ width:5, height:5, borderRadius:"50%", background: getStatusStyle(a.status).color, flexShrink:0 }}/>
            </div>
          ))}
        </div>
      </div>

      {/* ── CAMPO TÁCTICO ─────────────────────── */}
      <div id="tactical-field-capture" style={{ display:"flex", flexDirection:"column", minHeight:0 }}>
        <div style={{ padding:"8px 14px", background:"rgba(0,0,0,0.7)", borderBottom:`1px solid ${PALETTE.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textMuted }}>
            Formación {formation}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <motion.div
              onClick={handleSaveFormation}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                fontSize: 9, padding: "4px 12px",
                background: "transparent",
                border: `1px solid rgba(255,255,255,0.18)`,
                color: savingTactics ? PALETTE.neon : PALETTE.textMuted,
                cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {savingTactics ? "Guardando..." : "Guardar"}
            </motion.div>
            <motion.div
              onClick={() => showToast("Modulo 'Usar en partido' — Proximo en V9", "info")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                fontSize: 9, padding: "4px 12px",
                background: PALETTE.neon, color: "#0a0a0a",
                cursor: "pointer", textTransform: "uppercase",
                letterSpacing: "1px", fontWeight: 700,
              }}
            >
              Usar en partido →
            </motion.div>
          </div>
        </div>

        <div style={{ position:"relative", flex:1 }}>
          {/* Campo SVG */}
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} viewBox="0 0 500 560" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0a1f08"/>
                <stop offset="50%"  stopColor="#0d2a0a"/>
                <stop offset="100%" stopColor="#0a1f08"/>
              </linearGradient>
            </defs>
            <rect width="500" height="560" fill="url(#grass)"/>
            {/* Franjas de césped alternadas */}
            {[0,1,2,3,4,5,6].map(i => (
              <rect key={i} x="0" y={i*80} width="500" height="40" fill="rgba(255,255,255,0.015)"/>
            ))}
            {/* Líneas del campo */}
            <rect x="25" y="15" width="450" height="530" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2"/>
            <line x1="25" y1="280" x2="475" y2="280" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
            <circle cx="250" cy="280" r="65" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"/>
            <circle cx="250" cy="280" r="3" fill="rgba(255,255,255,0.3)"/>
            {/* Área grande */}
            <rect x="25" y="155" width="150" height="210" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"/>
            <rect x="325" y="155" width="150" height="210" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"/>
            {/* Área pequeña */}
            <rect x="25" y="210" width="62" height="100" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            <rect x="413" y="210" width="62" height="100" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            {/* Puntos de penalti */}
            <circle cx="105" cy="280" r="3" fill="rgba(255,255,255,0.2)"/>
            <circle cx="395" cy="280" r="3" fill="rgba(255,255,255,0.2)"/>
            {/* Semicírculos de área */}
            <path d="M 175 155 A 65 65 0 0 0 175 365" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            <path d="M 325 155 A 65 65 0 0 1 325 365" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
          </svg>

          {/* Tokens de jugadores */}
          {starters.map((athlete, i) => {
            const position  = positions[i];
            if (!position) return null;
            const isSelected = selectedIdx === i;

            return (
              <div
                key={athlete.id}
                onClick={() => setSelectedIdx(isSelected ? null : i)}
                style={{
                  position:  "absolute",
                  left:      position.left,
                  top:       position.top,
                  transform: "translate(-50%,-50%)",
                  display:   "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap:       2,
                  cursor:    "pointer",
                  zIndex:    5,
                  // Glow en selección
                  filter:    isSelected ? `drop-shadow(0 0 6px ${PALETTE.neon})` : "none",
                  transition:"filter 200ms",
                }}
              >
                <div style={{
                  width:      52,
                  background: "rgba(5,10,5,0.95)",
                  border:     `${isSelected ? 2 : 1}px solid ${isSelected ? PALETTE.neon : "rgba(200,255,0,0.25)"}`,
                  overflow:   "hidden",
                  textAlign:  "center",
                }}>
                  <img
                    src={getAvatarUrl(athlete.photo)}
                    alt={athlete.name}
                    style={{ width:"100%", height:44, objectFit:"cover", objectPosition:"top", display:"block" }}
                  />
                  <div style={{ padding:"2px 3px 3px", background:"rgba(0,0,0,0.7)" }}>
                    <div style={{ fontSize:7, color: PALETTE.text, textTransform:"uppercase", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {athlete.name.split(" ")[0]}
                    </div>
                    <div style={{ fontSize:6, color: PALETTE.neon, textTransform:"uppercase", marginTop:1 }}>{position.posCode}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PANEL DERECHO: info + notas ─────── */}
      <div style={{ background:"rgba(0,0,0,0.88)", borderLeft:`1px solid ${PALETTE.border}`, display:"flex", flexDirection:"column" }}>

        {/* Info del jugador seleccionado en el campo */}
        {selected ? (
          <div style={{ padding:"14px 16px", borderBottom:`1px solid ${PALETTE.border}` }}>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textHint, marginBottom:10 }}>Titular seleccionado</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <img src={getAvatarUrl(selected.photo)} alt={selected.name} style={{ width:46, height:46, borderRadius:"50%", border:`2px solid ${PALETTE.neon}`, objectFit:"cover" }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color: PALETTE.text, textTransform:"uppercase" }}>{selected.name}</div>
                <div style={{ fontSize:9, color: PALETTE.neon, textTransform:"uppercase", marginTop:2 }}>{selected.pos}</div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {[
                { label:"Goles",    value: selected.goals      || 0 },
                { label:"T. Amar.", value: selected.yellowCards || 0, color:"#f0c030" },
                { label:"T. Rojas", value: selected.redCards   || 0, color: PALETTE.danger },
                { label:"RPE prom.",value: selected.rpe        || "—" },
              ].map(m => (
                <div key={m.label} style={{ background:"rgba(255,255,255,0.04)", padding:"6px 8px" }}>
                  <div style={{ fontSize:7, color: PALETTE.textHint, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:2 }}>{m.label}</div>
                  <div style={{ fontSize:14, fontWeight:700, color: m.color || PALETTE.text }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding:"14px 16px", borderBottom:`1px solid ${PALETTE.border}` }}>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textHint, marginBottom:8 }}>Toca un jugador en el campo</div>
            <div style={{ fontSize:11, color: PALETTE.textHint, opacity:0.5 }}>para ver sus datos</div>
          </div>
        )}

        {/* Cuadro de notas tácticas */}
        <div style={{ flex:1, padding:"12px 16px", display:"flex", flexDirection:"column" }}>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textHint, marginBottom:8 }}>Notas tácticas</div>
          <textarea
            value={tacticalNote}
            onChange={e => setTacticalNote(e.target.value)}
            placeholder="Anotaciones del partido, instrucciones, presión alta, bloques defensivos..."
            style={{
              flex:       1,
              background: "rgba(255,255,255,0.04)",
              border:     `1px solid ${PALETTE.border}`,
              padding:    "10px 12px",
              fontSize:   11,
              color:      PALETTE.text,
              fontFamily: "inherit",
              outline:    "none",
              resize:     "none",
              lineHeight: 1.7,
              minHeight:  120,
            }}
          />
          <div style={{ fontSize:9, color: PALETTE.textHint, marginTop:6, textAlign:"right" }}>
            {tacticalNote.length} caracteres
          </div>
        </div>

        {/* Acciones del campo */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${PALETTE.border}`, display:"flex", flexDirection:"column", gap:6 }}>
          <motion.div
            onClick={handleSaveFormation}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: 8, borderRadius: 3,
              background: savingTactics ? `${PALETTE.neon}60` : PALETTE.neon,
              color: "#0a0a0a", fontSize: 10, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "1px",
              cursor: savingTactics ? "not-allowed" : "pointer", textAlign: "center",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {savingTactics ? (
              <>
                <div style={{ width: 10, height: 10, border: "2px solid #0a0a0a", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Guardando...
              </>
            ) : "Guardar formacion"}
          </motion.div>
          <motion.div
            onClick={handleExportPDF}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: 8, borderRadius: 3,
              background: "transparent",
              border: `1px solid rgba(255,255,255,0.15)`,
              color: exportingPDF ? PALETTE.neon : PALETTE.textMuted,
              fontSize: 10, textTransform: "uppercase", letterSpacing: "1px",
              cursor: exportingPDF ? "not-allowed" : "pointer", textAlign: "center",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {exportingPDF ? (
              <>
                <div style={{ width: 10, height: 10, border: `2px solid ${PALETTE.neon}`, borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Exportando...
              </>
            ) : "Exportar imagen"}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE RAÍZ
// ─────────────────────────────────────────────
export default function GestionPlantilla({ athletes, setAthletes, historial = [] }) {
  const [activeTab, setActiveTab] = useState("lista");

  /**
   * Actualiza un jugador en el estado global.
   * Busca por ID para no depender del índice (que puede cambiar con filtros).
   */
  const handleUpdateAthlete = (updatedAthlete) => {
    setAthletes(prev =>
      prev.map(a => a.id === updatedAthlete.id ? { ...a, ...updatedAthlete } : a)
    );
  };

  /** Agrega un deportista individual al plantel */
  const handleAddAthlete = (newAthlete) => {
    setAthletes(prev => [...prev, newAthlete]);
  };

  /** Agrega multiples deportistas (carga masiva CSV) */
  const handleAddBulk = (newAthletes) => {
    setAthletes(prev => [...prev, ...newAthletes]);
  };

  const tabs = [
    { key:"lista",   label:"Plantilla"       },
    { key:"pizarra", label:"Pizarra táctica" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 80px)", minHeight:0 }}>

      {/* Tabs de navegación interna */}
      <div style={{ display:"flex", alignItems:"stretch", height:36, background:"rgba(0,0,0,0.82)", borderBottom:`1px solid ${PALETTE.border}`, flexShrink:0 }}>
        {tabs.map(({ key, label }) => (
          <div
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding:        "0 20px",
              fontSize:       10,
              textTransform:  "uppercase",
              letterSpacing:  "2px",
              color:          activeTab === key ? PALETTE.text : PALETTE.textMuted,
              display:        "flex",
              alignItems:     "center",
              cursor:         "pointer",
              borderRight:    `1px solid ${PALETTE.border}`,
              borderBottom:   activeTab === key ? `2px solid ${PALETTE.neon}` : "2px solid transparent",
              background:     activeTab === key ? PALETTE.neonDim : "transparent",
              transition:     "all 150ms",
            }}
          >
            {label}
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", padding:"0 16px", fontSize:9, color: PALETTE.textHint, textTransform:"uppercase", letterSpacing:"1px" }}>
          {athletes.length} jugadores · {athletes.filter(a=>a.status==="P").length} disponibles
        </div>
      </div>

      {/* Contenido de la tab activa */}
      <div style={{ flex:1, minHeight:0, overflow:"hidden" }}>
        {activeTab === "lista" && (
          <PlayerListView
            athletes={athletes}
            onUpdateAthlete={handleUpdateAthlete}
            onAddAthlete={handleAddAthlete}
            onAddBulk={handleAddBulk}
          />
        )}
        {activeTab === "pizarra" && (
          <TacticalBoard athletes={athletes} historial={historial} />
        )}
      </div>
    </div>
  );
}
