import { useState } from "react";

const AVATAR_COLORS = [
  {bg:"#E1F5EE",tc:"#0F6E56"},{bg:"#E6F1FB",tc:"#0C447C"},{bg:"#EEEDFE",tc:"#3C3489"},
  {bg:"#EAF3DE",tc:"#3B6D11"},{bg:"#FAEEDA",tc:"#854F0B"},{bg:"#FBEAF0",tc:"#72243E"},
  {bg:"#E1F5EE",tc:"#085041"},{bg:"#FCEBEB",tc:"#791F1F"},
];

function initials(name) { return name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase(); }
function getAge(dob) { if(!dob) return "—"; return Math.floor((Date.now()-new Date(dob))/(1000*60*60*24*365.25))+"a"; }

export default function Plantel({ athletes, setAthletes }) {
  const [filter, setFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ name:"", pos:"", dob:"", contact:"" });

  const filtered = athletes.filter(a => a.name.toLowerCase().includes(filter.toLowerCase()));

  const openAdd = () => { setForm({name:"",pos:"",dob:"",contact:""}); setEditIdx(null); setModal(true); };
  const openEdit = (i) => { setForm({name:athletes[i].name,pos:athletes[i].pos,dob:athletes[i].dob,contact:athletes[i].contact}); setEditIdx(i); setModal(true); };

  const save = () => {
    if (!form.name || !form.pos) return;
    if (editIdx !== null) {
      const updated = [...athletes];
      updated[editIdx] = { ...updated[editIdx], ...form };
      setAthletes(updated);
    } else {
      setAthletes([...athletes, { ...form, status:"P", rpe:null }]);
    }
    setModal(false);
  };

  const remove = (i) => {
    if (window.confirm("¿Eliminar a " + athletes[i].name + "?")) {
      setAthletes(athletes.filter((_,idx) => idx !== i));
    }
  };

  const inp = { width:"100%", fontSize:13, border:"1px solid #e5e7eb", borderRadius:8, padding:"8px 10px", background:"#f9fafb", fontFamily:"inherit", boxSizing:"border-box" };

  return (
    <div>
      {/* Métricas */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10, marginBottom:"1.5rem" }}>
        {[
          { label:"Total", value:athletes.length, sub:"en el plantel", color:"#1D9E75" },
          { label:"Delanteros", value:athletes.filter(a=>a.pos==="Delantero").length, sub:"registrados", color:"#374151" },
          { label:"Mediocampistas", value:athletes.filter(a=>a.pos==="Mediocampista").length, sub:"registrados", color:"#374151" },
          { label:"Defensas/Porteros", value:athletes.filter(a=>a.pos==="Defensa"||a.pos==="Portero").length, sub:"registrados", color:"#374151" },
        ].map((m,i) => (
          <div key={i} style={{ background:"#f9fafb", borderRadius:8, padding:12 }}>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:22, fontWeight:500, color:m.color }}>{m.value}</div>
            <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Buscar deportista..." style={{ flex:1, fontSize:13, border:"1px solid #e5e7eb", borderRadius:8, padding:"7px 12px", background:"#f9fafb" }} />
        <button onClick={openAdd} style={{ background:"#1D9E75", color:"white", border:"none", borderRadius:8, padding:"7px 16px", fontSize:13, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap" }}>+ Agregar</button>
      </div>

      {/* Lista */}
      {filtered.length === 0 && <div style={{ textAlign:"center", padding:"2rem", color:"#9ca3af", fontSize:13 }}>No se encontraron deportistas.</div>}
      {filtered.map((a) => {
        const i = athletes.indexOf(a);
        const col = AVATAR_COLORS[i % AVATAR_COLORS.length];
        return (
          <div key={i} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:col.bg, color:col.tc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:500, flexShrink:0 }}>
              {initials(a.name)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:500 }}>{a.name}</div>
              <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>
                {getAge(a.dob)} &nbsp;·&nbsp;
                <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:"#f3f4f6", border:"1px solid #e5e7eb" }}>{a.pos}</span>
              </div>
              <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>Acudiente: {a.contact}</div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>openEdit(i)} style={{ fontSize:11, padding:"4px 10px", borderRadius:8, border:"1px solid #d1d5db", background:"transparent", color:"#6b7280", cursor:"pointer" }}>Editar</button>
              <button onClick={()=>remove(i)} style={{ fontSize:11, padding:"4px 10px", borderRadius:8, border:"1px solid #fca5a5", background:"transparent", color:"#A32D2D", cursor:"pointer" }}>Eliminar</button>
            </div>
          </div>
        );
      })}

      {/* Modal */}
      {modal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setModal(false)}} style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:20, width:340, maxWidth:"95%" }}>
            <div style={{ fontSize:15, fontWeight:500, marginBottom:16 }}>{editIdx!==null?"Editar deportista":"Agregar deportista"}</div>
            {[
              { label:"Nombre completo", key:"name", type:"text", placeholder:"Ej: Carlos Ríos" },
              { label:"Fecha de nacimiento", key:"dob", type:"date" },
              { label:"Contacto del acudiente", key:"contact", type:"text", placeholder:"Ej: 300 123 4567" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:"#6b7280", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.4px" }}>{f.label}</div>
                <input type={f.type} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.placeholder||""} style={inp} />
              </div>
            ))}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#6b7280", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.4px" }}>Posición</div>
              <select value={form.pos} onChange={e=>setForm({...form,pos:e.target.value})} style={inp}>
                <option value="">Seleccionar...</option>
                {["Portero","Defensa","Mediocampista","Delantero"].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:16 }}>
              <button onClick={()=>setModal(false)} style={{ background:"transparent", color:"#6b7280", border:"1px solid #d1d5db", borderRadius:8, padding:"8px 16px", fontSize:13, cursor:"pointer" }}>Cancelar</button>
              <button onClick={save} style={{ background:"#1D9E75", color:"white", border:"none", borderRadius:8, padding:"8px 20px", fontSize:13, fontWeight:500, cursor:"pointer" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
