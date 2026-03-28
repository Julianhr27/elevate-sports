import { useState } from "react";
import { sanitizeText } from "../utils/sanitize";
import { PALETTE as C } from "../constants/palette";

const CATEGORIAS_DEFAULT = [
  "Sub-7","Sub-8","Sub-9","Sub-10","Sub-11","Sub-12",
  "Sub-13","Sub-14","Sub-15","Sub-16","Sub-17","Sub-18",
  "Sub-20","Sub-23","Mayores","Femenino"
];

export default function MiClub({ clubInfo, setClubInfo }) {
  const [newCat, setNewCat] = useState("");
  const [newCampo, setNewCampo] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleCat = (cat) => {
    const cats = clubInfo.categorias || [];
    setClubInfo({
      ...clubInfo,
      categorias: cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]
    });
  };

  const addCat = () => {
    if (!newCat.trim()) return;
    const cats = clubInfo.categorias || [];
    if (!cats.includes(newCat.trim())) {
      setClubInfo({ ...clubInfo, categorias: [...cats, newCat.trim()] });
    }
    setNewCat("");
  };

  const addCampo = () => {
    if (!newCampo.trim()) return;
    const campos = clubInfo.campos || [];
    setClubInfo({ ...clubInfo, campos: [...campos, newCampo.trim()] });
    setNewCampo("");
  };

  const removeCampo = (i) => {
    const campos = [...(clubInfo.campos || [])];
    campos.splice(i, 1);
    setClubInfo({ ...clubInfo, campos });
  };

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const inp = { width:"100%", fontSize:13, border:`1px solid ${C.border}`, padding:"8px 10px", background:"rgba(255,255,255,0.05)", color:"white", fontFamily:"inherit", outline:"none", borderRadius:6 };
  const label = { fontSize:9, textTransform:"uppercase", letterSpacing:"1px", color:C.textMuted, marginBottom:5, display:"block" };
  const panel = { background:"rgba(255,255,255,0.03)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:10, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" };
  const panelTitle = { fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:C.textMuted, marginBottom:14 };

  return (
    <div style={{ padding:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

      {/* DATOS GENERALES */}
      <div>
        <div style={panel}>
          <div style={panelTitle}>Datos del club</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              ["Nombre del club","nombre","Club Deportivo"],
              ["Disciplina","disciplina","Fútbol"],
              ["Ciudad","ciudad","Medellín"],
              ["Entrenador","entrenador",""],
              ["Teléfono","telefono",""],
              ["Email","email",""],
            ].map(([l,k,p]) => (
              <div key={k}>
                <label style={label}>{l}</label>
                <input value={clubInfo[k]||""} onChange={e=>setClubInfo({...clubInfo,[k]:sanitizeText(e.target.value)})} placeholder={p} style={inp} maxLength={80}/>
              </div>
            ))}
          </div>
          <div style={{ marginTop:10 }}>
            <label style={label}>Descripción del club</label>
            <textarea value={clubInfo.descripcion||""} onChange={e=>setClubInfo({...clubInfo,descripcion:sanitizeText(e.target.value)})} rows={3} placeholder="Mision, objetivos de la temporada..." style={{ ...inp, resize:"none", lineHeight:1.6 }} maxLength={500}/>
          </div>
        </div>

        {/* CAMPOS DE ENTRENAMIENTO */}
        <div style={panel}>
          <div style={panelTitle}>Campos de entrenamiento</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
            {(clubInfo.campos||["Campo principal","Campo auxiliar"]).map((c,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{c}</span>
                <span onClick={()=>removeCampo(i)} style={{ fontSize:10, color:C.danger, cursor:"pointer", padding:"2px 6px" }}>✕</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={newCampo} onChange={e=>setNewCampo(sanitizeText(e.target.value))} onKeyDown={e=>e.key==="Enter"&&addCampo()} placeholder="Nombre del campo..." style={{ ...inp, flex:1 }} maxLength={60}/>
            <div onClick={addCampo} style={{ background:C.green, color:"white", padding:"8px 16px", fontSize:11, cursor:"pointer", whiteSpace:"nowrap", borderRadius:6 }}>+ Agregar</div>
          </div>
        </div>
      </div>

      {/* CATEGORÍAS */}
      <div>
        <div style={panel}>
          <div style={panelTitle}>Categorías asignadas al entrenador</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:12 }}>Selecciona las categorías que tienes a tu cargo</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
            {CATEGORIAS_DEFAULT.map(cat => {
              const active = (clubInfo.categorias||[]).includes(cat);
              return (
                <div key={cat} onClick={()=>toggleCat(cat)} style={{ fontSize:11, padding:"5px 14px", cursor:"pointer", borderRadius:6, border:`1px solid ${active?C.green:C.border}`, background: active?"rgba(29,158,117,0.15)":"transparent", color: active?C.green:C.textMuted, transition:"all 0.15s" }}>
                  {cat}
                </div>
              );
            })}
          </div>

          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:12, marginTop:4 }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", color:"rgba(255,255,255,0.25)", marginBottom:8 }}>Agregar categoría personalizada</div>
            <div style={{ display:"flex", gap:8 }}>
              <input value={newCat} onChange={e=>setNewCat(sanitizeText(e.target.value))} onKeyDown={e=>e.key==="Enter"&&addCat()} placeholder="Ej: Femenino Sub-17..." style={{ ...inp, flex:1 }} maxLength={30}/>
              <div onClick={addCat} style={{ background:C.green, color:"white", padding:"8px 16px", fontSize:11, cursor:"pointer", whiteSpace:"nowrap", borderRadius:6 }}>+ Agregar</div>
            </div>
          </div>

          {(clubInfo.categorias||[]).length > 0 && (
            <div style={{ marginTop:14, padding:12, background:"rgba(29,158,117,0.06)", border:`1px solid rgba(29,158,117,0.15)`, borderRadius:8 }}>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"1px", color:C.green, marginBottom:8 }}>Categorías activas ({(clubInfo.categorias||[]).length})</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {(clubInfo.categorias||[]).map(cat => (
                  <div key={cat} style={{ fontSize:11, padding:"4px 12px", background:"rgba(29,158,117,0.15)", border:"1px solid rgba(29,158,117,0.3)", color:C.green, borderRadius:6, display:"flex", alignItems:"center", gap:6 }}>
                    {cat}
                    <span onClick={()=>toggleCat(cat)} style={{ fontSize:10, cursor:"pointer", opacity:0.6 }}>✕</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
          <div onClick={save} style={{ background: saved?"#059669":C.green, color:"white", padding:"10px 24px", fontSize:11, textTransform:"uppercase", letterSpacing:"1.5px", cursor:"pointer", borderRadius:8 }}>
            {saved ? "Guardado ✓" : "Guardar cambios →"}
          </div>
        </div>
      </div>
    </div>
  );
}
