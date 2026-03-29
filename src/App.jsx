/**
 * @component App v8 — Auth-Ready
 * @description Componente raiz resiliente:
 * - Supabase Auth (email/password) para login/registro
 * - ErrorBoundary envuelve cada modulo
 * - React.lazy + Suspense para code-splitting
 * - Toast notifications (no alert)
 * - Schema migrations al boot
 *
 * @version 8.0
 * @author @Arquitecto (Julian) + @Data (Mateo) v2 Auth
 */

import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import useLocalStorage, { setHookErrorHandler } from "./hooks/useLocalStorage";
import FieldBackground from "./components/FieldBackground";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastContainer, { showToast } from "./components/Toast";
import { EMPTY_ATHLETES, EMPTY_HISTORIAL, EMPTY_MATCH_STATS, EMPTY_FINANZAS } from "./constants/initialStates";
import {
  loadDemoState, loadProductionState, logout as logoutService, calcStats, buildSesion,
  setStorageErrorHandler,
} from "./services/storageService";
import { takeHealthSnapshot, clearSnapshots, setHealthErrorHandler, setHealthClubId } from "./services/healthService";
import { runMigrations } from "./services/migrationService";
import { PALETTE as C } from "./constants/palette";
import { SESSION_KEY, createSession, validateSession, canAccessModule } from "./constants/roles";
import { setValidationErrorHandler } from "./constants/schemas";
import useSupabaseSync from "./hooks/useSupabaseSync";
import { isSupabaseReady } from "./lib/supabase";
import { createClub as sbCreateClub, setClubId, setSupabaseErrorHandler, migrateLocalToSupabase, loadClubIdFromProfile } from "./services/supabaseService";
import { exportBackupJSON } from "./services/backupService";
import { signUp, signIn, signOut as authSignOut, getProfile, onAuthStateChange, setAuthErrorHandler, linkProfileToClub } from "./services/authService";
import OfflineBanner from "./components/ui/OfflineBanner";
import UpdateToast from "./components/ui/UpdateToast";

// ── React.lazy: code-splitting por modulo ──
const PortalLayout = lazy(() => import("./components/portal/PortalLayout"));
const PortalHome = lazy(() => import("./components/portal/PortalHome"));
const SportsCRMPage = lazy(() => import("./components/portal/SportsCRMPage"));
const JournalPage = lazy(() => import("./components/portal/JournalPage"));
const QuienesSomos = lazy(() => import("./components/portal/QuienesSomos"));
const Contacto = lazy(() => import("./components/portal/Contacto"));
const PrivacyPolicy = lazy(() => import("./components/portal/PrivacyPolicy"));
const CommercialLanding = lazy(() => import("./components/CommercialLanding"));
const LandingPage = lazy(() => import("./components/LandingPage"));
const Home = lazy(() => import("./components/Home"));
const Entrenamiento = lazy(() => import("./components/Entrenamiento"));
const GestionPlantilla = lazy(() => import("./components/GestionPlantilla"));
const MiClub = lazy(() => import("./components/MiClub"));
const Administracion = lazy(() => import("./components/Administracion"));
const Calendario     = lazy(() => import("./components/Calendario"));

// ── Conectar handlers de error de storage al boot (antes de que cualquier hook escriba) ──
const _toastError = (msg) => showToast(msg, "error");
setStorageErrorHandler(_toastError);
setHookErrorHandler(_toastError);
setHealthErrorHandler(_toastError);
setValidationErrorHandler(_toastError);
setSupabaseErrorHandler(_toastError);
setAuthErrorHandler(_toastError);

// ── Ejecutar migraciones al boot ──
const migrationResult = runMigrations();
// Migration result tracked internally — no console output in production

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

// ── Root: BrowserRouter wrapper ──
export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Portal Corporativo — rutas con navbar compartida */}
        <Route element={<Suspense fallback={<LoadingFallback />}><PortalLayout /></Suspense>}>
          <Route index element={<PortalHome />} />
          <Route path="quienes-somos" element={<QuienesSomos />} />
          <Route path="contacto" element={<Contacto />} />
          <Route path="servicios/sports-crm" element={<SportsCRMPage />} />
          <Route path="journal" element={<JournalPage />} />
        </Route>
        {/* Politica de Privacidad — publica, sin navbar del portal */}
        <Route
          path="/privacidad"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PrivacyPolicy />
            </Suspense>
          }
        />
        {/* CRM App — sistema de gestion deportiva */}
        <Route path="/crm/*" element={<CRMApp />} />
      </Routes>
    </BrowserRouter>
  );
}

// ── CRM App: todo el sistema de gestion deportiva ──
function CRMApp() {
  const navigate = useNavigate();
  const [mode, setMode] = useLocalStorage("elevate_mode", null);
  const [session, setSession] = useLocalStorage(SESSION_KEY, null);
  const [activeModule, setActiveModule] = useState("home");
  const [athletes, setAthletes] = useLocalStorage("elevate_athletes", EMPTY_ATHLETES);
  const [historial, setHistorial] = useLocalStorage("elevate_historial", EMPTY_HISTORIAL);
  const [clubInfo, setClubInfo] = useLocalStorage("elevate_clubInfo", DEFAULT_CLUB);
  const [matchStats, setMatchStats] = useLocalStorage("elevate_matchStats", EMPTY_MATCH_STATS);
  const [finanzas, setFinanzas] = useLocalStorage("elevate_finanzas", EMPTY_FINANZAS);

  // Supabase sync: carga datos de la nube al montar (offline-first)
  const { syncSession, syncHealthSnapshots } = useSupabaseSync({
    setAthletes, setHistorial, setClubInfo, setMatchStats, setFinanzas, mode,
  });

  // Auth state: perfil de Supabase (club_id + role)
  const [authProfile, setAuthProfile] = useState(null);

  // Listener de auth: detecta login/logout/token refresh
  useEffect(() => {
    if (!isSupabaseReady) return;
    const sub = onAuthStateChange(async (event, authSession) => {
      if (event === "SIGNED_IN" && authSession) {
        const profile = await getProfile();
        setAuthProfile(profile);
        if (profile?.club_id) {
          setClubId(profile.club_id);
          setHealthClubId(profile.club_id); // aislar snapshots por club en dispositivo compartido
          await loadClubIdFromProfile();
        }
      } else if (event === "SIGNED_OUT") {
        setAuthProfile(null);
      }
    });
    // Cargar profile si ya hay sesion activa al boot
    (async () => {
      const profile = await getProfile();
      if (profile) {
        setAuthProfile(profile);
        if (profile.club_id) {
          setClubId(profile.club_id);
          setHealthClubId(profile.club_id); // aislar snapshots por club al recargar pagina
        }
      }
    })();
    return () => sub.unsubscribe();
  }, []);

  // Role: prioridad auth profile > localStorage session > fallback admin
  const userRole = authProfile?.role
    || ((session && validateSession(session)) ? session.role : "admin");

  // Navegación con control de acceso por rol
  const navigateTo = useCallback((mod) => {
    if (!canAccessModule(userRole, mod)) {
      showToast(`Acceso denegado: tu rol (${userRole}) no tiene permisos para ${mod}`, "warning");
      return;
    }
    setActiveModule(mod);
  }, [userRole]);

  const handleDemo = useCallback(() => {
    loadDemoState();
    const demoSession = createSession("admin", "Demo User");
    setSession(demoSession);
    const demoAthletes = JSON.parse(localStorage.getItem("elevate_athletes"));
    const demoHistorial = JSON.parse(localStorage.getItem("elevate_historial"));
    const demoClubInfo = JSON.parse(localStorage.getItem("elevate_clubInfo"));
    const demoMatchStats = JSON.parse(localStorage.getItem("elevate_matchStats"));
    const demoFinanzas = JSON.parse(localStorage.getItem("elevate_finanzas"));
    setAthletes(demoAthletes);
    setHistorial(demoHistorial);
    setClubInfo(demoClubInfo);
    setMatchStats(demoMatchStats);
    setFinanzas(demoFinanzas);
    setActiveModule("home");
    setMode("demo");
    // Sync demo data to Supabase in background
    if (isSupabaseReady) {
      migrateLocalToSupabase({
        clubInfo: demoClubInfo, athletes: demoAthletes, historial: demoHistorial,
        finanzas: demoFinanzas, matchStats: demoMatchStats, mode: "demo",
      }).then(r => r.success && showToast("Datos demo sincronizados con la nube", "info"));
    }
  }, [setAthletes, setHistorial, setClubInfo, setMatchStats, setFinanzas, setMode, setSession]);

  const handleRegister = useCallback(async (form) => {
    // 1. Registrar en Supabase Auth (si disponible)
    if (isSupabaseReady && form.email && form.password) {
      const { user, error } = await signUp({
        email: form.email,
        password: form.password,
        fullName: form.entrenador,
        role: form.role || "admin",
      });
      if (error) {
        showToast(error, "error");
        return;
      }
      if (user) {
        showToast("Cuenta creada. Revisa tu email para confirmar.", "info");
      }
    }

    // 2. Configurar estado local (offline-first)
    loadProductionState(form);
    const newSession = createSession(form.role || "admin", form.entrenador);
    setSession(newSession);
    setAthletes(EMPTY_ATHLETES);
    setHistorial(EMPTY_HISTORIAL);
    const newClubInfo = JSON.parse(localStorage.getItem("elevate_clubInfo"));
    setClubInfo(newClubInfo);
    setMatchStats(EMPTY_MATCH_STATS);
    setFinanzas(EMPTY_FINANZAS);
    setActiveModule("home");
    setMode("production");

    // 3. Crear club en Supabase y vincular al profile
    if (isSupabaseReady) {
      const clubId = await sbCreateClub(form, "production");
      if (clubId) {
        await linkProfileToClub(clubId);
        showToast("Club creado en la nube", "info");
      }
    }
  }, [setAthletes, setHistorial, setClubInfo, setMatchStats, setFinanzas, setMode, setSession]);

  const handleLogin = useCallback(async ({ email, password }) => {
    if (!isSupabaseReady) {
      showToast("Supabase no disponible — usa modo demo", "warning");
      return;
    }
    const { user, error } = await signIn(email, password);
    if (error) {
      showToast(error, "error");
      return;
    }

    // Cargar profile y club_id
    const profile = await getProfile();
    if (!profile?.club_id) {
      showToast("No se encontro un club asociado a tu cuenta", "warning");
      return;
    }
    setAuthProfile(profile);
    setClubId(profile.club_id);
    setHealthClubId(profile.club_id); // aislar snapshots por club en dispositivo compartido

    // Configurar sesion local (compatibilidad)
    const localSession = createSession(profile.role || "admin", profile.full_name || user.email);
    setSession(localSession);
    setMode("production");
    setActiveModule("home");
    showToast(`Bienvenido, ${profile.full_name || user.email}`, "success");
  }, [setSession, setMode]);

  const handleLogout = useCallback(async () => {
    // Cerrar sesion Supabase Auth
    if (isSupabaseReady) await authSignOut();
    setAuthProfile(null);
    logoutService();
    clearSnapshots();
    setClubId(null);
    setSession(null);
    setAthletes(EMPTY_ATHLETES);
    setHistorial(EMPTY_HISTORIAL);
    setClubInfo(DEFAULT_CLUB);
    setMatchStats(EMPTY_MATCH_STATS);
    setFinanzas(EMPTY_FINANZAS);
    setActiveModule("home");
    setMode(null);
    navigate("/");
  }, [setAthletes, setHistorial, setClubInfo, setMatchStats, setFinanzas, setMode, setSession, navigate]);

  // Auto-demo: si llegan desde el portal con ?demo=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "true" && !mode) {
      handleDemo();
      window.history.replaceState({}, "", "/crm");
    }
  }, []);

  // ── Landing: directo al formulario de login/registro ──
  if (!mode) {
    return (
      <div style={{ minHeight:"100vh", background:"#050a14", position:"relative" }}>
        <FieldBackground />
        <ToastContainer />
        <OfflineBanner />
        <UpdateToast />
        <Suspense fallback={<LoadingFallback />}>
          <LandingPage onDemo={handleDemo} onRegister={handleRegister} onLogin={handleLogin} />
        </Suspense>
      </div>
    );
  }

  // ── Guardar sesion: localStorage inmediato + Supabase en background ──
  const guardarSesion = (nota, tipo) => {
    const sesion = buildSesion(athletes, historial, nota, tipo);
    if (!sesion) {
      showToast("No se pudo guardar la sesion — datos invalidos", "error");
      return;
    }
    setHistorial(prev => [sesion, ...prev]);
    const snapshots = takeHealthSnapshot(athletes, [sesion, ...historial], sesion.num);
    showToast(`Sesion #${sesion.num} guardada correctamente`, "success");
    // Sync to Supabase (fire-and-forget)
    syncSession(sesion);
    if (snapshots?.length) syncHealthSnapshots(snapshots);
  };

  const stats = calcStats(athletes, historial);
  const clubProps = { ...clubInfo, categoria: (clubInfo.categorias || [])[0] || "General" };

  const MiniTopbar = ({ title, accent = C.neon, accentBg = "rgba(200,255,0,0.05)" }) => (
    <div style={{ height:38, background:"rgba(10,10,15,0.85)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${accent}33`, display:"flex", alignItems:"stretch" }}>
      <div onClick={() => setActiveModule("home")} style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:C.textMuted, display:"flex", alignItems:"center", cursor:"pointer", borderRight:`1px solid ${C.border}`, transition:"color 0.15s" }} onMouseEnter={e=>e.currentTarget.style.color="white"} onMouseLeave={e=>e.currentTarget.style.color=C.textMuted}>
        ← Dashboard
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
      <OfflineBanner />
      <UpdateToast />
      <div style={{ position:"relative", zIndex:2 }}>
        <Suspense fallback={<LoadingFallback />}>

          {activeModule === "home" && (
            <ErrorBoundary>
              <Home club={clubProps} athletes={athletes} historial={historial} stats={stats} matchStats={matchStats} onNavigate={navigateTo} mode={mode} onLogout={handleLogout} userRole={userRole} onExportBackup={() => { exportBackupJSON(); showToast("Backup descargado correctamente", "success"); }} />
            </ErrorBoundary>
          )}

          {activeModule === "entrenamiento" && (
            <ErrorBoundary>
              <MiniTopbar title="Entrenamiento" />
              <Entrenamiento athletes={athletes} setAthletes={setAthletes} historial={historial} onGuardar={guardarSesion} stats={stats} clubInfo={clubInfo} clubId={authProfile?.club_id || ""} />
            </ErrorBoundary>
          )}

          {activeModule === "plantilla" && (
            <ErrorBoundary>
              <MiniTopbar title="Gestion de plantilla" />
              <GestionPlantilla athletes={athletes} setAthletes={setAthletes} historial={historial} clubId={authProfile?.club_id || ""} />
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

          {activeModule === "calendario" && (
            <ErrorBoundary>
              <MiniTopbar title="Calendario" accent={C.neon} accentBg="rgba(200,255,0,0.05)" />
              <Calendario athletes={athletes} clubId={authProfile?.club_id || ""} />
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
