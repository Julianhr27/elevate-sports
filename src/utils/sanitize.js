/**
 * @module sanitize
 * @description Sanitizacion centralizada con DOMPurify.
 * Bloquea XSS, event handlers, javascript: URIs, entidades HTML.
 *
 * IMPORTANTE — Política de trim():
 * sanitizeText NO hace trim() en tiempo real para no bloquear el caracter
 * espacio (ASCII 32) mientras el usuario escribe nombres compuestos.
 * El trim() se aplica únicamente en sanitizeTextFinal(), que se usa
 * en el momento de submit/persistencia, nunca en onChange handlers.
 *
 * @author @QA (Sara-QA_Seguridad)
 * @version 2.1.0
 */

import DOMPurify from "dompurify";

/**
 * Sanitiza texto plano en tiempo real (onChange).
 * NO hace trim() — preserva espacios mientras el usuario escribe.
 * Bloquea XSS, HTML y scripts.
 *
 * @param {string} str - Valor del input en tiempo real
 * @returns {string} Texto sanitizado sin trim
 */
export function sanitizeText(str) {
  if (typeof str !== "string") return "";
  // Sin .trim() — los espacios intermedios y al final son válidos
  // mientras el usuario escribe (ej: "Carlos Alberto|")
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Sanitiza y recorta texto para persistencia/submit.
 * Usar únicamente al guardar datos, NUNCA en onChange.
 *
 * @param {string} str - Valor final a persistir
 * @returns {string} Texto sanitizado y sin espacios extremos
 */
export function sanitizeTextFinal(str) {
  if (typeof str !== "string") return "";
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

/**
 * Sanitiza número de teléfono.
 * Solo permite: dígitos, espacios, +, (, ), -
 *
 * @param {string} str
 * @returns {string}
 */
export function sanitizePhone(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[^0-9 +()-]/g, "").trim();
}

/**
 * Sanitiza email: lowercase + trim + strip HTML.
 * Es seguro hacer trim aquí porque los emails nunca tienen espacios válidos.
 *
 * @param {string} str
 * @returns {string}
 */
export function sanitizeEmail(str) {
  if (typeof str !== "string") return "";
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).toLowerCase().trim();
}

/**
 * Sanitiza nota/textarea: permite texto libre pero bloquea HTML/scripts.
 * NO hace trim() para preservar saltos de línea intencionales.
 *
 * @param {string} str
 * @returns {string}
 */
export function sanitizeNote(str) {
  if (typeof str !== "string") return "";
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
