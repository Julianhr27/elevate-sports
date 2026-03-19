import { useState } from "react";

const PHOTO = (seed, bg="059669") => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${bg}`;
const RPE_COLOR = (v) => v <= 3 ? "#1D9E75" : v <= 8 ? "#EF9F27" : "#E24B4A";
const RPE_LABEL = { 1:"Muy leve",2:"Leve",3:"Moderado",4:"Algo duro",5:"Duro",6:"Duro+",7:"Muy duro",8:"Muy duro+",9:"Máximo",10:"Límite" };

export default function Entrenamiento({ athletes, setAthletes, historial, onGuardar, stats }) {
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
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, padding:"0 8px" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"1px" }}>
            {new Date().toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short"})} · 4:00 PM
          </div>
          <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{ ...inp, width:"auto", fontSize:10, padding:"3px 8px" }}>
            {["Táctica","Físico","Recuperación","Partido interno"].map(t=><option key={t}>{t}</option>)}
          </select>
          <div onClick={() => onGuardar(nota, tipo)} style={{ background:"#1D9E75", color:"white", fontSize:9, textTransform:"uppercase", letterSpacing:"1px", padding:"5px 14px", cursor:"pointer", whiteSpace:"nowrap" }}>
            Guardar sesión →
          </div>
        </div>
      </div>

      {/* SESIÓN DE HOY */}
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
                    <div style={{ height:4, background:borderColor }} />
                    <div style={{ position:"relative" }}>
                      <img src={PHOTO(a.photo, photoBg)} alt="" style={{ width:"100%", height:80, objectFit:"cover", objectPosition:"top", display:"block" }}/>
                      {(ausente || lesionado) && (
                        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <div style={{ fontSize:10, fontWeight:500, textTransform:"uppercase", letterSpacing:"1.5px", padding:"3px 8px", border:`1px solid ${borderColor}`, color:borderColor, background: ausente ? "rgba(226,75,74,0.1)" : "rgba(239,159,39,0.1)" }}>
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
                      {[["P","p-on","#1D9E75","white"],["A","a-on","#E24B4A","white"],["L","l-on","#EF9F27","#1a0f00"]].map(([s, cls, bg, tc]) => (
                        <div key={s} onClick={() => setStatus(i, s)} style={{ flex:1, fontSize:8, padding:"3px 0", textAlign:"center", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.5px", background: a.status===s ? bg : "rgba(255,255,255,0.05)", color: a.status===s ? tc : "rgba(255,255,255,0.3)", border:"none" }}>
                          {s}
                        </div>
                      ))}
                    </div>
                    {presente && (
                      <div style={{ padding:"4px 6px 8px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:7, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>
                          <span>RPE</span>
                          <span style={{ color: a.rpe ? RPE_COLOR(a.rpe) : "rgba(255,255,255,0.25)" }}>{a.rpe ? `${a.rpe}` : "—"}</span>
                        </div>
                        <div style={{ display:"flex", gap:2 }}>
                          {[1,2,3,4,5,6,7,8,9,10].map(n => (
                            <div key={n} onClick={() => setRpe(i,n)} style={{ flex:1, height:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, cursor:"pointer", background: a.rpe===n ? RPE_COLOR(n) : "rgba(255,255,255,0.06)", color: a.rpe===n ? (n>=9?"white":"white") : "rgba(255,255,255,0.3)", border:`1px solid ${a.rpe===n ? RPE_COLOR(n) : "rgba(255,255,255,0.08)"}` }}>
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

      {/* PLANIFICACIÓN */}
      {tab === "planificacion" && (
        <div style={{ padding:16, display:"grid", gridTemplateColumns:"1fr 280px", gap:12 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Info */}
            <div style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:14 }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.3)", marginBottom:12 }}>Información de la sesión</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {[["Equipo","Águilas de Lucero"],["Categoría","Sub-17"],["Sesión #","15"],["Fecha",""],["Campo","Campo principal"],["Hora",""],["Microciclo","Semana 15"],["Rival próximo","Atlético Sur"]].map(([l,v],i) => (
                  <div key={i}><div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.25)", marginBottom:4 }}>{l}</div><input defaultValue={v} type={l==="Fecha"||l==="Hora"?l.toLowerCase():"text"} style={inp}/></div>
                ))}
              </div>
            </div>
            {/* Objetivos */}
            <div style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:14 }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.3)", marginBottom:12 }}>Objetivos</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[["Técnico-tácticos","Pressing alto, transiciones..."],["Físicos","Resistencia, velocidad..."],["Período",""]].map(([l,p],i)=>(
                  <div key={i}><div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.25)", marginBottom:4 }}>{l}</div>
                    {l==="Período" ? <select style={inp}><option>Competición</option><option>Pre-temporada</option><option>Transición</option></select> : <input placeholder={p} style={inp}/>}
                  </div>
                ))}
              </div>
            </div>
            {/* Warm Up */}
            <div style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(29,158,117,0.08)", border:"1px solid rgba(29,158,117,0.2)", borderLeft:"3px solid #1D9E75", padding:"8px 12px" }}>
                <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1.5px", color:"#1D9E75", flexShrink:0 }}>Warm Up</div>
                <input placeholder="Descripción del calentamiento..." style={{ ...inp, background:"transparent", border:"none", flex:1 }}/>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", whiteSpace:"nowrap" }}>⏱ <input placeholder="15" style={{ ...inp, width:28, textAlign:"center", background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.15)" }}/> min</div>
              </div>
            </div>
            {/* Tareas */}
            <div style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:14 }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.3)", marginBottom:12 }}>Tareas de la sesión</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[["Tarea 1","#1D9E75","rgba(29,158,117,0.1)"],["Tarea 2","#EF9F27","rgba(239,159,39,0.08)"],["Tarea 3","#7F77DD","rgba(127,119,221,0.08)"],["Tarea 4","#E24B4A","rgba(226,75,74,0.08)"]].map(([t,c,bg])=>(
                  <div key={t} style={{ border:`1px solid rgba(255,255,255,0.07)`, overflow:"hidden" }}>
                    <div style={{ padding:"7px 12px", background:bg, borderBottom:`1px solid rgba(255,255,255,0.06)`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1.5px", color:c, fontWeight:500 }}>{t}</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>⏱ <input placeholder="20" style={{ ...inp, width:24, textAlign:"center", background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.15)", padding:"0 2px" }}/> min</div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 90px" }}>
                      <div style={{ padding:"8px 12px" }}>
                        <div style={{ marginBottom:6 }}><div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.25)", marginBottom:3 }}>Objetivo</div><input placeholder="Objetivo..." style={{ ...inp, fontSize:10 }}/></div>
                        <div style={{ marginBottom:6 }}><div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.25)", marginBottom:3 }}>Descripción</div><textarea placeholder="Descripción del ejercicio..." rows={3} style={{ ...inp, fontSize:10, resize:"none" }}/></div>
                        <div style={{ fontSize:8, color:"rgba(255,255,255,0.25)" }}>S: <input style={{ ...inp, width:22, display:"inline", padding:"1px 3px", fontSize:9, background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.1)" }}/> T: <input style={{ ...inp, width:22, display:"inline", padding:"1px 3px", fontSize:9, background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.1)" }}/> R: <input style={{ ...inp, width:22, display:"inline", padding:"1px 3px", fontSize:9, background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.1)" }}/></div>
                      </div>
                      <div style={{ padding:8, background:"rgba(255,255,255,0.02)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg viewBox="0 0 80 96" width="80" height="96" xmlns="http://www.w3.org/2000/svg">
                          <rect width="80" height="96" fill="#0a2010"/>
                          <rect x="4" y="4" width="72" height="88" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                          <line x1="4" y1="48" x2="76" y2="48" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
                          <circle cx="40" cy="48" r="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
                          <rect x="24" y="4" width="32" height="16" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"/>
                          <rect x="24" y="76" width="32" height="16" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"/>
                          <text x="40" y="52" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.2)">dibujar</text>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:12 }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.3)", marginBottom:10 }}>Jugadores por posición</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4 }}>
                {[["POR",athletes.filter(a=>a.posCode==="GK")],["DEF",athletes.filter(a=>["CB","LB","RB"].includes(a.posCode))],["LAT",athletes.filter(a=>["LB","RB"].includes(a.posCode))],["MED",athletes.filter(a=>a.posCode==="CM")],["DEL",athletes.filter(a=>["ST","LW","RW"].includes(a.posCode))]].map(([pos,list])=>(
                  <div key={pos}>
                    <div style={{ fontSize:7, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.25)", textAlign:"center", padding:"3px", borderBottom:"1px solid rgba(255,255,255,0.06)", marginBottom:4 }}>{pos}</div>
                    {list.map(a=><div key={a.id} style={{ fontSize:8, color:"rgba(255,255,255,0.5)", padding:"2px 5px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)", marginBottom:2, textAlign:"center", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name.split(" ")[0]}</div>)}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:12 }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.3)", marginBottom:10 }}>Material</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {["Balones x12","Conos x20","Chalecos","Porterías pequeñas"].map(m=>(
                  <div key={m} style={{ fontSize:9, padding:"3px 10px", background:"rgba(29,158,117,0.1)", border:"1px solid rgba(29,158,117,0.2)", color:"#1D9E75" }}>{m}</div>
                ))}
                <div style={{ fontSize:9, padding:"3px 10px", background:"transparent", border:"1px dashed rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.3)", cursor:"pointer" }}>+ Agregar</div>
              </div>
            </div>
            <div style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:12 }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.3)", marginBottom:10 }}>Notas</div>
              <textarea placeholder="Observaciones del entrenador..." rows={3} style={{ ...inp, resize:"none", marginBottom:8 }}/>
              <textarea placeholder="Charla previa al equipo..." rows={3} style={{ ...inp, resize:"none" }}/>
            </div>
            <div onClick={()=>alert("Planificación guardada")} style={{ background:"#1D9E75", color:"white", padding:10, fontSize:10, textTransform:"uppercase", letterSpacing:"1.5px", cursor:"pointer", textAlign:"center" }}>Guardar planificación →</div>
            <div style={{ background:"#EF9F27", color:"#1a0f00", padding:10, fontSize:10, textTransform:"uppercase", letterSpacing:"1.5px", cursor:"pointer", textAlign:"center", marginTop:6 }}>Exportar PDF</div>
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      {tab === "historial" && (
        <div style={{ padding:16 }}>
          {historial.map((s,i)=>(
            <div key={i}>
              <div onClick={()=>setExpandedHist(expandedHist===i?null:i)} style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, cursor:"pointer" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:"white" }}>Sesión #{s.num} — {s.fecha}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{s.presentes} presentes de {s.total} · RPE: {s.rpeAvg ?? "—"} · {s.tipo}</div>
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{i===0?"más reciente":expandedHist===i?"▲":"▼"}</div>
              </div>
              {expandedHist===i && (
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", padding:14, marginBottom:4 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Nota:</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{s.nota || "Sin nota registrada."}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ANÁLISIS */}
      {tab === "analisis" && (
        <div style={{ padding:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10, marginBottom:16 }}>
            {[
              { label:"Asistencia promedio", value:"83%", color:"#1D9E75" },
              { label:"RPE promedio", value:"7.4", color:"white" },
              { label:"Pico RPE", value:"9.2", color:"#EF9F27" },
              { label:"Sesiones totales", value:historial.length, color:"white" },
            ].map((m,i)=>(
              <div key={i} style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:14 }}>
                <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.3)", marginBottom:8 }}>{m.label}</div>
                <div style={{ fontSize:24, fontWeight:500, color:m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:14 }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.3)", marginBottom:12 }}>Asistencia por jugador</div>
            {athletes.slice(0,8).map(a=>{
              const pct = a.status==="P"?Math.floor(Math.random()*30+70):Math.floor(Math.random()*30+40);
              return (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", width:100, flexShrink:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name.split(" ")[0]} {a.name.split(" ")[1]?.[0]}.</div>
                  <div style={{ flex:1, height:8, background:"rgba(255,255,255,0.07)", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background: pct>=80?"#1D9E75":pct>=65?"#EF9F27":"#E24B4A", borderRadius:4 }}/>
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", width:32, textAlign:"right" }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
