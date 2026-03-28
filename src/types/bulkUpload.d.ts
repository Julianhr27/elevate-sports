/**
 * @module bulkUpload types
 * @description Tipos para el modulo de carga masiva de deportistas.
 * @author @Data (Mateo-Data_Engine)
 */

/** Fila parseada del CSV antes de validacion */
export interface BulkUploadRow {
  nombre: string;
  apellido: string;
  fecha_nacimiento: string; // ISO yyyy-mm-dd
  posicion: string;         // pos_code: POR, DFC, LTD, LTI, MCD, MC, MCO, ED, EI, SD, DC, MP, EXT, CAR, SUP, GEN
  dorsal: number | null;
  documento_identidad: string;
  contacto_emergencia: string;
  /** Indice original de la fila en el archivo (1-based, excluyendo header) */
  _rowIndex: number;
}

/** Error de validacion por fila */
export interface ValidationError {
  row: number;        // indice 1-based
  field: string;      // nombre del campo
  message: string;    // descripcion legible
  value: unknown;     // valor que fallo
}

/** Resultado del parsing + validacion */
export interface BulkUploadResult {
  valid: BulkUploadRow[];
  invalid: Array<BulkUploadRow & { errors: ValidationError[] }>;
  totalRows: number;
  summary: {
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
  };
}

/** Configuracion del parser */
export interface BulkUploadConfig {
  maxRows: number;       // default 200
  maxFileMB: number;     // default 2
  delimiter: "," | ";";  // auto-detected
  requiredFields: string[];
}

/** Registro de upload para trazabilidad */
export interface BulkUploadLog {
  id?: number;
  club_id: string;
  uploaded_by: string;
  file_name: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  status: "success" | "partial" | "failed";
  error_details: ValidationError[] | null;
  created_at?: string;
}
