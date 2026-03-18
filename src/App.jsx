import { useState } from "react";
import Cancha from "./components/Cancha";
import Plantel from "./components/Plantel";
import Analisis from "./components/Analisis";
import Historial from "./components/Historial";

const TABS = ["Cancha", "Plantel", "Análisis", "Historial"];

const initialAthletes = [
  { name: "Carlos Ríos", pos: "Delantero", dob: "2008-03-12", contact: "300 111 2233", status: "P", rpe: null },
  { name: "Andrés Mena", pos: "Mediocampista", dob: "2007-11-05", contact: "311 223 3344", status: "P", rpe: null },
  { name: "Sebastián Gil", pos: "Defensa", dob: "2008-06-20", contact: "320 334 4455", status: "A", rpe: null },
  { name: "Miguel Torres", pos: "Portero", dob: "2007-09-15", contact: "315 445 5566", status: "P", rpe: null },
  { name: "Julián Pérez", pos: "Delantero", dob: "2009-01-30", contact: "312 556 6677", status: "L", rpe: null },
  { name: "David Cano", pos: "Mediocampista", dob: "2008-07-08", contact: "318 667 7788", status: "P", rpe: null },
  { name: "Felipe Ruiz", pos: "Defensa", dob: "2007-12-22", contact: "314 778 8899", status: "P", rpe: null },
  { name: "Tomás Vera", pos: "Mediocampista", dob: "2009-04-17", contact: "316 889 9900", status: "P", rpe: null },
];

const initialHistorial = [
  { num: 13, fecha: "Sáb 15 Mar", presentes: 16, total: 18, rpeAvg: 8.1, tipo: "Físico", nota: "Buena respuesta al trabajo de fuerza." },
  { num: 12, fecha: "Jue 13 Mar", presentes: 15, total: 18, rpeAvg: 6.4, tipo: "Recuperación", nota: "Sesión suave post competencia." },
  { num: 11, fecha: "Mar 11 Mar", presentes: 13, total: 18, rpeAvg: 9.2, tipo: "Partido", nota: "Alta intensidad. Revisar carga semana próxima." },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("Cancha");
  const [athletes, setAthletes] = useState(initialAthletes);
  const [historial, setHistorial] = useState(initialHistorial);

  const guardarSesion = (nota) => {
    const p = athletes.filter((a) => a.status === "P");
    const rpes = p.filter((a) => a.rpe).map((a) => a.rpe);
    const avg = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : null;
    const num = historial.length > 0 ? historial[0].num + 1 : 1;
    const hoy = new Date();
    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const fecha = `${dias[hoy.getDay()]} ${hoy.getDate()} ${meses[hoy.getMonth()]}`;
    setHistorial([{ num, fecha, presentes: p.length, total: athletes.length, rpeAvg: avg, tipo: "Sesión", nota }, ...historial]);
    alert("Sesión #" + num + " guardada correctamente.");
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.3px" }}>
          Elevate <span style={{ color: "#1D9E75" }}>Sports</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, background: "#E1F5EE", color: "#0F6E56", padding: "4px 12px", borderRadius: 20 }}>
            Sub-17 Fútbol
          </span>
          <span style={{ fontSize: 12, color: "#888" }}>{athletes.length} deportistas</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem", overflowX: "auto" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontSize: 13, padding: "8px 16px", cursor: "pointer", background: "transparent",
              border: "none", borderBottom: activeTab === tab ? "2px solid #1D9E75" : "2px solid transparent",
              color: activeTab === tab ? "#1D9E75" : "#6b7280", fontWeight: activeTab === tab ? 500 : 400,
              whiteSpace: "nowrap",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "Cancha" && <Cancha athletes={athletes} setAthletes={setAthletes} onGuardar={guardarSesion} />}
      {activeTab === "Plantel" && <Plantel athletes={athletes} setAthletes={setAthletes} />}
      {activeTab === "Análisis" && <Analisis athletes={athletes} historial={historial} />}
      {activeTab === "Historial" && <Historial historial={historial} />}
    </div>
  );
}
