/**
 * @component MatchCenter v1.0
 * @description Match Center — Reporte Post-Partido y Performance Analytics Engine.
 *
 * Secciones:
 *   A — Formulario de Ingesta Post-Partido (steppers tipo FIFA)
 *   B — Player Card Pro (estilo Ultimate Team)
 *   C — Analytics Dashboard (Spider Chart SVG, historial de Elevate Score, recomendaciones)
 *
 * @palette Charcoal (#0a0a14) / Neon (#c8ff00) / Electric Violet (#7F77DD)
 * @design  Glassmorphism + Framer Motion + SVG propio (sin dependencias externas de charts)
 * @author  @Andres (UI) + @Mateo (Data) + @Carlos (Arquitecto)
 * @version 1.0.0
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PALETTE as C } from "../constants/palette";
import {
  calcElevateScore,
  calcOVR,
  getPerformanceAlert,
  generateRecommendations,
  getAthleteScoreHistory,
  DEMO_MATCH_REPORTS,
} from "../utils/elevateScore";

// ── Inyectar responsive CSS una sola vez ──────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("mc-responsive")) {
  const s = document.createElement("style");
  s.id = "mc-responsive";
  s.textContent = `
    @media (max-width: 767px) {
      .mc-layout { flex-direction: column !important; }
      .mc-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; max-height: 260px !important; }
      .mc-main { padding: 14px !important; }
      .mc-player-grid { grid-template-columns: 1fr !important; }
      .mc-analytics-grid { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 479px) {
      .mc-card-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
      .mc-stats-row { grid-template-columns: repeat(3, 1fr) !important; }
    }
    /* ── FIFA Stepper touch targets ── */
    .mc-stepper-btn {
      min-width: 36px !important;
      min-height: 36px !important;
    }
    @media (max-width: 767px) {
      .mc-stepper-btn {
        min-width: 44px !important;
        min-height: 44px !important;
        font-size: 20px !important;
      }
      .mc-tarjeta-btn {
        min-width: 44px !important;
        min-height: 44px !important;
        font-size: 13px !important;
      }
    }
    /* ── Alert animations ── */
    @keyframes mc-pulse-warn {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,159,39,0.4); }
      50% { box-shadow: 0 0 0 4px rgba(239,159,39,0); }
    }
    @keyframes mc-pulse-crit {
      0%, 100% { box-shadow: 0 0 0 0 rgba(226,75,74,0.5); }
      50% { box-shadow: 0 0 0 4px rgba(226,75,74,0); }
    }
    .mc-alert-warn { animation: mc-pulse-warn 2s ease-in-out infinite; }
    .mc-alert-crit { animation: mc-pulse-crit 1.5s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

// ── Constantes ────────────────────────────────────────────────────────────────
const EMPTY_STATS = {
  goles: 0, asistencias: 0, recuperaciones: 0,
  duelosGanados: 0, minutosJugados: 0, tarjeta: "ninguna",
};

const TARJETA_OPTIONS = [
  { value: "ninguna", label: "—",  color: "rgba(255,255,255,0.25)" },
  { value: "amarilla", label: "A", color: "#EF9F27" },
  { value: "roja",     label: "R", color: "#E24B4A" },
];

/** Limites maximos por campo para validacion */
const FIELD_LIMITS = {
  minutosJugados: 120, goles: 10, asistencias: 10,
  recuperaciones: 30, duelosGanados: 20,
};

// ── Framer Motion variants ────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 28 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────

/** Stepper tipo FIFA — click +/- rapido, sin input manual */
function FifaStepper({ label, value, min = 0, max, onChange, accent = C.neon }) {
  const dec = useCallback(() => { if (value > min) onChange(value - 1); }, [value, min, onChange]);
  const inc = useCallback(() => { if (value < max) onChange(value + 1); }, [value, max, onChange]);

  const btnBase = {
    width: 36, height: 36, border: `1px solid rgba(255,255,255,0.15)`,
    background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer",
    fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center",
    justifyContent: "center", userSelect: "none",
    transition: "background 80ms, transform 80ms, border-color 80ms",
    flexShrink: 0, borderRadius: 4,
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  };

  const applyDown  = e => { e.currentTarget.style.transform = "scale(0.88)"; e.currentTarget.style.background = "rgba(255,255,255,0.18)"; };
  const applyReset = e => { e.currentTarget.style.transform = "scale(1)";    e.currentTarget.style.background = "rgba(255,255,255,0.05)"; };

  const isAtMin = value <= min;
  const isAtMax = value >= max;

  /** Permite respuesta visual inmediata + evita double-fire en touch */
  const makeHandlers = (action, disabled) => ({
    onMouseEnter: e => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,0.12)"; },
    onMouseLeave: applyReset,
    onMouseDown:  e => { if (!disabled) applyDown(e); },
    onMouseUp:    applyReset,
    // touchAction: manipulation en btnBase ya evita el click sintetico posterior al touch
    onTouchStart: e => { if (!disabled) { applyDown(e); } },
    onTouchEnd:   e => { e.preventDefault(); applyReset(e); if (!disabled) action(); },
    onClick:      action,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center", minWidth: 76 }}>
      <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted, textAlign: "center" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          className="mc-stepper-btn"
          style={{ ...btnBase, opacity: isAtMin ? 0.35 : 1, borderColor: isAtMin ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.15)" }}
          {...makeHandlers(dec, isAtMin)}
          disabled={isAtMin}
          aria-label={`Decrementar ${label}`}
        >−</button>

        <motion.div
          key={value}
          initial={{ scale: 1.35, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          style={{
            minWidth: 34, textAlign: "center", fontSize: 20, fontWeight: 900,
            color: value > 0 ? accent : C.textHint, fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </motion.div>

        <button
          className="mc-stepper-btn"
          style={{ ...btnBase, opacity: isAtMax ? 0.35 : 1, borderColor: isAtMax ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.15)" }}
          {...makeHandlers(inc, isAtMax)}
          disabled={isAtMax}
          aria-label={`Incrementar ${label}`}
        >+</button>
      </div>
    </div>
  );
}

/** Selector visual de tarjeta tipo badge — forma de tarjeta de futbol */
function TarjetaSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
      <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted }}>Tarjeta</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {TARJETA_OPTIONS.map(opt => {
          const isSelected = value === opt.value;
          const isNone = opt.value === "ninguna";
          return (
            <button
              key={opt.value}
              className="mc-tarjeta-btn"
              onClick={() => onChange(opt.value)}
              aria-label={opt.label === "—" ? "Sin tarjeta" : `Tarjeta ${opt.value}`}
              style={{
                /* proporciones de tarjeta de futbol: 2:3 */
                width: isNone ? 36 : 26, height: isNone ? 36 : 36,
                borderRadius: isNone ? 4 : 3,
                border: `2px solid ${isSelected ? opt.color : "rgba(255,255,255,0.1)"}`,
                background: isSelected
                  ? (isNone ? "rgba(255,255,255,0.1)" : opt.color)
                  : "rgba(255,255,255,0.03)",
                color: isSelected
                  ? (isNone ? "rgba(255,255,255,0.7)" : "#0a0a0a")
                  : C.textHint,
                fontSize: isNone ? 14 : 11, fontWeight: 900, cursor: "pointer",
                transition: "all 120ms",
                boxShadow: isSelected && !isNone ? `0 0 10px ${opt.color}55` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                letterSpacing: "0.5px",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Spider Chart SVG — 6 ejes, sin dependencias externas */
function SpiderChart({ data, size = 180, uid = "0" }) {
  // data: [{ label, value (0-1) }, ...]
  // uid: string unica por instancia para evitar conflicto de gradient IDs
  const cx = size / 2;
  const cy = size / 2;
  // Reducir r ligeramente para que las etiquetas no sean recortadas
  const r  = size * 0.33;
  const n  = data.length;
  const gradId = `spider-fill-${uid}`;

  /** Punto en el circulo para eje i con radio dado */
  const point = (i, radius) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  /** Anillos de referencia */
  const rings = [0.25, 0.5, 0.75, 1].map(scale => {
    const pts = data.map((_, i) => point(i, r * scale));
    return pts.map((p, j) => `${j === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";
  });

  /** Polígono de datos del jugador */
  const playerPts = data.map((d, i) => point(i, r * Math.max(0.04, d.value)));
  const playerPath = playerPts.map((p, j) => `${j === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";

  if (!data || data.length === 0) return null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.neon} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.neon} stopOpacity="0.06" />
        </radialGradient>
      </defs>

      {/* Ejes */}
      {data.map((_, i) => {
        const p = point(i, r);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2 2" />;
      })}

      {/* Anillos de referencia */}
      {rings.map((d, i) => (
        <path key={i} d={d} fill="none"
          stroke={i === 3 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)"}
          strokeWidth={i === 3 ? "1.5" : "1"}
        />
      ))}

      {/* Polígono de datos — fill con gradiente radial */}
      <path d={playerPath} fill={`url(#${gradId})`} stroke={C.neon} strokeWidth="2" strokeLinejoin="round" />

      {/* Puntos en vértices con glow */}
      {playerPts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={C.neon} opacity="0.15" />
          <circle cx={p.x} cy={p.y} r="3" fill={C.neon} />
        </g>
      ))}

      {/* Etiquetas — a 1.32r para dejar margen claro de los puntos */}
      {data.map((d, i) => {
        const p = point(i, r * 1.34);
        const val = Math.round(d.value * 100);
        return (
          <g key={i}>
            <text
              x={p.x} y={p.y - 1}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="8.5" fill="rgba(255,255,255,0.65)"
              fontFamily="Arial Narrow, Arial, sans-serif"
              fontWeight="700"
              style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
            >
              {d.label}
            </text>
            <text
              x={p.x} y={p.y + 9}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="7" fill={C.neon}
              fontFamily="Arial Narrow, Arial, sans-serif"
              fontWeight="900"
            >
              {val}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Genera un path SVG suave (cubic bezier) a partir de puntos discretos.
 * Evita el efecto "poligono" de las lineas rectas.
 */
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C${cpX.toFixed(1)},${prev.y.toFixed(1)} ${cpX.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
  }
  return d;
}

/** Mini Line Chart SVG para historial de Elevate Score */
function MiniLineChart({ data, width = 220, height = 60, uid = "0" }) {
  const gradId = `line-grad-${uid}`;

  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 9, color: C.textHint, textTransform: "uppercase", letterSpacing: "1px" }}>Sin historial</span>
      </div>
    );
  }

  const padX = 10;
  const padY = 10;
  const W = width - padX * 2;
  const H = height - padY * 2;
  const maxVal = 10;

  const pts = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * W,
    y: padY + H - (d.score / maxVal) * H,
    ...d,
  }));

  const linePath = smoothPath(pts);
  const areaPath = linePath
    + ` L${pts[pts.length - 1].x.toFixed(1)},${(padY + H).toFixed(1)}`
    + ` L${pts[0].x.toFixed(1)},${(padY + H).toFixed(1)} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.neon} stopOpacity="0.4" />
          <stop offset="100%" stopColor={C.neon} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area bajo la curva */}
      <path d={areaPath} fill={`url(#${gradId})`} />
      {/* Linea principal — suave y con caps redondeados */}
      <path d={linePath} fill="none" stroke={C.neon} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Puntos de datos */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={C.neon} opacity="0.15" />
          <circle cx={p.x} cy={p.y} r="2.5" fill={C.neon} />
        </g>
      ))}
    </svg>
  );
}

/** Semaforo de fatiga RPE */
function FatigaIndicator({ rpe }) {
  if (rpe == null) return <span style={{ fontSize: 9, color: C.textHint }}>Sin datos RPE</span>;
  let color = C.green;
  let label = "Optimo";
  if (rpe > 8) { color = C.danger; label = "Alta fatiga"; }
  else if (rpe > 6) { color = C.amber; label = "Precaucion"; }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0" }}>
      {/* Semaforo: punto con halo */}
      <div style={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, boxShadow: `0 0 0 3px ${color}33, 0 0 10px ${color}66` }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" }}>
        RPE {rpe} — {label}
      </span>
    </div>
  );
}

/** Player Card Pro — estética Ultimate Team Charcoal/Neon */
function PlayerCardPro({ athlete, stats, elevateScore, rpe, historial, onSelect, selected }) {
  const ovr     = calcOVR(getAthleteScoreHistory(athlete.id));
  const alert   = rpe != null ? getPerformanceAlert(rpe, elevateScore) : null;
  const scoreColor = elevateScore >= 7 ? C.neon : elevateScore >= 4 ? C.amber : C.danger;

  return (
    <motion.div
      variants={fadeUp}
      onClick={onSelect}
      whileHover={{ scale: 1.025, transition: { duration: 0.15 } }}
      style={{
        cursor: "pointer",
        position: "relative",
        background: selected
          ? "linear-gradient(145deg, rgba(200,255,0,0.1), rgba(10,10,20,0.95))"
          : "linear-gradient(145deg, rgba(20,20,35,0.98), rgba(8,8,16,0.98))",
        border: `1px solid ${selected ? C.neon : C.border}`,
        boxShadow: selected
          ? `0 0 0 1px ${C.neon}55, 0 8px 32px rgba(200,255,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05)`
          : "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
        overflow: "hidden",
        transition: "border 150ms, box-shadow 150ms, background 150ms",
      }}
    >
      {/* Borde superior de acento */}
      <div style={{ height: 3, background: selected ? C.neon : C.purple, transition: "background 150ms" }} />

      <div style={{ padding: "14px 16px" }}>
        {/* Header: Avatar + nombre + posicion */}
        <div className="mc-card-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          {/* Avatar placeholder con inicial */}
          <div style={{
            width: 44, height: 44, borderRadius: 4,
            background: "linear-gradient(135deg, rgba(200,255,0,0.15), rgba(127,119,221,0.15))",
            border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: C.neon, flexShrink: 0,
          }}>
            {athlete.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {athlete.name}
            </div>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginTop: 2 }}>
              {athlete.posCode} · {athlete.pos}
            </div>
          </div>
          {/* OVR badge — FIFA Ultimate Team style */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            background: "linear-gradient(135deg, rgba(200,255,0,0.18), rgba(200,255,0,0.06))",
            border: `1px solid ${C.neonBorder}`,
            boxShadow: `0 0 12px rgba(200,255,0,0.2), inset 0 1px 0 rgba(200,255,0,0.15)`,
            padding: "5px 10px", minWidth: 44, borderRadius: 4,
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.neon, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{ovr}</div>
            <div style={{ fontSize: 7, color: C.neonBorder, textTransform: "uppercase", letterSpacing: "1.5px", marginTop: 1 }}>OVR</div>
          </div>
        </div>

        {/* Elevate Score */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted }}>Elevate Score</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: scoreColor }}>{elevateScore.toFixed(1)}</span>
          </div>
          {/* Barra de progreso */}
          <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(elevateScore / 10) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ height: "100%", background: scoreColor, borderRadius: 2 }}
            />
          </div>
        </div>

        {/* Stats compactos del partido */}
        {stats && (
          <div className="mc-stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 10 }}>
            {[
              { lbl: "G",   val: stats.goles,          color: C.neon   },
              { lbl: "A",   val: stats.asistencias,     color: C.purple },
              { lbl: "REC", val: stats.recuperaciones,  color: C.green  },
              { lbl: "DUE", val: stats.duelosGanados,   color: C.amber  },
              { lbl: "MIN", val: stats.minutosJugados,  color: "white"  },
            ].map(s => (
              <div key={s.lbl} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 7, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tarjeta badge */}
        {stats?.tarjeta && stats.tarjeta !== "ninguna" && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", marginBottom: 8, borderRadius: 3,
            background: stats.tarjeta === "roja" ? "rgba(226,75,74,0.18)" : "rgba(239,159,39,0.18)",
            border: `1px solid ${stats.tarjeta === "roja" ? C.danger : C.amber}88`,
            boxShadow: `0 0 8px ${stats.tarjeta === "roja" ? "rgba(226,75,74,0.25)" : "rgba(239,159,39,0.25)"}`,
          }}>
            {/* Silueta de tarjeta FIFA */}
            <div style={{ width: 10, height: 14, background: stats.tarjeta === "roja" ? C.danger : C.amber, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: stats.tarjeta === "roja" ? C.danger : C.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
              Tarjeta {stats.tarjeta}
            </span>
          </div>
        )}

        {/* Fatiga */}
        <FatigaIndicator rpe={rpe} />

        {/* Alerta de rendimiento — visible, con acento lateral y pulso */}
        {alert && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={alert.level === "critical" ? "mc-alert-crit" : "mc-alert-warn"}
            style={{
              marginTop: 8, padding: "7px 10px",
              background: `${alert.color}12`,
              border: `1px solid ${alert.color}55`,
              borderLeft: `3px solid ${alert.color}`,
              borderRadius: 3,
              display: "flex", alignItems: "center", gap: 7,
            }}
          >
            {/* Icono de alerta */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M12 2L2 20h20L12 2Z" stroke={alert.color} strokeWidth="2" strokeLinejoin="round"/>
              <line x1="12" y1="9" x2="12" y2="14" stroke={alert.color} strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="17.5" r="1" fill={alert.color}/>
            </svg>
            <span style={{ fontSize: 9, color: alert.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", lineHeight: 1.3 }}>
              {alert.message}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/** Analytics panel para un jugador seleccionado */
function PlayerAnalytics({ athlete, stats, rpe, historial }) {
  const scoreHistory = useMemo(() => getAthleteScoreHistory(athlete.id), [athlete.id]);
  const currentScore = stats ? calcElevateScore(stats) : 0;
  const recommendations = useMemo(
    () => generateRecommendations(stats || EMPTY_STATS, rpe ?? 5, athlete.pos),
    [stats, rpe, athlete.pos]
  );

  // Spider chart: normalizar stats a [0, 1]
  const spiderData = stats ? [
    { label: "Goles",    value: Math.min(1, stats.goles / 3) },
    { label: "Asist",    value: Math.min(1, stats.asistencias / 3) },
    { label: "Rec",      value: Math.min(1, stats.recuperaciones / 15) },
    { label: "Duelos",   value: Math.min(1, stats.duelosGanados / 10) },
    { label: "Min",      value: stats.minutosJugados / 90 },
    { label: "Fisico",   value: rpe != null ? Math.max(0, 1 - (rpe - 1) / 9) : 0.5 },
  ] : [];

  // Barra correlacion
  const minEfectividad = stats ? (stats.minutosJugados > 0 ? currentScore / (stats.minutosJugados / 90 + 0.01) : 0) : 0;
  const riskPct = rpe != null ? Math.round((rpe / 10) * 100) : 0;

  return (
    <div>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: C.textMuted, marginBottom: 16 }}>
        Analytics — {athlete.name}
      </div>

      <div className="mc-analytics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Spider Chart */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted, marginBottom: 12 }}>
            Perfil de habilidades
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SpiderChart data={spiderData} size={160} uid={String(athlete.id)} />
          </div>
        </div>

        {/* Historial de Elevate Score */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted, marginBottom: 12 }}>
            Historial Elevate Score
          </div>
          <MiniLineChart data={scoreHistory} width={200} height={80} uid={`hist-${athlete.id}`} />
          {scoreHistory.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
              {scoreHistory.slice(-3).map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textMuted }}>
                  <span>vs {h.rival}</span>
                  <span style={{ color: h.score >= 6 ? C.neon : h.score >= 4 ? C.amber : C.danger, fontWeight: 700 }}>
                    {h.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barras de correlacion */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted, marginBottom: 12 }}>
          Correlacion partido
        </div>
        {[
          { label: "Minutos jugados",    pct: stats ? Math.round((stats.minutosJugados / 90) * 100) : 0, color: C.neon   },
          { label: "Efectividad",        pct: Math.min(100, Math.round(minEfectividad * 20)),            color: C.purple },
          { label: "Riesgo de lesion",   pct: riskPct,                                                  color: riskPct > 70 ? C.danger : riskPct > 50 ? C.amber : C.green },
        ].map(bar => (
          <div key={bar.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textMuted, marginBottom: 4 }}>
              <span>{bar.label}</span>
              <span style={{ color: bar.color, fontWeight: 700 }}>{bar.pct}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bar.pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{ height: "100%", background: bar.color, borderRadius: 2 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Recomendaciones tecnicas */}
      <div style={{
        background: "linear-gradient(135deg, rgba(127,119,221,0.08), rgba(127,119,221,0.03))",
        border: `1px solid rgba(127,119,221,0.25)`,
        borderLeft: `3px solid ${C.purple}`,
        padding: "14px 16px", borderRadius: 4,
      }}>
        <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "2px", color: C.purple, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Recomendaciones tecnicas
        </div>
        {recommendations.map((rec, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 28 }}
            style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}
          >
            {/* Chevron bullet */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ marginTop: 3, flexShrink: 0 }}>
              <path d="M9 18l6-6-6-6" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.55 }}>{rec}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL — MatchCenter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @component MatchCenter
 * @param {Object[]} athletes - Plantilla del club (DEMO_ATHLETES shape)
 * @param {Object[]} historial - Historial de sesiones (para RPE)
 * @param {string}   clubId   - ID del club para namespace de localStorage
 */
export default function MatchCenter({ athletes, historial, clubId }) {
  // ── Vista activa: "ingesta" | "analytics" ──────────────────────────────────
  const [view, setView] = useState("ingesta");

  // ── Seleccion de partido ───────────────────────────────────────────────────
  const [selectedMatchId, setSelectedMatchId] = useState(DEMO_MATCH_REPORTS[0].id);

  // ── Stats editables por jugador (namespace por clubId) ─────────────────────
  const STORAGE_KEY = `elevate_matchreports_${clubId || "default"}`;

  const [savedReports, setSavedReports] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  });

  // Inicializar stats del partido seleccionado desde demo o localStorage
  const buildInitialStats = useCallback((matchId) => {
    const saved = savedReports[matchId];
    if (saved) return saved;
    const demo = DEMO_MATCH_REPORTS.find(m => m.id === matchId);
    if (!demo) return {};
    const init = {};
    demo.playerStats.forEach(ps => { init[ps.athleteId] = { ...ps }; });
    return init;
  }, [savedReports]);

  const [playerStats, setPlayerStats] = useState(() => buildInitialStats(DEMO_MATCH_REPORTS[0].id));

  // Cuando cambia el partido seleccionado, recargar stats
  useEffect(() => {
    setPlayerStats(buildInitialStats(selectedMatchId));
  }, [selectedMatchId, buildInitialStats]);

  // ── Jugador seleccionado para analytics ────────────────────────────────────
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id || 1);

  // ── Lista de atletas participantes en el partido ───────────────────────────
  const matchAthletes = useMemo(() => {
    const demo = DEMO_MATCH_REPORTS.find(m => m.id === selectedMatchId);
    const participantIds = new Set(demo?.playerStats.map(ps => ps.athleteId) || []);
    // Si hay athletes prop, usar esos; sino usar los de la demo por ID
    if (athletes && athletes.length > 0) {
      return athletes.filter(a => participantIds.has(a.id));
    }
    // fallback: IDs del demo como pseudo-athletes
    return Array.from(participantIds).map(id => ({ id, name: `Jugador #${id}`, pos: "—", posCode: "—" }));
  }, [selectedMatchId, athletes]);

  // Stats y RPE del atleta seleccionado
  const selectedStats = playerStats[selectedAthleteId] || EMPTY_STATS;
  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId) || matchAthletes[0];
  const selectedRpe = athletes.find(a => a.id === selectedAthleteId)?.rpe;

  // ── Handler para actualizar un campo de stats ──────────────────────────────
  const updateStat = useCallback((athleteId, field, value) => {
    setPlayerStats(prev => ({
      ...prev,
      [athleteId]: { ...(prev[athleteId] || EMPTY_STATS), [field]: value },
    }));
  }, []);

  // ── Guardar reporte ────────────────────────────────────────────────────────
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    const newReports = { ...savedReports, [selectedMatchId]: playerStats };
    setSavedReports(newReports);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newReports)); } catch { /* quota */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const selectedMatch = DEMO_MATCH_REPORTS.find(m => m.id === selectedMatchId);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "calc(100vh - 38px)", background: C.bg, fontFamily: "'Arial Narrow', Arial, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "rgba(10,10,20,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`, padding: "0 24px",
        display: "flex", alignItems: "center", gap: 20, height: 54, flexShrink: 0,
      }}>
        {/* Icono */}
        <div style={{
          width: 34, height: 34, border: `1px solid ${C.neonBorder}`,
          background: C.neonDim, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke={C.neon} strokeWidth="1.8"/>
            <path d="M12 2a10 10 0 0 1 0 20M2 12h20M12 2c-2.5 3-4 6.5-4 10s1.5 7 4 10M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10" stroke={C.neon} strokeWidth="1.2"/>
          </svg>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: "-0.3px", lineHeight: 1 }}>
            Match Center
          </div>
          <div style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginTop: 2 }}>
            Reporte post-partido · Performance Analytics
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
          {[
            { key: "ingesta",   label: "Ingesta" },
            { key: "analytics", label: "Analytics" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                padding: "6px 16px", fontSize: 9, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "1.5px",
                background: view === tab.key ? C.neon : "transparent",
                color: view === tab.key ? "#0a0a0a" : C.textMuted,
                border: `1px solid ${view === tab.key ? C.neon : C.border}`,
                cursor: "pointer", transition: "all 150ms",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="mc-layout" style={{ display: "flex", height: "calc(100vh - 38px - 54px)" }}>

        {/* ── SIDEBAR: Selector de partido + lista de jugadores ── */}
        <div className="mc-sidebar" style={{
          width: 260, flexShrink: 0, borderRight: `1px solid ${C.border}`,
          background: "rgba(0,0,0,0.6)", overflowY: "auto",
          display: "flex", flexDirection: "column",
        }}>
          {/* Selector de partido */}
          <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted, marginBottom: 8 }}>
              Partido
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {DEMO_MATCH_REPORTS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  style={{
                    textAlign: "left", padding: "8px 10px",
                    background: selectedMatchId === m.id ? "rgba(200,255,0,0.08)" : "transparent",
                    border: `1px solid ${selectedMatchId === m.id ? C.neon : C.border}`,
                    cursor: "pointer", transition: "all 150ms",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "white", textTransform: "uppercase", letterSpacing: "-0.2px" }}>
                      vs {m.rival}
                    </div>
                    <div style={{ fontSize: 8, color: C.textMuted, marginTop: 1 }}>{m.fecha}</div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 900,
                    color: m.resultado.startsWith("0") ? C.danger : C.neon,
                    letterSpacing: "-0.5px",
                  }}>
                    {m.resultado}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de jugadores participantes */}
          <div style={{ padding: "12px 14px", flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted, marginBottom: 8 }}>
              Plantel ({matchAthletes.length})
            </div>
            {matchAthletes.map(a => {
              const ps = playerStats[a.id] || EMPTY_STATS;
              const score = calcElevateScore(ps);
              const isActive = selectedAthleteId === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAthleteId(a.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 8px", marginBottom: 2, cursor: "pointer",
                    background: isActive ? "rgba(200,255,0,0.06)" : "transparent",
                    border: `1px solid ${isActive ? C.neonBorder : "transparent"}`,
                    transition: "all 120ms",
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 3,
                    background: "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: C.neon, flexShrink: 0,
                  }}>
                    {a.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: "white", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {a.name}
                    </div>
                    <div style={{ fontSize: 8, color: C.textMuted }}>{a.posCode}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: score >= 6 ? C.neon : score >= 3 ? C.amber : C.danger, flexShrink: 0 }}>
                    {score.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="mc-main" style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <AnimatePresence mode="wait">

            {/* ── VISTA: INGESTA ── */}
            {view === "ingesta" && (
              <motion.div key="ingesta" {...fadeUp}>
                {/* Info del partido */}
                {selectedMatch && (
                  <div style={{
                    marginBottom: 20, padding: "14px 18px",
                    background: "rgba(200,255,0,0.04)", border: `1px solid ${C.neonBorder}`,
                    display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
                  }}>
                    <div>
                      <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted }}>Rival</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "white", textTransform: "uppercase" }}>vs {selectedMatch.rival}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted }}>Resultado</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: C.neon }}>{selectedMatch.resultado}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted }}>Fecha</div>
                      <div style={{ fontSize: 12, color: "white" }}>{selectedMatch.fecha}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted }}>Campo</div>
                      <div style={{ fontSize: 12, color: "white" }}>{selectedMatch.local ? "Local" : "Visitante"}</div>
                    </div>
                  </div>
                )}

                {/* Formulario de stats por jugador */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: C.textMuted, marginBottom: 12 }}>
                    Estadisticas por jugador
                  </div>
                  <motion.div
                    variants={stagger}
                    initial="initial"
                    animate="animate"
                    className="mc-player-grid"
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}
                  >
                    {matchAthletes.map(a => {
                      const ps = playerStats[a.id] || { ...EMPTY_STATS };
                      const score = calcElevateScore(ps);
                      const scoreColor = score >= 7 ? C.neon : score >= 4 ? C.amber : C.danger;

                      return (
                        <motion.div
                          key={a.id}
                          variants={fadeUp}
                          style={{
                            background: "rgba(0,0,0,0.65)", border: `1px solid ${C.border}`,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
                            overflow: "hidden",
                          }}
                        >
                          {/* Cabecera del jugador */}
                          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 3,
                              background: "rgba(200,255,0,0.08)", border: `1px solid ${C.neonBorder}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 14, fontWeight: 900, color: C.neon, flexShrink: 0,
                            }}>
                              {a.name.charAt(0)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "white", textTransform: "uppercase" }}>{a.name}</div>
                              <div style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{a.posCode} · {a.pos}</div>
                            </div>
                            {/* Score en tiempo real */}
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px" }}>Score</div>
                              <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score.toFixed(1)}</div>
                            </div>
                          </div>

                          {/* Steppers */}
                          <div style={{ padding: "12px 14px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-start" }}>
                            <FifaStepper label="Minutos" value={ps.minutosJugados} min={0} max={120} onChange={v => updateStat(a.id, "minutosJugados", v)} />
                            <FifaStepper label="Goles" value={ps.goles} min={0} max={10} onChange={v => updateStat(a.id, "goles", v)} accent={C.neon} />
                            <FifaStepper label="Asist" value={ps.asistencias} min={0} max={10} onChange={v => updateStat(a.id, "asistencias", v)} accent={C.purple} />
                            <FifaStepper label="Recup" value={ps.recuperaciones} min={0} max={30} onChange={v => updateStat(a.id, "recuperaciones", v)} accent={C.green} />
                            <FifaStepper label="Duelos" value={ps.duelosGanados} min={0} max={20} onChange={v => updateStat(a.id, "duelosGanados", v)} accent={C.amber} />
                            <TarjetaSelector value={ps.tarjeta} onChange={v => updateStat(a.id, "tarjeta", v)} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Boton Guardar */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                  <AnimatePresence>
                    {saved && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        style={{ padding: "10px 18px", fontSize: 10, color: C.neon, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <span>&#10003;</span> Reporte guardado
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    style={{
                      padding: "10px 28px", fontSize: 10, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "1.5px",
                      background: C.neon, color: "#0a0a0a", border: "none", cursor: "pointer",
                    }}
                  >
                    Guardar reporte
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── VISTA: ANALYTICS ── */}
            {view === "analytics" && (
              <motion.div key="analytics" {...fadeUp}>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {/* Player Cards */}
                  <div style={{ flex: "0 0 auto", minWidth: 280 }}>
                    <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: C.textMuted, marginBottom: 12 }}>
                      Player Card Pro
                    </div>
                    <motion.div variants={stagger} initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {matchAthletes.slice(0, 6).map(a => {
                        const ps = playerStats[a.id] || EMPTY_STATS;
                        const rpe = athletes.find(x => x.id === a.id)?.rpe;
                        return (
                          <PlayerCardPro
                            key={a.id}
                            athlete={a}
                            stats={ps}
                            elevateScore={calcElevateScore(ps)}
                            rpe={rpe}
                            historial={historial}
                            selected={selectedAthleteId === a.id}
                            onSelect={() => setSelectedAthleteId(a.id)}
                          />
                        );
                      })}
                    </motion.div>
                  </div>

                  {/* Analytics Panel del jugador seleccionado */}
                  <div style={{ flex: 1, minWidth: 300 }}>
                    <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: C.textMuted, marginBottom: 12 }}>
                      Analytics detallado
                    </div>
                    <AnimatePresence mode="wait">
                      {selectedAthlete && (
                        <motion.div key={selectedAthleteId} {...fadeUp}>
                          <PlayerAnalytics
                            athlete={selectedAthlete}
                            stats={selectedStats}
                            rpe={selectedRpe}
                            historial={historial}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
