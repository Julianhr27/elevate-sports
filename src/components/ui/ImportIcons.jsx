/**
 * @component ImportIcons
 * @description Iconografía premium para el módulo de importación masiva de deportistas.
 * Diseñada para el estilo FIFA/EA FC — líneas limpias, colores semánticos del sistema,
 * sin emojis ni iconos genéricos. Cada ícono tiene una variante de tamaño y color.
 *
 * @usage
 * import { UploadIcon, FileIcon, ValidationIcon, SpinnerIcon, SuccessIcon, ErrorIcon, ClearIcon } from "./ui/ImportIcons";
 * <UploadIcon size={24} color={PALETTE.neon} />
 *
 * @author @Desarrollador (Andres)
 * @version 1.0
 */

import { motion } from "framer-motion";
import { PALETTE } from "../../constants/palette";

// ── Prop types (interface-style JSDoc) ─────────────────────────────────────

/**
 * @typedef {Object} IconProps
 * @property {number}  [size=20]  - Tamaño en px
 * @property {string}  [color]    - Color del trazo (default: PALETTE.neon)
 * @property {number}  [opacity=1]
 */

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD ICON — flecha hacia arriba sobre bandeja de recepción
// Usado en: zona de drop, botón principal de carga
// ─────────────────────────────────────────────────────────────────────────────
export function UploadIcon({ size = 20, color = PALETTE.neon, opacity = 1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity, flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Bandeja inferior */}
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Flecha ascendente */}
      <polyline
        points="17 8 12 3 7 8"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="12" y1="3" x2="12" y2="15"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE CSV ICON — documento con indicador CSV
// Usado en: preview del archivo seleccionado, lista de archivos
// ─────────────────────────────────────────────────────────────────────────────
export function FileIcon({ size = 20, color = PALETTE.textMuted, opacity = 1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity, flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Cuerpo del documento */}
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Doblez esquina superior derecha */}
      <polyline
        points="14 2 14 8 20 8"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Líneas de datos (representan columnas CSV) */}
      <line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <line x1="8" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION PENDING — círculo con puntos suspensivos
// Usado en: estado "validando" antes de confirmar la importación
// ─────────────────────────────────────────────────────────────────────────────
export function ValidationPendingIcon({ size = 20, color = PALETTE.amber, opacity = 1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity, flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.75"/>
      {/* Puntos suspensivos */}
      <circle cx="8"  cy="12" r="1.2" fill={color}/>
      <circle cx="12" cy="12" r="1.2" fill={color}/>
      <circle cx="16" cy="12" r="1.2" fill={color}/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION SUCCESS — check dentro de escudo/círculo
// Usado en: filas válidas en la preview, confirmación de importación exitosa
// ─────────────────────────────────────────────────────────────────────────────
export function SuccessIcon({ size = 20, color = PALETTE.green, opacity = 1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity, flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.75"/>
      <polyline
        points="8 12 11 15 16 9"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ERROR — X dentro de círculo
// Usado en: filas con errores en la preview, fallo de importación
// ─────────────────────────────────────────────────────────────────────────────
export function ErrorIcon({ size = 20, color = PALETTE.danger, opacity = 1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity, flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.75"/>
      <line
        x1="15" y1="9" x2="9" y2="15"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <line
        x1="9" y1="9" x2="15" y2="15"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION WARNING — triángulo con signo de exclamación
// Usado en: filas con campos opcionales vacíos (no bloquean la importación)
// ─────────────────────────────────────────────────────────────────────────────
export function WarningIcon({ size = 20, color = PALETTE.amber, opacity = 1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity, flexShrink: 0 }}
      aria-hidden="true"
    >
      <path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="12" y1="9"  x2="12" y2="13" stroke={color} strokeWidth="1.75" strokeLinecap="round"/>
      <line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPINNER — ícono de carga animado con Framer Motion
// Usado en: procesamiento, validación en curso, subida al servidor
// ─────────────────────────────────────────────────────────────────────────────
export function SpinnerIcon({ size = 20, color = PALETTE.neon }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Pista del spinner */}
      <circle
        cx="12" cy="12" r="9"
        stroke={color}
        strokeWidth="1.75"
        opacity="0.2"
      />
      {/* Arco activo */}
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEAR / REMOVE — X simple (sin círculo), para limpiar selección
// Usado en: botón "quitar archivo", limpiar campo de búsqueda
// ─────────────────────────────────────────────────────────────────────────────
export function ClearIcon({ size = 16, color = PALETTE.textMuted, opacity = 1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ opacity, flexShrink: 0 }}
      aria-hidden="true"
    >
      <line x1="12" y1="4" x2="4" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="4"  y1="4" x2="12" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT BATCH — múltiples flechas hacia base de datos
// Usado en: encabezado del módulo de carga masiva
// ─────────────────────────────────────────────────────────────────────────────
export function ImportBatchIcon({ size = 24, color = PALETTE.neon, opacity = 1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity, flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Base de datos (cilindro) */}
      <ellipse cx="12" cy="18" rx="7" ry="2.5" stroke={color} strokeWidth="1.5"/>
      <path d="M5 18v-4M19 18v-4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="12" cy="14" rx="7" ry="2.5" stroke={color} strokeWidth="1.5"/>
      {/* Flecha triple descendente */}
      <path d="M9 2v6M12 2v6M15 2v6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.55"/>
      <path d="M7.5 6.5L9 8l1.5-1.5M10.5 6.5L12 8l1.5-1.5M13.5 6.5L15 8l1.5-1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE DOWNLOAD — documento con flecha hacia abajo
// Usado en: descargar plantilla CSV modelo
// ─────────────────────────────────────────────────────────────────────────────
export function TemplateDownloadIcon({ size = 20, color = PALETTE.purple, opacity = 1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity, flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Documento */}
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="14 2 14 8 20 8"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Flecha descarga */}
      <polyline
        points="9.5 14 12 17 14.5 14"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="12" y1="11" x2="12" y2="17"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAG DROP ZONE ICON — ícono principal de la zona de arrastre
// Combina nube + flecha para indicar "arrastra aquí"
// ─────────────────────────────────────────────────────────────────────────────
export function DragDropIcon({ size = 40, color = PALETTE.neon, opacity = 0.6 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{ opacity, flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Nube */}
      <path
        d="M35 30a8 8 0 1 0-2.26-15.67A12 12 0 1 0 14 30"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Flecha ascendente */}
      <polyline
        points="30 36 24 30 18 36"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="24" y1="30" x2="24" y2="44"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
