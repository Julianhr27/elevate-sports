import { useState, useEffect, useMemo } from "react";
import Planificacion from "./Planificacion";
import { getAvatarUrl as PHOTO } from "../utils/helpers";
import { PALETTE } from "../constants/palette";
import { sanitizeNote } from "../utils/sanitize";
const RPE_COLOR = (v) => v <= 3 ? PALETTE.green : v <= 8 ? PALETTE.amber : PALETTE.danger;

/* ── Helper: agrupa sesiones del historial por semana ISO ── */
function groupByWeek(sessions) {
  const weeks = [];
  const weekMap = {};
  sessions.forEach(s => {
    const d = new Date(s.fecha);
    if (isNaN(d.getTime())) {
      const key = "unknown";
      if (!weekMap[key]) { weekMap[key] = { key, label: "FECHA DESCONOCIDA", sessions: [] }; weeks.push(weekMap[key]); }
      weekMap[key].sessions.push(s);
      return;
    }
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (dt) => dt.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
    const key = `${mon.getFullYear()}-W${weekNum}`;
    if (!weekMap[key]) {
      weekMap[key] = { key, weekNum, label: `Semana ${weekNum} — ${fmt(mon)}-${fmt(sun)}`, sessions: [] };
      weeks.push(weekMap[key]);
    }
    weekMap[key].sessions.push(s);
  });
  return weeks;
}

/* ── Keyframe CSS inyectada una sola vez para el pulso verde ── */
if (typeof document !== "undefined" && !document.getElementById("elevate-pulse-kf")) {
  const style = document.createElement("style");
  style.id = "elevate-pulse-kf";
  style.textContent = "@keyframes elv_pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.45)}}";
  document.head.appendChild(style);
}

/* ── Colores por tipo de tarea (Feature C) ── */
const TIPO_COLORS = {
  "Táctica": PALETTE.purple,
  "Físico": PALETTE.amber,
  "Recuperación": PALETTE.green,
  "Partido": PALETTE.danger,
  "Partido interno": PALETTE.danger,
};

export default function Entrenamiento({ athletes, setAthletes, historial, onGuardar, stats, clubInfo }) {
  const [tab, setTab] = useState("sesion");
  const [tipo, setTipo] = useState("Táctica");
  const [nota, setNota] = useState("");
  const [expandedHist, setExpandedHist] = useState(null);
  const [collapsedWeeks, setCollapsedWeeks] = useState({});

  /* ── Feature B: elapsed timer ── */
  const [elapsed, setElapsed] = useState(0);
  const sessionActive = athletes.some(a => a.status === "P" && a.rpe != null);

  useEffect(() => {
    if (!sessionActive) { setElapsed(0); return; }
    const t0 = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [sessionActive]);

  const fmtElapsed = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  /* ── Feature A: historial agrupado ── */
  const weekGroups = useMemo(() => groupByWeek(historial), [historial]);

  const toggleWeek = (key) => setCollapsedWeeks(prev => ({ ...prev, [key]: !prev[key] }));

  /* ── Feature C: estadísticas por tipo ── */
  const tipoStats = useMemo(() => {
    const counts = {};
    const total = historial.length || 1;
    historial.forEach(s => {
      const t = s.tipo || "Sin tipo";
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [historial]);

  const setStatus = (i, s) => {
    const u = [...athletes];
    u[i] = { ...u[i], status: s, rpe: s !== "P" ? null : u[i].rpe };
    setAthletes(u);
  };

  const setRpe = (i, val) => {
    const u = [...athletes];
    u[i] = { ...u[i], rpe: u[i].rpe === val ? null : val };
    setAthletes(u);
  };

  const inp = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", padding:"6px 8px", fontSize:11, color:"white", fontFamily:"inherit", width:"100%", outline:"none" };

  return (
    <div>
      {/* ── Feature B: SESIÓN ACTIVA — banner prominente ── */}
      {sessionActive && (() => {
        const presentes = athletes.filter(a => a.status === "P");
        const conRpe = presentes.filter(a => a.rpe != null).length;
        const sinRpe = presentes.length - conRpe;
        const rpeAvg = conRpe > 0
          ? (presentes.filter(a => a.rpe != null).reduce((s, a) => s + a.rpe, 0) / conRpe).toFixed(1)
          : "—";
        return (
          <div style={{ background:"linear-gradient(135deg, rgba(29,158,117,0.15) 0%, rgba(29,158,117,0.05) 100%)", borderBottom:`2px solid ${PALETTE.green}`, padding:"12px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ position:"relative", width:14, height:14 }}>
                  <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:PALETTE.green, animation:"elv_pulse 1.4s ease-in-out infinite" }} />
                  <div style={{ position:"absolute", inset:2, borderRadius:"50%", background:PALETTE.green }} />
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"2px", color:PALETTE.green }}>
                    Sesion activa
                  </div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>
                    {tipo} · {new Date().toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short"})}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:18, fontWeight:700, fontFamily:"monospace", color:"white" }}>{fmtElapsed(elapsed)}</div>
                  <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.3)" }}>Tiempo</div>
                </div>
                <div style={{ width:1, height:28, background:"rgba(255,255,255,0.1)" }} />
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:18, fontWeight:700, color:PALETTE.green }}>{conRpe}/{presentes.length}</div>
                  <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.3)" }}>RPE reg.</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:18, fontWeight:700, color: rpeAvg === "—" ? "rgba(255,255,255,0.3)" : PALETTE.amber }}>{rpeAvg}</div>
                  <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.3)" }}>RPE prom</div>
                </div>
                {sinRpe > 0 && (
                  <div style={{ padding:"4px 10px", background:"rgba(239,159,39,0.15)", border:`1px solid ${PALETTE.amber}`, fontSize:9, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", color:PALETTE.amber }}>
                    {sinRpe} sin RPE
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MÉTRICAS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:2 }}>
        {[
          { label:"Presentes", value:stats.presentes, color:PALETTE.green, border:PALETTE.green },
          { label:"Ausentes", value:stats.ausentes, color:PALETTE.danger, border:PALETTE.danger },
          { label:"RPE promedio", value:stats.rpeAvg, color:PALETTE.amber, border:PALETTE.amber },
          { label:"Sesión", value:`#${(historial[0]?.num || 0) + 1}`, color:PALETTE.purple, border:PALETTE.purple },
        ].map((m,i) => (
          <div key={i} style={{ padding:"10px 16px", background:"rgba(255,255,255,0.03)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderBottom:`3px solid ${m.border}`, border:`1px solid ${PALETTE.border}`, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:22, fontWeight:500, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.3)" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* SUBTABS */}
      <div style={{ display:"flex", alignItems:"stretch", height:34, background:"rgba(10,10,15,0.85)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${PALETTE.border}`, padding:"0 16px" }}>
        {[["sesion","Sesión de hoy"],["planificacion","Planificación"],["historial","Historial"],["analisis","Análisis"]].map(([k,l]) => (
          <div key={k} onClick={() => setTab(k)} style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"1.5px", color: tab===k ? PALETTE.green : PALETTE.textMuted, display:"flex", alignItems:"center", padding:"0 14px", cursor:"pointer", borderBottom: tab===k ? `2px solid ${PALETTE.green}` : "2px solid transparent" }}>
            {l}
          </div>
        ))}
        {tab === "sesion" && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, padding:"0 8px" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"1px" }}>
              {new Date().toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short"})}
            </div>
            <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{ ...inp, width:"auto", fontSize:10, padding:"3px 8px" }}>
              {["Táctica","Físico","Recuperación","Partido interno"].map(t=><option key={t}>{t}</option>)}
            </select>
            <div onClick={() => onGuardar(nota, tipo)} style={{ background:PALETTE.green, color:"white", fontSize:9, textTransform:"uppercase", letterSpacing:"1px", padding:"5px 14px", cursor:"pointer", whiteSpace:"nowrap", borderRadius:6 }}>
              Guardar sesión →
            </div>
          </div>
        )}
      </div>

      {/* SESIÓN DE HOY — CARTAS */}
      {tab === "sesion" && (
        <div style={{ padding:16 }}>
          <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.25)", marginBottom:12 }}>
            Toca P / A / L y registra el RPE de cada jugador
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:10, marginBottom:20 }}>
            {athletes.map((a, i) => {
              const presente = a.status === "P";
              const ausente = a.status === "A";
              const lesionado = a.status === "L";
              const borderColor = presente ? PALETTE.green : ausente ? PALETTE.danger : lesionado ? PALETTE.amber : PALETTE.border;
              const bgColor = presente ? "rgba(4,30,18,0.95)" : ausente ? "rgba(30,4,4,0.95)" : lesionado ? "rgba(30,18,4,0.95)" : "rgba(8,18,8,0.95)";
              const opacity = ausente || lesionado ? 0.72 : 1;
              const photoBg = ausente || lesionado ? "555" : "059669";
              return (
                <div key={a.id} style={{ cursor:"pointer", opacity }}>
                  <div style={{ background:bgColor, border:`1px solid ${borderColor}`, overflow:"hidden" }}>
                    <div style={{ height:4, background:borderColor }}/>
                    <div style={{ position:"relative" }}>
                      <img src={PHOTO(a.photo, photoBg)} alt="" style={{ width:"100%", height:80, objectFit:"cover", objectPosition:"top", display:"block" }}/>
                      {(ausente || lesionado) && (
                        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <div style={{ fontSize:10, fontWeight:500, textTransform:"uppercase", letterSpacing:"1.5px", padding:"3px 8px", border:`1px solid ${borderColor}`, color:borderColor, background: ausente?"rgba(226,75,74,0.1)":"rgba(239,159,39,0.1)" }}>
                            {ausente ? "Ausente" : "Lesionado"}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ padding:"6px 8px 4px" }}>
                      <div style={{ fontSize:10, fontWeight:500, color:"white", textTransform:"uppercase", letterSpacing:"0.3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name.split(" ")[0]} {a.name.split(" ")[1]?.[0]}.</div>
                      <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.5px", marginTop:1 }}>{a.posCode}</div>
                    </div>
                    <div style={{ display:"flex", gap:1, padding:"0 6px 6px" }}>
                      {[["P",PALETTE.green,"white"],["A",PALETTE.danger,"white"],["L",PALETTE.amber,"#1a0f00"]].map(([s,bg,tc]) => (
                        <div key={s} onClick={() => setStatus(i, s)} style={{ flex:1, fontSize:8, padding:"3px 0", textAlign:"center", cursor:"pointer", textTransform:"uppercase", background: a.status===s ? bg : "rgba(255,255,255,0.05)", color: a.status===s ? tc : "rgba(255,255,255,0.3)" }}>
                          {s}
                        </div>
                      ))}
                    </div>
                    {presente && (
                      <div style={{ padding:"4px 6px 8px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:7, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>
                          <span>RPE</span>
                          <span style={{ color: a.rpe ? RPE_COLOR(a.rpe) : "rgba(255,255,255,0.25)" }}>{a.rpe || "—"}</span>
                        </div>
                        <div style={{ display:"flex", gap:2 }}>
                          {[1,2,3,4,5,6,7,8,9,10].map(n => (
                            <div key={n} onClick={() => setRpe(i,n)} style={{ flex:1, height:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, cursor:"pointer", background: a.rpe===n ? RPE_COLOR(n) : "rgba(255,255,255,0.06)", color: a.rpe===n ? "white" : "rgba(255,255,255,0.3)", border:`1px solid ${a.rpe===n ? RPE_COLOR(n) : "rgba(255,255,255,0.08)"}` }}>
                              {n}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${PALETTE.border}`, borderLeft:`3px solid ${PALETTE.green}`, borderRadius:8, padding:"10px 14px" }}>
            <textarea value={nota} onChange={e=>setNota(sanitizeNote(e.target.value))} placeholder="Nota general de la sesion..." rows={2} style={{ ...inp, background:"transparent", border:"none", resize:"none", lineHeight:1.6 }} maxLength={500}/>
          </div>
        </div>
      )}

      {tab === "planificacion" && (
        <Planificacion athletes={athletes} clubInfo={clubInfo} sessionCount={historial.length} />
      )}

      {/* ── Feature A: Historial agrupado por semana/microciclo ── */}
      {tab === "historial" && (
        <div style={{ padding:16 }}>
          {weekGroups.length === 0 && (
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1px", textAlign:"center", padding:32 }}>
              Sin sesiones registradas
            </div>
          )}
          {weekGroups.map(week => {
            const isCollapsed = !!collapsedWeeks[week.key];
            const weekRpeAvg = week.sessions.filter(s => s.rpeAvg != null).length > 0
              ? (week.sessions.reduce((sum, s) => sum + (s.rpeAvg || 0), 0) / week.sessions.filter(s => s.rpeAvg != null).length).toFixed(1)
              : "—";
            return (
              <div key={week.key} style={{ marginBottom:8 }}>
                {/* Week header */}
                <div
                  onClick={() => toggleWeek(week.key)}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", background:"rgba(127,119,221,0.08)", borderLeft:`3px solid ${PALETTE.purple}`, cursor:"pointer", marginBottom:2 }}
                >
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:PALETTE.purple, textTransform:"uppercase", letterSpacing:"1.5px" }}>
                      {week.label}
                    </div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"1px", marginTop:2 }}>
                      {week.sessions.length} sesión{week.sessions.length !== 1 ? "es" : ""} · RPE prom: {weekRpeAvg}
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{isCollapsed ? "▶" : "▼"}</div>
                </div>
                {/* Sessions inside week */}
                {!isCollapsed && week.sessions.map((s, i) => {
                  const globalIdx = `${week.key}-${i}`;
                  return (
                    <div key={globalIdx} style={{ marginLeft:12 }}>
                      <div onClick={() => setExpandedHist(expandedHist === globalIdx ? null : globalIdx)} style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, cursor:"pointer" }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:500, color:"white" }}>Sesión #{s.num} — {s.fecha}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{s.presentes} presentes · RPE: {s.rpeAvg ?? "—"} · {s.tipo}</div>
                        </div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{expandedHist === globalIdx ? "▲" : "▼"}</div>
                      </div>
                      {expandedHist === globalIdx && (
                        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", padding:14, marginBottom:4, marginLeft:0 }}>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Nota:</div>
                          <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{s.nota || "Sin nota."}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ANÁLISIS tab — datos reales desde localStorage/historial ── */}
      {tab === "analisis" && (() => {
        /* Metricas calculadas desde datos reales */
        const totalSesiones = historial.length;
        const sesionesConRpe = historial.filter(s => s.rpeAvg != null && s.rpeAvg !== "—");
        const rpeGlobal = sesionesConRpe.length > 0
          ? (sesionesConRpe.reduce((s, h) => s + Number(h.rpeAvg), 0) / sesionesConRpe.length).toFixed(1)
          : "—";
        const picoRpe = sesionesConRpe.length > 0
          ? Math.max(...sesionesConRpe.map(h => Number(h.rpeAvg))).toFixed(1)
          : "—";
        const asistenciaGlobal = totalSesiones > 0
          ? Math.round((historial.reduce((s, h) => s + h.presentes, 0) / historial.reduce((s, h) => s + h.total, 0)) * 100)
          : 0;

        /* Agrupacion tecnico vs fisico con RPE promedio por categoria */
        const categorias = {
          "Tecnico/Tactico": { tipos: ["Táctica", "Tactica"], count: 0, rpeSum: 0, rpeN: 0, color: PALETTE.purple },
          "Fisico":          { tipos: ["Físico", "Fisico"],   count: 0, rpeSum: 0, rpeN: 0, color: PALETTE.amber },
          "Competitivo":     { tipos: ["Partido", "Partido interno"], count: 0, rpeSum: 0, rpeN: 0, color: PALETTE.danger },
          "Recuperacion":    { tipos: ["Recuperación", "Recuperacion"], count: 0, rpeSum: 0, rpeN: 0, color: PALETTE.green },
        };
        historial.forEach(s => {
          for (const [cat, cfg] of Object.entries(categorias)) {
            if (cfg.tipos.includes(s.tipo)) {
              cfg.count++;
              if (s.rpeAvg != null && s.rpeAvg !== "—") { cfg.rpeSum += Number(s.rpeAvg); cfg.rpeN++; }
              break;
            }
          }
        });
        const maxCount = Math.max(...Object.values(categorias).map(c => c.count), 1);

        return (
          <div style={{ padding:16 }}>
            {/* KPIs reales */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:16 }}>
              {[
                { label:"Asistencia promedio", value: asistenciaGlobal + "%", color:PALETTE.green },
                { label:"RPE promedio", value: rpeGlobal, color:"white" },
                { label:"Pico RPE", value: picoRpe, color:PALETTE.amber },
                { label:"Sesiones totales", value: totalSesiones, color:"white" },
              ].map((m,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${PALETTE.border}`, borderRadius:12, padding:14, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
                  <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.3)", marginBottom:8 }}>{m.label}</div>
                  <div style={{ fontSize:24, fontWeight:500, color:m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Grafico de barras verticales: Tecnico vs Fisico vs Competitivo vs Recuperacion */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${PALETTE.border}`, borderRadius:12, padding:16, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
                <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:PALETTE.textMuted, marginBottom:16 }}>
                  Distribucion por categoria
                </div>
                <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-around", height:120, gap:8 }}>
                  {Object.entries(categorias).map(([cat, cfg]) => {
                    const h = maxCount > 0 ? Math.max((cfg.count / maxCount) * 100, cfg.count > 0 ? 8 : 0) : 0;
                    return (
                      <div key={cat} style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:1, height:"100%", justifyContent:"flex-end" }}>
                        <div style={{ fontSize:12, fontWeight:700, color: cfg.color, marginBottom:4 }}>{cfg.count}</div>
                        <div style={{ width:"100%", maxWidth:40, height:`${h}%`, background: cfg.color, minHeight: cfg.count > 0 ? 4 : 0, transition:"height 0.4s ease", borderRadius:"2px 2px 0 0" }} />
                        <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.5px", color:"rgba(255,255,255,0.4)", marginTop:6, textAlign:"center", lineHeight:1.2 }}>{cat}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RPE promedio por categoria */}
              <div style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${PALETTE.border}`, borderRadius:12, padding:16, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
                <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:PALETTE.textMuted, marginBottom:16 }}>
                  RPE promedio por categoria
                </div>
                <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-around", height:120, gap:8 }}>
                  {Object.entries(categorias).map(([cat, cfg]) => {
                    const avg = cfg.rpeN > 0 ? (cfg.rpeSum / cfg.rpeN) : 0;
                    const h = avg > 0 ? Math.max((avg / 10) * 100, 8) : 0;
                    const rpeColor = avg <= 3 ? PALETTE.green : avg <= 7 ? PALETTE.amber : PALETTE.danger;
                    return (
                      <div key={cat} style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:1, height:"100%", justifyContent:"flex-end" }}>
                        <div style={{ fontSize:12, fontWeight:700, color: rpeColor, marginBottom:4 }}>{avg > 0 ? avg.toFixed(1) : "—"}</div>
                        <div style={{ width:"100%", maxWidth:40, height:`${h}%`, background: rpeColor, minHeight: avg > 0 ? 4 : 0, transition:"height 0.4s ease", borderRadius:"2px 2px 0 0", opacity: avg > 0 ? 1 : 0.2 }} />
                        <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.5px", color:"rgba(255,255,255,0.4)", marginTop:6, textAlign:"center", lineHeight:1.2 }}>{cat}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Barras horizontales por tipo detallado */}
            <div style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${PALETTE.border}`, borderRadius:12, padding:16, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:PALETTE.textMuted, marginBottom:14 }}>
                Detalle por tipo de tarea
              </div>
              {tipoStats.length === 0 && (
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", textAlign:"center", padding:16 }}>Sin datos</div>
              )}
              {tipoStats.map(t => {
                const color = TIPO_COLORS[t.name] || "rgba(255,255,255,0.4)";
                return (
                  <div key={t.name} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4 }}>
                      <div style={{ fontSize:11, fontWeight:500, color:"white", textTransform:"uppercase", letterSpacing:"0.8px" }}>{t.name}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>
                        {t.count} sesion{t.count !== 1 ? "es" : ""} · <span style={{ color, fontWeight:600 }}>{t.pct}%</span>
                      </div>
                    </div>
                    <div style={{ width:"100%", height:6, background:"rgba(255,255,255,0.06)" }}>
                      <div style={{ width:`${t.pct}%`, height:"100%", background:color, transition:"width 0.4s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
