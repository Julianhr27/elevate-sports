import { useState } from "react";

const RPE_COLORS = { 1:"#5DCAA5",2:"#5DCAA5",3:"#5DCAA5",4:"#1D9E75",5:"#1D9E75",6:"#1D9E75",7:"#EF9F27",8:"#EF9F27",9:"#E24B4A",10:"#E24B4A" };
const RPE_LABELS = { 1:"Muy leve",2:"Leve",3:"Moderado",4:"Algo duro",5:"Duro",6:"Duro+",7:"Muy duro",8:"Muy duro+",9:"Máximo",10:"Límite" };
const AVATAR_COLORS = [
  {bg:"#E1F5EE",tc:"#0F6E56"},{bg:"#E6F1FB",tc:"#0C447C"},{bg:"#EEEDFE",tc:"#3C3489"},
  {bg:"#EAF3DE",tc:"#3B6D11"},{bg:"#FAEEDA",tc:"#854F0B"},{bg:"#FBEAF0",tc:"#72243E"},
  {bg:"#E1F5EE",tc:"#085041"},{bg:"#FCEBEB",tc:"#791F1F"},
];

function initials(name) { return name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase(); }

export default function Cancha({ athletes, setAthletes, onGuardar }) {
  const [nota, setNota] = useState("");

  const setStatus = (i, s) => {
    const updated = [...athletes];
    updated[i] = { ...updated[i], status: s, rpe: s !== "P" ? null : updated[i].rpe };
    setAthletes(updated);
  };

  const setRpe = (i, val) => {
    const updated = [...athletes];
    updated[i] = { ...updated[i], rpe: updated[i].rpe === val ? null : val };
    setAthletes(updated);
  };

  const p = athletes.filter(a => a.status === "P");
  const rpes = p.filter(a => a.rpe).map(a => a.rpe);
  const rpeAvg = rpes.length ? (rpes.reduce((a,b) => a+b,0) / rpes.length).toFixed(1) : "—";

  return (
    <div>
      {/* Métricas */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10, marginBottom:"1.5rem" }}>
        {[
          { label:"Presentes hoy", value:p.length, sub:`de ${athletes.length}`, color:"#1D9E75" },
          { label:"Ausentes", value:athletes.filter(a=>a.status==="A").length, sub:"sin justificar", color:"#A32D2D" },
          { label:"Lesionados", value:athletes.filter(a=>a.status==="L").length, sub:"en recuperación", color:"#BA7517" },
          { label:"RPE promedio", value:rpeAvg, sub:"percepción sesión", color:"#1D9E75" },
        ].map((m,i) => (
          <div key={i} style={{ background:"#f9fafb", borderRadius:8, padding:12 }}>
            <div style={{ fontSize:11, color:"#111827", marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:22, fontWeight:500, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Roster */}
      <div style={{ fontSize:11, fontWeight:500, color:"#6b7280", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>
        Lista de hoy
      </div>
      {athletes.map((a, i) => {
        const col = AVATAR_COLORS[i % AVATAR_COLORS.length];
        const showRpe = a.status === "P";
        return (
          <div key={i} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"10px 14px", marginBottom:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:col.bg, color:col.tc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:500, flexShrink:0 }}>
                {initials(a.name)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{a.name}</div>
                <div style={{ fontSize:11, color:"#6b7280" }}>{a.pos}</div>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                {[["P","Presente"],["A","Ausente"],["L","Lesionado"]].map(([s, label]) => (
                  <button key={s} onClick={() => setStatus(i,s)} style={{
                    fontSize:11, padding:"4px 9px", borderRadius:20, cursor:"pointer",
                    border: a.status===s ? "1px solid" : "1px solid #d1d5db",
                    background: a.status===s ? (s==="P"?"#E1F5EE":s==="A"?"#FCEBEB":"#FAEEDA") : "transparent",
                    color: a.status===s ? (s==="P"?"#0F6E56":s==="A"?"#A32D2D":"#854F0B") : "#6b7280",
                    borderColor: a.status===s ? (s==="P"?"#5DCAA5":s==="A"?"#F09595":"#EF9F27") : "#d1d5db",
                  }}>{label}</button>
                ))}
              </div>
            </div>
            {showRpe && (
              <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #f3f4f6" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:11, color:"#6b7280" }}>RPE (1–10)</span>
                  {a.rpe
                    ? <span style={{ fontSize:12, fontWeight:500, padding:"2px 10px", borderRadius:20, background:RPE_COLORS[a.rpe]+"22", color:RPE_COLORS[a.rpe], border:`1px solid ${RPE_COLORS[a.rpe]}66` }}>{a.rpe} — {RPE_LABELS[a.rpe]}</span>
                    : <span style={{ fontSize:11, color:"#9ca3af" }}>sin registrar</span>
                  }
                </div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setRpe(i,n)} style={{
                      width:28, height:28, borderRadius:6, border:"1px solid #e5e7eb", cursor:"pointer",
                      background: a.rpe===n ? RPE_COLORS[n] : "#f9fafb",
                      color: a.rpe===n ? "white" : "#6b7280",
                      fontSize:12, fontWeight:500, display:"flex", alignItems:"center", justifyContent:"center",
                    }}>{n}</button>
                  ))}
                </div>
                <input placeholder="Observación individual..." style={{ marginTop:8, width:"100%", fontSize:12, border:"1px solid #e5e7eb", borderRadius:6, padding:"5px 8px", background:"#f9fafb", boxSizing:"border-box" }} />
              </div>
            )}
            {!showRpe && (
              <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid #f3f4f6" }}>
                <input placeholder={a.status==="A"?"Motivo de ausencia...":"Estado de lesión..."} style={{ width:"100%", fontSize:12, border:"1px solid #e5e7eb", borderRadius:6, padding:"5px 8px", background:"#f9fafb", boxSizing:"border-box" }} />
              </div>
            )}
          </div>
        );
      })}

      {/* Nota de sesión */}
      <div style={{ fontSize:11, fontWeight:500, color:"#6b7280", margin:"1rem 0 8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Nota de sesión</div>
      <div style={{ background:"#f9fafb", borderLeft:"3px solid #1D9E75", borderRadius:"0 8px 8px 0", padding:"10px 14px", marginBottom:"1rem" }}>
        <textarea rows={2} value={nota} onChange={e=>setNota(e.target.value)} placeholder="Observaciones generales de la sesión..." style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:13, resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box" }} />
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button style={{ background:"transparent", color:"#6b7280", border:"1px solid #d1d5db", borderRadius:8, padding:"8px 16px", fontSize:13, cursor:"pointer" }}>Exportar PDF</button>
        <button onClick={() => onGuardar(nota)} style={{ background:"#1D9E75", color:"white", border:"none", borderRadius:8, padding:"8px 20px", fontSize:13, fontWeight:500, cursor:"pointer" }}>Guardar sesión</button>
      </div>
    </div>
  );
}
