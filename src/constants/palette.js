/**
 * @module palette
 * @description Paleta de colores centralizada para todo Elevate Sports.
 * Unifica las definiciones que existian en Home.jsx, GestionPlantilla.jsx y TacticalBoard.jsx.
 *
 * @version 1.0
 * @author Elevate Sports
 */

export const PALETTE = {
  // ── Neon (acento principal) ────────────────
  neon:        "#c8ff00",
  neonGlow:    "rgba(200,255,0,0.55)",
  neonDim:     "rgba(200,255,0,0.08)",
  neonBorder:  "rgba(200,255,0,0.22)",

  // ── Colores semanticos ─────────────────────
  amber:       "#EF9F27",
  amberDim:    "rgba(239,159,39,0.12)",
  amberBorder: "rgba(239,159,39,0.4)",
  green:       "#1D9E75",
  purple:      "#7F77DD",
  danger:      "#E24B4A",
  drag:        "#00e5ff",
  dragDim:     "rgba(0,229,255,0.15)",

  // ── Fondos y superficies ───────────────────
  bg:          "#050a14",
  surface:     "rgba(0,0,0,0.88)",
  surfaceHi:   "rgba(0,0,0,0.55)",

  // ── Bordes ─────────────────────────────────
  border:      "rgba(255,255,255,0.08)",
  borderHi:    "rgba(255,255,255,0.22)",

  // ── Texto ──────────────────────────────────
  text:        "white",
  textMuted:   "rgba(255,255,255,0.4)",
  textHint:    "rgba(255,255,255,0.22)",
};
