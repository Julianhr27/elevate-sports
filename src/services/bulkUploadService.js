/**
 * @module bulkUploadService
 * @description Parser y validador para carga masiva de deportistas via CSV.
 * Soporta delimitadores coma y punto-y-coma, comillas RFC 4180,
 * validacion por fila, y deteccion de duplicados por documento+club_id.
 *
 * @author @Data (Mateo-Data_Engine)
 * @version 1.0.0
 */

// ── Constantes ──────────────────────────────────────────
const MAX_ROWS = 200;
const MAX_FILE_MB = 2;

const VALID_POS_CODES = [
  "POR", "DFC", "LTD", "LTI", "MCD", "MC", "MCO",
  "ED", "EI", "SD", "DC", "MP", "EXT", "CAR", "SUP", "GEN",
];

const REQUIRED_FIELDS = ["nombre", "posicion"];

// Mapeo flexible de headers (el usuario puede usar variantes)
const HEADER_ALIASES = {
  nombre: ["nombre", "name", "primer_nombre", "first_name"],
  apellido: ["apellido", "last_name", "segundo_nombre", "surname"],
  fecha_nacimiento: ["fecha_nacimiento", "dob", "nacimiento", "birth_date", "fecha_nac"],
  posicion: ["posicion", "pos", "position", "pos_code"],
  dorsal: ["dorsal", "numero", "number", "num", "numero_dorsal"],
  documento_identidad: ["documento_identidad", "documento", "doc", "cedula", "dni", "id_number"],
  contacto_emergencia: ["contacto_emergencia", "emergencia", "emergency_contact", "contacto"],
};

// ── Parser CSV ──────────────────────────────────────────

/**
 * Detecta el delimitador del CSV (coma o punto-y-coma).
 * @param {string} firstLine
 * @returns {"," | ";"}
 */
function detectDelimiter(firstLine) {
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  return semis > commas ? ";" : ",";
}

/**
 * Parsea una linea CSV respetando comillas dobles (RFC 4180).
 * @param {string} line
 * @param {string} delimiter
 * @returns {string[]}
 */
function parseCSVLine(line, delimiter) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Normaliza un header a su campo canonico.
 * @param {string} raw
 * @returns {string|null}
 */
function normalizeHeader(raw) {
  const clean = raw.toLowerCase().trim().replace(/\s+/g, "_");
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(clean)) return canonical;
  }
  return null; // campo no reconocido — se ignora
}

// ── Validacion ──────────────────────────────────────────

/**
 * Valida una fecha en formato ISO (yyyy-mm-dd) y rango razonable.
 * @param {string} val
 * @returns {string|null} mensaje de error o null si OK
 */
function validateDate(val) {
  if (!val) return null; // opcional
  const match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "Formato invalido. Usar YYYY-MM-DD";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "Fecha invalida";
  const year = d.getFullYear();
  if (year < 1950 || year > new Date().getFullYear()) return "Ano fuera de rango (1950-actual)";
  return null;
}

/**
 * Valida una fila completa.
 * @param {Object} row
 * @param {number} rowIndex
 * @returns {import('../types/bulkUpload').ValidationError[]}
 */
function validateRow(row, rowIndex) {
  const errors = [];

  // Campos requeridos
  if (!row.nombre || row.nombre.trim().length < 2) {
    errors.push({ row: rowIndex, field: "nombre", message: "Nombre es requerido (min 2 caracteres)", value: row.nombre });
  }

  // Posicion
  if (!row.posicion) {
    errors.push({ row: rowIndex, field: "posicion", message: "Posicion es requerida", value: row.posicion });
  } else if (!VALID_POS_CODES.includes(row.posicion.toUpperCase())) {
    errors.push({ row: rowIndex, field: "posicion", message: `Codigo invalido. Validos: ${VALID_POS_CODES.join(", ")}`, value: row.posicion });
  }

  // Fecha nacimiento (opcional pero si viene, validar)
  const dateErr = validateDate(row.fecha_nacimiento);
  if (dateErr) {
    errors.push({ row: rowIndex, field: "fecha_nacimiento", message: dateErr, value: row.fecha_nacimiento });
  }

  // Dorsal (opcional, 1-99)
  if (row.dorsal !== null && row.dorsal !== undefined && row.dorsal !== "") {
    const num = Number(row.dorsal);
    if (isNaN(num) || num < 1 || num > 99 || !Number.isInteger(num)) {
      errors.push({ row: rowIndex, field: "dorsal", message: "Dorsal debe ser entero entre 1 y 99", value: row.dorsal });
    }
  }

  return errors;
}

// ── API Publica ─────────────────────────────────────────

/**
 * Parsea y valida un archivo CSV completo.
 * @param {string} csvText - Contenido del archivo CSV
 * @returns {import('../types/bulkUpload').BulkUploadResult}
 */
export function parseAndValidateCSV(csvText) {
  if (!csvText || typeof csvText !== "string") {
    return { valid: [], invalid: [], totalRows: 0, summary: { validCount: 0, invalidCount: 0, duplicateCount: 0 } };
  }

  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { valid: [], invalid: [], totalRows: 0, summary: { validCount: 0, invalidCount: 0, duplicateCount: 0 } };
  }

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseCSVLine(lines[0], delimiter);
  const headers = rawHeaders.map(normalizeHeader);

  // Verificar que al menos los campos requeridos estan presentes
  for (const req of REQUIRED_FIELDS) {
    if (!headers.includes(req)) {
      return {
        valid: [],
        invalid: [],
        totalRows: 0,
        summary: { validCount: 0, invalidCount: 0, duplicateCount: 0 },
        _error: `Campo requerido "${req}" no encontrado en headers. Headers detectados: ${rawHeaders.join(", ")}`,
      };
    }
  }

  const dataLines = lines.slice(1, MAX_ROWS + 1); // cap a MAX_ROWS
  const valid = [];
  const invalid = [];
  const seenDocs = new Set();

  for (let i = 0; i < dataLines.length; i++) {
    const fields = parseCSVLine(dataLines[i], delimiter);
    const row = { _rowIndex: i + 1 };

    // Mapear campos por header
    headers.forEach((h, idx) => {
      if (h) row[h] = fields[idx] || "";
    });

    // Normalizar posicion a uppercase
    if (row.posicion) row.posicion = row.posicion.toUpperCase();

    // Parsear dorsal a numero
    if (row.dorsal && row.dorsal !== "") {
      row.dorsal = Number(row.dorsal);
    } else {
      row.dorsal = null;
    }

    // Validar
    const errors = validateRow(row, i + 1);

    // Deduplicacion por documento
    if (row.documento_identidad && row.documento_identidad.trim()) {
      const docKey = row.documento_identidad.trim().toLowerCase();
      if (seenDocs.has(docKey)) {
        errors.push({ row: i + 1, field: "documento_identidad", message: "Documento duplicado en el archivo", value: row.documento_identidad });
      } else {
        seenDocs.add(docKey);
      }
    }

    if (errors.length > 0) {
      invalid.push({ ...row, errors });
    } else {
      valid.push(row);
    }
  }

  const duplicateCount = invalid.filter(r => r.errors.some(e => e.field === "documento_identidad" && e.message.includes("duplicado"))).length;

  return {
    valid,
    invalid,
    totalRows: dataLines.length,
    summary: {
      validCount: valid.length,
      invalidCount: invalid.length,
      duplicateCount,
    },
  };
}

/**
 * Valida tamanio del archivo antes de leer.
 * @param {File} file
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateFileSize(file) {
  if (!file) return { ok: false, error: "No se selecciono archivo" };
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_MB) {
    return { ok: false, error: `Archivo excede ${MAX_FILE_MB}MB (${sizeMB.toFixed(1)}MB)` };
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["csv", "txt"].includes(ext)) {
    return { ok: false, error: "Solo se aceptan archivos .csv o .txt" };
  }
  return { ok: true };
}

/**
 * Lee un File como texto.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Error leyendo archivo"));
    reader.readAsText(file, "UTF-8");
  });
}

/**
 * Genera un CSV template de ejemplo para descarga.
 * @returns {string}
 */
export function generateTemplateCSV() {
  const headers = "nombre,apellido,fecha_nacimiento,posicion,dorsal,documento_identidad,contacto_emergencia";
  const example1 = "Carlos,Gomez,2008-03-15,DFC,4,1234567890,3001234567";
  const example2 = "Maria,Lopez,2009-07-22,MC,8,0987654321,3109876543";
  return [headers, example1, example2].join("\n");
}

export { MAX_ROWS, MAX_FILE_MB, VALID_POS_CODES };
