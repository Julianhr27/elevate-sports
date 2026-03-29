/**
 * @module elevateScore
 * @description Motor de Elevate Score v1.0 — Algoritmo de rendimiento post-partido.
 *
 * ══════════════════════════════════════════════════════════════════
 *  MODELO MATEMATICO — Elevate Sports Performance Engine v1.0
 * ══════════════════════════════════════════════════════════════════
 *
 *  FORMULA
 *  -------
 *  ElevateScore (0-10) =
 *    (goles × 2.0) +
 *    (asistencias × 1.5) +
 *    (recuperaciones × 0.3) +
 *    (duelosGanados × 0.2) +
 *    (minutosJugados/90 × 1.0) -
 *    (tarjetaAmarilla × 0.5) -
 *    (tarjetaRoja × 3.0)
 *
 *  Resultado crudo normalizado a [0, 10] via clamp.
 *
 *  UMBRALES DE RIESGO
 *  ------------------
 *  | Condicion                        | Alerta                          |
 *  |----------------------------------|---------------------------------|
 *  | RPE > 7                          | "Rendimiento en Riesgo"         |
 *  | RPE > 8 AND ElevateScore > 7     | "Reducir carga siguiente entreno"|
 *
 * @author @Mateo (Data)
 * @version 1.0.0
 */

/**
 * Pesos del algoritmo Elevate Score.
 * Separados como constantes para facilitar ajuste futuro.
 */
export const ELEVATE_WEIGHTS = {
  goles:          2.0,
  asistencias:    1.5,
  recuperaciones: 0.3,
  duelosGanados:  0.2,
  minutos:        1.0,   // aplicado como minutosJugados/90 × 1.0
  tarjetaAmarilla: 0.5,  // penalizacion
  tarjetaRoja:     3.0,  // penalizacion
};

/**
 * Calcula el Elevate Score de un jugador para un partido dado.
 *
 * @param {Object} stats - Estadisticas del partido del jugador
 * @param {number} stats.goles
 * @param {number} stats.asistencias
 * @param {number} stats.recuperaciones
 * @param {number} stats.duelosGanados
 * @param {number} stats.minutosJugados
 * @param {string} stats.tarjeta - "ninguna" | "amarilla" | "roja"
 * @returns {number} Score normalizado [0, 10], redondeado a 1 decimal
 */
export function calcElevateScore({ goles, asistencias, recuperaciones, duelosGanados, minutosJugados, tarjeta }) {
  const raw =
    (goles * ELEVATE_WEIGHTS.goles) +
    (asistencias * ELEVATE_WEIGHTS.asistencias) +
    (recuperaciones * ELEVATE_WEIGHTS.recuperaciones) +
    (duelosGanados * ELEVATE_WEIGHTS.duelosGanados) +
    ((minutosJugados / 90) * ELEVATE_WEIGHTS.minutos) -
    (tarjeta === "amarilla" ? ELEVATE_WEIGHTS.tarjetaAmarilla : 0) -
    (tarjeta === "roja" ? ELEVATE_WEIGHTS.tarjetaRoja : 0);

  return Number(Math.max(0, Math.min(10, raw)).toFixed(1));
}

/**
 * Calcula el OVR (Overall Rating) de un jugador basado en sus estadisticas
 * acumuladas de multiples partidos. Escala FIFA 50-99.
 *
 * @param {Object[]} matchHistory - Array de estadisticas por partido
 * @returns {number} OVR entero [50, 99]
 */
export function calcOVR(matchHistory) {
  if (!matchHistory || matchHistory.length === 0) return 65;
  const avgScore = matchHistory.reduce((sum, m) => sum + calcElevateScore(m), 0) / matchHistory.length;
  // Mapear [0, 10] → [50, 99]
  return Math.round(50 + (avgScore / 10) * 49);
}

/**
 * Determina el nivel de alerta basado en RPE y Elevate Score.
 *
 * @param {number} rpe - RPE del jugador (1-10)
 * @param {number} elevateScore - Score calculado (0-10)
 * @returns {{ level: string, message: string, color: string } | null}
 */
export function getPerformanceAlert(rpe, elevateScore) {
  if (rpe > 8 && elevateScore > 7) {
    return {
      level: "critical",
      message: "Reducir carga siguiente entreno",
      color: "#E24B4A",
    };
  }
  if (rpe > 7) {
    return {
      level: "warning",
      message: "Rendimiento en Riesgo",
      color: "#EF9F27",
    };
  }
  return null;
}

/**
 * Genera recomendaciones tecnicas automaticas cruzando datos de partido y fatiga.
 *
 * @param {Object} stats - Stats del partido
 * @param {number} rpe - RPE del jugador
 * @param {string} pos - Posicion del jugador
 * @returns {string[]} Array de recomendaciones
 */
export function generateRecommendations(stats, rpe, pos) {
  const recs = [];
  const score = calcElevateScore(stats);

  if (rpe > 8) recs.push("Priorizar recuperacion activa. Reducir carga de entrenamiento 48h.");
  if (stats.minutosJugados < 45) recs.push("Tiempo de juego reducido — evaluar rotacion en proximo partido.");
  if (stats.duelosGanados < 3 && (pos === "Defensa" || pos === "Mediocampista")) recs.push("Trabajar en duelos 1v1 en siguiente sesion tactica.");
  if (stats.recuperaciones < 2 && pos === "Mediocampista") recs.push("Revisar posicionamiento defensivo y pressing en mediocampo.");
  if (stats.goles === 0 && stats.asistencias === 0 && pos === "Delantero") recs.push("Analizar movimientos sin balon y desmarques en zona de definicion.");
  if (stats.tarjeta === "roja") recs.push("Sesion de video obligatoria — analizar la accion que genero la expulsion.");
  if (score >= 8) recs.push("Rendimiento destacado. Considerar liderazgo de unidad tactica en proximo ciclo.");
  if (recs.length === 0) recs.push("Rendimiento dentro del rango esperado. Mantener plan de entrenamiento actual.");

  return recs;
}

// ── Datos demo de partidos ───────────────────────────────────────────────────

/**
 * Partidos demo generados con stats realistas para los atletas demo.
 * IDs de atletas: 1-15 (matching DEMO_ATHLETES en initialStates.js)
 */
export const DEMO_MATCH_REPORTS = [
  {
    id: "match-001",
    rival: "Atletico Sur",
    fecha: "2026-03-22",
    resultado: "3-1",
    local: true,
    playerStats: [
      { athleteId: 1,  goles: 2, asistencias: 1, recuperaciones: 3,  duelosGanados: 5,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 2,  goles: 0, asistencias: 2, recuperaciones: 8,  duelosGanados: 7,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 3,  goles: 0, asistencias: 0, recuperaciones: 2,  duelosGanados: 4,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 4,  goles: 0, asistencias: 0, recuperaciones: 6,  duelosGanados: 8,  minutosJugados: 90, tarjeta: "amarilla" },
      { athleteId: 5,  goles: 1, asistencias: 0, recuperaciones: 10, duelosGanados: 6,  minutosJugados: 85, tarjeta: "ninguna" },
      { athleteId: 6,  goles: 0, asistencias: 0, recuperaciones: 7,  duelosGanados: 9,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 7,  goles: 0, asistencias: 1, recuperaciones: 5,  duelosGanados: 6,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 8,  goles: 0, asistencias: 0, recuperaciones: 2,  duelosGanados: 3,  minutosJugados: 60, tarjeta: "ninguna" },
      { athleteId: 9,  goles: 0, asistencias: 0, recuperaciones: 1,  duelosGanados: 2,  minutosJugados: 55, tarjeta: "ninguna" },
      { athleteId: 10, goles: 0, asistencias: 0, recuperaciones: 5,  duelosGanados: 7,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 11, goles: 0, asistencias: 0, recuperaciones: 6,  duelosGanados: 5,  minutosJugados: 75, tarjeta: "ninguna" },
    ],
  },
  {
    id: "match-002",
    rival: "Deportivo Norte",
    fecha: "2026-03-15",
    resultado: "1-1",
    local: false,
    playerStats: [
      { athleteId: 1,  goles: 1, asistencias: 0, recuperaciones: 2,  duelosGanados: 4,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 2,  goles: 0, asistencias: 1, recuperaciones: 7,  duelosGanados: 6,  minutosJugados: 90, tarjeta: "amarilla" },
      { athleteId: 3,  goles: 0, asistencias: 0, recuperaciones: 3,  duelosGanados: 5,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 4,  goles: 0, asistencias: 0, recuperaciones: 8,  duelosGanados: 10, minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 5,  goles: 0, asistencias: 0, recuperaciones: 9,  duelosGanados: 5,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 6,  goles: 0, asistencias: 1, recuperaciones: 6,  duelosGanados: 8,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 7,  goles: 0, asistencias: 0, recuperaciones: 4,  duelosGanados: 5,  minutosJugados: 78, tarjeta: "ninguna" },
      { athleteId: 8,  goles: 0, asistencias: 0, recuperaciones: 1,  duelosGanados: 2,  minutosJugados: 45, tarjeta: "ninguna" },
      { athleteId: 9,  goles: 0, asistencias: 0, recuperaciones: 2,  duelosGanados: 3,  minutosJugados: 70, tarjeta: "ninguna" },
      { athleteId: 10, goles: 0, asistencias: 0, recuperaciones: 6,  duelosGanados: 7,  minutosJugados: 90, tarjeta: "amarilla" },
    ],
  },
  {
    id: "match-003",
    rival: "Estrellas del Este",
    fecha: "2026-03-08",
    resultado: "2-0",
    local: true,
    playerStats: [
      { athleteId: 1,  goles: 1, asistencias: 1, recuperaciones: 4,  duelosGanados: 6,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 2,  goles: 0, asistencias: 1, recuperaciones: 9,  duelosGanados: 8,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 3,  goles: 0, asistencias: 0, recuperaciones: 1,  duelosGanados: 3,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 4,  goles: 1, asistencias: 0, recuperaciones: 5,  duelosGanados: 7,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 5,  goles: 0, asistencias: 0, recuperaciones: 11, duelosGanados: 7,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 6,  goles: 0, asistencias: 0, recuperaciones: 8,  duelosGanados: 10, minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 7,  goles: 0, asistencias: 0, recuperaciones: 6,  duelosGanados: 6,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 8,  goles: 0, asistencias: 0, recuperaciones: 3,  duelosGanados: 4,  minutosJugados: 80, tarjeta: "ninguna" },
      { athleteId: 11, goles: 0, asistencias: 0, recuperaciones: 7,  duelosGanados: 6,  minutosJugados: 90, tarjeta: "ninguna" },
    ],
  },
  {
    id: "match-004",
    rival: "Los Pumas FC",
    fecha: "2026-02-28",
    resultado: "0-2",
    local: false,
    playerStats: [
      { athleteId: 1,  goles: 0, asistencias: 0, recuperaciones: 1,  duelosGanados: 3,  minutosJugados: 72, tarjeta: "ninguna" },
      { athleteId: 2,  goles: 0, asistencias: 0, recuperaciones: 5,  duelosGanados: 4,  minutosJugados: 90, tarjeta: "amarilla" },
      { athleteId: 3,  goles: 0, asistencias: 0, recuperaciones: 2,  duelosGanados: 6,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 4,  goles: 0, asistencias: 0, recuperaciones: 4,  duelosGanados: 5,  minutosJugados: 90, tarjeta: "roja"    },
      { athleteId: 5,  goles: 0, asistencias: 0, recuperaciones: 6,  duelosGanados: 4,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 6,  goles: 0, asistencias: 0, recuperaciones: 5,  duelosGanados: 7,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 7,  goles: 0, asistencias: 0, recuperaciones: 3,  duelosGanados: 4,  minutosJugados: 90, tarjeta: "ninguna" },
      { athleteId: 9,  goles: 0, asistencias: 0, recuperaciones: 1,  duelosGanados: 2,  minutosJugados: 60, tarjeta: "ninguna" },
      { athleteId: 10, goles: 0, asistencias: 0, recuperaciones: 4,  duelosGanados: 5,  minutosJugados: 90, tarjeta: "ninguna" },
    ],
  },
];

/**
 * Obtiene el historial de Elevate Score de un atleta a traves de los partidos demo.
 * Util para el mini line chart del historial.
 *
 * @param {number} athleteId
 * @param {Object[]} matchReports - Array de reportes (usa DEMO_MATCH_REPORTS por defecto)
 * @returns {{ fecha: string, rival: string, score: number }[]}
 */
export function getAthleteScoreHistory(athleteId, matchReports = DEMO_MATCH_REPORTS) {
  return matchReports
    .map(match => {
      const ps = match.playerStats.find(s => s.athleteId === athleteId);
      if (!ps) return null;
      return {
        fecha: match.fecha,
        rival: match.rival,
        score: calcElevateScore(ps),
      };
    })
    .filter(Boolean)
    .reverse(); // cronologico ascendente para el chart
}
