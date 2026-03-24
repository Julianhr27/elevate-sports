/**
 * @component App v7 — Battle-Ready
 * @description Componente raiz resiliente:
 * - ErrorBoundary envuelve cada modulo
 * - React.lazy + Suspense para code-splitting
 * - Toast notifications (no alert)
 * - Schema migrations al boot
 *
 * @version 7.0
 * @author @Arquitecto (Julian)
 */

import { useState, useCallback, lazy, Suspense } from "react";
import useLocalStorage from "./hooks/useLocalStorage";
import FieldBackground from "./components/FieldBackground";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastContainer, { showToast } from "./components/Toast";
import { EMPTY_ATHLETES, EMPTY_HISTORIAL, EMPTY_MATCH_STATS, EMPTY_FINANZAS } from "./constants/initialStates";
import { loadDemoState, loadProductionState, logout as logoutService, calcStats, buildSesion } from "./services/storageService";
import { takeHealthSnapshot, clearSnapshots } from "./services/healthService";
import { runMigrations } from "./services/migrationService";
import { PALETTE as C } from "./constants/palette";

// ── React.lazy: code-splitting por modulo ──
const LandingPage = lazy(() => import("./components/LandingPage"));
const Home = lazy(() => import("./components/Home"));
const Entrenamiento = lazy(() => import("./components/Entrenamiento"));
const GestionPlantilla = lazy(() => import("./components/GestionPlantilla"));
const MiClub = lazy(() => import("./components/MiClub"));
const Administracion = lazy(() => import("./components/Administracion"));

// ── Ejecutar migraciones al boot ──
const migrationResult = runMigrations();
if (migrationResult.migrated) {
  console.info(`[migrations] ${migrationResult.steps} migration(s): ${migrationResult.from} → ${migrationResult.to}`);
}

// ── Loading fallback ──
const LoadingFallback = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
    <div style={{ textAlign:"center" }}>
      <div style={{ width:24, height:24, border:`2px solid ${C.neon}`, borderTop:"2px solid transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
      <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase", letterSpacing:"2px" }}>Cargando</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  </div>
);

const DEFAULT_CLUB = { nombre:"", disciplina:"", ciudad:"", entrenador:"", temporada:"", categorias:[], campos:[], descripcion:"", telefono:"", email:"" };

export default function App() {
  const [mode, setMode] = useLocalStorage("elevate_mode", null);
  const [activeModule, setActiveModule] = useState("home");
  const [athletes, setAthletes] = useLocalStorage("elevate_athletes", EMPTY_ATHLETES);
  const [historial, setHistorial] = useLocalStorage("elevate_historial", EMPTY_HISTORIAL);
  const [clubInfo, setClubInfo] = useLocalStorage("elevate_clubInfo", DEFAULT_CLUB);
  const [matchStats, setMatchStats] = useLocalStorage("elevate_matchStats", EMPTY_MATCH_STATS);
  const [finanzas, setFinanzas] = useLocalStorage("elevate_finanzas", EMPTY_FINANZAS);

  const handleDemo = useCallback(() => {
    loadDemoState();
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
        <ToastContainer />
        <Suspense fallback={<LoadingFallback />}>
          <LandingPage onDemo={handleDemo} onRegister={handleRegister} />
        </Suspense>
      </div>
    );
  }

  // ── Guardar sesion con Toast (no alert) ──
  const guardarSesion = (nota, tipo) => {
    const sesion = buildSesion(athletes, historial, nota, tipo);
    setHistorial(prev => [sesion, ...prev]);
    takeHealthSnapshot(athletes, [sesion, ...historial], sesion.num);
    showToast(`Sesion #${sesion.num} guardada correctamente`, "success");
  };

  const stats = calcStats(athletes, historial);
  const clubProps = { ...clubInfo, categoria: (clubInfo.categorias || [])[0] || "General" };

  const MiniTopbar = ({ title, accent = C.neon, accentBg = "rgba(200,255,0,0.05)" }) => (
    <div style={{ height:38, background:"rgba(0,0,0,0.92)", borderBottom:`1px solid ${accent}33`, display:"flex", alignItems:"stretch" }}>
      <div onClick={() => setActiveModule("home")} style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:C.textMuted, display:"flex", alignItems:"center", cursor:"pointer", borderRight:`1px solid ${C.border}` }}>
        ← Inicio
      </div>
      <div style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:"white", display:"flex", alignItems:"center", borderBottom:`2px solid ${accent}`, background:accentBg }}>
        {title}
      </div>
      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10, padding:"0 18px" }}>
        {mode === "demo" && (
          <div style={{ padding:"2px 8px", fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", background:`${C.amber}33`, color:C.amber, border:`1px solid ${C.amber}66` }}>Demo</div>
        )}
        <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase", letterSpacing:"1px" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:accent, display:"inline-block", marginRight:6 }}/>
          {clubInfo.nombre || "Mi Club"} · {(clubInfo.categorias||[])[0]||"General"}
        </div>
      </div>
    </div>
  );

  // ── Routing con ErrorBoundary + Suspense por modulo ──
  return (
    <div style={{ minHeight:"100vh", background:C.bg, position:"relative" }}>
      <FieldBackground />
      <ToastContainer />
      <div style={{ position:"relative", zIndex:2 }}>
        <Suspense fallback={<LoadingFallback />}>

          {activeModule === "home" && (
            <ErrorBoundary>
              <Home club={clubProps} athletes={athletes} historial={historial} stats={stats} matchStats={matchStats} onNavigate={setActiveModule} mode={mode} onLogout={handleLogout} />
            </ErrorBoundary>
          )}

          {activeModule === "entrenamiento" && (
            <ErrorBoundary>
              <MiniTopbar title="Entrenamiento" />
              <Entrenamiento athletes={athletes} setAthletes={setAthletes} historial={historial} onGuardar={guardarSesion} stats={stats} clubInfo={clubInfo} />
            </ErrorBoundary>
          )}

          {activeModule === "plantilla" && (
            <ErrorBoundary>
              <MiniTopbar title="Gestion de plantilla" />
              <GestionPlantilla athletes={athletes} setAthletes={setAthletes} historial={historial} />
            </ErrorBoundary>
          )}

          {activeModule === "miclub" && (
            <ErrorBoundary>
              <MiniTopbar title="Mi club" />
              <MiClub clubInfo={clubInfo} setClubInfo={setClubInfo} />
            </ErrorBoundary>
          )}

          {activeModule === "admin" && (
            <ErrorBoundary>
              <MiniTopbar title="Administracion" accent={C.purple} accentBg="rgba(127,119,221,0.08)" />
              <Administracion athletes={athletes} finanzas={finanzas} setFinanzas={setFinanzas} />
            </ErrorBoundary>
          )}

          {activeModule === "reportes" && (
            <ErrorBoundary>
              <MiniTopbar title="Reportes" />
              <Reportes athletes={athletes} historial={historial} matchStats={matchStats} finanzas={finanzas} />
            </ErrorBoundary>
          )}

        </Suspense>
      </div>
    </div>
  );
}

function Reportes({ athletes, historial, matchStats, finanzas }) {
  const movs = finanzas.movimientos || [];
  const ingresos = movs.filter(m => m.tipo === "ingreso").reduce((s,m) => s+m.monto, 0);
  const egresos = movs.filter(m => m.tipo === "egreso").reduce((s,m) => s+m.monto, 0);
  const balance = ingresos - egresos;
  const pagados = (finanzas.pagos || []).filter(p => p.estado === "pagado").length;

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:20 }}>
        {[
          { label:"Jugadores", value:athletes.length, color:C.neon },
          { label:"Sesiones", value:historial.length, color:C.green },
          { label:"Partidos", value:matchStats.played, color:C.purple },
        ].map((m,i) => (
          <div key={i} style={{ padding:"18px 20px", background:"rgba(0,0,0,0.7)", borderTop:`3px solid ${m.color}`, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:C.textMuted, marginBottom:8 }}>{m.label}</div>
            <div style={{ fontSize:32, fontWeight:700, color:m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:12 }}>
        <div style={{ background:"rgba(0,0,0,0.7)", border:`1px solid ${C.border}`, padding:18 }}>
          <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:C.textMuted, marginBottom:14 }}>Record de partidos</div>
          <div style={{ display:"flex", gap:20 }}>
            {[{val:matchStats.won,lbl:"G",color:C.green},{val:matchStats.drawn,lbl:"E",color:"rgba(255,255,255,0.5)"},{val:matchStats.lost,lbl:"P",color:C.danger}].map((s,i) => (
              <div key={i}><div style={{ fontSize:28, fontWeight:700, color:s.color }}>{s.val}</div><div style={{ fontSize:9, color:C.textMuted, textTransform:"uppercase" }}>{s.lbl}</div></div>
            ))}
          </div>
        </div>
        <div style={{ background:"rgba(0,0,0,0.7)", border:`1px solid ${C.border}`, padding:18 }}>
          <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:C.textMuted, marginBottom:14 }}>Resumen financiero</div>
          <div style={{ display:"flex", gap:20 }}>
            <div><div style={{ fontSize:22, fontWeight:700, color: balance>=0?C.green:C.danger }}>${balance.toLocaleString("es-CO")}</div><div style={{ fontSize:9, color:C.textMuted, textTransform:"uppercase" }}>Balance</div></div>
            <div><div style={{ fontSize:22, fontWeight:700, color:C.purple }}>{pagados}/{athletes.length}</div><div style={{ fontSize:9, color:C.textMuted, textTransform:"uppercase" }}>Al dia</div></div>
          </div>
        </div>
      </div>
      <div style={{ marginTop:16, background:"rgba(0,0,0,0.7)", border:`1px solid ${C.border}`, padding:18 }}>
        <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"2px", color:C.textMuted, marginBottom:14 }}>Ultimas 5 sesiones</div>
        {historial.slice(0,5).map((s,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom: i<4?`1px solid ${C.border}`:"none", flexWrap:"wrap", gap:4 }}>
            <div style={{ fontSize:12, color:"white" }}>#{s.num} — {s.fecha} <span style={{ color:C.textMuted, fontSize:10 }}>({s.tipo})</span></div>
            <div style={{ fontSize:11, color:C.textMuted }}>{s.presentes}/{s.total} · RPE {s.rpeAvg ?? "\u2014"}</div>
          </div>
        ))}
        {historial.length===0 && <div style={{ fontSize:11, color:C.textHint }}>Sin sesiones registradas</div>}
      </div>
    </div>
  );
}
