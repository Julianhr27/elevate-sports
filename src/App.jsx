import { useState } from "react";
import FieldBackground from "./components/FieldBackground";
import Home from "./components/Home";
import Entrenamiento from "./components/Entrenamiento";
import GestionPlantilla from "./components/GestionPlantilla";

const CLUB = {
  nombre: "Águilas de Lucero",
  categoria: "Sub-17",
  entrenador: "Juan Felipe Cuervo",
  temporada: "2025-26",
};

const INITIAL_ATHLETES = [
  { id: 1, name: "Carlos Ríos", pos: "Delantero", posCode: "ST", dob: "2008-03-12", contact: "300 111 2233", status: "P", rpe: 8, photo: "carlos", available: true },
  { id: 2, name: "David Cano", pos: "Mediocampista", posCode: "CM", dob: "2008-07-08", contact: "318 667 7788", status: "P", rpe: 7, photo: "david", available: true },
  { id: 3, name: "Miguel Torres", pos: "Portero", posCode: "GK", dob: "2007-09-15", contact: "315 445 5566", status: "P", rpe: 6, photo: "miguel", available: true },
  { id: 4, name: "Felipe Ruiz", pos: "Defensa", posCode: "LB", dob: "2007-12-22", contact: "314 778 8899", status: "P", rpe: 9, photo: "felipe", available: true },
  { id: 5, name: "Pablo Vargas", pos: "Mediocampista", posCode: "CM", dob: "2008-05-10", contact: "312 334 5566", status: "P", rpe: 8, photo: "pablo", available: true },
  { id: 6, name: "Roberto Castro", pos: "Defensa", posCode: "CB", dob: "2008-01-22", contact: "311 445 6677", status: "P", rpe: 7, photo: "roberto", available: true },
  { id: 7, name: "Héctor Díaz", pos: "Defensa", posCode: "RB", dob: "2007-08-14", contact: "310 556 7788", status: "P", rpe: 5, photo: "hector", available: true },
  { id: 8, name: "Nicolás Ossa", pos: "Delantero", posCode: "LW", dob: "2008-11-03", contact: "313 667 8899", status: "P", rpe: 7, photo: "nicolas", available: true },
  { id: 9, name: "Kevin Pinto", pos: "Delantero", posCode: "RW", dob: "2009-02-18", contact: "317 778 9900", status: "P", rpe: 6, photo: "kevin", available: true },
  { id: 10, name: "Luis Mora", pos: "Defensa", posCode: "CB", dob: "2008-04-25", contact: "316 889 0011", status: "P", rpe: 7, photo: "luis", available: true },
  { id: 11, name: "Edgar Largo", pos: "Mediocampista", posCode: "CM", dob: "2007-06-30", contact: "319 990 1122", status: "P", rpe: null, photo: "edgar", available: true },
  { id: 12, name: "Andrés Mena", pos: "Mediocampista", posCode: "CM", dob: "2007-11-05", contact: "311 223 3344", status: "P", rpe: null, photo: "andres", available: true },
  { id: 13, name: "Sebastián Gil", pos: "Defensa", posCode: "CB", dob: "2008-06-20", contact: "320 334 4455", status: "A", rpe: null, photo: "sebastian", available: false },
  { id: 14, name: "Tomás Vera", pos: "Mediocampista", posCode: "CM", dob: "2009-04-17", contact: "316 889 9900", status: "A", rpe: null, photo: "tomas", available: false },
  { id: 15, name: "Julián Pérez", pos: "Delantero", posCode: "ST", dob: "2009-01-30", contact: "312 556 6677", status: "L", rpe: null, photo: "julian", available: false },
];

const INITIAL_HISTORIAL = [
  { num: 14, fecha: "Mar 18 Mar", presentes: 14, total: 18, rpeAvg: 7.2, tipo: "Táctica", nota: "Buena respuesta al pressing alto." },
  { num: 13, fecha: "Sáb 15 Mar", presentes: 16, total: 18, rpeAvg: 8.1, tipo: "Físico", nota: "Buena respuesta al trabajo de fuerza." },
  { num: 12, fecha: "Jue 13 Mar", presentes: 15, total: 18, rpeAvg: 6.4, tipo: "Recuperación", nota: "Sesión suave post competencia." },
  { num: 11, fecha: "Mar 11 Mar", presentes: 13, total: 18, rpeAvg: 9.2, tipo: "Partido", nota: "Alta intensidad. Revisar carga semana próxima." },
  { num: 10, fecha: "Sáb 08 Mar", presentes: 17, total: 18, rpeAvg: 7.8, tipo: "Físico", nota: "Excelente disposición del grupo." },
];

export default function App() {
  const [activeModule, setActiveModule] = useState("home");
  const [athletes, setAthletes] = useState(INITIAL_ATHLETES);
  const [historial, setHistorial] = useState(INITIAL_HISTORIAL);

  const guardarSesion = (nota, tipo) => {
    const p = athletes.filter(a => a.status === "P");
    const rpes = p.filter(a => a.rpe).map(a => a.rpe);
    const avg = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : null;
    const num = historial.length > 0 ? historial[0].num + 1 : 1;
    const hoy = new Date();
    const dias = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const fecha = `${dias[hoy.getDay()]} ${hoy.getDate()} ${meses[hoy.getMonth()]}`;
    setHistorial([{ num, fecha, presentes: p.length, total: athletes.length, rpeAvg: avg, tipo: tipo || "Sesión", nota }, ...historial]);
    alert("Sesión #" + num + " guardada.");
  };

  const stats = {
    presentes: athletes.filter(a => a.status === "P").length,
    ausentes: athletes.filter(a => a.status === "A").length,
    lesionados: athletes.filter(a => a.status === "L").length,
    rpeAvg: (() => {
      const rpes = athletes.filter(a => a.status === "P" && a.rpe).map(a => a.rpe);
      return rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : "—";
    })(),
    sesiones: historial.length,
    asistencia: Math.round((historial.reduce((a,s) => a + s.presentes, 0) / Math.max(historial.reduce((a,s) => a + s.total, 0), 1)) * 100),
  };

  const navItems = [
    { key: "home", label: "Inicio" },
    { key: "entrenamiento", label: "Entrenamiento" },
    { key: "plantilla", label: "Gestión de plantilla" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#060d06", position: "relative" }}>
      <FieldBackground />
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ display:"flex", alignItems:"stretch", height:38, background:"rgba(0,0,0,0.88)", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
          <div onClick={() => setActiveModule("home")} style={{ padding:"0 20px", display:"flex", alignItems:"center", background:"rgba(0,0,0,0.5)", borderRight:"1px solid rgba(255,255,255,0.12)", fontSize:15, fontWeight:500, color:"white", letterSpacing:"-0.3px", whiteSpace:"nowrap", cursor:"pointer" }}>
            Elevate <span style={{ color:"#1D9E75", marginLeft:4 }}>Sports</span>
          </div>
          <div style={{ display:"flex", alignItems:"stretch" }}>
            {navItems.map(m => (
              <div key={m.key} onClick={() => setActiveModule(m.key)} style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color: activeModule===m.key ? "white" : "rgba(255,255,255,0.35)", display:"flex", alignItems:"center", cursor:"pointer", borderRight:"1px solid rgba(255,255,255,0.06)", borderBottom: activeModule===m.key ? "2px solid #1D9E75" : "2px solid transparent", background: activeModule===m.key ? "rgba(255,255,255,0.04)" : "transparent", whiteSpace:"nowrap" }}>
                {m.label}
              </div>
            ))}
            {["Administración","Reportes","Mi club"].map(label => (
              <div key={label} style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.25)", display:"flex", alignItems:"center", cursor:"pointer", borderRight:"1px solid rgba(255,255,255,0.06)", borderBottom:"2px solid transparent", whiteSpace:"nowrap" }}>
                {label}
              </div>
            ))}
          </div>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", padding:"0 18px", gap:8, fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1px", whiteSpace:"nowrap" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#1D9E75" }} />
            {CLUB.nombre} &nbsp;·&nbsp; {CLUB.categoria}
          </div>
        </div>

        {activeModule === "home" && <Home club={CLUB} athletes={athletes} historial={historial} stats={stats} onNavigate={setActiveModule} />}
        {activeModule === "entrenamiento" && <Entrenamiento athletes={athletes} setAthletes={setAthletes} historial={historial} onGuardar={guardarSesion} stats={stats} />}
        {activeModule === "plantilla" && <GestionPlantilla athletes={athletes} setAthletes={setAthletes} />}
      </div>
    </div>
  );
}
