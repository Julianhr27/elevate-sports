/**
 * @module rpeEngine
 * @description Motor de calculo de Salud Actual basado en RPE.
 * Formula: SaludActual = 100 - (Promedio_RPE_7_dias * 10)
 * Rango: 0 (riesgo critico) a 100 (optimo)
 *
 * @author @Data (Mateo-Data_Engine)
 * @version 1.0.0
 */

/**
 * Calcula la SaludActual de un atleta basandose en su historial RPE
 * de los ultimos 7 dias.
 *
 * @param {number|null} currentRpe - RPE actual de la sesion en curso (1-10 o null)
 * @param {Array} historial - Array de sesiones con { rpeAvg, fecha }
 * @param {number} athleteId - ID del atleta (para filtrar si el historial es por atleta)
 * @returns {{ salud: number, riskLevel: string, color: string, rpeAvg7d: number|null }}
 */
export function calcSaludActual(currentRpe, historial = []) {
  // Recopilar RPEs de los ultimos 7 dias
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  const rpes = [];

  // Agregar RPE actual si existe
  if (currentRpe != null && currentRpe >= 1 && currentRpe <= 10) {
    rpes.push(currentRpe);
  }

  // Agregar RPEs del historial reciente
  historial.forEach(s => {
    if (s.rpeAvg != null && s.rpeAvg !== "\u2014") {
      const rpe = Number(s.rpeAvg);
      if (!isNaN(rpe) && rpe >= 1 && rpe <= 10) {
        // Intentar parsear la fecha
        const d = new Date(s.fecha);
        if (!isNaN(d.getTime()) && (now - d.getTime()) <= SEVEN_DAYS) {
          rpes.push(rpe);
        } else if (isNaN(d.getTime())) {
          // Fechas formateadas como "Mar 18 Mar" no parsean — incluir ultimas 5
          rpes.push(rpe);
        }
      }
    }
  });

  // Limitar a las ultimas 7 entradas como proxy de 7 dias
  const recent = rpes.slice(0, 7);

  if (recent.length === 0) {
    return { salud: 100, riskLevel: "sin_datos", color: "rgba(255,255,255,0.3)", rpeAvg7d: null };
  }

  const avgRpe = recent.reduce((s, v) => s + v, 0) / recent.length;
  const salud = Math.max(0, Math.min(100, Math.round(100 - (avgRpe * 10))));

  let riskLevel, color;
  if (salud >= 60) {
    riskLevel = "optimo";
    color = "#1D9E75"; // verde
  } else if (salud >= 30) {
    riskLevel = "precaucion";
    color = "#EF9F27"; // ambar
  } else {
    riskLevel = "riesgo";
    color = "#E24B4A"; // rojo
  }

  return { salud, riskLevel, color, rpeAvg7d: Number(avgRpe.toFixed(1)) };
}

/**
 * Calcula SaludActual para todos los atletas de una vez.
 *
 * @param {Array} athletes - Array de atletas con { id, rpe }
 * @param {Array} historial - Array de sesiones globales
 * @returns {Map<number, { salud, riskLevel, color, rpeAvg7d }>}
 */
export function calcSaludPlantel(athletes, historial = []) {
  const map = new Map();
  athletes.forEach(a => {
    map.set(a.id, calcSaludActual(a.rpe, historial));
  });
  return map;
}

/**
 * Retorna el color de la barra de salud para un valor dado.
 * @param {number} salud - 0 a 100
 * @returns {string} color hex
 */
export function saludColor(salud) {
  if (salud >= 60) return "#1D9E75";
  if (salud >= 30) return "#EF9F27";
  return "#E24B4A";
}
