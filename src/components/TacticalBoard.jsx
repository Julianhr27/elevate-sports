/**
 * @component TacticalBoard v8 — FIFA Squad Management UI
 * @description Pizarra tactica estilo FIFA 18 con:
 * - Campo VERTICAL con tokens grandes (foto + OVR + nombre)
 * - Tabs superiores: PLANTILLA | FORMACIONES | ROLES | INSTRUCCIONES | TACTICAS
 * - Suplentes en barra horizontal inferior
 * - Miniaturas de formacion como mini-canchas SVG
 * - Panel de jugador estilo FIFA card
 * - Framer Motion para transiciones fluidas
 * - Barras de salud RPE
 *
 * @version 8.0
 * @author @Desarrollador (Andres)
 */

import { useState, useRef, useCallback, useMemo, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PALETTE as C } from "../constants/palette";
import { FORMATIONS_HORIZONTAL as FORMATIONS } from "../constants/formations";
import { getAvatarUrl as avatar, calculateAge, getStatusStyle } from "../utils/helpers";
import { calcSaludActual, saludColor } from "../utils/rpeEngine";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "./ConfirmModal";
import { showToast } from "./Toast";

/* ── Responsive: inyectar media query CSS una sola vez ── */
if (typeof document !== "undefined" && !document.getElementById("tb-responsive")) {
  const s = document.createElement("style");
  s.id = "tb-responsive";
  s.textContent = `
    @media(max-width:768px){
      .tb-main-grid{grid-template-columns:1fr!important}
      .tb-detail-panel{position:fixed!important;inset:0!important;width:100%!important;z-index:100!important;border:none!important}
      .tb-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch}
      .tb-tabs>div{white-space:nowrap;padding:0 12px!important;font-size:9px!important;letter-spacing:1px!important}
      .tb-subs-bar{flex-wrap:wrap}
      .tb-subs-bar>div{min-width:120px!important}
    }
    @media(max-width:480px){
      .tb-field{min-height:350px!important}
      .tb-token{width:52px!important}
      .tb-token img{height:40px!important}
      .tb-token .ovr{font-size:13px!important}
    }
  `;
  document.head.appendChild(s);
}

// ── Posiciones verticales para el campo (top=porteria propia abajo) ──
const VERT_FORMATIONS = {
  "4-3-3": {
    label: "Ataque",
    positions: [
      { posCode:"GK", left:50, top:90 },
      { posCode:"LB", left:15, top:72 },
      { posCode:"CB", left:37, top:75 },
      { posCode:"CB", left:63, top:75 },
      { posCode:"RB", left:85, top:72 },
      { posCode:"CM", left:28, top:52 },
      { posCode:"CM", left:50, top:48 },
      { posCode:"CM", left:72, top:52 },
      { posCode:"LW", left:18, top:22 },
      { posCode:"ST", left:50, top:14 },
      { posCode:"RW", left:82, top:22 },
    ],
  },
  "4-4-2": {
    label: "Clasico",
    positions: [
      { posCode:"GK", left:50, top:90 },
      { posCode:"LB", left:15, top:74 },
      { posCode:"CB", left:37, top:76 },
      { posCode:"CB", left:63, top:76 },
      { posCode:"RB", left:85, top:74 },
      { posCode:"LM", left:15, top:50 },
      { posCode:"CM", left:38, top:53 },
      { posCode:"CM", left:62, top:53 },
      { posCode:"RM", left:85, top:50 },
      { posCode:"ST", left:37, top:18 },
      { posCode:"ST", left:63, top:18 },
    ],
  },
  "3-5-2": {
    label: "Compacto",
    positions: [
      { posCode:"GK", left:50, top:90 },
      { posCode:"CB", left:25, top:75 },
      { posCode:"CB", left:50, top:77 },
      { posCode:"CB", left:75, top:75 },
      { posCode:"LM", left:10, top:50 },
      { posCode:"CM", left:32, top:53 },
      { posCode:"CM", left:50, top:48 },
      { posCode:"CM", left:68, top:53 },
      { posCode:"RM", left:90, top:50 },
      { posCode:"ST", left:37, top:18 },
      { posCode:"ST", left:63, top:18 },
    ],
  },
  "4-2-3-1": {
    label: "Control",
    positions: [
      { posCode:"GK", left:50, top:90 },
      { posCode:"LB", left:15, top:74 },
      { posCode:"CB", left:37, top:76 },
      { posCode:"CB", left:63, top:76 },
      { posCode:"RB", left:85, top:74 },
      { posCode:"DM", left:38, top:60 },
      { posCode:"DM", left:62, top:60 },
      { posCode:"LW", left:20, top:36 },
      { posCode:"CAM",left:50, top:33 },
      { posCode:"RW", left:80, top:36 },
      { posCode:"ST", left:50, top:14 },
    ],
  },
  "5-3-2": {
    label: "Defensivo",
    positions: [
      { posCode:"GK", left:50, top:90 },
      { posCode:"LWB",left:10, top:68 },
      { posCode:"CB", left:30, top:76 },
      { posCode:"CB", left:50, top:78 },
      { posCode:"CB", left:70, top:76 },
      { posCode:"RWB",left:90, top:68 },
      { posCode:"CM", left:30, top:50 },
      { posCode:"CM", left:50, top:47 },
      { posCode:"CM", left:70, top:50 },
      { posCode:"ST", left:37, top:18 },
      { posCode:"ST", left:63, top:18 },
    ],
  },
};

const POSITION_GROUPS = {
  GK:["GK"], DEF:["CB","LB","RB","LCB","RCB","LWB","RWB"],
  MID:["CM","DM","LDM","RDM","CAM","LM","RM"], FWD:["ST","LS","RS","LW","RW","CF"],
};
const getGroup = (pc) => { for (const [g,c] of Object.entries(POSITION_GROUPS)) if (c.includes(pc)) return g; return "MID"; };

const ROLE_OPTIONS = {
  GK: ["Portero","Barredora"],
  DEF: ["Defensor","Stopper","Lateral ofensivo","Marcador"],
  MID: ["Playmaker","Box to box","Pivote","Mediapunta","Interior"],
  FWD: ["Goleador","Falso 9","Extremo","Segundo delantero"],
};

// ── Mini cancha SVG para thumbnails de formacion ──
const MiniPitch = memo(function MiniPitch({ positions, isActive, onClick }) {
  return (
    <div onClick={onClick} style={{ width:64, height:48, background: isActive ? "rgba(200,255,0,0.12)" : "rgba(255,255,255,0.04)", border:`1px solid ${isActive ? C.neon : C.border}`, cursor:"pointer", position:"relative", overflow:"hidden", borderRadius:2 }}>
      <svg viewBox="0 0 100 70" style={{ width:"100%", height:"100%", position:"absolute", inset:0 }}>
        <rect x="2" y="2" width="96" height="66" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"/>
        <line x1="50" y1="2" x2="50" y2="68" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
        <circle cx="50" cy="35" r="8" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
        {positions.map((p, i) => (
          <circle key={i} cx={p.left} cy={p.top * 0.7 + 2} r="2.8" fill={isActive ? C.neon : "rgba(255,255,255,0.5)"} />
        ))}
      </svg>
    </div>
  );
});

// ── Barra de salud ──
function HealthBar({ salud, width = 48 }) {
  return (
    <div style={{ width, height:3, background:"rgba(0,0,0,0.6)", borderRadius:1, overflow:"hidden" }}>
      <motion.div initial={{width:0}} animate={{width:`${salud}%`}} transition={{duration:0.5}} style={{ height:"100%", background: saludColor(salud), borderRadius:1 }} />
    </div>
  );
}

// ── Radar hexagonal ──
const HexRadar = memo(function HexRadar({ attrs, size=120 }) {
  const cx=size/2, cy=size/2, r=size*0.38;
  const keys=Object.keys(attrs);
  const hex=keys.map((_,i)=>{const a=(Math.PI/3)*i-Math.PI/2;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};});
  const data=keys.map((k,i)=>{const s=Math.min((attrs[k]||50)/99,1);const a=(Math.PI/3)*i-Math.PI/2;return{x:cx+r*s*Math.cos(a),y:cy+r*s*Math.sin(a)};});
  const toP=pts=>pts.map((p,i)=>`${i===0?"M":"L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")+" Z";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.33,0.66,1].map((s,si)=>(<polygon key={si} points={hex.map(p=>`${(cx+(p.x-cx)*s).toFixed(1)},${(cy+(p.y-cy)*s).toFixed(1)}`).join(" ")} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>))}
      {hex.map((p,i)=><line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>)}
      <path d={toP(data)} fill="rgba(200,255,0,0.18)" stroke={C.neon} strokeWidth="1.5"/>
      {data.map((p,i)=><circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5" fill={C.neon}/>)}
      {hex.map((p,i)=>{const lx=cx+(p.x-cx)*1.28,ly=cy+(p.y-cy)*1.28;return(<text key={i} x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontWeight="700">{keys[i]?.slice(0,3).toUpperCase()}</text>);})}
    </svg>
  );
});

// ── Token de jugador grande estilo FIFA ──
const PlayerToken = memo(function PlayerToken({ starter, salud, isSelected, isDragged, isTarget, onSelect, onPointerDown }) {
  const [hovered, setHovered] = useState(false);
  const athlete = starter.athlete;
  if (!athlete) {
    return (
      <div style={{ width:68, height:80, border:`1.5px dashed ${isTarget ? C.drag : "rgba(255,255,255,0.2)"}`, borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", background: isTarget ? C.dragDim : "rgba(255,255,255,0.03)" }}>
        <div style={{ fontSize:22, color:"rgba(255,255,255,0.15)" }}>+</div>
      </div>
    );
  }

  const isGK = starter.posCode === "GK";
  const active = isSelected || hovered;
  const saludVal = salud?.salud ?? 100;
  const ovr = athlete.rating || Math.round(((athlete.speed||78)+(athlete.shooting||72)+(athlete.passing||80)+(athlete.dribble||75)+(athlete.defense||65)+(athlete.physical||77))/6);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1, userSelect:"none" }}>
      {/* OVR badge */}
      <div style={{ fontSize:16, fontWeight:900, color: isSelected ? C.neon : "white", textShadow:"0 2px 8px rgba(0,0,0,0.9)", lineHeight:1, zIndex:2 }}>
        {ovr}
      </div>
      <div
        onClick={onSelect}
        onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
        onPointerDown={onPointerDown}
        style={{
          width:68, overflow:"hidden", cursor: isDragged?"grabbing":"grab",
          touchAction:"none",
          opacity: isDragged?0.2:1,
          border: `2px solid ${isTarget ? C.drag : isSelected ? C.neon : saludColor(saludVal)}`,
          background: isTarget ? "rgba(0,60,80,0.9)" : "rgba(5,12,5,0.92)",
          transform: `scale(${isTarget?1.08:active&&!isDragged?1.04:1})`,
          boxShadow: isSelected ? `0 0 0 1px ${C.neon}, 0 0 18px rgba(200,255,0,0.5)` : isTarget ? `0 0 14px rgba(0,229,255,0.5)` : active ? `0 6px 20px rgba(0,0,0,0.8), 0 0 8px ${saludColor(saludVal)}44` : `0 3px 10px rgba(0,0,0,0.6), 0 0 4px ${saludColor(saludVal)}33`,
          transition:"transform 180ms, box-shadow 180ms, opacity 120ms", borderRadius:3,
        }}
      >
        {/* Health Signal stripe — refleja Borg CR-10 individual */}
        <div style={{ height:3, background: isSelected ? C.neon : saludColor(saludVal) }} />
        {/* Photo */}
        <div style={{ width:68, height:56, overflow:"hidden", position:"relative" }}>
          <img src={avatar(athlete.photo)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top", display:"block", pointerEvents:"none" }} />
          {athlete.status !== "P" && (
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontSize:8, color: getStatusStyle(athlete.status).color, border:`1px solid ${getStatusStyle(athlete.status).color}`, padding:"1px 4px", fontWeight:700, textTransform:"uppercase" }}>
                {athlete.status==="L"?"LES":"AUS"}
              </div>
            </div>
          )}
          {/* Position badge */}
          <div style={{ position:"absolute", top:2, left:2, fontSize:7, fontWeight:700, color:"white", background:"rgba(0,0,0,0.7)", padding:"1px 4px", borderRadius:1, textTransform:"uppercase" }}>
            {starter.posCode}
          </div>
        </div>
        {/* Name + health */}
        <div style={{ padding:"3px 4px 4px", background:"rgba(0,0,0,0.8)", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize:8, color:"white", fontWeight:700, textTransform:"uppercase", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", letterSpacing:"0.3px", textAlign:"center" }}>
            {athlete.name.split(" ").pop()}
          </div>
          <div style={{ marginTop:2 }}>
            <HealthBar salud={saludVal} width="100%" />
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.starter?.athlete?.id === next.starter?.athlete?.id &&
  prev.starter?.posCode === next.starter?.posCode &&
  prev.salud?.salud === next.salud?.salud &&
  prev.isSelected === next.isSelected &&
  prev.isDragged === next.isDragged &&
  prev.isTarget === next.isTarget
);

// ── Panel detalle FIFA Card ──
function PlayerDetail({ starter, allAthletes, historial, onClose, onSwapSimilar }) {
  const athlete = starter?.athlete;
  if (!athlete) return null;
  const status = getStatusStyle(athlete.status);
  const { salud, rpeAvg7d } = calcSaludActual(athlete.rpe, historial, athlete.id);
  const attrs = { Ritmo:athlete.speed||78, Tiro:athlete.shooting||72, Pases:athlete.passing||80, Regate:athlete.dribble||75, Defensa:athlete.defense||65, Fisico:athlete.physical||77 };
  const ovr = athlete.rating || Math.round(Object.values(attrs).reduce((a,b)=>a+b,0)/6);
  const group = getGroup(starter.posCode);
  const similar = allAthletes.filter(a => getGroup(a.posCode)===group && a.id!==athlete.id).slice(0,3);

  return (
    <motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.2}}
      style={{ width:240, background:"rgba(8,14,22,0.97)", borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflowY:"auto" }}>

      {/* Header: foto + OVR + pos */}
      <div style={{ position:"relative", height:160, overflow:"hidden" }}>
        <img src={avatar(athlete.photo)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top", filter:"brightness(0.7)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(8,14,22,1) 0%, rgba(8,14,22,0.3) 50%, transparent 100%)" }} />
        <div style={{ position:"absolute", bottom:10, left:14, right:14 }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:10, color:C.neon, fontWeight:700, textTransform:"uppercase", letterSpacing:"2px" }}>
                {starter.posCode}
              </div>
              <div style={{ fontSize:20, fontWeight:900, color:"white", textTransform:"uppercase", letterSpacing:"-0.5px", lineHeight:1.1 }}>
                {athlete.name}
              </div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:36, fontWeight:900, color:C.neon, lineHeight:1 }}>{ovr}</div>
              <div style={{ fontSize:7, color:C.textHint, textTransform:"uppercase", letterSpacing:"1px" }}>OVR</div>
            </div>
          </div>
        </div>
        <div onClick={onClose} style={{ position:"absolute", top:8, right:8, fontSize:16, color:"rgba(255,255,255,0.5)", cursor:"pointer", padding:"2px 6px" }}>✕</div>
      </div>

      {/* Salud */}
      <div style={{ padding:"10px 14px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", color: saludColor(salud) }}>Salud: {salud}%</span>
          <span style={{ fontSize:9, color:C.textMuted }}>RPE 7d: {rpeAvg7d ?? "\u2014"}</span>
        </div>
        <HealthBar salud={salud} width="100%" />
      </div>

      {/* Radar */}
      <div style={{ display:"flex", justifyContent:"center", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
        <HexRadar attrs={attrs} size={130} />
      </div>

      {/* Stats grid */}
      <div style={{ padding:"8px 14px", borderBottom:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
        {Object.entries(attrs).map(([k,v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"4px 6px", background:"rgba(255,255,255,0.03)" }}>
            <span style={{ fontSize:9, color:C.textMuted, textTransform:"uppercase" }}>{k}</span>
            <span style={{ fontSize:11, fontWeight:700, color: v>=80?C.neon:v>=70?C.amber:C.textMuted }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ padding:"8px 14px", borderBottom:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
        {[
          { l:"Edad", v: calculateAge(athlete.dob)==="\u2014"?"\u2014":calculateAge(athlete.dob)+" a\u00f1os" },
          { l:"Estado", v: status.label, c: status.color },
        ].map(m => (
          <div key={m.l} style={{ background:"rgba(255,255,255,0.03)", padding:"5px 6px" }}>
            <div style={{ fontSize:7, color:C.textHint, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:1 }}>{m.l}</div>
            <div style={{ fontSize:11, fontWeight:600, color: m.c||C.text }}>{m.v}</div>
          </div>
        ))}
      </div>

      {/* Similares */}
      {similar.length > 0 && (
        <div style={{ padding:"8px 14px" }}>
          <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"2px", color:C.textHint, marginBottom:6 }}>Alternativas</div>
          {similar.map(a => {
            const aOvr = a.rating || Math.floor(72+(a.id%20));
            return (
              <div key={a.id} onClick={()=>onSwapSimilar(a)} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px", marginBottom:3, background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border}`, cursor:"pointer", borderRadius:2 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", overflow:"hidden", border:`1px solid rgba(255,255,255,0.12)`, flexShrink:0 }}>
                  <img src={avatar(a.photo)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, color:C.text, fontWeight:700, textTransform:"uppercase", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name.split(" ").pop()}</div>
                  <div style={{ fontSize:8, color:C.textMuted }}>{a.posCode}</div>
                </div>
                <div style={{ fontSize:16, fontWeight:900, color:C.neon }}>{aOvr}</div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════
export default function TacticalBoard({ athletes = [], historial = [] }) {
  const [formationKey, setFormationKey] = useState("4-3-3");
  const [dragInfo, setDragInfo] = useState(null);
  const [nearTarget, setNearTarget] = useState(null);
  const ghostRef = useRef(null);
  const benchAreaRef = useRef(null);
  const startersRef = useRef(null);
  const benchInfoRef = useRef(null);
  const dragInfoRef = useRef(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [activeTab, setActiveTab] = useState("plantilla");

  const [rolesData, setRolesData] = useLocalStorage("elevate_roles_v2", {});
  const [instructionsText, setInstructionsText] = useLocalStorage("elevate_instructions", "");
  const [tacticasText, setTacticasText] = useLocalStorage("elevate_tacticas", "");
  const [confirmAction, setConfirmAction] = useState(null); // { title, message, onConfirm }

  const [starters, setStarters] = useState(() =>
    VERT_FORMATIONS["4-3-3"].positions.map((pos, i) => ({
      ...pos, currentLeft:pos.left, currentTop:pos.top,
      athlete: athletes[i]||null, id:`s${i}`,
    }))
  );
  const [bench, setBench] = useState(() =>
    athletes.slice(11).map((a,i) => ({ athlete:a, id:`b${i}` }))
  );

  const fieldRef = useRef(null);

  useEffect(() => { startersRef.current = starters; }, [starters]);
  useEffect(() => { benchInfoRef.current = bench; }, [bench]);

  const saludMap = useMemo(() => {
    const m = new Map();
    athletes.forEach(a => m.set(a.id, calcSaludActual(a.rpe, historial, a.id)));
    return m;
  }, [athletes, historial]);

  // ── Formation change ──
  const changeFormation = useCallback((key) => {
    setFormationKey(key); setSelectedIdx(null);
    const np = VERT_FORMATIONS[key].positions;
    setStarters(prev => np.map((pos,i) => {
      const g = getGroup(pos.posCode);
      const stagger = g==="GK"?0 : g==="DEF"?0.04 : g==="MID"?0.09 : 0.14;
      return {
        ...pos, currentLeft:pos.left, currentTop:pos.top,
        athlete: prev[i]?.athlete??null, id: prev[i]?.id??`s${i}`, stagger,
      };
    }));
  }, []);

  // ── Pointer Drag System (FIFA-style: ghost + spring + touch) ──
  const handlePointerDown = useCallback((e, type, index) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const info = { type, index, x: e.clientX, y: e.clientY };
    setDragInfo(info);
    dragInfoRef.current = info;
    setSelectedIdx(null);
  }, []);

  useEffect(() => {
    if (!dragInfo) return;
    const onMove = (e) => {
      e.preventDefault();
      if (ghostRef.current) {
        ghostRef.current.style.left = `${e.clientX - 36}px`;
        ghostRef.current.style.top = `${e.clientY - 42}px`;
      }
      if (!fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      let nearest = null, minDist = 10;
      (startersRef.current || []).forEach((st, i) => {
        if (dragInfoRef.current?.type === "starter" && dragInfoRef.current?.index === i) return;
        const dx = st.currentLeft - px, dy = st.currentTop - py;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) { minDist = d; nearest = i; }
      });
      setNearTarget(prev => prev === nearest ? prev : nearest);
    };
    const onUp = (e) => {
      const di = dragInfoRef.current;
      const curSt = startersRef.current || [];
      const curBn = benchInfoRef.current || [];
      if (!di) { cleanup(); return; }

      if (fieldRef.current) {
        const rect = fieldRef.current.getBoundingClientRect();
        const inField = e.clientX >= rect.left && e.clientX <= rect.right &&
                        e.clientY >= rect.top && e.clientY <= rect.bottom;
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;

        // Buscar jugador mas cercano para swap
        let nearest = null, minDist = 10;
        curSt.forEach((st, i) => {
          if (di.type === "starter" && di.index === i) return;
          const dx = st.currentLeft - px, dy = st.currentTop - py;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDist) { minDist = d; nearest = i; }
        });

        if (inField && nearest !== null) {
          // Drop sobre otro jugador → swap
          if (di.type === "starter") {
            setStarters(p => { const n = [...p]; const t = n[di.index].athlete; n[di.index] = { ...n[di.index], athlete: n[nearest].athlete }; n[nearest] = { ...n[nearest], athlete: t }; return n; });
          } else if (di.type === "bench") {
            const en = curBn[di.index], lv = curSt[nearest]?.athlete;
            setStarters(p => p.map((s, i) => i === nearest ? { ...s, athlete: en.athlete } : s));
            setBench(p => { const n = p.filter((_, i) => i !== di.index); return lv ? [...n, { athlete: lv, id: `b${Date.now()}` }] : n; });
          }
          cleanup(); return;
        }
        if (inField && di.type === "starter") {
          // Reposicionar en campo libre
          const left = Math.min(Math.max(px, 4), 96);
          const top = Math.min(Math.max(py, 4), 96);
          setStarters(p => p.map((s, i) => i === di.index ? { ...s, currentLeft: left, currentTop: top } : s));
          cleanup(); return;
        }
        if (inField && di.type === "bench") {
          // Suplente a slot vacio
          const ei = curSt.findIndex(s => !s.athlete);
          if (ei >= 0) {
            const left = Math.min(Math.max(px, 4), 96), top = Math.min(Math.max(py, 4), 96);
            setStarters(p => p.map((s, i) => i === ei ? { ...s, athlete: curBn[di.index]?.athlete, currentLeft: left, currentTop: top } : s));
            setBench(p => p.filter((_, i) => i !== di.index));
          }
          cleanup(); return;
        }
      }
      // Drop en zona suplentes → mover al banquillo
      if (benchAreaRef.current && di.type === "starter") {
        const br = benchAreaRef.current.getBoundingClientRect();
        if (e.clientX >= br.left && e.clientX <= br.right && e.clientY >= br.top && e.clientY <= br.bottom) {
          const lv = curSt[di.index]?.athlete;
          if (lv) {
            setStarters(p => p.map((s, i) => i === di.index ? { ...s, athlete: null } : s));
            setBench(p => [...p, { athlete: lv, id: `b${Date.now()}` }]);
          }
        }
      }
      cleanup();
    };
    const cleanup = () => {
      setDragInfo(null); dragInfoRef.current = null;
      setNearTarget(null);
      if (ghostRef.current) ghostRef.current.style.display = "none";
    };
    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onUp);
    return () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp); };
  }, [dragInfo]);

  const doSwap = useCallback((na) => {
    if (selectedIdx===null) return;
    const lv=starters[selectedIdx].athlete;
    setStarters(p=>p.map((s,i)=>i===selectedIdx?{...s,athlete:na}:s));
    if (lv) setBench(p=>[...p,{athlete:lv,id:`b${Date.now()}`}]);
    setBench(p=>p.filter(b=>b.athlete?.id!==na.id));
    setSelectedIdx(null);
  }, [selectedIdx,starters]);

  const swapSimilar = useCallback((na) => {
    const current = selectedIdx!==null ? starters[selectedIdx]?.athlete : null;
    setConfirmAction({
      title: "Cambiar jugador",
      message: `Reemplazar a ${current?.name?.split(" ").pop() || "titular"} por ${na.name.split(" ").pop()}?`,
      onConfirm: () => { doSwap(na); setConfirmAction(null); },
    });
  }, [selectedIdx, starters, doSwap]);

  const doMoveToBank = useCallback(() => {
    if (selectedIdx===null) return;
    const lv=starters[selectedIdx].athlete; if (!lv) return;
    setStarters(p=>p.map((s,i)=>i===selectedIdx?{...s,athlete:null}:s));
    setBench(p=>[...p,{athlete:lv,id:`b${Date.now()}`}]);
    setSelectedIdx(null);
  }, [selectedIdx,starters]);

  const moveToBank = useCallback(() => {
    const lv = selectedIdx!==null ? starters[selectedIdx]?.athlete : null;
    if (!lv) return;
    setConfirmAction({
      title: "Pasar a suplentes",
      message: `Mover a ${lv.name.split(" ").pop()} al banquillo?`,
      onConfirm: () => { doMoveToBank(); setConfirmAction(null); },
    });
  }, [selectedIdx, starters, doMoveToBank]);

  const isDrag = (t,i) => dragInfo?.type===t&&dragInfo?.index===i;
  const selStarter = selectedIdx!==null ? starters[selectedIdx] : null;

  const TABS = [
    { key:"plantilla",     label:"Plantilla" },
    { key:"formaciones",   label:"Formaciones" },
    { key:"roles",         label:"Roles" },
    { key:"instrucciones", label:"Instrucciones" },
    { key:"tacticas",      label:"Tacticas" },
  ];

  const ta = { width:"100%", minHeight:220, background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, color:"white", fontSize:12, fontFamily:"inherit", padding:12, outline:"none", resize:"vertical", lineHeight:1.7 };

  // ── Ghost data ──
  const ghostAthlete = dragInfo
    ? (dragInfo.type === "starter" ? starters[dragInfo.index]?.athlete : bench[dragInfo.index]?.athlete)
    : null;
  const ghostOvr = ghostAthlete
    ? (ghostAthlete.rating || Math.round(((ghostAthlete.speed||78)+(ghostAthlete.shooting||72)+(ghostAthlete.passing||80)+(ghostAthlete.dribble||75)+(ghostAthlete.defense||65)+(ghostAthlete.physical||77))/6))
    : 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"#0a1020", fontFamily:"'Arial Narrow',Arial,sans-serif", overflow:"hidden" }}>

      {/* ── TABS SUPERIORES FIFA ── */}
      <div style={{ display:"flex", alignItems:"stretch", height:36, background:"rgba(0,0,0,0.85)", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        {TABS.map(t => (
          <div key={t.key} onClick={()=>setActiveTab(t.key)}
            style={{ padding:"0 18px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"2px", color: activeTab===t.key ? C.neon : C.textMuted, display:"flex", alignItems:"center", cursor:"pointer", borderBottom: activeTab===t.key ? `2px solid ${C.neon}` : "2px solid transparent", transition:"color 0.15s" }}>
            {t.label}
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", padding:"0 14px", gap:8 }}>
          <div style={{ fontSize:9, color:C.textMuted, textTransform:"uppercase", letterSpacing:"1px" }}>{formationKey}</div>
          <motion.div
            onClick={() => showToast("Modulo 'Usar en partido' disponible en V9", "info")}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ padding:"4px 12px", fontSize:9, textTransform:"uppercase", letterSpacing:"1px", background:C.amber, color:"#1a0f00", cursor:"pointer", fontWeight:700 }}
          >
            Usar en partido
          </motion.div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      {(activeTab === "plantilla" || activeTab === "formaciones") && (
        <div style={{ flex:1, display:"flex", minHeight:0, overflow:"hidden" }}>

          {/* Panel izq: detalle o formaciones */}
          <AnimatePresence mode="wait">
            {activeTab === "plantilla" && selStarter?.athlete ? (
              <PlayerDetail key="detail" starter={selStarter} allAthletes={athletes} historial={historial} onClose={()=>setSelectedIdx(null)} onSwapSimilar={swapSimilar} />
            ) : activeTab === "formaciones" ? (
              <motion.div key="formations" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{ width:240, background:"rgba(0,0,0,0.8)", borderRight:`1px solid ${C.border}`, padding:16, overflowY:"auto" }}>
                <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:C.textHint, marginBottom:14 }}>Selecciona formacion</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {Object.entries(VERT_FORMATIONS).map(([key, f]) => (
                    <div key={key} style={{ textAlign:"center" }}>
                      <MiniPitch positions={f.positions} isActive={formationKey===key} onClick={()=>changeFormation(key)} />
                      <div style={{ fontSize:11, fontWeight:700, color: formationKey===key ? C.neon : C.textMuted, marginTop:4 }}>{key}</div>
                      <div style={{ fontSize:8, color:C.textHint }}>{f.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Campo vertical */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
            <div
              ref={fieldRef}
              style={{
                flex:1, position:"relative", cursor:"crosshair", overflow:"hidden",
                background:`
                  repeating-linear-gradient(180deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 40px,rgba(0,0,0,0.08) 40px,rgba(0,0,0,0.08) 80px),
                  linear-gradient(180deg,#1a4a0e 0%,#256015 50%,#1a4a0e 100%)`,
              }}
            >
              {/* SVG campo vertical */}
              <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} viewBox="0 0 90 130" preserveAspectRatio="none">
                <rect x="3" y="3" width="84" height="124" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4"/>
                <line x1="3" y1="65" x2="87" y2="65" stroke="rgba(255,255,255,0.45)" strokeWidth="0.35"/>
                <circle cx="45" cy="65" r="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.35"/>
                <circle cx="45" cy="65" r="0.7" fill="rgba(255,255,255,0.5)"/>
                {/* Area superior (rival) */}
                <rect x="22" y="3" width="46" height="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.35"/>
                <rect x="33" y="3" width="24" height="7" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.3"/>
                <circle cx="45" cy="15" r="0.5" fill="rgba(255,255,255,0.5)"/>
                <rect x="37.5" y="0" width="15" height="3" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.45"/>
                {/* Area inferior (propia) */}
                <rect x="22" y="109" width="46" height="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.35"/>
                <rect x="33" y="120" width="24" height="7" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.3"/>
                <circle cx="45" cy="115" r="0.5" fill="rgba(255,255,255,0.5)"/>
                <rect x="37.5" y="127" width="15" height="3" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.45"/>
              </svg>

              {/* Tokens animados — spring con micro-rebote FIFA */}
              {starters.map((st, i) => (
                <motion.div key={st.id}
                  animate={{ left:`${st.currentLeft}%`, top:`${st.currentTop}%` }}
                  transition={{ type:"spring", stiffness:170, damping:14, mass:0.8, delay: st.stagger||0 }}
                  style={{ position:"absolute", transform:"translate(-50%,-50%)", zIndex: isDrag("starter",i)?1:selectedIdx===i?15:5 }}>
                  <PlayerToken
                    starter={st} salud={st.athlete ? saludMap.get(st.athlete.id) : null}
                    isSelected={selectedIdx===i} isDragged={isDrag("starter",i)} isTarget={nearTarget===i}
                    onSelect={e=>{e.stopPropagation();setSelectedIdx(p=>p===i?null:i);}}
                    onPointerDown={e=>handlePointerDown(e,"starter",i)}
                  />
                </motion.div>
              ))}
            </div>

            {/* ── SUPLENTES — barra horizontal inferior ── */}
            <div ref={benchAreaRef} style={{ flexShrink:0, background:"rgba(0,0,0,0.85)", borderTop:`2px solid ${C.border}`, padding:"10px 16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:"2px", color:"white" }}>Suplentes</div>
                <div style={{ fontSize:9, color:C.textMuted }}>({bench.length})</div>
              </div>
              <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:4 }}>
                {bench.map((b,i) => {
                  const bSalud = b.athlete ? saludMap.get(b.athlete.id) : null;
                  const bSaludVal = bSalud?.salud ?? 100;
                  const bOvr = b.athlete?.rating || Math.floor(72+(b.athlete?.id%20||0));
                  return (
                    <div key={b.id}
                      onPointerDown={e=>handlePointerDown(e,"bench",i)}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 12px", background:"rgba(255,255,255,0.04)", border:`1px solid ${saludColor(bSaludVal)}55`, cursor:"grab", opacity:isDrag("bench",i)?0.3:1, touchAction:"none", flexShrink:0, borderRadius:3, minWidth:140, userSelect:"none" }}
                    >
                      <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background: saludColor(bSaludVal) }} />
                        <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:"uppercase" }}>{b.athlete?.posCode}</div>
                      </div>
                      <div style={{ width:32, height:32, borderRadius:"50%", overflow:"hidden", border:`2px solid ${saludColor(bSaludVal)}`, flexShrink:0 }}>
                        <img src={avatar(b.athlete?.photo)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      </div>
                      <div style={{ fontSize:22, fontWeight:900, color:C.neon }}>{bOvr}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"white", textTransform:"uppercase", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {b.athlete?.name?.split(" ").pop()||"\u2014"}
                        </div>
                        {bSalud && <HealthBar salud={bSalud.salud} width={50} />}
                      </div>
                    </div>
                  );
                })}
                {bench.length === 0 && <div style={{ fontSize:10, color:C.textHint, padding:"8px 0" }}>Arrastra titulares aqui para suplirlos</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ROLES ── */}
      {activeTab === "roles" && (
        <div style={{ flex:1, padding:20, overflowY:"auto" }}>
          <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:C.textHint, marginBottom:16 }}>Asignacion de roles por posicion</div>
          <div style={{ maxWidth:600 }}>
            {starters.filter(s=>s.athlete).map((s,i) => {
              const group = getGroup(s.posCode);
              const options = ROLE_OPTIONS[group] || ROLE_OPTIONS.MID;
              const currentRole = rolesData[s.athlete.id] || options[0];
              return (
                <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 12px", borderBottom:`1px solid ${C.border}`, background: i%2===0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", overflow:"hidden", border:`1px solid rgba(255,255,255,0.12)`, flexShrink:0 }}>
                    <img src={avatar(s.athlete.photo)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color:C.neon, textTransform:"uppercase", width:35 }}>{s.posCode}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:"white", textTransform:"uppercase", flex:1 }}>{s.athlete.name.split(" ").pop()}</div>
                  <div style={{ fontSize:14, color:C.textMuted, margin:"0 8px" }}>\u2192</div>
                  <select
                    value={currentRole}
                    onChange={e => setRolesData(prev => ({...prev, [s.athlete.id]: e.target.value}))}
                    style={{ fontSize:12, padding:"5px 10px", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, color:"white", fontFamily:"inherit", outline:"none", minWidth:150, cursor:"pointer" }}
                  >
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: INSTRUCCIONES ── */}
      {activeTab === "instrucciones" && (
        <div style={{ flex:1, padding:20, overflowY:"auto" }}>
          <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:C.textHint, marginBottom:14 }}>Instrucciones del partido</div>
          <div style={{ maxWidth:600 }}>
            <textarea value={instructionsText} onChange={e=>setInstructionsText(e.target.value)} placeholder={"Pressing: Alto / Medio / Bajo\nLinea defensiva: Alta / Media / Baja\nAmplitud: Estrecho / Normal / Amplio\nRitmo de juego: Rapido / Posesion\nTransiciones: Contraataque / Posicional\n\nNotas adicionales..."} style={ta} />
            <div style={{ fontSize:8, color:C.textHint, marginTop:6 }}>Auto-guardado</div>
          </div>
        </div>
      )}

      {/* ── TAB: TACTICAS ── */}
      {activeTab === "tacticas" && (
        <div style={{ flex:1, padding:20, overflowY:"auto" }}>
          <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:C.textHint, marginBottom:14 }}>Plan tactico del equipo</div>
          <div style={{ maxWidth:600 }}>
            <textarea value={tacticasText} onChange={e=>setTacticasText(e.target.value)} placeholder={"FASE OFENSIVA:\n- Salida desde atras con...\n- Jugada por banda con...\n\nFASE DEFENSIVA:\n- Pressing tras perdida...\n- Repliegue a zona...\n\nBALON PARADO:\n- Corners: ...\n- Tiros libres: ...\n\nTRANSICIONES:\n- Ofensiva: ...\n- Defensiva: ..."} style={{...ta, minHeight:300}} />
            <div style={{ fontSize:8, color:C.textHint, marginTop:6 }}>Auto-guardado</div>
          </div>
        </div>
      )}

      {/* ── Modal de confirmacion ── */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmModal
            title={confirmAction.title}
            message={confirmAction.message}
            onConfirm={confirmAction.onConfirm}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Ghost token FIFA — sigue el cursor durante drag ── */}
      {dragInfo && ghostAthlete && (
        <div ref={ghostRef} style={{
          position:"fixed", left: dragInfo.x - 36, top: dragInfo.y - 42,
          zIndex:9999, pointerEvents:"none",
          filter:`drop-shadow(0 0 18px ${C.neonGlow}) drop-shadow(0 0 6px rgba(200,255,0,0.3))`,
          opacity:0.92,
        }}>
          <div style={{
            width:72, background:"rgba(5,12,5,0.95)",
            border:`2px solid ${C.neon}`, borderRadius:3, overflow:"hidden",
            transform:"scale(1.12)",
            boxShadow:`0 0 24px ${C.neonGlow}, inset 0 0 8px rgba(200,255,0,0.08)`,
          }}>
            <div style={{ height:3, background:C.neon }} />
            <img src={avatar(ghostAthlete.photo)} alt=""
              style={{ width:72, height:58, objectFit:"cover", objectPosition:"top", display:"block" }} />
            <div style={{ padding:"3px 4px", background:"rgba(0,0,0,0.85)", textAlign:"center" }}>
              <div style={{ fontSize:8, color:"white", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                {ghostAthlete.name.split(" ").pop()}
              </div>
            </div>
          </div>
          <div style={{ textAlign:"center", fontSize:16, fontWeight:900, color:C.neon, textShadow:`0 2px 10px rgba(0,0,0,0.9), 0 0 8px ${C.neonGlow}`, marginTop:2 }}>
            {ghostOvr}
          </div>
        </div>
      )}
    </div>
  );
}
