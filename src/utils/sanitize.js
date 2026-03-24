/**
 * @module sanitize
 * @description Utilidades centralizadas de sanitizacion de inputs.
 * Previene XSS y caracteres peligrosos en todos los formularios.
 *
 * @author @QA (Sara-QA_Seguridad)
 * @version 1.0.0
 */

/** Strip caracteres HTML/script peligrosos */
export function sanitizeText(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>{}]/g, "");
}

/** Solo digitos, espacios, +, (, ), - */
export function sanitizePhone(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[^0-9 +()-]/g, "");
}

/** Lowercase + trim */
export function sanitizeEmail(str) {
  if (typeof str !== "string") return "";
  return str.toLowerCase().trim();
}
