import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const RPE_COLORS = { 1:"#5DCAA5",2:"#5DCAA5",3:"#5DCAA5",4:"#1D9E75",5:"#1D9E75",6:"#1D9E75",7:"#EF9F27",8:"#EF9F27",9:"#E24B4A",10:"#E24B4A" };

const asistenciaData = [
  {name:"C. Ríos",val:92},{name:"A. Mena",val:88},{name:"M. Torres",val:85},
  {name:"D. Cano",val:100},{name:"F. Ruiz",val:77},{name:"J. Pérez",val:70},
  {name:"S. Gil",val:55},{name:"T. Vera",val:60},
];

const rpeData = [
  {name:"D. Cano",val:9},{name:"C. Ríos",val:8},{name:"A. Mena",val:7},
  {name:"F. Ruiz",val:7},{name:"M. Torres",val:6},{name:"J. Pérez",val:5},
];

export default function Analisis({ historial }) {
  const lineRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!lineRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(lineRef.current, {
      type: "line",
      data: {
        labels: ["S7","S8","S9","S10","S11","S12","S13","S14"],
        datasets: [
          { label:"Asistencia", data:[72,78,80,75,82,83,89,78], borderColor:"#1D9E75", backgroundColor:"rgba(29,158,117,0.07)", fill:true, tension:0.4, pointRadius:3, yAxisID:"y" },
          { label:"RPE", data:[6.5,7.2,7.8,9.2,8.1,6.4,7.0,7.2], borderColor:"#EF9F27", backgroundColor:"rgba(239,159,39,0.07)", fill:false, tension:0.4, pointRadius:3, yAxisID:"y2" },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales: {
          y:{ min:60, max:100, position:"left", ticks:{ font:{size:10}, color:"#888780", callback:v=>v+"%" }, grid:{ color:"rgba(136,135,128,0.08)" } },
          y2:{ min:0, max:10, position:"right", ticks:{ font:{size:10}, color:"#BA7517", stepSize:2 }, grid:{ display:false } },
          x:{ ticks:{ font:{size:10}, color:"#888780" }, grid:{ display:false } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, []);

  const card = { background:"#f9fafb", borderRadius:8, padding:12 };

  return (
    <div>
      {/* Métricas */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10, marginBottom:"1.5rem" }}>
        {[
          { label:"Asistencia promedio", value:"83%", sub:"últimas 4 semanas", color:"#1D9E75" },
          { label:"RPE promedio", value:"7.1", sub:"últimas 8 sesiones", color:"#374151" },
          { label:"Pico RPE", value:"9.2", sub:"sesión #11", color:"#BA7517" },
          { label:"Sesiones", value:historial.length + 11, sub:"este macrociclo", color:"#374151" },
        ].map((m,i) => (
          <div key={i} style={card}>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:22, fontWeight:500, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Barras */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:14 }}>
          <div style={{ fontSize:12, color:"#6b7280", marginBottom:10, fontWeight:500 }}>Asistencia por deportista (%)</div>
          {asistenciaData.map((d,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <div style={{ fontSize:11, color:"#6b7280", width:55, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.name}</div>
              <div style={{ flex:1, height:8, background:"#f3f4f6", borderRadius:4, overflow:"hidden" }}>
                <div style={{ width:`${d.val}%`, height:"100%", background:d.val>=80?"#1D9E75":d.val>=65?"#EF9F27":"#E24B4A", borderRadius:4 }} />
              </div>
              <div style={{ fontSize:11, color:"#6b7280", width:28, textAlign:"right" }}>{d.val}%</div>
            </div>
          ))}
        </div>
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:14 }}>
          <div style={{ fontSize:12, color:"#6b7280", marginBottom:10, fontWeight:500 }}>RPE promedio por deportista</div>
          {rpeData.map((d,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <div style={{ fontSize:11, color:"#6b7280", width:55, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.name}</div>
              <div style={{ flex:1, height:8, background:"#f3f4f6", borderRadius:4, overflow:"hidden" }}>
                <div style={{ width:`${d.val*10}%`, height:"100%", background:RPE_COLORS[d.val], borderRadius:4 }} />
              </div>
              <div style={{ fontSize:11, color:"#6b7280", width:28, textAlign:"right" }}>{d.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Línea */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:14 }}>
        <div style={{ fontSize:12, color:"#6b7280", marginBottom:10, fontWeight:500 }}>Evolución RPE y asistencia — últimas 8 sesiones</div>
        <div style={{ position:"relative", width:"100%", height:160 }}>
          <canvas ref={lineRef} />
        </div>
        <div style={{ display:"flex", gap:16, marginTop:8 }}>
          {[["#1D9E75","Asistencia %"],["#EF9F27","RPE promedio"]].map(([c,l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#6b7280" }}>
              <div style={{ width:10, height:3, background:c, borderRadius:2 }} />{l}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:"1rem" }}>
        <button style={{ background:"transparent", color:"#6b7280", border:"1px solid #d1d5db", borderRadius:8, padding:"8px 16px", fontSize:13, cursor:"pointer" }}>Exportar informe</button>
      </div>
    </div>
  );
}
