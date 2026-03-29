/**
 * @component Calendario
 * @description Competition Planner + RSVP Engine unificado.
 *
 * Módulos integrados:
 *  - Vista de calendario mensual custom (sin FullCalendar — bundle ligero)
 *  - Diferenciación visual por tipo de evento: entrenamiento / partido / club
 *  - Panel lateral de evento seleccionado con lista de deportistas + estados RSVP
 *  - Widget de disponibilidad en tiempo real ("18 confirmados de 22 convocados")
 *  - Botón "Enviar recordatorio" (simulado con toast)
 *  - Navegación prev/next mes
 *  - Bloqueo de RPE para inasistencia confirmada (expuesto via localStorage)
 *  - Responsive mobile: panel cae debajo del grid en viewport < 768px
 *
 * @persistencia localStorage namespace `elevate_rsvp_{clubId}`
 * @version 1.0
 * @author @Arquitecto Carlos / @Andres UI
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PALETTE as C } from "../constants/palette";
import { showToast } from "./Toast";

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIVE CSS — inyectado una sola vez en el DOM
// ─────────────────────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("cal-responsive")) {
  const s = document.createElement("style");
  s.id = "cal-responsive";
  s.textContent = `
    .cal-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 12px;
      padding: 12px;
      min-height: calc(100vh - 38px);
      box-sizing: border-box;
      align-items: start;
    }
    @media (max-width: 900px) {
      .cal-layout {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
      }
    }
    @media (max-width: 479px) {
      .cal-layout { padding: 6px; gap: 6px; }
      .cal-day-cell { min-height: 52px !important; padding: 3px !important; }
      .cal-event-badge { font-size: 7px !important; padding: 1px 4px !important; }
      .cal-header-label { font-size: 10px !important; }
    }
    .cal-day-cell:hover .cal-day-hover-ring {
      opacity: 1;
    }
    .cal-rsvp-btn {
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 10px;
      cursor: pointer;
      transition: background 150ms, border-color 150ms;
      box-sizing: border-box;
    }
    .cal-reminder-btn {
      min-height: 44px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 150ms, border-color 150ms, box-shadow 150ms;
      box-sizing: border-box;
    }
    /* On mobile, the panel must not collapse — enforce a visible min-height */
    @media (max-width: 900px) {
      .cal-event-panel {
        min-height: 300px !important;
        position: static !important;
      }
    }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE TIPO DE EVENTO
// ─────────────────────────────────────────────────────────────────────────────
const EVENT_TYPES = {
  training:    { label: "Entrenamiento",    color: C.purple,  colorDim: "rgba(127,119,221,0.18)", border: "rgba(127,119,221,0.5)" },
  match:       { label: "Partido oficial",  color: C.neon,    colorDim: "rgba(200,255,0,0.12)",   border: "rgba(200,255,0,0.45)"  },
  club:        { label: "Evento de club",   color: C.amber,   colorDim: "rgba(239,159,39,0.15)",  border: "rgba(239,159,39,0.45)" },
};

// ─────────────────────────────────────────────────────────────────────────────
// ESTADOS RSVP
// ─────────────────────────────────────────────────────────────────────────────
const RSVP_STATES = {
  PENDIENTE:    { label: "Pendiente",   color: "rgba(255,255,255,0.25)", bg: "rgba(255,255,255,0.05)", icon: "?" },
  CONFIRMADO:   { label: "Confirmado",  color: C.neon,                  bg: "rgba(200,255,0,0.12)",   icon: "✓" },
  AUSENTE:      { label: "Ausente",     color: C.danger,                bg: "rgba(226,75,74,0.12)",   icon: "✗" },
  DUDA:         { label: "Duda",        color: C.amber,                 bg: "rgba(239,159,39,0.12)",  icon: "~" },
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERADOR DE EVENTOS DEMO para el mes actual y adyacentes
// Genera datos realistas sin necesitar backend.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera un array de eventos demo centrados en el mes dado.
 * @param {number} year
 * @param {number} month - 0-indexed
 * @returns {Array<EventDef>}
 */
function generateDemoEvents(year, month) {
  const d = (day, hour = 18, min = 0) => {
    const dt = new Date(year, month, day, hour, min);
    return dt.toISOString();
  };

  return [
    // Entrenamientos — martes y jueves habituales
    { id: `t-${year}-${month}-1`,  type: "training", title: "Entrenamiento físico",      datetime: d(2,  18, 0),  location: "Campo A",       convocados: null },
    { id: `t-${year}-${month}-2`,  type: "training", title: "Trabajo táctico",            datetime: d(4,  18, 0),  location: "Campo A",       convocados: null },
    { id: `t-${year}-${month}-3`,  type: "training", title: "Rondos y pressing",          datetime: d(9,  18, 0),  location: "Campo A",       convocados: null },
    { id: `t-${year}-${month}-4`,  type: "training", title: "Entrenamiento precompetición",datetime: d(11, 17, 30), location: "Campo B",       convocados: null },
    { id: `t-${year}-${month}-5`,  type: "training", title: "Recuperación activa",        datetime: d(16, 10, 0),  location: "Gimnasio",      convocados: null },
    { id: `t-${year}-${month}-6`,  type: "training", title: "Pautas tácticas jornada",    datetime: d(18, 18, 0),  location: "Campo A",       convocados: null },
    { id: `t-${year}-${month}-7`,  type: "training", title: "Ensayo de balón parado",     datetime: d(23, 18, 0),  location: "Campo A",       convocados: null },
    { id: `t-${year}-${month}-8`,  type: "training", title: "Entrenamiento técnico",      datetime: d(25, 18, 0),  location: "Campo B",       convocados: null },

    // Partidos oficiales
    { id: `m-${year}-${month}-1`,  type: "match",    title: "vs Atlético Sur",            datetime: d(7,  16, 0),  location: "Estadio Local", convocados: 22, rival: "Atlético Sur",  esLocal: true  },
    { id: `m-${year}-${month}-2`,  type: "match",    title: "vs Deportivo Norte",         datetime: d(14, 11, 0),  location: "Est. Norte",    convocados: 22, rival: "Dep. Norte",    esLocal: false },
    { id: `m-${year}-${month}-3`,  type: "match",    title: "vs Unión FC",                datetime: d(21, 16, 30), location: "Estadio Local", convocados: 22, rival: "Unión FC",      esLocal: true  },
    { id: `m-${year}-${month}-4`,  type: "match",    title: "vs Racing Club",             datetime: d(28, 17, 0),  location: "Estadio Racing",convocados: 22, rival: "Racing Club",   esLocal: false },

    // Eventos de club
    { id: `c-${year}-${month}-1`,  type: "club",     title: "Reunión de cuerpo técnico",  datetime: d(5,  10, 0),  location: "Sala de reuniones" },
    { id: `c-${year}-${month}-2`,  type: "club",     title: "Jornada de puertas abiertas",datetime: d(19, 10, 0),  location: "Campo A" },
  ].filter(ev => {
    const evDate = new Date(ev.datetime);
    return evDate.getMonth() === month && evDate.getFullYear() === year;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE CALENDARIO
// ─────────────────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

/**
 * Genera la grilla de días para un mes dado.
 * Lunes como primer día de la semana.
 * @returns {Array<{ date: Date|null, isCurrentMonth: boolean }>}
 */
function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  // getDay() 0=Sun..6=Sat — convertir a 0=Mon..6=Sun
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  // Días del mes anterior para rellenar
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -startDow + i + 1);
    cells.push({ date: d, isCurrentMonth: false });
  }
  // Días del mes actual
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  // Rellenar hasta 42 celdas (6 semanas)
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, isCurrentMonth: false });
  }
  return cells;
}

/** Formatea hora HH:MM desde un ISO string */
function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Formatea fecha larga */
function fmtDateLong(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

/** Compara si dos fechas son el mismo día */
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

/** Compara si una fecha es hoy */
function isToday(d) {
  return isSameDay(d, new Date());
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — RSVP STATE PERSISTIDO EN LOCALSTORAGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve el estado RSVP de un evento y funciones para mutarlo.
 * Persiste en `elevate_rsvp_{clubId}`.
 * @param {string} clubId
 */
function useRsvp(clubId) {
  const storageKey = `elevate_rsvp_${clubId || "demo"}`;

  const [rsvpMap, setRsvpMap] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const persist = useCallback((next) => {
    setRsvpMap(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // quota exceeded — fail silently
    }
  }, [storageKey]);

  /**
   * Obtiene el estado RSVP de un atleta para un evento.
   * @returns {"PENDIENTE"|"CONFIRMADO"|"AUSENTE"|"DUDA"}
   */
  const getRsvp = useCallback((eventId, athleteId) => {
    return rsvpMap?.[eventId]?.[athleteId] || "PENDIENTE";
  }, [rsvpMap]);

  /**
   * Actualiza el estado RSVP de un atleta para un evento.
   */
  const setRsvp = useCallback((eventId, athleteId, state) => {
    const next = {
      ...rsvpMap,
      [eventId]: {
        ...(rsvpMap[eventId] || {}),
        [athleteId]: state,
      },
    };
    persist(next);

    // Publicar en localStorage para que Entrenamiento pueda leer el bloqueo RPE
    // Clave: `elevate_rsvp_absent_{clubId}_{eventId}_{athleteId}` = "1" | "0"
    const cid = clubId || "demo";
    const absentKey = `elevate_rsvp_absent_${cid}_${eventId}_${athleteId}`;
    localStorage.setItem(absentKey, state === "AUSENTE" ? "1" : "0");
  }, [rsvpMap, persist, clubId]);

  /**
   * Calcula el resumen de disponibilidad para un evento.
   * @returns {{ confirmados: number, ausentes: number, dudas: number, pendientes: number, total: number }}
   */
  const getAvailability = useCallback((eventId, athleteIds) => {
    const eventRsvp = rsvpMap[eventId] || {};
    let confirmados = 0, ausentes = 0, dudas = 0, pendientes = 0;
    for (const id of athleteIds) {
      const s = eventRsvp[id] || "PENDIENTE";
      if (s === "CONFIRMADO") confirmados++;
      else if (s === "AUSENTE") ausentes++;
      else if (s === "DUDA") dudas++;
      else pendientes++;
    }
    return { confirmados, ausentes, dudas, pendientes, total: athleteIds.length };
  }, [rsvpMap]);

  return { getRsvp, setRsvp, getAvailability };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: BADGE DE EVENTO EN EL GRID
// ─────────────────────────────────────────────────────────────────────────────

function EventBadge({ event, onClick, isSelected }) {
  const def = EVENT_TYPES[event.type];
  return (
    <div
      className="cal-event-badge"
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      style={{
        fontSize: 8,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        padding: "2px 6px",
        borderRadius: 3,
        background: isSelected ? def.color : def.colorDim,
        color: isSelected ? "#0a0a0a" : def.color,
        border: `1px solid ${def.border}`,
        cursor: "pointer",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%",
        transition: "background 150ms, color 150ms, box-shadow 150ms",
        boxShadow: isSelected ? `0 0 10px ${def.color}55, inset 0 1px 0 rgba(255,255,255,0.15)` : "none",
      }}
    >
      {event.title}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: WIDGET DE DISPONIBILIDAD
// ─────────────────────────────────────────────────────────────────────────────

function AvailabilityWidget({ availability }) {
  const { confirmados, ausentes, dudas, pendientes, total } = availability;
  const pct = total > 0 ? Math.round((confirmados / total) * 100) : 0;

  return (
    <div style={{ background: "rgba(0,0,0,0.45)", border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", marginBottom: 12 }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: C.textMuted, marginBottom: 10 }}>
        Disponibilidad
      </div>

      {/* Barra de progreso */}
      <div style={{ height: 6, background: "rgba(255,255,255,0.07)", marginBottom: 10, borderRadius: 3, overflow: "hidden", position: "relative" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{ height: "100%", background: `linear-gradient(90deg, ${C.neon}cc, ${C.neon})`, boxShadow: `0 0 10px ${C.neon}88`, borderRadius: 3 }}
        />
      </div>

      {/* Cifra principal */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: C.neon, lineHeight: 1 }}>{confirmados}</span>
        <span style={{ fontSize: 12, color: C.textMuted }}>de {total} confirmados</span>
      </div>

      {/* Desglose */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "Confirm.", val: confirmados, color: C.neon },
          { label: "Ausentes", val: ausentes,    color: C.danger },
          { label: "Duda",     val: dudas,       color: C.amber },
          { label: "Pendiente",val: pendientes,  color: C.textMuted },
        ].map(({ label, val, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 24 }}
            style={{ textAlign: "center", flex: 1 }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: "0.4px", color: C.textHint, marginTop: 2 }}>{label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: FILA DE ATLETA + RSVP TOGGLE
// ─────────────────────────────────────────────────────────────────────────────

function AthleteRsvpRow({ athlete, currentState, onChangeState }) {
  const stateDef = RSVP_STATES[currentState] || RSVP_STATES.PENDIENTE;
  const order = ["CONFIRMADO", "DUDA", "AUSENTE", "PENDIENTE"];

  const cycle = useCallback(() => {
    const idx = order.indexOf(currentState);
    const next = order[(idx + 1) % order.length];
    onChangeState(next);
  }, [currentState, onChangeState]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {/* Avatar + nombre */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: `${stateDef.bg}`,
          border: `1px solid ${stateDef.color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: stateDef.color,
          flexShrink: 0,
        }}>
          {(athlete.nombre || "?")[0]?.toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {athlete.nombre || "Deportista"}
          </div>
          <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {athlete.posicion || "—"}
          </div>
        </div>
      </div>

      {/* Estado RSVP — click para ciclar */}
      <button
        onClick={cycle}
        title={`Click para cambiar estado (actual: ${stateDef.label})`}
        className="cal-rsvp-btn"
        style={{
          background: stateDef.bg,
          border: `1px solid ${stateDef.color}55`,
          color: stateDef.color,
          fontSize: 9, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.5px",
          flexShrink: 0,
          borderRadius: 4,
          boxShadow: `0 0 6px ${stateDef.color}22`,
        }}
      >
        <span style={{ fontSize: 12 }}>{stateDef.icon}</span>
        {stateDef.label}
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: PANEL LATERAL DE EVENTO SELECCIONADO
// ─────────────────────────────────────────────────────────────────────────────

function EventPanel({ event, athletes, getRsvp, setRsvp, getAvailability, onClose }) {
  const def = EVENT_TYPES[event.type];
  const athleteIds = athletes.map(a => a.id ?? `ath-${athletes.indexOf(a)}`);
  const availability = getAvailability(event.id, athleteIds);

  // Atletas convocados: para partido usa el número convocados (tomar primeros N)
  // Para entrenamiento y club: todos los atletas
  const convocadoIds = event.convocados
    ? athleteIds.slice(0, event.convocados)
    : athleteIds;

  const convocadoAvail = getAvailability(event.id, convocadoIds);

  const handleReminder = () => {
    const pendientes = convocadoAvail.pendientes;
    if (pendientes === 0) {
      showToast("Todos los deportistas han respondido.", "info");
    } else {
      showToast(`Recordatorio enviado a ${pendientes} deportista${pendientes !== 1 ? "s" : ""} con respuesta pendiente.`, "success");
    }
  };

  return (
    <motion.div
      key={event.id}
      className="cal-event-panel"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      style={{
        background: "rgba(10,10,18,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${def.border}`,
        borderTop: `3px solid ${def.color}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${def.color}11`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        minHeight: 320,
        maxHeight: "calc(100vh - 80px)",
        position: "sticky",
        top: 12,
        overflow: "hidden",
      }}
    >
      {/* Header del panel */}
      <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            {/* Tipo de evento */}
            <div style={{
              display: "inline-block",
              fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px",
              color: "#0a0a0a",
              background: def.color,
              padding: "2px 8px",
              borderRadius: 3,
              marginBottom: 6,
              boxShadow: `0 0 8px ${def.color}66`,
            }}>
              {def.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
              {event.title}
            </div>
          </div>
          {/* Cerrar panel */}
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2, flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {/* Metadatos */}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 10, color: C.textMuted, textTransform: "capitalize" }}>
            {fmtDateLong(event.datetime)} · {fmtTime(event.datetime)}
          </div>
          {event.location && (
            <div style={{ fontSize: 10, color: C.textMuted }}>
              Lugar: <span style={{ color: "rgba(255,255,255,0.6)" }}>{event.location}</span>
            </div>
          )}
          {event.rival && (
            <div style={{ fontSize: 10, color: C.textMuted }}>
              Rival: <span style={{ color: def.color, fontWeight: 700 }}>{event.rival}</span>
              {" "}
              <span style={{ color: C.textHint }}>({event.esLocal ? "Local" : "Visitante"})</span>
            </div>
          )}
        </div>
      </div>

      {/* Widget de disponibilidad */}
      <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
        <AvailabilityWidget availability={convocadoAvail} />
      </div>

      {/* Botón recordatorio */}
      <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
        <button
          onClick={handleReminder}
          className="cal-reminder-btn"
          style={{
            background: "transparent",
            border: `1px solid ${def.color}66`,
            color: def.color,
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            borderRadius: 4,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${def.colorDim}`; e.currentTarget.style.borderColor = def.color; e.currentTarget.style.boxShadow = `0 0 12px ${def.color}33`; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = `${def.color}66`; e.currentTarget.style.boxShadow = "none"; }}
        >
          Enviar recordatorio
        </button>
      </div>

      {/* Lista de deportistas + RSVP — scrollable */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: C.textMuted, marginBottom: 8 }}>
          Deportistas ({convocadoIds.length})
        </div>
        {convocadoIds.length === 0 ? (
          <div style={{ fontSize: 11, color: C.textHint, textAlign: "center", padding: "20px 0" }}>
            Sin deportistas en la plantilla. Agrega atletas para ver el RSVP.
          </div>
        ) : (
          athletes
            .filter(a => convocadoIds.includes(a.id ?? `ath-${athletes.indexOf(a)}`))
            .map(athlete => {
              const aid = athlete.id || athlete.nombre;
              return (
                <AthleteRsvpRow
                  key={aid}
                  athlete={athlete}
                  currentState={getRsvp(event.id, aid)}
                  onChangeState={(state) => setRsvp(event.id, aid, state)}
                />
              );
            })
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: EMPTY STATE (sin evento seleccionado)
// ─────────────────────────────────────────────────────────────────────────────

function PanelEmpty() {
  return (
    <motion.div
      className="cal-event-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: "rgba(10,10,18,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 240,
        padding: 24,
        textAlign: "center",
      }}
    >
      {/* Icono calendario */}
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16, opacity: 0.3 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="1.5"/>
        <path d="M3 10h18M8 2v4M16 2v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>
        Selecciona un evento
      </div>
      <div style={{ fontSize: 10, color: C.textHint, lineHeight: 1.5 }}>
        Haz click sobre cualquier evento del calendario para ver los detalles y gestionar la asistencia del equipo.
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: CALENDARIO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @component Calendario
 * @param {Array}   athletes - Lista de deportistas del club (desde App state)
 * @param {string}  clubId   - ID del club (para namespacing de localStorage)
 */
export default function Calendario({ athletes = [], clubId = "" }) {
  const today = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth());
  const [selected, setSelected] = useState(null); // EventDef | null

  const { getRsvp, setRsvp, getAvailability } = useRsvp(clubId);

  // Generar eventos demo para el mes visible
  const events = useMemo(() => generateDemoEvents(year, month), [year, month]);

  // Grid de 42 celdas
  const grid = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  // Índice: día -> eventos
  const eventsByDay = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const d = new Date(ev.datetime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  const prevMonth = useCallback(() => {
    setSelected(null);
    setMonth(m => {
      if (m === 0) { setYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setSelected(null);
    setMonth(m => {
      if (m === 11) { setYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  // Cuando se cambia de mes, si el evento seleccionado ya no existe, cerrar el panel
  useEffect(() => {
    if (selected && !events.find(e => e.id === selected.id)) {
      setSelected(null);
    }
  }, [events, selected]);

  const handleSelectEvent = useCallback((event) => {
    setSelected(prev => prev?.id === event.id ? null : event);
  }, []);

  // Leyenda de tipos de evento
  const LEGEND = Object.entries(EVENT_TYPES).map(([, v]) => ({ label: v.label, color: v.color }));

  return (
    <div style={{ minHeight: "calc(100vh - 38px)", background: C.bg }}>

      {/* ── TOPBAR DEL MÓDULO ── */}
      <div style={{
        padding: "10px 16px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        background: "rgba(10,10,18,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>

        {/* Navegación de mes */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={prevMonth}
            style={{ background: "none", border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", padding: "4px 10px", fontSize: 12, transition: "border-color 150ms, color 150ms" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.neon; e.currentTarget.style.color = C.neon; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
          >
            ‹
          </button>

          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex", alignItems: "baseline", gap: 8 }}
          >
            <span style={{ fontSize: 18, fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: "-0.5px" }}>
              {MONTHS_ES[month]}
            </span>
            <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
              {year}
            </span>
          </motion.div>

          <button
            onClick={nextMonth}
            style={{ background: "none", border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", padding: "4px 10px", fontSize: 12, transition: "border-color 150ms, color 150ms" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.neon; e.currentTarget.style.color = C.neon; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
          >
            ›
          </button>

          {/* Botón "Hoy" */}
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(null); }}
            style={{ background: "none", border: `1px solid ${C.neonBorder}`, color: C.neon, cursor: "pointer", padding: "4px 10px", fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}
          >
            Hoy
          </button>
        </div>

        {/* Leyenda de tipos */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {LEGEND.map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, background: color, boxShadow: `0 0 4px ${color}` }} />
              <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.8px", color: C.textMuted }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Contador de eventos del mes */}
        <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px" }}>
          <span style={{ color: "white", fontWeight: 700 }}>{events.length}</span> eventos este mes
        </div>
      </div>

      {/* ── LAYOUT PRINCIPAL: GRID + PANEL ── */}
      <div className="cal-layout">

        {/* ── GRID MENSUAL ── */}
        <div>
          {/* Cabecera de días */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 2 }}>
            {DAYS_OF_WEEK.map(d => (
              <div
                key={d}
                className="cal-header-label"
                style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: C.textMuted, textAlign: "center", padding: "6px 0" }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Celdas del grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {grid.map(({ date, isCurrentMonth }, idx) => {
              const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const dayEvents = eventsByDay[key] || [];
              const today_ = isToday(date);
              const hasSelectedEvent = selected && isSameDay(date, new Date(selected.datetime));

              return (
                <div
                  key={idx}
                  className="cal-day-cell"
                  style={{
                    minHeight: 72,
                    padding: 5,
                    background: hasSelectedEvent
                      ? "rgba(200,255,0,0.06)"
                      : today_
                        ? "rgba(127,119,221,0.08)"
                        : isCurrentMonth
                          ? "rgba(255,255,255,0.02)"
                          : "transparent",
                    border: hasSelectedEvent
                      ? `1px solid ${C.neonBorder}`
                      : today_
                        ? `1px solid rgba(127,119,221,0.3)`
                        : `1px solid ${C.border}`,
                    cursor: dayEvents.length > 0 ? "pointer" : "default",
                    transition: "background 150ms, border-color 150ms",
                    position: "relative",
                    borderRadius: 4,
                  }}
                  onMouseEnter={dayEvents.length > 0 ? e => { if (!hasSelectedEvent) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; } } : undefined}
                  onMouseLeave={dayEvents.length > 0 ? e => { if (!hasSelectedEvent) { e.currentTarget.style.background = isCurrentMonth ? "rgba(255,255,255,0.02)" : "transparent"; e.currentTarget.style.borderColor = today_ ? "rgba(127,119,221,0.3)" : C.border; } } : undefined}
                >
                  {/* Número de día */}
                  <div style={{
                    fontSize: 11,
                    fontWeight: today_ ? 900 : 500,
                    color: today_ ? C.purple : isCurrentMonth ? "rgba(255,255,255,0.7)" : C.textHint,
                    marginBottom: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <span>{date.getDate()}</span>
                    {today_ && (
                      <span style={{ fontSize: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: C.purple, background: "rgba(127,119,221,0.15)", padding: "1px 4px" }}>
                        Hoy
                      </span>
                    )}
                  </div>

                  {/* Badges de eventos — máx 3 visibles */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {dayEvents.slice(0, 3).map(ev => (
                      <EventBadge
                        key={ev.id}
                        event={ev}
                        onClick={handleSelectEvent}
                        isSelected={selected?.id === ev.id}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: 7, color: C.textMuted, paddingLeft: 2 }}>
                        +{dayEvents.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lista de eventos del mes — debajo del grid en mobile */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: C.textMuted, marginBottom: 10, paddingLeft: 2 }}>
              Agenda del mes
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {events
                .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
                .map(ev => {
                  const def = EVENT_TYPES[ev.type];
                  const isSelected = selected?.id === ev.id;
                  return (
                    <motion.div
                      key={ev.id}
                      whileHover={{ x: 3 }}
                      onClick={() => handleSelectEvent(ev)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        background: isSelected ? def.colorDim : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? def.border : C.border}`,
                        borderLeft: `3px solid ${def.color}`,
                        borderRadius: 4,
                        cursor: "pointer",
                        transition: "background 150ms, border-color 150ms",
                        boxShadow: isSelected ? `0 2px 12px ${def.color}22` : "none",
                      }}
                    >
                      {/* Fecha */}
                      <div style={{ minWidth: 36, textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: def.color, lineHeight: 1 }}>
                          {new Date(ev.datetime).getDate()}
                        </div>
                        <div style={{ fontSize: 7, color: C.textMuted, textTransform: "uppercase" }}>
                          {DAYS_OF_WEEK[new Date(ev.datetime).getDay() === 0 ? 6 : new Date(ev.datetime).getDay() - 1]}
                        </div>
                      </div>
                      {/* Separador */}
                      <div style={{ width: 1, height: 30, background: C.border, flexShrink: 0 }} />
                      {/* Info */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ev.title}
                        </div>
                        <div style={{ fontSize: 9, color: C.textMuted }}>
                          {fmtTime(ev.datetime)} · {ev.location}
                        </div>
                      </div>
                      {/* Tipo */}
                      <div style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: def.color, background: def.colorDim, padding: "2px 6px", flexShrink: 0 }}>
                        {def.label}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* ── PANEL LATERAL — EVENTO SELECCIONADO ── */}
        <div>
          <AnimatePresence mode="wait">
            {selected ? (
              <EventPanel
                key={selected.id}
                event={selected}
                athletes={athletes}
                getRsvp={getRsvp}
                setRsvp={setRsvp}
                getAvailability={getAvailability}
                onClose={() => setSelected(null)}
              />
            ) : (
              <PanelEmpty key="empty" />
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
