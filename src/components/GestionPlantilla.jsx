/**
 * @component GestionPlantilla
 * @description Módulo de gestión del plantel con dos vistas:
 *   1. LISTA   — tabla estilo FIFA con stats por jugador + panel de edición
 *   2. PIZARRA — campo táctico con formaciones + cuadro de notas lateral
 *
 * @architecture
 * GestionPlantilla (estado: tab activo, jugador seleccionado, formación, notas)
 * ├── PlayerListView   → tabla FIFA con PlayerRow + PlayerEditPanel
 * └── TacticalBoardView → campo SVG + tokens + sidebar formaciones + notas
 *
 * @props
 * - athletes    {Array}    Plantel completo desde App.jsx
 * - setAthletes {Function} Actualizador de estado global del plantel
 *
 * @state-decisions
 * - selectedPlayer se eleva a GestionPlantilla (no a cada vista)
 *   para que ambas vistas compartan el jugador seleccionado.
 * - editMode vive en PlayerEditPanel para no contaminar el estado global.
 *
 * @palette  Ver PALETTE (heredada del proyecto)
 * @version  2.0
 * @author   Elevate Sports
 */

import { useState } from "react";
import TacticalBoard from "./TacticalBoard";
import { PALETTE } from "../constants/palette";
import { FORMATIONS_VERTICAL as FORMATIONS } from "../constants/formations";
import { getAvatarUrl, getStatusStyle } from "../utils/helpers";


// ─────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────

/**
 * @component PlayerRow
 * @description Fila de jugador en la lista estilo FIFA.
 * Muestra: posición, número, nombre, fecha nacimiento,
 * tarjetas amarillas/rojas, goles y estado.
 *
 * @why-separate-component
 * Encapsular la fila permite aplicar hover state local
 * sin re-renderizar toda la lista.
 */
function PlayerRow({ athlete, isSelected, onSelect, index }) {
  const [hovered, setHovered] = useState(false);
  const statusStyle = getStatusStyle(athlete.status);
  const isActive = isSelected || hovered;

  return (
    <div
      onClick={() => onSelect(athlete)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         "grid",
        gridTemplateColumns: "32px 28px 1fr 80px 30px 30px 30px 60px",
        alignItems:      "center",
        padding:         "0 12px",
        height:          38,
        cursor:          "pointer",
        background:      isSelected
          ? "rgba(200,255,0,0.08)"
          : hovered
            ? "rgba(255,255,255,0.04)"
            : index % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
        borderLeft:      isSelected ? `3px solid ${PALETTE.neon}` : "3px solid transparent",
        borderBottom:    `1px solid ${PALETTE.border}`,
        transition:      "background 150ms ease",
      }}
    >
      {/* Posición */}
      <div style={{ fontSize:10, color: isActive ? PALETTE.neon : PALETTE.textMuted, fontWeight:700, textTransform:"uppercase" }}>
        {athlete.posCode}
      </div>

      {/* Número de dorsal */}
      <div style={{ fontSize:12, fontWeight:700, color: isActive ? PALETTE.text : PALETTE.textMuted, textAlign:"center" }}>
        {athlete.id}
      </div>

      {/* Nombre completo */}
      <div style={{ fontSize:11, color: isActive ? PALETTE.text : "rgba(255,255,255,0.7)", fontWeight: isSelected ? 600 : 400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {athlete.name}
      </div>

      {/* Fecha de nacimiento */}
      <div style={{ fontSize:9, color: PALETTE.textMuted, textAlign:"center" }}>
        {athlete.dob || "—"}
      </div>

      {/* Tarjetas amarillas */}
      <div style={{ display:"flex", justifyContent:"center" }}>
        <div style={{ width:10, height:14, background: (athlete.yellowCards||0) > 0 ? "#f0c030" : "rgba(255,255,255,0.1)", borderRadius:1, fontSize:8, color:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
          {athlete.yellowCards || 0}
        </div>
      </div>

      {/* Tarjetas rojas */}
      <div style={{ display:"flex", justifyContent:"center" }}>
        <div style={{ width:10, height:14, background: (athlete.redCards||0) > 0 ? PALETTE.danger : "rgba(255,255,255,0.1)", borderRadius:1, fontSize:8, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
          {athlete.redCards || 0}
        </div>
      </div>

      {/* Goles */}
      <div style={{ fontSize:11, color: (athlete.goals||0) > 0 ? PALETTE.neon : PALETTE.textMuted, textAlign:"center", fontWeight:700 }}>
        {athlete.goals || 0}
      </div>

      {/* Estado */}
      <div style={{ fontSize:9, color: statusStyle.color, textTransform:"uppercase", letterSpacing:"0.5px", textAlign:"right" }}>
        {statusStyle.label}
      </div>
    </div>
  );
}

/**
 * @component PlayerEditPanel
 * @description Panel lateral derecho para ver y editar
 * la ficha completa de un jugador seleccionado.
 * Tiene dos modos: vista (lectura) y edición.
 *
 * @why-edit-mode-local
 * El modo de edición es transitorio y solo relevante
 * para este panel — no necesita subir al estado global.
 * Solo al "Guardar" se propaga el cambio hacia arriba.
 */
function PlayerEditPanel({ athlete, onUpdate, onClose }) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft]       = useState({ ...athlete });

  if (!athlete) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color: PALETTE.textHint, gap:12 }}>
      <div style={{ fontSize:28, opacity:0.3 }}>👤</div>
      <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"1.5px" }}>Selecciona un jugador</div>
    </div>
  );

  const statusStyle = getStatusStyle(draft.status);

  /** Persiste los cambios del draft hacia App.jsx */
  const handleSave = () => {
    onUpdate(draft);
    setEditMode(false);
  };

  /** Descarta cambios y vuelve al modo vista */
  const handleCancel = () => {
    setDraft({ ...athlete });
    setEditMode(false);
  };

  const fieldStyle = {
    background:  editMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
    border:      editMode ? `1px solid ${PALETTE.neonBorder}` : "1px solid rgba(255,255,255,0.06)",
    padding:     "6px 10px",
    fontSize:    11,
    color:       PALETTE.text,
    fontFamily:  "inherit",
    outline:     "none",
    width:       "100%",
    transition:  "border 200ms",
  };

  const sectionTitle = {
    fontSize:      9,
    textTransform: "uppercase",
    letterSpacing: "2px",
    color:         PALETTE.textHint,
    marginBottom:  10,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>

      {/* Header del panel */}
      <div style={{ padding:"14px 16px", background:"rgba(0,0,0,0.5)", borderBottom:`1px solid ${PALETTE.border}`, display:"flex", alignItems:"flex-start", gap:12 }}>
        <img
          src={getAvatarUrl(draft.photo)}
          alt={draft.name}
          style={{ width:64, height:64, borderRadius:"50%", border:`2px solid ${PALETTE.neon}`, objectFit:"cover", flexShrink:0 }}
        />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:PALETTE.text, textTransform:"uppercase", letterSpacing:"-0.3px", lineHeight:1.1 }}>{draft.name}</div>
          <div style={{ fontSize:10, color: PALETTE.neon, textTransform:"uppercase", letterSpacing:"1px", marginTop:3 }}>{draft.pos}</div>
          <div style={{ fontSize:9, color: statusStyle.color, textTransform:"uppercase", letterSpacing:"0.5px", marginTop:2 }}>{statusStyle.label}</div>
        </div>
        <div onClick={onClose} style={{ fontSize:16, color: PALETTE.textMuted, cursor:"pointer", padding:"2px 6px" }}>✕</div>
      </div>

      {/* Valoración (V2 con partidos) */}
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${PALETTE.border}` }}>
        <div style={sectionTitle}>Valoración general</div>
        <div style={{ background:"rgba(200,255,0,0.06)", border:`1px solid ${PALETTE.neonBorder}`, padding:"8px 12px", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:28, fontWeight:900, color: PALETTE.neon, lineHeight:1 }}>—</div>
          <div style={{ fontSize:9, color: PALETTE.textMuted, lineHeight:1.6 }}>
            Se genera automáticamente<br/>con partidos registrados (V2)
          </div>
        </div>
      </div>

      {/* Métricas del ciclo */}
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${PALETTE.border}` }}>
        <div style={sectionTitle}>Métricas del ciclo</div>
        {[
          { label:"Asistencia", value:"100%", pct:100, color: PALETTE.green  },
          { label:"RPE prom.",  value: draft.rpe ?? "—", pct:(draft.rpe||0)*10, color: PALETTE.amber  },
        ].map(m => (
          <div key={m.label} style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:10, color: PALETTE.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{m.label}</span>
              <span style={{ fontSize:11, fontWeight:600, color:m.color }}>{m.value}</span>
            </div>
            <div style={{ height:3, background:"rgba(255,255,255,0.08)", borderRadius:2 }}>
              <div style={{ width:`${m.pct}%`, height:"100%", background:m.color, borderRadius:2 }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Ficha editable */}
      <div style={{ padding:"12px 16px", flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={sectionTitle}>Información del jugador</div>
          {!editMode && (
            <div
              onClick={() => setEditMode(true)}
              style={{ fontSize:9, color: PALETTE.neon, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", border:`1px solid ${PALETTE.neonBorder}`, padding:"3px 10px" }}
            >
              Editar
            </div>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { label:"Nombre completo", key:"name",    type:"text"   },
            { label:"Posición",        key:"pos",     type:"text"   },
            { label:"Número dorsal",   key:"id",      type:"number" },
            { label:"Fecha nacimiento",key:"dob",     type:"date"   },
            { label:"Contacto",        key:"contact", type:"text"   },
            { label:"Goles",           key:"goals",   type:"number" },
            { label:"T. Amarillas",    key:"yellowCards", type:"number" },
            { label:"T. Rojas",        key:"redCards",    type:"number" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color: PALETTE.textHint, marginBottom:3 }}>{label}</div>
              {editMode ? (
                <input
                  type={type}
                  value={draft[key] ?? ""}
                  onChange={e => setDraft(prev => ({ ...prev, [key]: type === "number" ? +e.target.value : e.target.value }))}
                  style={fieldStyle}
                />
              ) : (
                <div style={{ ...fieldStyle, color: draft[key] ? PALETTE.text : PALETTE.textHint }}>
                  {draft[key] || "—"}
                </div>
              )}
            </div>
          ))}

          {/* Estado — siempre editable como select */}
          <div>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color: PALETTE.textHint, marginBottom:3 }}>Estado</div>
            {editMode ? (
              <select
                value={draft.status}
                onChange={e => setDraft(prev => ({ ...prev, status: e.target.value }))}
                style={{ ...fieldStyle, background:"rgba(255,255,255,0.06)" }}
              >
                <option value="P">Disponible</option>
                <option value="A">Ausente</option>
                <option value="L">Lesionado</option>
              </select>
            ) : (
              <div style={{ ...fieldStyle, color: statusStyle.color }}>{statusStyle.label}</div>
            )}
          </div>
        </div>

        {/* Acciones de edición */}
        {editMode && (
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <div
              onClick={handleSave}
              style={{ flex:1, padding:9, background: PALETTE.neon, color:"#0a0a0a", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", textAlign:"center" }}
            >
              Guardar
            </div>
            <div
              onClick={handleCancel}
              style={{ flex:1, padding:9, background:"transparent", border:`1px solid rgba(255,255,255,0.15)`, color: PALETTE.textMuted, fontSize:10, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", textAlign:"center" }}
            >
              Cancelar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @component PlayerListView
 * @description Vista de lista completa del plantel estilo FIFA.
 * Columnas: posición, número, nombre, fecha nacimiento,
 * tarjetas amarillas/rojas, goles, estado.
 * Panel derecho: edición del jugador seleccionado.
 */
function PlayerListView({ athletes, onUpdateAthlete }) {
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [sortKey, setSortKey]                 = useState("posCode");
  const [filterStatus, setFilterStatus]       = useState("all");

  // Ordena y filtra la lista de forma derivada (sin estado extra)
  const displayedAthletes = [...athletes]
    .filter(a => filterStatus === "all" || a.status === filterStatus)
    .sort((a, b) => {
      if (sortKey === "name")    return a.name.localeCompare(b.name);
      if (sortKey === "posCode") return a.posCode.localeCompare(b.posCode);
      if (sortKey === "goals")   return (b.goals || 0) - (a.goals || 0);
      return 0;
    });

  const headerCell = (label, key) => ({
    fontSize:      8,
    textTransform: "uppercase",
    letterSpacing: "1px",
    color:         sortKey === key ? PALETTE.neon : PALETTE.textHint,
    cursor:        "pointer",
    fontWeight:    sortKey === key ? 700 : 400,
  });

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", height:"100%", minHeight:0 }}>

      {/* ── LISTA ─────────────────────────────── */}
      <div style={{ display:"flex", flexDirection:"column", minHeight:0 }}>

        {/* Controles de filtro y orden */}
        <div style={{ padding:"8px 12px", background:"rgba(0,0,0,0.7)", borderBottom:`1px solid ${PALETTE.border}`, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:9, color: PALETTE.textMuted, textTransform:"uppercase", letterSpacing:"1px" }}>
            {displayedAthletes.length} jugadores
          </div>
          <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
            {[["all","Todos"],["P","Disponibles"],["L","Lesionados"],["A","Ausentes"]].map(([v,l]) => (
              <div
                key={v}
                onClick={() => setFilterStatus(v)}
                style={{ fontSize:9, padding:"3px 10px", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.5px", background: filterStatus===v ? PALETTE.neonDim : "transparent", border:`1px solid ${filterStatus===v ? PALETTE.neon : "rgba(255,255,255,0.12)"}`, color: filterStatus===v ? PALETTE.neon : PALETTE.textMuted }}
              >
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Cabecera de la tabla */}
        <div style={{ display:"grid", gridTemplateColumns:"32px 28px 1fr 80px 30px 30px 30px 60px", padding:"6px 12px", background:"rgba(0,0,0,0.6)", borderBottom:`1px solid ${PALETTE.border}` }}>
          <div onClick={() => setSortKey("posCode")} style={headerCell("POS","posCode")}>POS</div>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color: PALETTE.textHint, textAlign:"center" }}>#</div>
          <div onClick={() => setSortKey("name")} style={headerCell("Nombre","name")}>Nombre</div>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color: PALETTE.textHint, textAlign:"center" }}>Nacimiento</div>
          <div style={{ fontSize:8, color:"#f0c030", textAlign:"center" }}>🟨</div>
          <div style={{ fontSize:8, color: PALETTE.danger, textAlign:"center" }}>🟥</div>
          <div onClick={() => setSortKey("goals")} style={{ ...headerCell("GOL","goals"), textAlign:"center" }}>GOL</div>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color: PALETTE.textHint, textAlign:"right" }}>Estado</div>
        </div>

        {/* Filas de jugadores */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {displayedAthletes.map((a, i) => (
            <PlayerRow
              key={a.id}
              athlete={a}
              index={i}
              isSelected={selectedAthlete?.id === a.id}
              onSelect={setSelectedAthlete}
            />
          ))}
        </div>
      </div>

      {/* ── PANEL EDICIÓN ─────────────────────── */}
      <div style={{ background:"rgba(0,0,0,0.88)", borderLeft:`1px solid ${PALETTE.border}` }}>
        <PlayerEditPanel
          athlete={selectedAthlete}
          onUpdate={(updated) => {
            onUpdateAthlete(updated);
            setSelectedAthlete(updated);
          }}
          onClose={() => setSelectedAthlete(null)}
        />
      </div>
    </div>
  );
}

/**
 * @component TacticalBoardView
 * @description Vista de pizarra táctica con campo de fútbol,
 * tokens de jugadores, selector de formaciones y cuadro de notas.
 */
function TacticalBoardView({ athletes }) {
  const [formation,    setFormation]    = useState("4-3-3");
  const [selectedIdx,  setSelectedIdx]  = useState(null);
  const [tacticalNote, setTacticalNote] = useState("");

  const starters   = athletes.filter(a => a.available).slice(0, 11);
  const bench      = athletes.filter((_, i) => i >= 11).slice(0, 7);
  const positions  = FORMATIONS[formation];
  const selected   = selectedIdx !== null ? starters[selectedIdx] : null;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"170px 1fr 220px", height:"100%", minHeight:0 }}>

      {/* ── SIDEBAR IZQ: formaciones + suplentes ── */}
      <div style={{ background: PALETTE.surface, borderRight:`1px solid ${PALETTE.border}`, display:"flex", flexDirection:"column", overflowY:"auto" }}>

        <div style={{ padding:"10px 14px 6px" }}>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textHint, marginBottom:8 }}>Formación activa</div>
          {Object.keys(FORMATIONS).map(f => (
            <div
              key={f}
              onClick={() => { setFormation(f); setSelectedIdx(null); }}
              style={{ padding:"7px 10px", fontSize:11, color: formation===f ? PALETTE.neon : PALETTE.textMuted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${PALETTE.border}`, background: formation===f ? PALETTE.neonDim : "transparent", borderLeft: formation===f ? `2px solid ${PALETTE.neon}` : "2px solid transparent", marginBottom:1 }}
            >
              {f}
              {formation===f && <span style={{ fontSize:8, color: PALETTE.neon }}>●</span>}
            </div>
          ))}
        </div>

        <div style={{ padding:"10px 14px 6px", borderTop:`1px solid ${PALETTE.border}`, marginTop:4 }}>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textHint, marginBottom:8 }}>Suplentes</div>
          {bench.map(a => (
            <div key={a.id} style={{ padding:"6px 8px", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid rgba(255,255,255,0.04)`, cursor:"pointer" }}>
              <img
                src={getAvatarUrl(a.photo)}
                alt={a.name}
                style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover", border:`1px solid ${a.status==="L" ? PALETTE.danger : "rgba(255,255,255,0.12)"}` }}
              />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name.split(" ")[0]}</div>
                <div style={{ fontSize:7, color: PALETTE.textHint, textTransform:"uppercase" }}>{a.posCode}</div>
              </div>
              <div style={{ width:5, height:5, borderRadius:"50%", background: getStatusStyle(a.status).color, flexShrink:0 }}/>
            </div>
          ))}
        </div>
      </div>

      {/* ── CAMPO TÁCTICO ─────────────────────── */}
      <div style={{ display:"flex", flexDirection:"column", minHeight:0 }}>
        <div style={{ padding:"8px 14px", background:"rgba(0,0,0,0.7)", borderBottom:`1px solid ${PALETTE.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textMuted }}>
            Formación {formation}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ fontSize:9, padding:"4px 12px", background:"transparent", border:`1px solid rgba(255,255,255,0.15)`, color: PALETTE.textMuted, cursor:"pointer", textTransform:"uppercase", letterSpacing:"1px" }}>Guardar</div>
            <div style={{ fontSize:9, padding:"4px 12px", background: PALETTE.neon, color:"#0a0a0a", cursor:"pointer", textTransform:"uppercase", letterSpacing:"1px", fontWeight:700 }}>Usar en partido →</div>
          </div>
        </div>

        <div style={{ position:"relative", flex:1 }}>
          {/* Campo SVG */}
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} viewBox="0 0 500 560" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0a1f08"/>
                <stop offset="50%"  stopColor="#0d2a0a"/>
                <stop offset="100%" stopColor="#0a1f08"/>
              </linearGradient>
            </defs>
            <rect width="500" height="560" fill="url(#grass)"/>
            {/* Franjas de césped alternadas */}
            {[0,1,2,3,4,5,6].map(i => (
              <rect key={i} x="0" y={i*80} width="500" height="40" fill="rgba(255,255,255,0.015)"/>
            ))}
            {/* Líneas del campo */}
            <rect x="25" y="15" width="450" height="530" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2"/>
            <line x1="25" y1="280" x2="475" y2="280" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
            <circle cx="250" cy="280" r="65" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"/>
            <circle cx="250" cy="280" r="3" fill="rgba(255,255,255,0.3)"/>
            {/* Área grande */}
            <rect x="25" y="155" width="150" height="210" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"/>
            <rect x="325" y="155" width="150" height="210" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"/>
            {/* Área pequeña */}
            <rect x="25" y="210" width="62" height="100" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            <rect x="413" y="210" width="62" height="100" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            {/* Puntos de penalti */}
            <circle cx="105" cy="280" r="3" fill="rgba(255,255,255,0.2)"/>
            <circle cx="395" cy="280" r="3" fill="rgba(255,255,255,0.2)"/>
            {/* Semicírculos de área */}
            <path d="M 175 155 A 65 65 0 0 0 175 365" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            <path d="M 325 155 A 65 65 0 0 1 325 365" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
          </svg>

          {/* Tokens de jugadores */}
          {starters.map((athlete, i) => {
            const position  = positions[i];
            if (!position) return null;
            const isSelected = selectedIdx === i;

            return (
              <div
                key={athlete.id}
                onClick={() => setSelectedIdx(isSelected ? null : i)}
                style={{
                  position:  "absolute",
                  left:      position.left,
                  top:       position.top,
                  transform: "translate(-50%,-50%)",
                  display:   "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap:       2,
                  cursor:    "pointer",
                  zIndex:    5,
                  // Glow en selección
                  filter:    isSelected ? `drop-shadow(0 0 6px ${PALETTE.neon})` : "none",
                  transition:"filter 200ms",
                }}
              >
                <div style={{
                  width:      52,
                  background: "rgba(5,10,5,0.95)",
                  border:     `${isSelected ? 2 : 1}px solid ${isSelected ? PALETTE.neon : "rgba(200,255,0,0.25)"}`,
                  overflow:   "hidden",
                  textAlign:  "center",
                }}>
                  <img
                    src={getAvatarUrl(athlete.photo)}
                    alt={athlete.name}
                    style={{ width:"100%", height:44, objectFit:"cover", objectPosition:"top", display:"block" }}
                  />
                  <div style={{ padding:"2px 3px 3px", background:"rgba(0,0,0,0.7)" }}>
                    <div style={{ fontSize:7, color: PALETTE.text, textTransform:"uppercase", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {athlete.name.split(" ")[0]}
                    </div>
                    <div style={{ fontSize:6, color: PALETTE.neon, textTransform:"uppercase", marginTop:1 }}>{position.posCode}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PANEL DERECHO: info + notas ─────── */}
      <div style={{ background:"rgba(0,0,0,0.88)", borderLeft:`1px solid ${PALETTE.border}`, display:"flex", flexDirection:"column" }}>

        {/* Info del jugador seleccionado en el campo */}
        {selected ? (
          <div style={{ padding:"14px 16px", borderBottom:`1px solid ${PALETTE.border}` }}>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textHint, marginBottom:10 }}>Titular seleccionado</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <img src={getAvatarUrl(selected.photo)} alt={selected.name} style={{ width:46, height:46, borderRadius:"50%", border:`2px solid ${PALETTE.neon}`, objectFit:"cover" }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color: PALETTE.text, textTransform:"uppercase" }}>{selected.name}</div>
                <div style={{ fontSize:9, color: PALETTE.neon, textTransform:"uppercase", marginTop:2 }}>{selected.pos}</div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {[
                { label:"Goles",    value: selected.goals      || 0 },
                { label:"T. Amar.", value: selected.yellowCards || 0, color:"#f0c030" },
                { label:"T. Rojas", value: selected.redCards   || 0, color: PALETTE.danger },
                { label:"RPE prom.",value: selected.rpe        || "—" },
              ].map(m => (
                <div key={m.label} style={{ background:"rgba(255,255,255,0.04)", padding:"6px 8px" }}>
                  <div style={{ fontSize:7, color: PALETTE.textHint, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:2 }}>{m.label}</div>
                  <div style={{ fontSize:14, fontWeight:700, color: m.color || PALETTE.text }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding:"14px 16px", borderBottom:`1px solid ${PALETTE.border}` }}>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textHint, marginBottom:8 }}>Toca un jugador en el campo</div>
            <div style={{ fontSize:11, color: PALETTE.textHint, opacity:0.5 }}>para ver sus datos</div>
          </div>
        )}

        {/* Cuadro de notas tácticas */}
        <div style={{ flex:1, padding:"12px 16px", display:"flex", flexDirection:"column" }}>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color: PALETTE.textHint, marginBottom:8 }}>Notas tácticas</div>
          <textarea
            value={tacticalNote}
            onChange={e => setTacticalNote(e.target.value)}
            placeholder="Anotaciones del partido, instrucciones, presión alta, bloques defensivos..."
            style={{
              flex:       1,
              background: "rgba(255,255,255,0.04)",
              border:     `1px solid ${PALETTE.border}`,
              padding:    "10px 12px",
              fontSize:   11,
              color:      PALETTE.text,
              fontFamily: "inherit",
              outline:    "none",
              resize:     "none",
              lineHeight: 1.7,
              minHeight:  120,
            }}
          />
          <div style={{ fontSize:9, color: PALETTE.textHint, marginTop:6, textAlign:"right" }}>
            {tacticalNote.length} caracteres
          </div>
        </div>

        {/* Acciones del campo */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${PALETTE.border}`, display:"flex", flexDirection:"column", gap:6 }}>
          <div style={{ padding:8, background: PALETTE.neon, color:"#0a0a0a", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", textAlign:"center" }}>
            Guardar formación
          </div>
          <div style={{ padding:8, background:"transparent", border:`1px solid rgba(255,255,255,0.15)`, color: PALETTE.textMuted, fontSize:10, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", textAlign:"center" }}>
            Exportar PDF
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE RAÍZ
// ─────────────────────────────────────────────
export default function GestionPlantilla({ athletes, setAthletes, historial = [] }) {
  const [activeTab, setActiveTab] = useState("lista");

  /**
   * Actualiza un jugador en el estado global.
   * Busca por ID para no depender del índice (que puede cambiar con filtros).
   */
  const handleUpdateAthlete = (updatedAthlete) => {
    setAthletes(prev =>
      prev.map(a => a.id === updatedAthlete.id ? { ...a, ...updatedAthlete } : a)
    );
  };

  const tabs = [
    { key:"lista",   label:"Plantilla"       },
    { key:"pizarra", label:"Pizarra táctica" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 80px)", minHeight:0 }}>

      {/* Tabs de navegación interna */}
      <div style={{ display:"flex", alignItems:"stretch", height:36, background:"rgba(0,0,0,0.82)", borderBottom:`1px solid ${PALETTE.border}`, flexShrink:0 }}>
        {tabs.map(({ key, label }) => (
          <div
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding:        "0 20px",
              fontSize:       10,
              textTransform:  "uppercase",
              letterSpacing:  "2px",
              color:          activeTab === key ? PALETTE.text : PALETTE.textMuted,
              display:        "flex",
              alignItems:     "center",
              cursor:         "pointer",
              borderRight:    `1px solid ${PALETTE.border}`,
              borderBottom:   activeTab === key ? `2px solid ${PALETTE.neon}` : "2px solid transparent",
              background:     activeTab === key ? PALETTE.neonDim : "transparent",
              transition:     "all 150ms",
            }}
          >
            {label}
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", padding:"0 16px", fontSize:9, color: PALETTE.textHint, textTransform:"uppercase", letterSpacing:"1px" }}>
          {athletes.length} jugadores · {athletes.filter(a=>a.status==="P").length} disponibles
        </div>
      </div>

      {/* Contenido de la tab activa */}
      <div style={{ flex:1, minHeight:0, overflow:"hidden" }}>
        {activeTab === "lista" && (
          <PlayerListView
            athletes={athletes}
            onUpdateAthlete={handleUpdateAthlete}
          />
        )}
        {activeTab === "pizarra" && (
          <TacticalBoard athletes={athletes} historial={historial} />
        )}
      </div>
    </div>
  );
}
