import { useState } from "react";

export default function Historial({ historial }) {
  const [expanded, setExpanded] = useState(null);

  const prom = historial.length
    ? (historial.reduce((a,b) => a + (b.presentes/b.total*100), 0) / historial.length).toFixed(0) + "%"
    : "—";

  const rpeAvgTotal = historial.filter(s=>s.rpeAvg).length
    ? (historial.filter(s=>s.rpeAvg).reduce((a,b)=>a+(+b.rpeAvg),0)/historial.filter(s=>s.rpeAvg).length).toFixed(1)
    : "—";

  return (
    <div>
      {/* Métricas */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10, marginBottom:"1.5rem" }}>
        {[
          { label:"Sesiones guardadas", value:historial.length, sub:"este macrociclo", color:"#1D9E75" },
          { label:"Última sesión", value:historial[0]?.fecha ?? "—", sub:"más reciente", color:"#374151", small:true },
          { label:"Asistencia prom.", value:prom, sub:"histórico", color:"#1D9E75" },
          { label:"RPE prom.", value:rpeAvgTotal, sub:"histórico", color:"#374151" },
        ].map((m,i) => (
          <div key={i} style={{ background:"#f9fafb", borderRadius:8, padding:12 }}>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize: m.small?14:22, fontWeight:500, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize:11, fontWeight:500, color:"#6b7280", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>
        Sesiones registradas
      </div>

      {historial.length === 0 && (
        <div style={{ textAlign:"center", padding:"2rem", color:"#9ca3af", fontSize:13 }}>Aún no hay sesiones guardadas.</div>
      )}

      {historial.map((s, i) => (
        <div key={i}>
          <div
            onClick={() => setExpanded(expanded===i ? null : i)}
            style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, cursor:"pointer" }}
          >
            <div>
              <div style={{ fontSize:14, fontWeight:500 }}>Sesión #{s.num} — {s.fecha}</div>
              <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>
                {s.presentes} presentes de {s.total} &nbsp;·&nbsp; RPE prom: {s.rpeAvg ?? "—"} &nbsp;·&nbsp; {s.tipo}
              </div>
            </div>
            <div style={{ fontSize:12, color:"#9ca3af" }}>{i===0?"más reciente": expanded===i?"▲":"▼"}</div>
          </div>
          {expanded === i && (
            <div style={{ background:"#f9fafb", borderRadius:12, padding:14, marginBottom:6 }}>
              <div style={{ fontSize:12, color:"#6b7280", marginBottom:6 }}>Nota de sesión:</div>
              <div style={{ fontSize:13 }}>{s.nota || "Sin nota registrada."}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
