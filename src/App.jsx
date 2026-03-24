/**
 * @component App v6
 * @description Componente raiz — solo routing y orquestacion.
 * Logica de negocio extraida a src/services/.
 *
 * @version 6.0
 * @author @Arquitecto (Julian)
 */

import { useState, useCallback } from "react";
import useLocalStorage from "./hooks/useLocalStorage";
import FieldBackground from "./components/FieldBackground";
import LandingPage from "./components/LandingPage";
import Home from "./components/Home";
import Entrenamiento from "./components/Entrenamiento";
import GestionPlantilla from "./components/GestionPlantilla";
import MiClub from "./components/MiClub";
import Administracion from "./components/Administracion";
import { EMPTY_ATHLETES, EMPTY_HISTORIAL, EMPTY_MATCH_STATS, EMPTY_FINANZAS } from "./constants/initialStates";
import { loadDemoState, loadProductionState, logout as logoutService, calcStats, buildSesion } from "./services/storageService";
import { takeHealthSnapshot, clearSnapshots } from "./services/healthService";

const DEFAULT_CLUB = { nombre:"", disciplina:"", ciudad:"", entrenador:"", temporada:"", categorias:[], campos:[], descripcion:"", telefono:"", email:"" };

export default function App() {
  const [mode, setMode]             = useLocalStorage("elevate_mode", null);
  const [activeModule, setActiveModule] = useState("home");
  const [athletes,   setAthletes]   = useLocalStorage("elevate_athletes",   EMPTY_ATHLETES);
  const [historial,  setHistorial]  = useLocalStorage("elevate_historial",  EMPTY_HISTORIAL);
  const [clubInfo,   setClubInfo]   = useLocalStorage("elevate_clubInfo",   DEFAULT_CLUB);
  const [matchStats, setMatchStats] = useLocalStorage("elevate_matchStats", EMPTY_MATCH_STATS);
  const [finanzas,   setFinanzas]   = useLocalStorage("elevate_finanzas",   EMPTY_FINANZAS);

  // ── Onboarding (delegado a storageService) ──
  const handleDemo = useCallback(() => {
    loadDemoState();
    // Re-sync React state from localStorage
    setAthletes(JSON.parse(localStorage.getItem("elevate_athletes")));
    setHistorial(JSON.parse(localStorage.getItem("elevate_historial")));
    setClubInfo(JSON.parse(localStorage.getItem("elevate_clubInfo")));
    setMatchStats(JSON.parse(localStorage.getItem("elevate_matchStats")));
    setFinanzas(JSON.parse(localStorage.getItem("elevate_finanzas")));
    setActiveModule("home");
    setMode("demo");
  }, [setAthletes, setHistorial, setClubInfo, setMatchStats, setFinanzas, setMode]);

  const handleRegister = useCallback((form) => {
    loadProductionState(form);
    setAthletes(EMPTY_ATHLETES);
    setHistorial(EMPTY_HISTORIAL);
    setClubInfo(JSON.parse(localStorage.getItem("elevate_clubInfo")));
    setMatchStats(EMPTY_MATCH_STATS);
    setFinanzas(EMPTY_FINANZAS);
    setActiveModule("home");
    setMode("production");
  }, [setAthletes, setHistorial, setClubInfo, setMatchStats, setFinanzas, setMode]);

  const handleLogout = useCallback(() => {
    logoutService();
    clearSnapshots();
    setAthletes(EMPTY_ATHLETES);
    setHistorial(EMPTY_HISTORIAL);
    setClubInfo(DEFAULT_CLUB);
    setMatchStats(EMPTY_MATCH_STATS);
    setFinanzas(EMPTY_FINANZAS);
    setActiveModule("home");
    setMode(null);
  }, [setAthletes, setHistorial, setClubInfo, setMatchStats, setFinanzas, setMode]);

  // ── Landing ──
  if (!mode) {
    return (
      <div style={{ minHeight:"100vh", background:"#050a14", position:"relative" }}>
        <FieldBackground />
        <LandingPage onDemo={handleDemo} onRegister={handleRegister} />
      </div>
    );
  }

  // ── Guardar sesion (usa buildSesion del service + healthSnapshot) ──
  const guardarSesion = (nota, tipo) => {
    const sesion = buildSesion(athletes, historial, nota, tipo);
    setHistorial(prev => [sesion, ...prev]);
    // Tomar snapshot de salud del plantel al cerrar sesion
    takeHealthSnapshot(athletes, [sesion, ...historial], sesion.num);
    alert(`Sesion #${sesion.num} guardada correctamente.`);
  };

  // ── Stats (delegado a service) ──
  const stats = calcStats(athletes, historial);
  const clubProps = { ...clubInfo, categoria: (clubInfo.categorias || [])[0] || "General" };

  // ── MiniTopbar ──
  const MiniTopbar = ({ title, accent = "#c8ff00", accentBg = "rgba(200,255,0,0.05)" }) => (
    <div style={{ height:38, background:"rgba(0,0,0,0.92)", borderBottom:`1px solid ${accent}33`, display:"flex", alignItems:"stretch" }}>
      <div onClick={() => setActiveModule("home")} style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", cursor:"pointer", borderRight:"1px solid rgba(255,255,255,0.08)" }}>
        ← Inicio
      </div>
      <div style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:"white", display:"flex", alignItems:"center", borderBottom:`2px solid ${accent}`, background:accentBg }}>
        {title}
      </div>
      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10, padding:"0 18px" }}>
        {mode === "demo" && (
          <div style={{ padding:"2px 8px", fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", background:"rgba(239,159,39,0.2)", color:"#EF9F27", border:"1px solid rgba(239,159,39,0.4)" }}>Demo</div>
        )}
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1px" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:accent, display:"inline-block", marginRight:6 }}/>
          {clubInfo.nombre || "Mi Club"} · {(clubInfo.categorias||[])[0]||"General"}
        </div>
      </div>
    </div>
  );

  // ── Routing ──
  return (
    <div style={{ minHeight:"100vh", background:"#050a14", position:"relative" }}>
      <FieldBackground />
      <div style={{ position:"relative", zIndex:2 }}>
        {activeModule === "home" && <Home club={clubProps} athletes={athletes} historial={historial} stats={stats} matchStats={matchStats} onNavigate={setActiveModule} mode={mode} onLogout={handleLogout} />}
        {activeModule === "entrenamiento" && <><MiniTopbar title="Entrenamiento" /><Entrenamiento athletes={athletes} setAthletes={setAthletes} historial={historial} onGuardar={guardarSesion} stats={stats} clubInfo={clubInfo} /></>}
        {activeModule === "plantilla" && <><MiniTopbar title="Gestion de plantilla" /><GestionPlantilla athletes={athletes} setAthletes={setAthletes} historial={historial} /></>}
        {activeModule === "miclub" && <><MiniTopbar title="Mi club" /><MiClub clubInfo={clubInfo} setClubInfo={setClubInfo} /></>}
        {activeModule === "admin" && <><MiniTopbar title="Administracion" accent="#7F77DD" accentBg="rgba(127,119,221,0.08)" /><Administracion athletes={athletes} finanzas={finanzas} setFinanzas={setFinanzas} /></>}
        {activeModule === "reportes" && <><MiniTopbar title="Reportes" /><Reportes athletes={athletes} historial={historial} matchStats={matchStats} finanzas={finanzas} /></>}
      </div>
    </div>
  );
}

// ── Reportes extraido como componente ──
function Reportes({ athletes, historial, matchStats, finanzas }) {
  const movs = finanzas.movimientos || [];
  const ingresos = movs.filter(m => m.tipo === "ingreso").reduce((s,m) => s+m.monto, 0);
  const egresos = movs.filter(m => m.tipo === "egreso").reduce((s,m) => s+m.monto, 0);
  const balance = ingresos - egresos;
  const pagados = (finanzas.pagos || []).filter(p => p.estado === "pagado").length;

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:20 }}>
        {[
          { label:"Jugadores", value:athletes.length, color:"#c8ff00" },
          { label:"Sesiones", value:historial.length, color:"#1D9E75" },
          { label:"Partidos", value:matchStats.played, color:"#7F77DD" },
        ].map((m,i) => (
          <div key={i} style={{ padding:"18px 20px", background:"rgba(0,0,0,0.7)", borderTop:`3px solid ${m.color}`, border:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.35)", marginBottom:8 }}>{m.label}</div>
            <div style={{ fontSize:32, fontWeight:700, color:m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:12 }}>
        <div style={{ background:"rgba(0,0,0,0.7)", border:"1px solid rgba(255,255,255,0.08)", padding:18 }}>
          <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.35)", marginBottom:14 }}>Record de partidos</div>
          <div style={{ display:"flex", gap:20 }}>
            {[{val:matchStats.won,lbl:"G",color:"#1D9E75"},{val:matchStats.drawn,lbl:"E",color:"rgba(255,255,255,0.5)"},{val:matchStats.lost,lbl:"P",color:"#E24B4A"}].map((s,i) => (
              <div key={i}><div style={{ fontSize:28, fontWeight:700, color:s.color }}>{s.val}</div><div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>{s.lbl}</div></div>
            ))}
          </div>
          <div style={{ marginTop:12, fontSize:11, color:"rgba(255,255,255,0.4)" }}>Goles: {matchStats.goalsFor}F / {matchStats.goalsAgainst}C · {matchStats.points} pts</div>
        </div>
        <div style={{ background:"rgba(0,0,0,0.7)", border:"1px solid rgba(255,255,255,0.08)", padding:18 }}>
          <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.35)", marginBottom:14 }}>Resumen financiero</div>
          <div style={{ display:"flex", gap:20, marginBottom:8 }}>
            <div><div style={{ fontSize:22, fontWeight:700, color: balance>=0?"#1D9E75":"#E24B4A" }}>${balance.toLocaleString("es-CO")}</div><div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>Balance</div></div>
            <div><div style={{ fontSize:22, fontWeight:700, color:"#7F77DD" }}>{pagados}/{athletes.length}</div><div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>Al dia</div></div>
          </div>
        </div>
      </div>
      <div style={{ marginTop:16, background:"rgba(0,0,0,0.7)", border:"1px solid rgba(255,255,255,0.08)", padding:18 }}>
        <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.35)", marginBottom:14 }}>Ultimas 5 sesiones</div>
        {historial.slice(0,5).map((s,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom: i<4?"1px solid rgba(255,255,255,0.06)":"none" }}>
            <div style={{ fontSize:12, color:"white" }}>#{s.num} — {s.fecha} <span style={{ color:"rgba(255,255,255,0.3)", fontSize:10 }}>({s.tipo})</span></div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{s.presentes}/{s.total} · RPE {s.rpeAvg ?? "\u2014"}</div>
          </div>
        ))}
        {historial.length===0 && <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>Sin sesiones registradas</div>}
      </div>
    </div>
  );
}
