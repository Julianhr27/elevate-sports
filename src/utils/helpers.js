/**
 * @module helpers
 * @description Funciones utilitarias compartidas en Elevate Sports.
 * Centraliza logica duplicada que existia en GestionPlantilla, TacticalBoard y Entrenamiento.
 *
 * @version 1.0
 * @author Elevate Sports
 */

/**
 * Genera URL de avatar DiceBear (Avataaars) para un jugador.
 * @param {string} seed - Semilla para generar el avatar (normalmente athlete.photo)
 * @param {string} [bg="059669"] - Color de fondo hex sin #
 * @returns {string} URL del avatar SVG
 */
export const getAvatarUrl = (seed, bg = "059669") =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${bg}`;

/**
 * Calcula la edad en anios a partir de una fecha de nacimiento.
 * @param {string|null} dob - Fecha ISO string
 * @returns {number|string} Edad numerica o "—" si no hay fecha
 */
export const calculateAge = (dob) => {
  if (!dob) return "—";
  return Math.floor(
    (Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25)
  );
};

/**
 * Devuelve estilo visual (color + label) segun el estado del jugador.
 * @param {string} status - "P" | "A" | "L"
 * @returns {{ color: string, label: string }}
 */
export const getStatusStyle = (status) => ({
  P: { color: "#1D9E75", label: "Disponible" },
  A: { color: "#E24B4A", label: "Ausente"    },
  L: { color: "#EF9F27", label: "Lesionado"  },
}[status] || { color: "rgba(255,255,255,0.4)", label: "—" });
