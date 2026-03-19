import { useState } from "react";

const PHOTO = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=059669`;

const FORMATIONS = {
  "4-3-3": [
    { posCode:"GK", left:"50%", top:"91%" },
    { posCode:"LB", left:"14%", top:"74%" },
    { posCode:"CB", left:"34%", top:"76%" },
    { posCode:"CB", left:"66%", top:"76%" },
    { posCode:"RB", left:"86%", top:"74%" },
    { posCode:"CM", left:"25%", top:"53%" },
    { posCode:"CM", left:"50%", top:"49%" },
    { posCode:"CM", left:"75%", top:"53%" },
    { posCode:"LW", left:"18%", top:"23%" },
    { posCode:"ST", left:"50%", top:"16%" },
    { posCode:"RW", left:"82%", top:"23%" },
  ],
  "4-4-2": [
    { posCode:"GK", left:"50%", top:"91%" },
    { posCode:"LB", left:"14%", top:"76%" },
    { posCode:"CB", left:"34%", top:"78%" },
    { posCode:"CB", left:"66%", top:"78%" },
    { posCode:"RB", left:"86%", top:"76%" },
    { posCode:"LM", left:"14%", top:"53%" },
    { posCode:"CM", left:"36%", top:"55%" },
    { posCode:"CM", left:"64%", top:"55%" },
    { posCode:"RM", left:"86%", top:"53%" },
    { posCode:"ST", left:"36%", top:"20%" },
    { posCode:"ST", left:"64%", top:"20%" },
  ],
  "3-5-2": [
    { posCode:"GK", left:"50%", top:"91%" },
    { posCode:"CB", left:"25%", top:"76%" },
    { posCode:"CB", left:"50%", top:"78%" },
    { posCode:"CB", left:"75%", top:"76%" },
    { posCode:"LM", left:"10%", top:"53%" },
    { posCode:"CM", left:"30%", top:"55%" },
    { posCode:"CM", left:"50%", top:"50%" },
    { posCode:"CM", left:"70%", top:"55%" },
    { posCode:"RM", left:"90%", top:"53%" },
    { posCode:"ST", left:"36%", top:"20%" },
    { posCode:"ST", left:"64%", top:"20%" },
  ],
};

export default function GestionPlantilla({ athletes, setAthletes }) {
  const [formation, setFormation] = useState("4-3-3");
  const [selectedIdx, setSelectedIdx] = useState(null);

  const starters = athletes.filter(a => a.available).slice(0, 11);
  const bench = athletes.filter(a => !a.available || athletes.indexOf(a) >= 11);
  const positions = FORMATIONS[formation];
  const selected = selectedIdx !== null ? starters[selectedIdx] : null;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"185px 1fr 220px", minHeight:"calc(100vh - 38px)" }}>

      {/* SIDEBAR IZQ */}
      <div style={{ background:"rgba(0,0,0,0.82)", borderRight:"1px solid rgba(255,255,255,0.08)", padding:"12px 0", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.3)", padding:"0 14px 8px", borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:6 }}>Formación</div>
        {Object.keys(FORMATIONS).map(f => (
          <div key={f} onClick={() => setFormation(f)} style={{ padding:"8px 14px", fontSize:11, color: formation===f ? "#EF9F27" : "rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.04)", background: formation===f ? "rgba(239,159,39,0.1)" : "transparent", borderLeft: formation===f ? "2px solid #EF9F27" : "2px solid transparent" }}>
            {f} {formation===f && <span style={{ fontSize:9, color:"#EF9F27" }}>activa</span>}
          </div>
        ))}
        <div style={{ padding:"7px 14px", fontSize:10, color:"rgba(255,255,255,0.2)", cursor:"pointer", textAlign:"center", marginTop:4 }}>+ Nueva formación</div>

        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.3)", padding:"0 14px 8px", borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:6 }}>Suplentes</div>
          {bench.slice(0,6).map((a,i) => (
            <div key={a.id} style={{ padding:"7px 12px", display:"flex", alignItems:"center", gap:8, borderBottom:"1px solid rgba(255,255,255,0.04)", cursor:"pointer" }}>
              <img src={PHOTO(a.photo)} alt="" style={{ width:30, height:30, borderRadius:"50%", objectFit:"cover", border:`1px solid ${a.status==="L"?"rgba(226,75,74,0.4)":"rgba(255,255,255,0.12)"}` }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:"0.3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name.split(" ")[0]}</div>
                <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>{a.posCode}</div>
              </div>
              <div style={{ width:6, height:6, borderRadius:"50%", background: a.status==="L" ? "#E24B4A" : "#1D9E75", flexShrink:0 }}/>
            </div>
          ))}
        </div>
      </div>

      {/* CAMPO */}
      <div style={{ display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", background:"rgba(0,0,0,0.7)", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.5)" }}>Formación {formation} — {athletes[0]?.pos.split(" ")[0] || "Sub-17"}</div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", padding:"5px 12px", background:"transparent", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>Compartir</div>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", padding:"5px 12px", background:"transparent", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>Guardar</div>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", padding:"5px 12px", background:"#EF9F27", color:"#1a0f00", cursor:"pointer" }}>Usar en partido →</div>
          </div>
        </div>

        <div style={{ position:"relative", flex:1, minHeight:560 }}>
          {/* Campo SVG */}
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} viewBox="0 0 500 560" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <rect width="500" height="560" fill="#081408"/>
            <rect x="30" y="20" width="440" height="520" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
            <line x1="30" y1="280" x2="470" y2="280" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
            <circle cx="250" cy="280" r="60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
            <circle cx="250" cy="280" r="3" fill="rgba(255,255,255,0.15)"/>
            <rect x="30" y="160" width="110" height="200" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.2"/>
            <rect x="360" y="160" width="110" height="200" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.2"/>
            <rect x="30" y="210" width="50" height="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <rect x="420" y="210" width="50" height="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
          </svg>

          {/* TOKENS JUGADORES */}
          {starters.map((a, i) => {
            const pos = positions[i];
            if (!pos) return null;
            const isSelected = selectedIdx === i;
            const isGK = pos.posCode === "GK";
            const borderColor = isSelected ? "white" : isGK ? "rgba(29,158,117,0.6)" : "rgba(239,159,39,0.35)";

            return (
              <div key={a.id} onClick={() => setSelectedIdx(isSelected ? null : i)} style={{ position:"absolute", left:pos.left, top:pos.top, transform:"translate(-50%,-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer", zIndex:5 }}>
                <div style={{ width:56, background:"rgba(5,10,5,0.95)", border:`${isSelected?2:1}px solid ${borderColor}`, textAlign:"center", overflow:"hidden" }}>
                  <div style={{ width:56, height:46, overflow:"hidden", background:"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                    <img src={PHOTO(a.photo)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }}/>
                  </div>
                  <div style={{ padding:"3px 3px 4px", background:"rgba(0,0,0,0.6)" }}>
                    <div style={{ fontSize:8, color:"white", textTransform:"uppercase", letterSpacing:"0.2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name.split(" ")[0]}</div>
                    <div style={{ fontSize:7, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginTop:1 }}>{pos.posCode}</div>
                  </div>
                </div>
                <div style={{ width:18, height:3, background:"rgba(0,0,0,0.4)", borderRadius:"50%" }}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div style={{ background:"rgba(0,0,0,0.88)", borderLeft:"1px solid rgba(255,255,255,0.08)", overflowY:"auto" }}>
        {selected ? (
          <div>
            <div style={{ padding:16, background:"rgba(0,0,0,0.4)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.25)", marginBottom:12 }}>Jugador seleccionado</div>
              <div style={{ width:72, height:72, borderRadius:"50%", overflow:"hidden", border:"2px solid #EF9F27", marginBottom:10, background:"rgba(255,255,255,0.05)" }}>
                <img src={PHOTO(selected.photo)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              </div>
              <div style={{ fontSize:16, fontWeight:500, color:"white", textTransform:"uppercase", letterSpacing:"-0.3px", lineHeight:1.1 }}>{selected.name}</div>
              <div style={{ fontSize:10, color:"#EF9F27", textTransform:"uppercase", letterSpacing:"1px", marginTop:3 }}>{selected.pos}</div>
            </div>

            <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.25)", marginBottom:10 }}>Valoración</div>
              <div style={{ background:"rgba(239,159,39,0.07)", border:"1px solid rgba(239,159,39,0.15)", padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>Se genera con los partidos registrados.</div>
                <div style={{ fontSize:9, color:"#EF9F27", marginTop:4 }}>0 partidos · sin valoración</div>
              </div>
            </div>

            <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.25)", marginBottom:10 }}>Métricas del ciclo</div>
              {[
                { label:"Asistencia", value:"100%", pct:100, color:"#1D9E75" },
                { label:"RPE promedio", value: selected.rpe ? selected.rpe : "—", pct: selected.rpe ? selected.rpe * 10 : 0, color:"#EF9F27" },
                { label:"Sesiones", value:"14/14", pct:100, color:"#7F77DD" },
              ].map(m => (
                <div key={m.label} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.5px" }}>{m.label}</span>
                    <span style={{ fontSize:12, fontWeight:500, color:m.color }}>{m.value}</span>
                  </div>
                  <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:2 }}>
                    <div style={{ width:`${m.pct}%`, height:"100%", background:m.color, borderRadius:2 }}/>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.25)", marginBottom:10 }}>Información</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { label:"Estado", value: selected.status==="P"?"Disponible":selected.status==="L"?"Lesionado":"Ausente", color: selected.status==="P"?"#1D9E75":selected.status==="L"?"#EF9F27":"#E24B4A" },
                  { label:"Posición", value:selected.pos, color:"white" },
                  { label:"Contacto", value:selected.contact, color:"white" },
                  { label:"Edad", value: Math.floor((Date.now()-new Date(selected.dob))/(1000*60*60*24*365.25))+"a", color:"white" },
                ].map(m=>(
                  <div key={m.label} style={{ background:"rgba(255,255,255,0.04)", padding:"8px 10px" }}>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:3 }}>{m.label}</div>
                    <div style={{ fontSize:12, fontWeight:500, color:m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ width:"100%", padding:8, fontSize:9, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", background:"transparent", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.5)", textAlign:"center" }}>Ver ficha completa</div>
              <div style={{ width:"100%", padding:8, fontSize:9, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", background:"#1D9E75", color:"white", textAlign:"center" }}>Cambiar posición</div>
              <div style={{ width:"100%", padding:8, fontSize:9, textTransform:"uppercase", letterSpacing:"1px", cursor:"pointer", background:"#EF9F27", color:"#1a0f00", textAlign:"center" }}>Pasar a suplentes</div>
            </div>
          </div>
        ) : (
          <div style={{ padding:16, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"rgba(255,255,255,0.2)", fontSize:12, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:12, opacity:0.3 }}>⚽</div>
            Toca una carta para ver el detalle del jugador
          </div>
        )}
      </div>
    </div>
  );
}
