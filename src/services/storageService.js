/**
 * @module storageService
 * @description Capa de abstraccion sobre localStorage.
 * Centraliza lectura, escritura, limpieza y migracion de datos.
 * En futuro: reemplazar internals por Supabase sin cambiar la API.
 *
 * @author @Arquitecto (Julian)
 * @version 1.0.0
 */

import {
  DEMO_ATHLETES, DEMO_HISTORIAL, DEMO_CLUB_INFO, DEMO_MATCH_STATS, DEMO_FINANZAS,
  EMPTY_ATHLETES, EMPTY_HISTORIAL, EMPTY_MATCH_STATS, EMPTY_FINANZAS,
  createEmptyClubInfo, STORAGE_KEYS,
} from "../constants/initialStates";

const DEFAULT_CLUB = { nombre:"", disciplina:"", ciudad:"", entrenador:"", temporada:"", categorias:[], campos:[], descripcion:"", telefono:"", email:"" };

// ── Helpers de bajo nivel ──

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[storageService] Error writing "${key}":`, e.name);
  }
}

function remove(key) {
  window.localStorage.removeItem(key);
}

// ── API Publica ──

/** Lee el modo actual de la app */
export function getMode() {
  return read("elevate_mode", null);
}

/** Limpia selectivamente todas las keys de Elevate */
export function clearAll() {
  STORAGE_KEYS.forEach(k => remove(k));
}

/** Carga estado demo: limpia + escribe datos simulados */
export function loadDemoState() {
  clearAll();
  write("elevate_athletes", DEMO_ATHLETES);
  write("elevate_historial", DEMO_HISTORIAL);
  write("elevate_clubInfo", DEMO_CLUB_INFO);
  write("elevate_matchStats", DEMO_MATCH_STATS);
  write("elevate_finanzas", DEMO_FINANZAS);
  write("elevate_mode", "demo");
}

/** Carga estado produccion: limpia + escribe esquema vacio con datos del form */
export function loadProductionState(form) {
  clearAll();
  write("elevate_athletes", EMPTY_ATHLETES);
  write("elevate_historial", EMPTY_HISTORIAL);
  write("elevate_clubInfo", createEmptyClubInfo(form));
  write("elevate_matchStats", EMPTY_MATCH_STATS);
  write("elevate_finanzas", EMPTY_FINANZAS);
  write("elevate_mode", "production");
}

/** Cierra sesion: limpia todo y vuelve a landing */
export function logout() {
  clearAll();
}

/** Calcula stats del plantel en tiempo real */
export function calcStats(athletes, historial) {
  const rpes = athletes.filter(a => a.status === "P" && a.rpe).map(a => a.rpe);
  return {
    presentes:  athletes.filter(a => a.status === "P").length,
    ausentes:   athletes.filter(a => a.status === "A").length,
    lesionados: athletes.filter(a => a.status === "L").length,
    rpeAvg:     rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : "\u2014",
    sesiones:   historial.length,
    asistencia: Math.round(
      (historial.reduce((a, s) => a + s.presentes, 0) /
       Math.max(historial.reduce((a, s) => a + s.total, 0), 1)) * 100
    ),
  };
}

/** Crea una nueva sesion de entrenamiento */
export function buildSesion(athletes, historial, nota, tipo) {
  const presentes = athletes.filter(a => a.status === "P");
  const rpesValidos = presentes.filter(a => a.rpe).map(a => a.rpe);
  const rpePromedio = rpesValidos.length
    ? (rpesValidos.reduce((acc, v) => acc + v, 0) / rpesValidos.length).toFixed(1)
    : null;

  const num = historial.length > 0 ? historial[0].num + 1 : 1;
  const hoy = new Date();
  const dias  = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const fecha = `${dias[hoy.getDay()]} ${hoy.getDate()} ${meses[hoy.getMonth()]}`;

  return {
    num, fecha,
    presentes: presentes.length,
    total: athletes.length,
    rpeAvg: rpePromedio,
    tipo: tipo || "Sesion",
    nota,
    savedAt: new Date().toISOString(),
  };
}

export default {
  getMode, clearAll, loadDemoState, loadProductionState, logout,
  calcStats, buildSesion,
};
