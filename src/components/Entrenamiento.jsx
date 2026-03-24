import { useState } from "react";
import Planificacion from "./Planificacion";
import { getAvatarUrl as PHOTO } from "../utils/helpers";
const RPE_COLOR = (v) => v <= 3 ? "#1D9E75" : v <= 8 ? "#EF9F27" : "#E24B4A";

export default function Entrenamiento({ athletes, setAthletes, historial, onGuardar, stats, clubInfo }) {
  const [tab, setTab] = useState("sesion");
  const [tipo, setTipo] = useState("Táctica");
  const [nota, setNota] = useState("");
  const [expandedHist, setExpandedHist] = useState(null);

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
      {/* MÉTRICAS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:2 }}>
        {[
          { label:"Presentes", value:stats.presentes, color:"#1D9E75", border:"#1D9E75" },
          { label:"Ausentes", value:stats.ausentes, color:"#E24B4A", border:"#E24B4A" },
          { label:"RPE promedio", value:stats.rpeAvg, color:"#EF9F27", border:"#EF9F27" },
          { label:"Sesión", value:`#${(historial[0]?.num || 0) + 1}`, color:"#7F77DD", border:"#7F77DD" },
        ].map((m,i) => (
          <div key={i} style={{ padding:"10px 16px", background:"rgba(0,0,0,0.82)", borderBottom:`3px solid ${m.border}`, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:22, fontWeight:500, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.3)" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* SUBTABS */}
      <div style={{ display:"flex", alignItems:"stretch", height:34, background:"rgba(0,0,0,0.75)", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"0 16px" }}>
        {[["sesion","Sesión de hoy"],["planificacion","Planificación"],["historial","Historial"],["analisis","Análisis"]].map(([k,l]) => (
          <div key={k} onClick={() => setTab(k)} style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"1.5px", color: tab===k ? "#1D9E75" : "rgba(255,255,255,0.3)", display:"flex", alignItems:"center", padding:"0 14px", cursor:"pointer", borderBottom: tab===k ? "2px solid #1D9E75" : "2px solid transparent" }}>
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
            <div onClick={() => onGuardar(nota, tipo)} style={{ background:"#1D9E75", color:"white", fontSize:9, textTransform:"uppercase", letterSpacing:"1px", padding:"5px 14px", cursor:"pointer", whiteSpace:"nowrap" }}>
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
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,minmax(0,1fr))", gap:10, marginBottom:20 }}>
            {athletes.map((a, i) => {
              const presente = a.status === "P";
              const ausente = a.status === "A";
              const lesionado = a.status === "L";
              const borderColor = presente ? "#1D9E75" : ausente ? "#E24B4A" : lesionado ? "#EF9F27" : "rgba(255,255,255,0.1)";
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
                      {[["P","#1D9E75","white"],["A","#E24B4A","white"],["L","#EF9F27","#1a0f00"]].map(([s,bg,tc]) => (
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
          <div style={{ background:"rgba(0,0,0,0.5)", borderLeft:"3px solid #1D9E75", padding:"10px 14px" }}>
            <textarea value={nota} onChange={e=>setNota(e.target.value)} placeholder="Nota general de la sesión..." rows={2} style={{ ...inp, background:"transparent", border:"none", resize:"none", lineHeight:1.6 }}/>
          </div>
        </div>
      )}

      {tab === "planificacion" && (
        <Planificacion athletes={athletes} clubInfo={clubInfo} sessionCount={historial.length} />
      )}

      {tab === "historial" && (
        <div style={{ padding:16 }}>
          {historial.map((s,i) => (
            <div key={i}>
              <div onClick={()=>setExpandedHist(expandedHist===i?null:i)} style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, cursor:"pointer" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:"white" }}>Sesión #{s.num} — {s.fecha}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{s.presentes} presentes · RPE: {s.rpeAvg ?? "—"} · {s.tipo}</div>
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{i===0?"más reciente":expandedHist===i?"▲":"▼"}</div>
              </div>
              {expandedHist===i && (
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", padding:14, marginBottom:4 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Nota:</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{s.nota || "Sin nota."}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "analisis" && (
        <div style={{ padding:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10, marginBottom:16 }}>
            {[
              { label:"Asistencia promedio", value:"83%", color:"#1D9E75" },
              { label:"RPE promedio", value:"7.4", color:"white" },
              { label:"Pico RPE", value:"9.2", color:"#EF9F27" },
              { label:"Sesiones totales", value:historial.length, color:"white" },
            ].map((m,i) => (
              <div key={i} style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:14 }}>
                <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.3)", marginBottom:8 }}>{m.label}</div>
                <div style={{ fontSize:24, fontWeight:500, color:m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
