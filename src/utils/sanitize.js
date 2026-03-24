/**
 * @module sanitize
 * @description Sanitizacion centralizada con DOMPurify.
 * Bloquea XSS, event handlers, javascript: URIs, entidades HTML.
 *
 * @author @QA (Sara-QA_Seguridad)
 * @version 2.0.0
 */

import DOMPurify from "dompurify";

/** Sanitiza texto plano: strip todo HTML/scripts */
export function sanitizeText(str) {
  if (typeof str !== "string") return "";
  // DOMPurify con ALLOWED_TAGS vacio = solo texto plano
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

/** Solo digitos, espacios, +, (, ), - */
export function sanitizePhone(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[^0-9 +()-]/g, "").trim();
}

/** Lowercase + trim + strip HTML */
export function sanitizeEmail(str) {
  if (typeof str !== "string") return "";
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).toLowerCase().trim();
}

/** Sanitiza nota/textarea: permite texto pero bloquea HTML/scripts */
export function sanitizeNote(str) {
  if (typeof str !== "string") return "";
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
