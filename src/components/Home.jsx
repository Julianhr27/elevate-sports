/**
 * @component Home
 * @description Pantalla principal de Elevate Sports con UX nivel consola.
 *
 * @ux-features
 * - Hover/Focus con glow neón radial por tile
 * - Scale transform suave (1.02) en tile activo
 * - Imagen de fondo: oscura en reposo, saturada al hover
 * - Botón CTA: cambia a blanco al hover
 * - Audio sintetizado con Web Audio API (sin archivos externos):
 *     · hover  → "woosh" suave de baja frecuencia (tipo FIFA nav)
 *     · click  → "confirmación" metálica breve
 *
 * @audio-architecture
 * AudioContext se crea una sola vez (lazy) para evitar warnings del browser.
 * Dos funciones de síntesis: playHover() y playSelect()
 * que generan sonido programáticamente con OscillatorNode + GainNode.
 *
 * @palette  Ver objeto PALETTE (centralizado)
 * @version  5.0
 * @author   Elevate Sports
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import imgEntrenamiento from "../assets/entrenamiento.jpeg";
import imgPlantilla     from "../assets/Gestion_de_plantilla.jpeg";
import imgPartido       from "../assets/Partido.jpeg";
import imgOficina       from "../assets/Oficina.jpeg";
import imgProximo       from "../assets/Proximo_partido.jpeg";
import { PALETTE }      from "../constants/palette";
import EmptyState       from "./ui/EmptyState";
import { useResponsive } from "../hooks/useResponsive";

// ── Inject responsive media queries once ────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("home-responsive")) {
  const s = document.createElement("style");
  s.id = "home-responsive";
  s.textContent = `
    /* Home topbar nav: horizontal scroll on mobile */
    .home-topbar { overflow-x: auto; -webkit-overflow-scrolling: touch; }

    /* Home grid: single column on mobile, 2-col on tablet */
    @media (max-width: 479px) {
      .home-grid {
        grid-template-columns: 1fr !important;
        grid-auto-rows: minmax(160px, auto) !important;
        padding: 3px 8px 10px !important;
      }
      .home-grid > * {
        grid-column: auto !important;
        grid-row: auto !important;
      }
      .home-tile-big { font-size: clamp(28px, 8vw, 44px) !important; }
      .home-tile-mid { font-size: clamp(18px, 5.5vw, 24px) !important; }
    }
    @media (min-width: 480px) and (max-width: 767px) {
      .home-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        grid-auto-rows: minmax(160px, auto) !important;
      }
      .home-stat-row {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
    /* KPI metrics: 2-col on mobile */
    @media (max-width: 767px) {
      .home-metrics { grid-template-columns: repeat(2, 1fr) !important; }
      .home-brand-full { display: none !important; }
    }
    /* Club badge: hide name on xs */
    @media (max-width: 479px) {
      .home-club-name { display: none !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", stiffness: 300, damping: 28 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const metricItemVariant = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 28 } },
};

// ─────────────────────────────────────────────
// NAVEGACIÓN
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  { key:"home",          label:"Inicio",               navigable:false },
  { key:"entrenamiento", label:"Entrenamiento",         navigable:true  },
  { key:"plantilla",     label:"Gestión de plantilla",  navigable:true  },
  { key:"calendario",    label:"Calendario",            navigable:true  },
  { key:"admin",         label:"Administración",        navigable:true  },
  { key:"reportes",      label:"Reportes",              navigable:true  },
  { key:"miclub",        label:"Mi club",               navigable:true  },
];

// ─────────────────────────────────────────────
// ICONOS SVG
// ─────────────────────────────────────────────
const Icon = {
  Users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={PALETTE.neon} strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke={PALETTE.neon} strokeWidth="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={PALETTE.neon} strokeWidth="2" strokeLinecap="round"/></svg>,
  Ball:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={PALETTE.neon} strokeWidth="2"/><path d="M12 2a10 10 0 0 1 0 20M2 12h20M12 2c-2.5 3-4 6.5-4 10s1.5 7 4 10M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10" stroke={PALETTE.neon} strokeWidth="1.5"/></svg>,
  Train: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" stroke={PALETTE.neon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" stroke={PALETTE.neon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={PALETTE.neon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ─────────────────────────────────────────────
// WEB AUDIO API — SÍNTESIS DE SONIDO
// No requiere archivos externos.
// AudioContext se crea de forma lazy al primer uso.
// ─────────────────────────────────────────────

/**
 * Hook que expone dos funciones de audio sintetizado:
 * - playHover():  sonido de navegación suave (woosh FIFA)
 * - playSelect(): sonido de confirmación metálica
 */
function useGameAudio() {
  const ctxRef = useRef(null);

  /** Obtiene o crea el AudioContext (lazy, evita warnings del browser) */
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  /**
   * Sonido de hover/navegación
   * Síntesis: oscilador sinusoidal de baja frecuencia (80→40 Hz)
   * con envelope rápido — reproduce el "thud" suave de menús FIFA.
   */
  const playHover = useCallback(() => {
    try {
      const ctx  = getCtx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext puede estar bloqueado hasta interacción del usuario — silencioso
    }
  }, [getCtx]);

  /**
   * Sonido de selección/click
   * Síntesis: dos osciladores (fundamental + armónico) con
   * envelope más largo y frecuencia ascendente — "ding" metálico FIFA.
   */
  const playSelect = useCallback(() => {
    try {
      const ctx   = getCtx();
      const now   = ctx.currentTime;

      // Oscilador 1: fundamental
      const osc1  = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(480, now + 0.08);
      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.start(now);
      osc1.stop(now + 0.26);

      // Oscilador 2: armónico (5ª justa)
      const osc2  = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(480, now);
      osc2.frequency.exponentialRampToValueAtTime(720, now + 0.08);
      gain2.gain.setValueAtTime(0.1, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc2.start(now);
      osc2.stop(now + 0.21);
    } catch { /* audio context not supported */ }
  }, [getCtx]);

  return { playHover, playSelect };
}

// ─────────────────────────────────────────────
// COMPONENTE TILE INTERACTIVO
// Encapsula toda la lógica de hover/focus/audio
// para no repetirla en cada mosaico.
// ─────────────────────────────────────────────

/**
 * @component InteractiveTile
 * @param {string}   tileKey        - Identificador único del tile
 * @param {string}   gridColumn     - CSS grid-column
 * @param {string}   gridRow        - CSS grid-row
 * @param {string}   image          - URL de imagen de fondo
 * @param {string}   overlayType    - "left" | "bottom"
 * @param {string}   borderTopColor - Color del borde superior
 * @param {number}   borderTopWidth - Grosor del borde superior
 * @param {Function} onClick        - Callback al hacer click
 * @param {Function} playHover      - Función de audio hover
 * @param {Function} playSelect     - Función de audio selección
 * @param {ReactNode} children      - Contenido del tile
 */
function InteractiveTile({
  gridColumn, gridRow,
  image, overlayType = "bottom",
  borderTopColor = PALETTE.neon, borderTopWidth = 4,
  onClick, playHover, playSelect,
  children,
}) {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
    playHover();
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const handleClick = () => {
    playSelect();
    onClick && onClick();
  };

  // Overlay gradiente según tipo de tile
  const overlayGradient = overlayType === "left"
    ? "linear-gradient(to right, rgba(0,0,0,0.88) 28%, rgba(0,0,0,0.22) 65%, transparent 100%)"
    : "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.05) 100%)";

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        position:    "relative",
        overflow:    "hidden",
        cursor:      "pointer",
        gridColumn,
        gridRow,
        borderTop:   `${borderTopWidth}px solid ${borderTopColor}`,
        // ── Glow effect ──
        // boxShadow con spread interno + externo para efecto neón radial
        boxShadow: hovered
          ? `0 0 0 1px ${PALETTE.neon}, 0 0 28px 4px ${PALETTE.neonGlow}, inset 0 0 20px rgba(200,255,0,0.06), 0 8px 32px rgba(0,0,0,0.6)`
          : "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
        // ── Scale transform ──
        transform:  hovered ? "scale(1.025)" : "scale(1)",
        zIndex:     hovered ? 3 : 1,
        transition: "transform 220ms ease-in-out, box-shadow 220ms ease-in-out",
      }}
    >
      {/* Imagen de fondo con filtro dinámico */}
      <div style={{
        position:        "absolute",
        inset:           0,
        backgroundImage: `url(${image})`,
        backgroundSize:  "cover",
        backgroundPosition: "center",
        zIndex:          0,
        // Cuando NO está en hover: desaturado y oscuro (reposo)
        // Cuando SÍ está en hover: saturado y brillante
        filter: hovered
          ? "brightness(1.08) saturate(1.15)"
          : "brightness(0.75) saturate(0.8)",
        transition: "filter 250ms ease-in-out",
      }}/>

      {/* Overlay de gradiente */}
      <div style={{
        position:   "absolute",
        inset:      0,
        background: overlayGradient,
        zIndex:     2,
        // Overlay más claro en hover para resaltar imagen
        opacity:    hovered ? 0.82 : 1,
        transition: "opacity 250ms ease-in-out",
      }}/>

      {/* Contenido del tile con prop isHovered para CTA */}
      <div style={{
        position: "relative",
        zIndex:   5,
        height:   "100%",
        display:  "flex",
        flexDirection:  "column",
        justifyContent: "flex-end",
        padding:  "18px 20px",
      }}>
        {typeof children === "function" ? children(hovered) : children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HOME PRINCIPAL
// ─────────────────────────────────────────────
export default function Home({ club, athletes, stats, matchStats, onNavigate, mode, onLogout }) {
  const { playHover, playSelect } = useGameAudio();
  const { isMobile, isXs }        = useResponsive();

  const clubInitials = (club.nombre || "ES")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  // ── Estilos estáticos ────────────────────
  const css = {
    app: { minHeight:"100vh", background:PALETTE.bg, fontFamily:"'Arial Narrow', Arial, sans-serif", display:"flex", flexDirection:"column" },
    topbar: { height:42, background:"rgba(10,10,15,0.85)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${PALETTE.neonBorder}`, display:"flex", alignItems:"stretch", flexShrink:0, overflowX:"auto" },
    brandBlock: { padding:"0 22px", display:"flex", alignItems:"center", background:"rgba(0,0,0,0.6)", borderRight:`1px solid ${PALETTE.border}` },
    navItem: (active) => ({ padding:"0 15px", fontSize:10, textTransform:"uppercase", letterSpacing:"1.8px", color: active ? PALETTE.text : PALETTE.textMuted, display:"flex", alignItems:"center", cursor:"pointer", borderRight:`1px solid ${PALETTE.border}`, borderBottom: active ? `2px solid ${PALETTE.neon}` : "2px solid transparent", background: active ? "rgba(200,255,0,0.05)" : "transparent", whiteSpace:"nowrap", transition:"color 0.15s" }),
    clubBadge: { marginLeft:"auto", display:"flex", alignItems:"center", gap:10, padding:"0 18px", borderLeft:`1px solid ${PALETTE.border}` },
    clubLogo: { width:28, height:28, borderRadius:"50%", background:"rgba(200,255,0,0.12)", border:`2px solid ${PALETTE.neon}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:PALETTE.neon, flexShrink:0 },
    metrics: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:0, flexShrink:0, borderBottom:`1px solid rgba(255,255,255,0.06)` },
    metricBlock: (i) => ({ padding:"12px 18px", display:"flex", alignItems:"center", gap:12, background: i===0 ? "linear-gradient(135deg,rgba(57,255,20,0.09),rgba(57,255,20,0.03))" : "linear-gradient(135deg,rgba(20,20,30,0.9),rgba(10,10,20,0.95))", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`3px solid ${PALETTE.neon}`, borderRight:`1px solid rgba(255,255,255,0.06)`, boxShadow:"0 4px 24px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.03)" }),
    grid: { flex:1, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,280px),1fr))", gridAutoRows:"minmax(180px,1fr)", gap:4, padding:"4px 12px 12px", minHeight:0 },
    tag: { fontSize:9, textTransform:"uppercase", letterSpacing:"3px", fontWeight:600, color:PALETTE.neon, marginBottom:8, opacity:0.9 },
    titleBig: { fontSize:44, fontWeight:900, color:PALETTE.text, textTransform:"uppercase", letterSpacing:"-2px", lineHeight:0.9, textShadow:"0 2px 24px rgba(0,0,0,1)", marginBottom:18 },
    titleMid: { fontSize:24, fontWeight:900, color:PALETTE.text, textTransform:"uppercase", letterSpacing:"-0.8px", lineHeight:1, textShadow:"0 2px 14px rgba(0,0,0,0.9)", marginBottom:14 },
    // Botón CTA: recibe isHovered para cambiar color
    btn: (hov) => ({ display:"inline-flex", alignItems:"center", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", padding:"10px 22px", background: hov ? "white" : PALETTE.neon, color:"#0a0a0a", border:"none", cursor:"pointer", width:"fit-content", transition:"background 200ms ease-in-out, color 200ms ease-in-out" }),
    ghostBtn: { display:"inline-flex", alignItems:"center", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", padding:"6px 14px", background:"transparent", border:`1px solid rgba(200,255,0,0.4)`, color:PALETTE.neon, cursor:"pointer" },
    statRow: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", height:"100%", position:"relative", zIndex:2 },
    statBlock: (last) => ({ display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 18px", borderRight: last ? "none" : `1px solid ${PALETTE.border}` }),
    footer: { display:"flex", alignItems:"center", justifyContent:"flex-end", padding:"4px 18px 8px", flexShrink:0 },
  };

  const METRICS = [
    { label:"Deportistas",    value:athletes.length,        icon:Icon.Users },
    { label:"Partidos",       value:matchStats.played,        icon:Icon.Ball  },
    { label:"Entrenamientos", value:stats.sesiones,          icon:Icon.Train },
    { label:"Asistencia",     value:stats.asistencia + "%",  icon:Icon.Chart },
  ];

  const STATS = [
    { val:matchStats.won,         lbl:"Ganados",   color:PALETTE.green },
    { val:matchStats.lost,        lbl:"Perdidos",  color:PALETTE.danger },
    { val:matchStats.points,      lbl:"Puntos",    color:PALETTE.neon },
    { val:`${matchStats.goalsFor}-${matchStats.goalsAgainst}`, lbl:"Goles F/C", color:"white" },
  ];

  return (
    <div style={css.app}>

      {/* TOPBAR */}
      <div className="home-topbar" style={css.topbar}>
        <div style={css.brandBlock}>
          <span className="home-brand-full" style={{ fontSize:17, fontWeight:700, color:PALETTE.text, letterSpacing:"-0.3px", whiteSpace:"nowrap" }}>
            Elevate<span style={{ color:PALETTE.neon }}>Sports</span>
          </span>
        </div>
        {NAV_ITEMS.map(({ key, label, navigable }) => (
          <div key={key} onClick={() => navigable && onNavigate(key)} style={css.navItem(key==="home")}>
            {label}
          </div>
        ))}
        <div style={css.clubBadge}>
          {mode === "demo" && (
            <div style={{ padding:"2px 8px", fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", background:"rgba(239,159,39,0.2)", color:"#EF9F27", border:"1px solid rgba(239,159,39,0.4)", marginRight:6 }}>
              Demo
            </div>
          )}
          <div style={css.clubLogo}>{clubInitials}</div>
          <div className="home-club-name">
            <div style={{ fontSize:12, fontWeight:700, color:PALETTE.text, textTransform:"uppercase", letterSpacing:"1px", whiteSpace:"nowrap" }}>
              {club.nombre || "Mi Club"}
            </div>
            <div style={{ fontSize:9, color:PALETTE.textMuted, textTransform:"uppercase", letterSpacing:"0.5px", marginTop:1 }}>
              {(club.categorias||[])[0]||"General"} · {club.temporada||"2025-26"}
            </div>
          </div>
          {onLogout && (
            <div
              onClick={onLogout}
              style={{ marginLeft:10, padding:"4px 10px", fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.35)", border:"1px solid rgba(255,255,255,0.12)", cursor:"pointer", whiteSpace:"nowrap" }}
            >
              Cerrar sesion
            </div>
          )}
        </div>
      </div>

      {/* METRICS */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="home-metrics"
        style={css.metrics}
      >
        {METRICS.map((m, i) => (
          <motion.div key={m.label} variants={metricItemVariant} style={css.metricBlock(i)}>
            {m.icon}
            <div>
              <div style={{ fontSize:22, fontWeight:700, color:PALETTE.neon, lineHeight:1 }}>{m.value}</div>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", color:PALETTE.textMuted, marginTop:2 }}>{m.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* EMPTY STATE — shown when no athletes registered yet */}
      {athletes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.2 }}
          style={{
            margin: "0 12px",
            background: "rgba(139,92,246,0.06)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <EmptyState
            icon={
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="#8B5CF6" strokeWidth="1.8"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            }
            title="Bienvenido a Elevate Sports"
            subtitle="Comienza agregando deportistas a tu plantilla para desbloquear todas las metricas y funciones del dashboard"
            actionLabel="Ir a Plantilla"
            onAction={() => onNavigate("plantilla")}
            compact
          />
        </motion.div>
      )}

      {/* GRID DE MOSAICOS */}
      <motion.div
        {...fadeInUp}
        className="home-grid"
        style={css.grid}
      >

        {/* TILE 1 — ENTRENAMIENTO */}
        <InteractiveTile
          tileKey="entrenamiento"
          gridColumn="1" gridRow="1"
          image={imgEntrenamiento}
          overlayType="left"
          onClick={() => onNavigate("entrenamiento")}
          playHover={playHover}
          playSelect={playSelect}
        >
          {(hov) => (
            <>
              <div style={css.tag}>Módulo 01</div>
              <div style={css.titleBig}>Entrenamiento</div>
              <div style={css.btn(hov)}>Entrar →</div>
            </>
          )}
        </InteractiveTile>

        {/* TILE 2 — GESTIÓN DE PLANTILLA */}
        <InteractiveTile
          tileKey="plantilla"
          gridColumn="2" gridRow="1"
          image={imgPlantilla}
          overlayType="bottom"
          onClick={() => onNavigate("plantilla")}
          playHover={playHover}
          playSelect={playSelect}
        >
          {(hov) => (
            <>
              <div style={css.tag}>Módulo 02</div>
              <div style={css.titleMid}>Gestión de plantilla</div>
              <div style={css.btn(hov)}>Ver plantilla →</div>
            </>
          )}
        </InteractiveTile>

        {/* TILE 3 — PRÓXIMO PARTIDO */}
        <InteractiveTile
          tileKey="partido"
          gridColumn="3" gridRow="1"
          image={imgPartido}
          overlayType="bottom"
          playHover={playHover}
          playSelect={playSelect}
        >
          {(hov) => (
            <>
              <div style={css.tag}>Próximo partido</div>
              <div style={css.titleMid}>vs Atlético Sur</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:4, letterSpacing:"0.5px" }}>
                {matchStats.won}G · {matchStats.drawn}E · {matchStats.lost}P — {matchStats.points} pts
              </div>
              <div style={{ ...css.btn(hov), marginTop:10 }}>Ver partido →</div>
            </>
          )}
        </InteractiveTile>

        {/* TILE 4 — RESUMEN DEL CICLO (sin hover interactivo) */}
        <div style={{ position:"relative", overflow:"hidden", gridColumn:"1/3", gridRow:"2", borderTop:`2px solid ${PALETTE.neonBorder}`, boxShadow:"0 4px 24px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.03)" }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:`url(${imgProximo})`, backgroundSize:"cover", backgroundPosition:"center", filter:"brightness(0.12) saturate(0.6)", zIndex:0 }}/>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(14,14,24,0.92),rgba(8,8,16,0.96))", zIndex:1 }}/>
          <div className="home-stat-row" style={css.statRow}>
            {STATS.map((m, i) => (
              <div key={m.lbl} style={css.statBlock(i===3)}>
                <div style={{ fontSize:20, fontWeight:700, color:m.color }}>{m.val}</div>
                <div style={{ fontSize:9, color:PALETTE.textHint, textTransform:"uppercase", letterSpacing:"0.8px", marginTop:3 }}>{m.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TILE 5 — OFICINA */}
        <InteractiveTile
          tileKey="oficina"
          gridColumn="3" gridRow="2"
          image={imgOficina}
          overlayType="bottom"
          borderTopWidth={2}
          borderTopColor={PALETTE.neonBorder}
          onClick={() => onNavigate("admin")}
          playHover={playHover}
          playSelect={playSelect}
        >
          {(hov) => (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:"100%", paddingBottom:4 }}>
              <div>
                <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1.5px", color:PALETTE.textHint, marginBottom:3 }}>Oficina</div>
                <div style={{ fontSize:12, fontWeight:700, color:PALETTE.text, textTransform:"uppercase", letterSpacing:"0.5px" }}>Administración y pagos</div>
              </div>
              <div style={{ ...css.ghostBtn, borderColor: hov ? PALETTE.purple : "rgba(127,119,221,0.4)", color: hov ? "white" : PALETTE.purple, transition:"color 200ms, border-color 200ms" }}>
                Entrar →
              </div>
            </div>
          )}
        </InteractiveTile>

        {/* TILE 6 — CALENDARIO (fila 3, ancho completo) */}
        <div
          onClick={() => onNavigate("calendario")}
          onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.neon; playHover(); }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(200,255,0,0.15)"; }}
          style={{
            position:"relative", overflow:"hidden",
            gridColumn:"1/4", gridRow:"3",
            borderTop:`2px solid rgba(200,255,0,0.35)`,
            border:`1px solid rgba(200,255,0,0.15)`,
            background:"linear-gradient(135deg,rgba(200,255,0,0.04),rgba(10,10,18,0.96))",
            cursor:"pointer",
            minHeight:64,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"0 24px",
            transition:"border-color 200ms",
            boxShadow:"0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          {/* Icono calendario */}
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:36, height:36, border:`1px solid rgba(200,255,0,0.3)`, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(200,255,0,0.06)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="1" stroke={PALETTE.neon} strokeWidth="1.5"/>
                <path d="M3 10h18M8 2v4M16 2v4" stroke={PALETTE.neon} strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="7" y="14" width="3" height="3" rx="0.5" fill={PALETTE.neon} opacity="0.7"/>
                <rect x="10.5" y="14" width="3" height="3" rx="0.5" fill={PALETTE.neon} opacity="0.4"/>
                <rect x="14" y="14" width="3" height="3" rx="0.5" fill={PALETTE.neon} opacity="0.2"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(200,255,0,0.6)", marginBottom:3 }}>Módulo 06</div>
              <div style={{ fontSize:14, fontWeight:900, color:PALETTE.text, textTransform:"uppercase", letterSpacing:"-0.3px" }}>
                Calendario & RSVP
              </div>
            </div>
          </div>

          {/* Descripción + CTA */}
          <div style={{ display:"flex", alignItems:"center", gap:24 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, color:PALETTE.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                Partidos · Entrenamientos · Asistencia
              </div>
            </div>
            <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", padding:"7px 16px", border:`1px solid rgba(200,255,0,0.4)`, color:PALETTE.neon }}>
              Abrir →
            </div>
          </div>
        </div>

      </motion.div>

      {/* FOOTER */}
      <div style={css.footer}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ background:PALETTE.neon, color:"#0a0a0a", fontSize:10, fontWeight:700, padding:"2px 6px" }}>ES</div>
          <div style={{ fontSize:13, color:PALETTE.text, letterSpacing:"1px", fontWeight:700, textTransform:"uppercase" }}>Elevate Sports</div>
        </div>
      </div>

    </div>
  );
}
