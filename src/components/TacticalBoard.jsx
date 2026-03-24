/**
 * @component TacticalBoard v6
 * @description Pizarra táctica horizontal estilo FIFA con:
 * - Cancha horizontal (porterías izq/der)
 * - Sin títulos duplicados
 * - Sin hueco inferior
 * - Panel de click con radar hexagonal + jugadores similares
 * - Drag & drop persistente
 *
 * @version 6.0
 * @author Elevate Sports
 */

import { useState, useRef, useCallback } from "react";
import { PALETTE as C } from "../constants/palette";
import { FORMATIONS_HORIZONTAL as FORMATIONS } from "../constants/formations";
import { getAvatarUrl as avatar, calculateAge, getStatusStyle } from "../utils/helpers";

const POSITION_GROUPS = {
  GK:  ["GK"],
  DEF: ["CB","LB","RB","LCB","RCB","LWB","RWB"],
  MID: ["CM","DM","LDM","RDM","CAM","LM","RM"],
  FWD: ["ST","LS","RS","LW","RW","CF"],
};

const getGroup = (posCode) => {
  for (const [g, codes] of Object.entries(POSITION_GROUPS)) {
    if (codes.includes(posCode)) return g;
  }
  return "MID";
};

/** Wrapper to preserve " años" suffix used in TacticalBoard */
const calcAge = (dob) => {
  const age = calculateAge(dob);
  return age === "—" ? "—" : age + " años";
};

// ─────────────────────────────────────────────
// RADAR HEXAGONAL
// ─────────────────────────────────────────────
function HexRadar({ attrs, size = 100 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.36;
  const keys = Object.keys(attrs);
  const hex = keys.map((_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const data = keys.map((k, i) => {
    const scale = Math.min((attrs[k] || 50) / 99, 1);
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return { x: cx + r * scale * Math.cos(a), y: cy + r * scale * Math.sin(a) };
  });
  const toPath = pts => pts.map((p,i) => `${i===0?"M":"L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.33,0.66,1].map((s,si) => (
        <polygon key={si}
          points={hex.map(p=>`${(cx+(p.x-cx)*s).toFixed(1)},${(cy+(p.y-cy)*s).toFixed(1)}`).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
      ))}
      {hex.map((p,i) => <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>)}
      <path d={toPath(data)} fill="rgba(200,255,0,0.2)" stroke={C.neon} strokeWidth="1.2"/>
      {data.map((p,i) => <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2" fill={C.neon}/>)}
      {hex.map((p,i) => {
        const lx = cx + (p.x-cx)*1.3, ly = cy + (p.y-cy)*1.3;
        return (
          <text key={i} x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="6" fill="rgba(255,255,255,0.5)"
            fontFamily="Arial Narrow,Arial,sans-serif" fontWeight="700">
            {keys[i]?.slice(0,3).toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// PANEL DE DETALLE — con radar + similares
// Se mantiene hasta que el usuario cierre
// ─────────────────────────────────────────────
function PlayerDetailPanel({ starter, allAthletes, onClose, onSwapSimilar, onMoveToBank }) {
  const athlete = starter?.athlete;
  if (!athlete) return null;

  const status = getStatusStyle(athlete.status);
  const group  = getGroup(starter.posCode);

  const attrs = {
    Ritmo:   athlete.speed    || 78,
    Tiro:    athlete.shooting || 72,
    Pases:   athlete.passing  || 80,
    Regate:  athlete.dribble  || 75,
    Defensa: athlete.defense  || 65,
    Físico:  athlete.physical || 77,
  };

  const similar = allAthletes
    .filter(a => getGroup(a.posCode) === group && a.id !== athlete.id)
    .slice(0, 3);

  const overallRating = athlete.rating ||
    Math.round(Object.values(attrs).reduce((a,b) => a+b, 0) / 6);

  return (
    <div style={{
      width:        220,
      flexShrink:   0,
      background:   "rgba(8,14,8,0.97)",
      borderLeft:   `1px solid ${C.border}`,
      display:      "flex",
      flexDirection:"column",
      overflowY:    "auto",
    }}>

      {/* Header con nombre, OVR y botón cerrar */}
      <div style={{ padding:"12px 14px 10px", background:"rgba(200,255,0,0.07)", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:C.text, textTransform:"uppercase", letterSpacing:"-0.5px", lineHeight:1 }}>
              {athlete.name.split(" ").pop()}
            </div>
            <div style={{ fontSize:9, color:C.neon, textTransform:"uppercase", letterSpacing:"1.5px", marginTop:3 }}>
              {starter.posCode} · {athlete.pos}
            </div>
            <div style={{ fontSize:9, color:status.color, textTransform:"uppercase", marginTop:2 }}>
              {status.label}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
            <div style={{ fontSize:28, fontWeight:900, color:C.neon, lineHeight:1 }}>{overallRating}</div>
            <div style={{ fontSize:7, color:C.textHint, textTransform:"uppercase", letterSpacing:"1px" }}>OVR</div>
          </div>
          <div onClick={onClose} style={{ fontSize:14, color:C.textMuted, cursor:"pointer", padding:"2px 6px" }}>✕</div>
        </div>
      </div>

      {/* Radar */}
      <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 6px", borderBottom:`1px solid ${C.border}` }}>
        <HexRadar attrs={attrs} size={110}/>
      </div>

      {/* Atributos en grid 2 columnas */}
      <div style={{ padding:"8px 14px 10px", borderBottom:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"1fr 1fr", rowGap:6, columnGap:12 }}>
        {Object.entries(attrs).map(([k, v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:9, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.3px" }}>{k}</span>
            <span style={{ fontSize:11, fontWeight:700, color: v>=80 ? C.neon : v>=70 ? C.amber : C.textMuted }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Jugadores similares */}
      {similar.length > 0 && (
        <div style={{ padding:"8px 14px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color:C.textHint, marginBottom:8 }}>
            Jugadores similares
          </div>
          {similar.map(a => {
            const aRating = a.rating || Math.floor(72 + (a.id % 20));
            return (
              <div
                key={a.id}
                onClick={() => onSwapSimilar(a)}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", marginBottom:4, background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, cursor:"pointer", borderRadius:2, transition:"background 150ms" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(200,255,0,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.04)"}
              >
                <div style={{ fontSize:16, fontWeight:900, color:C.neon, minWidth:28 }}>{aRating}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, color:C.text, fontWeight:700, textTransform:"uppercase", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {a.name.split(" ").pop()}
                  </div>
                  <div style={{ fontSize:8, color:C.textMuted, textTransform:"uppercase" }}>{a.posCode}</div>
                </div>
                <div style={{ fontSize:9, color:C.neon, fontWeight:700, whiteSpace:"nowrap" }}>↑ CAMBIAR</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info básica */}
      <div style={{ padding:"8px 14px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
          {[
            { label:"Edad",     value: calcAge(athlete.dob)      },
            { label:"Estado",   value: status.label, color: status.color },
            { label:"Posición", value: athlete.pos,  small:true },
            { label:"Contacto", value: athlete.contact, small:true },
          ].map(m => (
            <div key={m.label} style={{ background:"rgba(255,255,255,0.04)", padding:"6px 8px" }}>
              <div style={{ fontSize:7, color:C.textHint, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:2 }}>{m.label}</div>
              <div style={{ fontSize: m.small ? 9 : 11, fontWeight:600, color: m.color || C.text }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:5, marginTop:"auto" }}>
        <div style={{ padding:7, fontSize:9, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", background:"transparent", border:`1px solid ${C.borderHi}`, color:C.textMuted, textAlign:"center" }}>
          Ver ficha completa
        </div>
        <div style={{ padding:7, fontSize:9, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", background:C.green, color:C.text, textAlign:"center" }}>
          Cambiar posición
        </div>
        <div onClick={onMoveToBank} style={{ padding:7, fontSize:9, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", background:C.amber, color:"#1a0f00", textAlign:"center", fontWeight:700 }}>
          Pasar a suplentes
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TOKEN DE JUGADOR EN EL CAMPO
// ─────────────────────────────────────────────
function PlayerToken({ starter, isSelected, isDragged, isTarget, onSelect, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop }) {
  const [hovered, setHovered] = useState(false);
  const isGK    = starter.posCode === "GK";
  const athlete = starter.athlete;
  const isEmpty = !athlete;
  const active  = isSelected || hovered;

  if (isEmpty) {
    return (
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          width:    52,
          height:   58,
          border:   `1.5px dashed ${isTarget ? C.drag : "rgba(255,255,255,0.2)"}`,
          borderRadius: 3,
          display:  "flex",
          alignItems:"center",
          justifyContent:"center",
          background: isTarget ? C.dragDim : "rgba(255,255,255,0.03)",
          transition:"all 200ms",
        }}
      >
        <div style={{ fontSize:18, color:"rgba(255,255,255,0.18)" }}>+</div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, userSelect:"none" }}>
      <div
        draggable
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          width:      56,
          background: isTarget ? "rgba(0,60,80,0.88)" : "rgba(5,10,5,0.92)",
          border:     `${isSelected?2:1}px solid ${isTarget ? C.drag : isSelected ? C.neon : isGK ? "rgba(29,158,117,0.6)" : "rgba(239,159,39,0.4)"}`,
          overflow:   "hidden",
          cursor:     isDragged ? "grabbing" : "grab",
          opacity:    isDragged ? 0.2 : 1,
          transform:  `scale(${isTarget?1.1:active&&!isDragged?1.04:1})`,
          boxShadow:  isSelected
            ? `0 0 0 1px ${C.neon}, 0 0 14px rgba(200,255,0,0.4)`
            : isTarget
              ? `0 0 0 1px ${C.drag}, 0 0 12px rgba(0,229,255,0.4)`
              : active
                ? "0 4px 16px rgba(0,0,0,0.8)"
                : "0 2px 6px rgba(0,0,0,0.5)",
          transition: "transform 180ms ease, box-shadow 180ms ease, opacity 120ms",
          borderRadius: 2,
        }}
      >
        {/* Franja color */}
        <div style={{ height:3, background: isGK ? C.green : isSelected ? C.neon : C.amber, transition:"background 200ms" }}/>

        {/* Avatar */}
        <div style={{ width:56, height:44, overflow:"hidden", background:"rgba(255,255,255,0.04)", position:"relative" }}>
          <img
            src={avatar(athlete.photo)}
            alt={athlete.name}
            style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top", display:"block", pointerEvents:"none" }}
          />
          {athlete.status !== "P" && (
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontSize:7, color: getStatusStyle(athlete.status).color, border:`1px solid ${getStatusStyle(athlete.status).color}`, padding:"1px 3px", fontWeight:700, textTransform:"uppercase" }}>
                {athlete.status==="L"?"LES":"AUS"}
              </div>
            </div>
          )}
        </div>

        {/* Nombre y pos */}
        <div style={{ padding:"2px 4px 3px", background:"rgba(0,0,0,0.75)", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize:7, color:C.text, textTransform:"uppercase", fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", letterSpacing:"0.2px" }}>
            {athlete.name.split(" ")[0][0]}. {athlete.name.split(" ").pop()}
          </div>
          <div style={{ fontSize:6, color: isGK ? C.green : C.amber, textTransform:"uppercase", marginTop:1 }}>
            {starter.posCode}
          </div>
        </div>
      </div>
      {/* Sombra */}
      <div style={{ width:16, height:3, background:"rgba(0,0,0,0.4)", borderRadius:"50%" }}/>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function TacticalBoard({ athletes = [] }) {
  const [formationKey,      setFormationKey]      = useState("4-3-3");
  const [dragging,          setDragging]           = useState(null);
  const [dropTarget,        setDropTarget]         = useState(null);
  const [selectedStarterIdx,setSelectedStarterIdx] = useState(null);

  const [starters, setStarters] = useState(() =>
    FORMATIONS["4-3-3"].positions.map((pos, i) => ({
      ...pos,
      currentLeft: pos.left,
      currentTop:  pos.top,
      athlete:     athletes[i] || null,
      id:          `s${i}`,
    }))
  );
  const [bench, setBench] = useState(() =>
    athletes.slice(11).map((a, i) => ({ athlete: a, id:`b${i}` }))
  );

  const fieldRef = useRef(null);

  // ── Cambio de formación ─────────────────────
  const handleFormationChange = useCallback((key) => {
    setFormationKey(key);
    setSelectedStarterIdx(null);
    const newPos = FORMATIONS[key].positions;
    setStarters(prev => newPos.map((pos, i) => ({
      ...pos,
      currentLeft: pos.left,
      currentTop:  pos.top,
      athlete:     prev[i]?.athlete ?? null,
      id:          prev[i]?.id ?? `s${i}`,
    })));
  }, []);

  // ── Drag ────────────────────────────────────
  const startDrag = useCallback((e, type, index) => {
    setDragging({ type, index });
    setSelectedStarterIdx(null);
    const g = document.createElement("div");
    g.style.cssText = "position:absolute;top:-9999px;opacity:0;";
    document.body.appendChild(g);
    e.dataTransfer.setDragImage(g, 0, 0);
    setTimeout(() => document.body.removeChild(g), 0);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleFieldDrop = useCallback((e) => {
    e.preventDefault();
    if (!dragging || !fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const left = Math.min(Math.max(((e.clientX-rect.left)/rect.width)*100, 4), 96);
    const top  = Math.min(Math.max(((e.clientY-rect.top)/rect.height)*100, 4), 96);

    if (dragging.type === "starter") {
      setStarters(prev => prev.map((s,i) =>
        i===dragging.index ? {...s, currentLeft:left, currentTop:top} : s
      ));
    } else if (dragging.type === "bench") {
      const entering = bench[dragging.index];
      const emptyIdx = starters.findIndex(s => !s.athlete);
      if (emptyIdx >= 0) {
        setStarters(prev => prev.map((s,i) =>
          i===emptyIdx ? {...s, athlete:entering.athlete, currentLeft:left, currentTop:top} : s
        ));
        setBench(prev => prev.filter((_,i) => i!==dragging.index));
      }
    }
    setDragging(null); setDropTarget(null);
  }, [dragging, bench, starters]);

  const handlePlayerDrop = useCallback((e, targetType, targetIndex) => {
    e.preventDefault(); e.stopPropagation();
    if (!dragging) return;

    if (dragging.type==="starter" && targetType==="starter") {
      setStarters(prev => {
        const next = [...prev];
        const tmp  = next[dragging.index].athlete;
        next[dragging.index] = {...next[dragging.index], athlete: next[targetIndex].athlete};
        next[targetIndex]    = {...next[targetIndex],    athlete: tmp};
        return next;
      });
    } else if (dragging.type==="bench" && targetType==="starter") {
      const entering = bench[dragging.index];
      const leaving  = starters[targetIndex].athlete;
      setStarters(prev => prev.map((s,i) => i===targetIndex ? {...s, athlete:entering.athlete} : s));
      setBench(prev => {
        const next = prev.filter((_,i) => i!==dragging.index);
        return leaving ? [...next, {athlete:leaving, id:`b${Date.now()}`}] : next;
      });
    } else if (dragging.type==="starter" && targetType==="bench") {
      const leaving  = starters[dragging.index].athlete;
      const entering = bench[targetIndex];
      setStarters(prev => prev.map((s,i) => i===dragging.index ? {...s, athlete:entering.athlete} : s));
      setBench(prev => {
        const next = prev.filter((_,i) => i!==targetIndex);
        return leaving ? [...next, {athlete:leaving, id:`b${Date.now()}`}] : next;
      });
    }

    setDragging(null); setDropTarget(null);
  }, [dragging, bench, starters]);

  // ── Swap desde similares ────────────────────
  const handleSwapSimilar = useCallback((newAthlete) => {
    if (selectedStarterIdx === null) return;
    const leaving = starters[selectedStarterIdx].athlete;
    setStarters(prev => prev.map((s,i) =>
      i===selectedStarterIdx ? {...s, athlete:newAthlete} : s
    ));
    if (leaving) setBench(prev => [...prev, {athlete:leaving, id:`b${Date.now()}`}]);
    setBench(prev => prev.filter(b => b.athlete?.id !== newAthlete.id));
    setSelectedStarterIdx(null);
  }, [selectedStarterIdx, starters]);

  const handleMoveToBank = useCallback(() => {
    if (selectedStarterIdx === null) return;
    const leaving = starters[selectedStarterIdx].athlete;
    if (!leaving) return;
    setStarters(prev => prev.map((s,i) => i===selectedStarterIdx ? {...s, athlete:null} : s));
    setBench(prev => [...prev, {athlete:leaving, id:`b${Date.now()}`}]);
    setSelectedStarterIdx(null);
  }, [selectedStarterIdx, starters]);

  const isDraggingThis = (type, idx) => dragging?.type===type && dragging?.index===idx;
  const selectedStarter = selectedStarterIdx !== null ? starters[selectedStarterIdx] : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"#0a150a", fontFamily:"'Arial Narrow',Arial,sans-serif", overflow:"hidden" }}>

      {/* ── LAYOUT: sidebar + campo + panel ─── */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"160px 1fr auto", minHeight:0, overflow:"hidden" }}>

        {/* SIDEBAR IZQ */}
        <div style={{ background:"rgba(0,0,0,0.82)", borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflowY:"auto" }}>
          <div style={{ padding:"10px 12px 6px" }}>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color:C.textHint, marginBottom:8 }}>Formación activa</div>
            {Object.keys(FORMATIONS).map(f => (
              <div key={f} onClick={() => handleFormationChange(f)}
                style={{ padding:"6px 10px", fontSize:11, color: formationKey===f ? C.amber : C.textMuted, cursor:"pointer", display:"flex", justifyContent:"space-between", borderBottom:`1px solid rgba(255,255,255,0.04)`, background: formationKey===f ? C.amberDim : "transparent", borderLeft: formationKey===f ? `2px solid ${C.amber}` : "2px solid transparent", marginBottom:1 }}>
                {f} {formationKey===f && <span style={{ fontSize:8, color:C.amber }}>●</span>}
              </div>
            ))}
          </div>

          <div style={{ borderTop:`1px solid ${C.border}`, padding:"10px 12px 6px" }}>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color:C.textHint, marginBottom:8 }}>Suplentes</div>
            {bench.map((b,i) => (
              <div key={b.id}
                draggable
                onDragStart={e => startDrag(e,"bench",i)}
                onDragEnd={() => setDragging(null)}
                onDragOver={e => { e.preventDefault(); setDropTarget(`bench-${i}`); }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={e => handlePlayerDrop(e,"bench",i)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 8px", borderBottom:`1px solid rgba(255,255,255,0.04)`, cursor:"grab", opacity: isDraggingThis("bench",i) ? 0.3 : 1, background: dropTarget===`bench-${i}` ? C.dragDim : "transparent", transition:"background 150ms" }}
              >
                <div style={{ width:26, height:26, borderRadius:"50%", overflow:"hidden", border:`1px solid ${b.athlete?.status==="L" ? C.danger : "rgba(255,255,255,0.12)"}`, flexShrink:0 }}>
                  <img src={avatar(b.athlete?.photo||"sub")} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {b.athlete?.name?.split(" ")[0]||"—"}
                  </div>
                  <div style={{ fontSize:7, color:C.textHint, textTransform:"uppercase" }}>{b.athlete?.posCode||"—"}</div>
                </div>
                <div style={{ width:5, height:5, borderRadius:"50%", background: getStatusStyle(b.athlete?.status).color, flexShrink:0 }}/>
              </div>
            ))}
            {bench.length === 0 && (
              <div style={{ fontSize:9, color:C.textHint, textAlign:"center", padding:"10px 0", lineHeight:1.8 }}>
                Arrastra titulares<br/>aquí para suplirlos
              </div>
            )}
          </div>
        </div>

        {/* CAMPO HORIZONTAL */}
        <div style={{ display:"flex", flexDirection:"column", minHeight:0 }}>
          {/* Header del campo */}
          <div style={{ padding:"7px 14px", background:"rgba(0,0,0,0.7)", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:C.textMuted }}>
              Formación {formationKey} · Arrastra para mover
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", padding:"4px 12px", background:"transparent", border:`1px solid ${C.borderHi}`, color:C.textMuted, cursor:"pointer" }}>Guardar</div>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", padding:"4px 12px", background:C.amber, color:"#1a0f00", cursor:"pointer", fontWeight:700 }}>Usar en partido →</div>
            </div>
          </div>

          {/* Cancha */}
          <div
            ref={fieldRef}
            onDragOver={e => e.preventDefault()}
            onDrop={handleFieldDrop}

            style={{
              flex:       1,
              position:   "relative",
              background: `
                repeating-linear-gradient(
                  90deg,
                  rgba(0,0,0,0) 0px, rgba(0,0,0,0) 50px,
                  rgba(0,0,0,0.1) 50px, rgba(0,0,0,0.1) 100px
                ),
                linear-gradient(90deg, #1e4a10 0%, #265c15 50%, #1e4a10 100%)
              `,
              overflow:   "hidden",
              cursor:     "crosshair",
            }}
          >
            {/* SVG CANCHA HORIZONTAL */}
            <svg
              style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
              viewBox="0 0 135 90"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Perímetro */}
              <rect x="3" y="3" width="129" height="84" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.45"/>

              {/* Línea de medio campo */}
              <line x1="67.5" y1="3" x2="67.5" y2="87" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4"/>

              {/* Círculo central */}
              <circle cx="67.5" cy="45" r="10" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.4"/>
              <circle cx="67.5" cy="45" r="0.7" fill="rgba(255,255,255,0.6)"/>

              {/* Área grande IZQUIERDA */}
              <rect x="3" y="22" width="20" height="46" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.4"/>
              {/* Área chica IZQ */}
              <rect x="3" y="33" width="8" height="24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.35"/>
              {/* Punto penal IZQ */}
              <circle cx="16" cy="45" r="0.6" fill="rgba(255,255,255,0.55)"/>
              {/* Semicírculo IZQ */}
              <path d="M 23 22 A 10 10 0 0 1 23 68" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.35"/>
              {/* Portería IZQ */}
              <rect x="0" y="37.5" width="3" height="15" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"/>

              {/* Área grande DERECHA */}
              <rect x="112" y="22" width="20" height="46" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.4"/>
              {/* Área chica DER */}
              <rect x="124" y="33" width="8" height="24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.35"/>
              {/* Punto penal DER */}
              <circle cx="119" cy="45" r="0.6" fill="rgba(255,255,255,0.55)"/>
              {/* Semicírculo DER */}
              <path d="M 112 22 A 10 10 0 0 0 112 68" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.35"/>
              {/* Portería DER */}
              <rect x="132" y="37.5" width="3" height="15" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"/>

              {/* Esquinas */}
              <path d="M 3 6 A 2 2 0 0 0 6 3"    fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.35"/>
              <path d="M 3 84 A 2 2 0 0 1 6 87"   fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.35"/>
              <path d="M 132 6 A 2 2 0 0 1 129 3"  fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.35"/>
              <path d="M 132 84 A 2 2 0 0 0 129 87" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.35"/>
            </svg>

            {/* TOKENS */}
            {starters.map((starter, i) => (
              <div key={starter.id} style={{ position:"absolute", left:`${starter.currentLeft}%`, top:`${starter.currentTop}%`, transform:"translate(-50%,-50%)", zIndex: isDraggingThis("starter",i) ? 1 : selectedStarterIdx===i ? 15 : 5 }}>
                <PlayerToken
                  starter={starter}
                  isSelected={selectedStarterIdx === i}
                  isDragged={isDraggingThis("starter",i)}
                  isTarget={dropTarget === i}
                  onSelect={e => { e.stopPropagation(); setSelectedStarterIdx(prev => prev===i ? null : i); }}
                  onDragStart={e => startDrag(e,"starter",i)}
                  onDragEnd={() => { setDragging(null); setDropTarget(null); }}
                  onDragOver={e => { e.preventDefault(); setDropTarget(i); }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={e => handlePlayerDrop(e,"starter",i)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* PANEL DETALLE o placeholder */}
        {selectedStarter?.athlete ? (
          <PlayerDetailPanel
            starter={selectedStarter}
            allAthletes={athletes}
            onClose={() => setSelectedStarterIdx(null)}
            onSwapSimilar={handleSwapSimilar}
            onMoveToBank={handleMoveToBank}
          />
        ) : (
          <div style={{ width:220, background:"rgba(0,0,0,0.88)", borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:28, opacity:0.12, marginBottom:10 }}>⚽</div>
            <div style={{ fontSize:9, color:C.textHint, textTransform:"uppercase", letterSpacing:"1.5px", textAlign:"center", lineHeight:1.9 }}>
              Toca un jugador<br/>para ver su ficha
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
