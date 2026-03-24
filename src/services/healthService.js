/**
 * @module healthService
 * @description Servicio de HealthSnapshots.
 * Cada vez que se cierra una sesion, guarda una "foto" del estado
 * de salud de cada jugador presente para tracking historico.
 *
 * @author @Data (Mateo-Data_Engine)
 * @version 1.0.0
 */

import { calcSaludActual } from "../utils/rpeEngine";

const STORAGE_KEY = "elevate_healthSnapshots";
const MAX_SNAPSHOTS = 500; // limitar para no saturar localStorage

/** Lee snapshots desde localStorage */
export function getSnapshots() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Escribe snapshots a localStorage */
function saveSnapshots(snapshots) {
  try {
    // Mantener solo los ultimos MAX_SNAPSHOTS
    const trimmed = snapshots.slice(-MAX_SNAPSHOTS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("[healthService] Error saving snapshots:", e.name);
  }
}

/**
 * Genera y persiste un snapshot de salud para todos los atletas presentes.
 * Llamar al guardar/cerrar una sesion.
 *
 * @param {Array} athletes - Plantel completo con { id, name, status, rpe }
 * @param {Array} historial - Historial de sesiones
 * @param {number} sessionNum - Numero de la sesion que se esta cerrando
 * @returns {Array} Los snapshots generados
 */
export function takeHealthSnapshot(athletes, historial, sessionNum) {
  const now = new Date().toISOString();
  const presentes = athletes.filter(a => a.status === "P");

  const newSnapshots = presentes.map(a => {
    const { salud, riskLevel, rpeAvg7d } = calcSaludActual(a.rpe, historial);
    return {
      athleteId: a.id,
      athleteName: a.name,
      fecha: now,
      sessionNum,
      salud,
      riskLevel,
      rpeAvg7d,
      rpeActual: a.rpe,
    };
  });

  const existing = getSnapshots();
  const updated = [...existing, ...newSnapshots];
  saveSnapshots(updated);

  return newSnapshots;
}

/**
 * Obtiene el historial de salud de un atleta especifico.
 * @param {number} athleteId
 * @param {number} [limit=20] - Maximo de snapshots a retornar
 * @returns {Array} Snapshots ordenados por fecha desc
 */
export function getAthleteHealthHistory(athleteId, limit = 20) {
  return getSnapshots()
    .filter(s => s.athleteId === athleteId)
    .slice(-limit)
    .reverse();
}

/**
 * Obtiene el ultimo snapshot de salud del plantel completo.
 * @returns {Map<number, Object>} athleteId → ultimo snapshot
 */
export function getLatestPlantelHealth() {
  const snapshots = getSnapshots();
  const map = new Map();
  // Recorrer de mas antiguo a mas reciente para que el ultimo sobrescriba
  snapshots.forEach(s => map.set(s.athleteId, s));
  return map;
}

/**
 * Obtiene atletas en riesgo (salud < 30) del ultimo snapshot.
 * @returns {Array} Snapshots de atletas en riesgo
 */
export function getAtRiskAthletes() {
  const latest = getLatestPlantelHealth();
  return Array.from(latest.values()).filter(s => s.riskLevel === "riesgo");
}

/** Limpia todos los snapshots (para logout/reset) */
export function clearSnapshots() {
  window.localStorage.removeItem(STORAGE_KEY);
}
