import { useState, useRef } from "react";
import DOMPurify from "dompurify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SESSION_ID = () => `SES-${Date.now().toString(36).toUpperCase()}`;

const RECOMENDACIONES = {
  tecnico: ["Pressing alto y salida de balón","Juego de posición y circulación","Transiciones defensa-ataque","Juego directo y balón en profundidad","Construcción desde portería"],
  fisico: ["Resistencia aeróbica","Velocidad y aceleración","Fuerza explosiva","Movilidad y flexibilidad","Recuperación activa"],
};

const MATERIALES_COMUNES = ["Balones","Conos","Chalecos","Porterías pequeñas","Escaleras de agilidad","Picas","Vallas","Elásticos","Petos de colores","Cronómetro"];

const TIEMPOS_TEORIA = (total) => ({
  warmup: Math.round(total * 0.15),
  tarea1: Math.round(total * 0.2),
  tarea2: Math.round(total * 0.25),
  tarea3: Math.round(total * 0.25),
  tarea4: Math.round(total * 0.15),
});

export default function Planificacion({ athletes, clubInfo, sessionCount }) {
  const [sessionId] = useState(SESSION_ID());
  const [duracionTotal, setDuracionTotal] = useState(90);
  const [tiempos, setTiempos] = useState(TIEMPOS_TEORIA(90));
  const [categoria, setCategoria] = useState((clubInfo?.categorias||[])[0] || "Sub-17");
  const [campo, setCampo] = useState((clubInfo?.campos||["Campo principal"])[0] || "Campo principal");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [hora, setHora] = useState("16:00");
  const [showTecRec, setShowTecRec] = useState(false);
  const [showFisRec, setShowFisRec] = useState(false);
  const [objTec, setObjTec] = useState("");
  const [objFis, setObjFis] = useState("");
  const [periodo, setPeriodo] = useState("Competición");
  const [warmupDesc, setWarmupDesc] = useState("");
  const [tareas, setTareas] = useState([
    { objetivo:"", descripcion:"", series:"", tiempo:"", repeticiones:"", imagenPreview:null, svgRec:null, analizando:false },
    { objetivo:"", descripcion:"", series:"", tiempo:"", repeticiones:"", imagenPreview:null, svgRec:null, analizando:false },
    { objetivo:"", descripcion:"", series:"", tiempo:"", repeticiones:"", imagenPreview:null, svgRec:null, analizando:false },
    { objetivo:"", descripcion:"", series:"", tiempo:"", repeticiones:"", imagenPreview:null, svgRec:null, analizando:false },
  ]);
  const [materiales, setMateriales] = useState([
    { nombre:"Balones", cantidad:12 },
    { nombre:"Conos", cantidad:20 },
    { nombre:"Chalecos", cantidad:18 },
  ]);
  const [newMat, setNewMat] = useState("");
  const [newMatQty, setNewMatQty] = useState(1);
  const [showMatRec, setShowMatRec] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState(athletes.map(a=>a.id));
  const [notas, setNotas] = useState("");
  const [charla, setCharla] = useState("");
  const fileRefs = useRef([null,null,null,null]);

  const updateDuracion = (val) => {
    setDuracionTotal(val);
    setTiempos(TIEMPOS_TEORIA(val));
  };

  const updateTarea = (i, key, val) => {
    const t = [...tareas];
    t[i] = { ...t[i], [key]: val };
    setTareas(t);
  };

  const handleImageUpload = (i, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const t = [...tareas];
      t[i] = { ...t[i], imagenPreview: e.target.result, analizando: false, svgRec: null };
      setTareas([...t]);

      // TODO: El análisis IA de diagramas tácticos debe rutear por un backend propio
      // (e.g. POST /api/analyze-diagram) para no exponer la API key de Anthropic en el frontend.
      // La llamada directa a https://api.anthropic.com/v1/messages fue deshabilitada por seguridad.
      alert("El análisis IA de diagramas requiere configuración del servidor. La imagen se guardó como preview.");
    };
    reader.readAsDataURL(file);
  };

  const addMaterial = () => {
    if (!newMat.trim()) return;
    setMateriales([...materiales, { nombre: newMat.trim(), cantidad: newMatQty }]);
    setNewMat(""); setNewMatQty(1); setShowMatRec(false);
  };

  const removeMaterial = (i) => { const m = [...materiales]; m.splice(i,1); setMateriales(m); };
  const updateMaterialQty = (i, qty) => { const m=[...materiales]; m[i]={...m[i],cantidad:qty}; setMateriales(m); };

  const togglePlayer = (id) => {
    setSelectedPlayers(prev => prev.includes(id) ? prev.filter(p=>p!==id) : [...prev, id]);
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    const verde = [29, 158, 117];

    doc.setFillColor(...verde);
    doc.rect(0, 0, 210, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Elevate Sports — Planificación de Sesión", 14, 13);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`ID: ${sessionId}  |  Sesión #${sessionCount + 1}  |  Fecha: ${fecha}  |  Hora: ${hora}`, 14, 28);
    doc.text(`Campo: ${campo}  |  Categoría: ${categoria}  |  Duración: ${duracionTotal} min`, 14, 35);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Objetivos", 14, 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Técnico-tácticos: ${objTec || "—"}`, 14, 53);
    doc.text(`Físicos: ${objFis || "—"}  |  Período: ${periodo}`, 14, 60);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Calentamiento", 14, 72);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${warmupDesc || "Sin descripción"}  (${tiempos.warmup} min)`, 14, 79);

    autoTable(doc, {
      startY: 88,
      head: [["Tarea","Objetivo","Descripción","Series","Tiempo","Rep.","Min"]],
      body: tareas.map((t, i) => [
        `Tarea ${i + 1}`,
        t.objetivo || "—",
        t.descripcion || "—",
        t.series || "—",
        t.tiempo || "—",
        t.repeticiones || "—",
        [tiempos.tarea1, tiempos.tarea2, tiempos.tarea3, tiempos.tarea4][i],
      ]),
      headStyles: { fillColor: verde, textColor: 255, fontSize: 9, fontStyle:"bold" },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 250, 245] },
      margin: { left: 14, right: 14 },
    });

    const y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Material necesario", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Material","Cantidad"]],
      body: materiales.map(m => [m.nombre, m.cantidad]),
      headStyles: { fillColor: verde, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      tableWidth: 80,
    });

    const y2 = doc.lastAutoTable.finalY + 10;
    const jugSeleccionados = athletes.filter(a => selectedPlayers.includes(a.id));
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Jugadores convocados", 14, y2);
    autoTable(doc, {
      startY: y2 + 4,
      head: [["Nombre","Posición","Estado"]],
      body: jugSeleccionados.map(a => [a.name, a.pos, a.status==="P"?"Disponible":a.status==="L"?"Lesionado":"Ausente"]),
      headStyles: { fillColor: verde, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    const y3 = doc.lastAutoTable.finalY + 10;
    if (notas) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Notas del entrenador:", 14, y3);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(notas, 180);
      doc.text(lines, 14, y3 + 6);
    }

    doc.setFontSize(8);
    doc.setTextColor(150,150,150);
    doc.text(`Elevate Sports — ${sessionId}`, 14, 290);
    doc.text(`Página 1`, 196, 290, { align:"right" });

    doc.save(`planificacion-${sessionId}.pdf`);
  };

  const inp = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", padding:"7px 10px", fontSize:11, color:"white", fontFamily:"inherit", outline:"none", width:"100%" };
  const lbl = { fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.3)", marginBottom:4, display:"block" };
  const panel = { background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.07)", padding:14, marginBottom:10 };
  const panelTitle = { fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.35)", marginBottom:12 };
  const TASK_COLORS = ["#1D9E75","#EF9F27","#7F77DD","#E24B4A"];

  return (
    <div style={{ padding:16, display:"grid", gridTemplateColumns:"1fr 290px", gap:12 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

        {/* INFO SESIÓN */}
        <div style={panel}>
          <div style={panelTitle}>Información de la sesión</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:10 }}>
            <div>
              <label style={lbl}>ID de sesión</label>
              <div style={{ ...inp, background:"rgba(29,158,117,0.08)", border:"1px solid rgba(29,158,117,0.2)", color:"#1D9E75", fontSize:10, letterSpacing:"0.5px", cursor:"default" }}>{sessionId}</div>
            </div>
            <div>
              <label style={lbl}>Sesión #</label>
              <div style={{ ...inp, background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.5)", cursor:"default", fontSize:12, fontWeight:500 }}>#{sessionCount + 1}</div>
            </div>
            <div>
              <label style={lbl}>Categoría</label>
              <select value={categoria} onChange={e=>setCategoria(e.target.value)} style={inp}>
                {(clubInfo?.categorias||["Sub-17"]).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Duración total (min)</label>
              <input type="number" value={duracionTotal} onChange={e=>updateDuracion(+e.target.value)} min={30} max={180} step={5} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Fecha</label>
              <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Hora</label>
              <input type="time" value={hora} onChange={e=>setHora(e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Campo</label>
              <select value={campo} onChange={e=>setCampo(e.target.value)} style={inp}>
                {(clubInfo?.campos||["Campo principal","Campo auxiliar"]).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Rival próximo</label>
              <input placeholder="Atlético Sur..." style={inp}/>
            </div>
          </div>

          {duracionTotal > 0 && (
            <div style={{ background:"rgba(29,158,117,0.06)", border:"1px solid rgba(29,158,117,0.15)", padding:"10px 12px" }}>
              <div style={{ fontSize:9, color:"#1D9E75", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Distribución sugerida para {duracionTotal} min</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[["Calentamiento",tiempos.warmup],["Tarea 1",tiempos.tarea1],["Tarea 2",tiempos.tarea2],["Tarea 3",tiempos.tarea3],["Tarea 4",tiempos.tarea4]].map(([n,t])=>(
                  <div key={n} style={{ fontSize:10, padding:"3px 10px", background:"rgba(29,158,117,0.1)", border:"1px solid rgba(29,158,117,0.2)", color:"#1D9E75" }}>
                    {n}: <strong>{t} min</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* OBJETIVOS */}
        <div style={panel}>
          <div style={panelTitle}>Objetivos de la sesión</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            <div>
              <label style={lbl}>Técnico-tácticos</label>
              <div style={{ position:"relative" }}>
                <input value={objTec} onChange={e=>setObjTec(e.target.value)} onFocus={()=>setShowTecRec(true)} onBlur={()=>setTimeout(()=>setShowTecRec(false),150)} placeholder="Pressing alto..." style={inp}/>
                {showTecRec && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#111", border:"1px solid rgba(255,255,255,0.12)", zIndex:20 }}>
                    {RECOMENDACIONES.tecnico.map(r=>(
                      <div key={r} onMouseDown={()=>{setObjTec(r);setShowTecRec(false);}} style={{ padding:"7px 10px", fontSize:11, color:"rgba(255,255,255,0.6)", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>{r}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={lbl}>Físicos</label>
              <div style={{ position:"relative" }}>
                <input value={objFis} onChange={e=>setObjFis(e.target.value)} onFocus={()=>setShowFisRec(true)} onBlur={()=>setTimeout(()=>setShowFisRec(false),150)} placeholder="Resistencia..." style={inp}/>
                {showFisRec && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#111", border:"1px solid rgba(255,255,255,0.12)", zIndex:20 }}>
                    {RECOMENDACIONES.fisico.map(r=>(
                      <div key={r} onMouseDown={()=>{setObjFis(r);setShowFisRec(false);}} style={{ padding:"7px 10px", fontSize:11, color:"rgba(255,255,255,0.6)", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>{r}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={lbl}>Período</label>
              <select value={periodo} onChange={e=>setPeriodo(e.target.value)} style={inp}>
                {["Pre-temporada","Competición","Transición"].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* WARM UP */}
        <div style={panel}>
          <div style={panelTitle}>Calentamiento</div>
          <div style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(29,158,117,0.06)", border:"1px solid rgba(29,158,117,0.2)", borderLeft:"3px solid #1D9E75", padding:"8px 12px" }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1.5px", color:"#1D9E75", flexShrink:0 }}>Warm Up</div>
            <input value={warmupDesc} onChange={e=>setWarmupDesc(e.target.value)} placeholder="Descripción del calentamiento..." style={{ ...inp, background:"transparent", border:"none", flex:1 }}/>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:4 }}>
              ⏱
              <input value={tiempos.warmup} onChange={e=>setTiempos({...tiempos,warmup:+e.target.value})} type="number" style={{ ...inp, width:44, textAlign:"center", background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.15)", padding:"2px 4px" }}/>
              min
            </div>
          </div>
        </div>

        {/* TAREAS */}
        <div style={panel}>
          <div style={panelTitle}>Tareas de la sesión</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {tareas.map((t, i) => (
              <div key={i} style={{ border:"1px solid rgba(255,255,255,0.07)", overflow:"hidden" }}>
                <div style={{ padding:"8px 12px", background:`${TASK_COLORS[i]}18`, borderBottom:`1px solid ${TASK_COLORS[i]}22`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1.5px", color:TASK_COLORS[i], fontWeight:500 }}>Tarea {i+1}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:9, color:"rgba(255,255,255,0.3)" }}>
                    ⏱
                    <input value={[tiempos.tarea1,tiempos.tarea2,tiempos.tarea3,tiempos.tarea4][i]} onChange={e=>{const k=["tarea1","tarea2","tarea3","tarea4"][i];setTiempos({...tiempos,[k]:+e.target.value});}} type="number" style={{ ...inp, width:36, textAlign:"center", background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.15)", padding:"1px 3px", fontSize:11 }}/>
                    min
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 110px" }}>
                  <div style={{ padding:"10px 12px" }}>
                    <div style={{ marginBottom:8 }}>
                      <label style={lbl}>Objetivo</label>
                      <input value={t.objetivo} onChange={e=>updateTarea(i,"objetivo",e.target.value)} placeholder="Objetivo de la tarea..." style={{ ...inp, fontSize:10 }}/>
                    </div>
                    <div style={{ marginBottom:8 }}>
                      <label style={lbl}>Descripción</label>
                      <textarea value={t.descripcion} onChange={e=>updateTarea(i,"descripcion",e.target.value)} rows={3} placeholder="Descripción del ejercicio..." style={{ ...inp, fontSize:10, resize:"none" }}/>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      {[["Series","series"],["Tiempo","tiempo"],["Repeticiones","repeticiones"]].map(([l,k])=>(
                        <div key={k} style={{ flex:1 }}>
                          <label style={lbl}>{l}</label>
                          <input value={t[k]} onChange={e=>updateTarea(i,k,e.target.value)} style={{ ...inp, fontSize:10, padding:"4px 6px" }}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PIZARRA */}
                  <div style={{ padding:8, background:"rgba(255,255,255,0.02)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderLeft:"1px solid rgba(255,255,255,0.05)", gap:6 }}>
                    {t.analizando ? (
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:9, color:"#1D9E75", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Analizando...</div>
                        <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>Claude está recreando el diagrama</div>
                      </div>
                    ) : t.svgRec ? (
                      <div>
                        <div style={{ fontSize:7, color:"#1D9E75", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4, textAlign:"center" }}>Recreado por IA</div>
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t.svgRec.replace(/width="[^"]*"/, 'width="94"').replace(/height="[^"]*"/, 'height="100"'), { USE_PROFILES: { svg: true } }) }}/>
                        <div onClick={()=>fileRefs.current[i]?.click()} style={{ fontSize:7, color:"rgba(255,255,255,0.3)", textAlign:"center", cursor:"pointer", marginTop:4 }}>cambiar imagen</div>
                      </div>
                    ) : t.imagenPreview ? (
                      <div>
                        <img src={t.imagenPreview} alt="" style={{ width:94, height:80, objectFit:"contain" }}/>
                        <div onClick={()=>fileRefs.current[i]?.click()} style={{ fontSize:7, color:"rgba(255,255,255,0.3)", textAlign:"center", cursor:"pointer", marginTop:4 }}>cambiar</div>
                      </div>
                    ) : (
                      <div onClick={()=>fileRefs.current[i]?.click()} style={{ textAlign:"center", cursor:"pointer" }}>
                        <svg width="94" height="80" viewBox="0 0 94 80" xmlns="http://www.w3.org/2000/svg">
                          <rect width="94" height="80" fill="#0a2010"/>
                          <rect x="4" y="4" width="86" height="72" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                          <line x1="4" y1="40" x2="90" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
                          <circle cx="47" cy="40" r="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
                        </svg>
                        <div style={{ fontSize:8, color:"rgba(29,158,117,0.7)", marginTop:4, textTransform:"uppercase", letterSpacing:"0.5px" }}>+ Subir imagen</div>
                        <div style={{ fontSize:7, color:"rgba(255,255,255,0.2)", marginTop:2 }}>Claude la recreará</div>
                      </div>
                    )}
                    <input ref={el=>fileRefs.current[i]=el} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleImageUpload(i, e.target.files[0])}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SIDEBAR DERECHO */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

        {/* JUGADORES */}
        <div style={panel}>
          <div style={panelTitle}>Jugadores — {categoria}</div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:10 }}>Selecciona quiénes participan</div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:9, color:"#1D9E75" }}>{selectedPlayers.length} seleccionados</span>
            <div style={{ display:"flex", gap:10 }}>
              <span onClick={()=>setSelectedPlayers(athletes.map(a=>a.id))} style={{ fontSize:9, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>Todos</span>
              <span onClick={()=>setSelectedPlayers([])} style={{ fontSize:9, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>Ninguno</span>
            </div>
          </div>
          {["Portero","Defensa","Mediocampista","Delantero"].map(pos => {
            const grupo = athletes.filter(a=>a.pos===pos);
            if (!grupo.length) return null;
            return (
              <div key={pos} style={{ marginBottom:10 }}>
                <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.25)", marginBottom:5, borderBottom:"1px solid rgba(255,255,255,0.06)", paddingBottom:4 }}>{pos}s</div>
                {grupo.map(a => {
                  const sel = selectedPlayers.includes(a.id);
                  return (
                    <div key={a.id} onClick={()=>togglePlayer(a.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px", cursor:"pointer", background: sel?"rgba(29,158,117,0.08)":"transparent", border:`1px solid ${sel?"rgba(29,158,117,0.2)":"transparent"}`, marginBottom:3 }}>
                      <div style={{ width:8, height:8, border:`1px solid ${sel?"#1D9E75":"rgba(255,255,255,0.2)"}`, background: sel?"#1D9E75":"transparent", flexShrink:0 }}/>
                      <div style={{ fontSize:11, color: sel?"white":"rgba(255,255,255,0.45)" }}>{a.name}</div>
                      {a.status==="L" && <div style={{ fontSize:8, color:"#EF9F27", marginLeft:"auto" }}>LES</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* MATERIALES */}
        <div style={panel}>
          <div style={panelTitle}>Material necesario</div>
          {materiales.map((m,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <div style={{ flex:1, fontSize:11, color:"rgba(255,255,255,0.7)", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", padding:"5px 10px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.nombre}</div>
              <input type="number" value={m.cantidad} onChange={e=>updateMaterialQty(i,+e.target.value)} min={1} style={{ ...inp, width:52, textAlign:"center", padding:"5px 4px" }}/>
              <span onClick={()=>removeMaterial(i)} style={{ fontSize:11, color:"#E24B4A", cursor:"pointer", padding:"0 4px" }}>✕</span>
            </div>
          ))}
          <div style={{ marginTop:10, borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:10 }}>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.25)", marginBottom:6 }}>Agregar material</div>
            <div style={{ position:"relative", marginBottom:6 }}>
              <input value={newMat} onChange={e=>{setNewMat(e.target.value);setShowMatRec(true);}} onBlur={()=>setTimeout(()=>setShowMatRec(false),150)} placeholder="Nombre del material..." style={inp}/>
              {showMatRec && newMat && (
                <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#111", border:"1px solid rgba(255,255,255,0.12)", zIndex:20, maxHeight:160, overflowY:"auto" }}>
                  {MATERIALES_COMUNES.filter(m=>m.toLowerCase().includes(newMat.toLowerCase())).map(m=>(
                    <div key={m} onMouseDown={()=>{setNewMat(m);setShowMatRec(false);}} style={{ padding:"6px 10px", fontSize:11, color:"rgba(255,255,255,0.6)", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>{m}</div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <input type="number" value={newMatQty} onChange={e=>setNewMatQty(+e.target.value)} min={1} placeholder="Cant." style={{ ...inp, width:70 }}/>
              <div onClick={addMaterial} style={{ flex:1, background:"#1D9E75", color:"white", padding:"7px 12px", fontSize:10, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", textAlign:"center" }}>+ Agregar</div>
            </div>
          </div>
        </div>

        {/* NOTAS */}
        <div style={panel}>
          <div style={panelTitle}>Notas adicionales</div>
          <label style={lbl}>Observaciones del entrenador</label>
          <textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={3} placeholder="Aspectos a reforzar..." style={{ ...inp, resize:"none", marginBottom:10 }}/>
          <label style={lbl}>Charla previa al equipo</label>
          <textarea value={charla} onChange={e=>setCharla(e.target.value)} rows={3} placeholder="Puntos clave para motivar al grupo..." style={{ ...inp, resize:"none" }}/>
        </div>

        <div onClick={()=>alert(`Planificación ${sessionId} guardada`)} style={{ background:"#1D9E75", color:"white", padding:10, fontSize:10, textTransform:"uppercase", letterSpacing:"1.5px", cursor:"pointer", textAlign:"center" }}>
          Guardar planificación →
        </div>
        <div onClick={generarPDF} style={{ background:"#EF9F27", color:"#1a0f00", padding:10, fontSize:10, textTransform:"uppercase", letterSpacing:"1.5px", cursor:"pointer", textAlign:"center", marginTop:6 }}>
          Exportar PDF
        </div>
        <div style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.4)", padding:10, fontSize:10, textTransform:"uppercase", letterSpacing:"1.5px", cursor:"pointer", textAlign:"center", marginTop:6 }}>
          Usar como plantilla
        </div>

      </div>
    </div>
  );
}
