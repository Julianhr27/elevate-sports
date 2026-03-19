const PHOTO = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=059669`;

export default function Home({ club, athletes, historial, stats, onNavigate }) {
  const s = { fontSize:10, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.3)", marginTop:3 };

  return (
    <div>
      {/* QUICK METRICS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:2 }}>
        {[
          { label:"Deportistas", value:athletes.length, color:"#1D9E75", bg:"rgba(29,158,117,0.15)", border:"#1D9E75",
            icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="#1D9E75" strokeWidth="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/></svg> },
          { label:"Partidos", value:3, color:"#EF9F27", bg:"rgba(239,159,39,0.12)", border:"#EF9F27",
            icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#EF9F27" strokeWidth="2"/><path d="M12 2a10 10 0 0 1 0 20M2 12h20M12 2c-2.5 3-4 6.5-4 10s1.5 7 4 10M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10" stroke="#EF9F27" strokeWidth="1.5"/></svg> },
          { label:"Entrenamientos", value:stats.sesiones, color:"#7F77DD", bg:"rgba(127,119,221,0.12)", border:"#7F77DD",
            icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { label:"Asistencia", value:stats.asistencia + "%", color:"#E24B4A", bg:"rgba(226,75,74,0.12)", border:"#E24B4A",
            icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
        ].map((m, i) => (
          <div key={i} style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:14, background:m.bg, borderBottom:`3px solid ${m.border}`, cursor:"pointer" }}>
            <div style={{ width:44, height:44, borderRadius:10, background:`${m.border}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{m.icon}</div>
            <div>
              <div style={{ fontSize:28, fontWeight:500, color:m.color, lineHeight:1 }}>{m.value}</div>
              <div style={s}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* GREETING */}
      <div style={{ padding:"12px 16px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:2 }}>Bienvenido de vuelta</div>
          <div style={{ fontSize:18, fontWeight:500, color:"white", letterSpacing:"-0.3px" }}>{club.entrenador}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"1px" }}>
            {new Date().toLocaleDateString("es-CO", { weekday:"long", day:"numeric", month:"short" })} &nbsp;·&nbsp; Temporada {club.temporada}
          </div>
          <div style={{ background:"rgba(239,159,39,0.1)", border:"1px solid rgba(239,159,39,0.2)", padding:"8px 14px" }}>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1.5px", color:"#EF9F27", marginBottom:2 }}>Próximo partido</div>
            <div style={{ fontSize:12, fontWeight:500, color:"white" }}>vs Atlético Sur</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>Sábado 22 Mar · 3:00 PM</div>
          </div>
        </div>
      </div>

      {/* MAIN TILES */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gridTemplateRows:"300px 120px", gap:8, padding:"8px 16px 16px" }}>

        {/* ENTRENAMIENTO */}
        <div onClick={() => onNavigate("entrenamiento")} style={{ background:"rgba(0,0,0,0.55)", border:"1px solid rgba(29,158,117,0.3)", borderTop:"4px solid #1D9E75", cursor:"pointer", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", width:250, height:250, borderRadius:"50%", background:"rgba(29,158,117,0.05)", top:-90, right:-90, pointerEvents:"none" }}/>
          <div style={{ position:"relative", zIndex:2, height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"20px 22px" }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"3px", color:"#1D9E75", marginBottom:8, fontWeight:500 }}>Módulo 01</div>
            <div style={{ fontSize:32, fontWeight:500, color:"white", textTransform:"uppercase", letterSpacing:"-1px", lineHeight:1.0, textShadow:"0 2px 16px rgba(0,0,0,0.9)", marginBottom:10 }}>Entrena-<br/>miento</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.38)", lineHeight:1.6, marginBottom:16 }}>Asistencia, RPE, planificación y seguimiento del ciclo.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:18 }}>
              {["Sesión de hoy — cartas de jugadores","Planificación de sesión","Historial y análisis del ciclo"].map(item => (
                <div key={item} style={{ fontSize:10, color:"rgba(255,255,255,0.45)", display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:14, height:1.5, background:"#1D9E75", flexShrink:0 }}/>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:10, fontWeight:500, textTransform:"uppercase", letterSpacing:"1.5px", padding:"9px 20px", background:"#1D9E75", color:"white", width:"fit-content", cursor:"pointer" }}>
              Entrar →
            </div>
          </div>
        </div>

        {/* GESTIÓN DE PLANTILLA */}
        <div onClick={() => onNavigate("plantilla")} style={{ background:"rgba(0,0,0,0.55)", border:"1px solid rgba(239,159,39,0.3)", borderTop:"4px solid #EF9F27", cursor:"pointer", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", width:250, height:250, borderRadius:"50%", background:"rgba(239,159,39,0.05)", top:-90, right:-90, pointerEvents:"none" }}/>
          <div style={{ position:"relative", zIndex:2, height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"20px 22px" }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"3px", color:"#EF9F27", marginBottom:8, fontWeight:500 }}>Módulo 02</div>
            <div style={{ fontSize:32, fontWeight:500, color:"white", textTransform:"uppercase", letterSpacing:"-1px", lineHeight:1.0, textShadow:"0 2px 16px rgba(0,0,0,0.9)", marginBottom:10 }}>Gestión de<br/>plantilla</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.38)", lineHeight:1.6, marginBottom:14 }}>Arma tu equipo, visualiza formaciones y prepara la charla táctica.</div>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              {athletes.slice(0,3).map(a => (
                <div key={a.id} style={{ background:"rgba(0,0,0,0.5)", border:"1px solid rgba(239,159,39,0.2)", padding:"7px 10px", minWidth:72 }}>
                  <img src={PHOTO(a.photo)} alt="" style={{ width:36, height:36, borderRadius:"50%", display:"block", marginBottom:4, objectFit:"cover" }}/>
                  <div style={{ fontSize:8, color:"white", textTransform:"uppercase", letterSpacing:"0.3px" }}>{a.name.split(" ")[0]}</div>
                  <div style={{ fontSize:7, color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>{a.posCode}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:10, fontWeight:500, textTransform:"uppercase", letterSpacing:"1.5px", padding:"9px 20px", background:"#EF9F27", color:"#1a0f00", width:"fit-content", cursor:"pointer" }}>
              Ver plantilla →
            </div>
          </div>
        </div>

        {/* RESUMEN CICLO */}
        <div style={{ background:"rgba(0,0,0,0.55)", border:"1px solid rgba(29,158,117,0.12)", borderTop:"2px solid rgba(29,158,117,0.4)", display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
          {[
            { val: stats.asistencia + "%", lbl:"Asistencia", color:"#1D9E75" },
            { val: stats.rpeAvg, lbl:"RPE prom.", color:"white" },
            { val: stats.sesiones, lbl:"Sesiones", color:"white" },
            { val: stats.lesionados, lbl:"Lesionados", color:"#EF9F27" },
          ].map((m, i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 16px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontSize:22, fontWeight:500, color:m.color }}>{m.val}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.8px", marginTop:3 }}>{m.lbl}</div>
            </div>
          ))}
        </div>

        {/* PRÓXIMA SESIÓN */}
        <div style={{ background:"rgba(0,0,0,0.55)", border:"1px solid rgba(239,159,39,0.12)", borderTop:"2px solid rgba(239,159,39,0.4)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px" }}>
          <div>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"1.5px", color:"rgba(255,255,255,0.3)", marginBottom:4 }}>Próxima sesión</div>
            <div style={{ fontSize:12, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.8px", color:"white" }}>Entrenamiento táctico</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:3 }}>Miércoles 20 Mar · 4:00 PM</div>
          </div>
          <div onClick={() => onNavigate("entrenamiento")} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.18)", color:"rgba(255,255,255,0.6)", fontSize:9, fontWeight:500, textTransform:"uppercase", letterSpacing:"1.5px", padding:"6px 14px", cursor:"pointer" }}>
            Planificar →
          </div>
        </div>

      </div>
    </div>
  );
}
