/**
 * @component App
 * @description Componente raíz de Elevate Sports.
 * Gestiona el estado global, el enrutamiento entre módulos
 * y provee el contexto de datos a todos los componentes hijo.
 *
 * @architecture
 * App (estado global)
 * ├── Home          → pantalla principal con mosaicos FIFA
 * ├── Entrenamiento → asistencia, RPE, planificación, historial
 * ├── GestionPlantilla → pizarra táctica y gestión del plantel
 * └── MiClub        → configuración del club, categorías y campos
 *
 * @state
 * - activeModule  {string}  Módulo activo (home | entrenamiento | plantilla | miclub)
 * - athletes      {Array}   Plantel completo con estado, RPE y datos personales
 * - historial     {Array}   Sesiones registradas con métricas
 * - clubInfo      {Object}  Configuración del club (nombre, categorías, campos, etc.)
 *
 * @notes
 * - El topbar/navegación principal vive en Home.jsx (no aquí)
 *   para mantener la estética FIFA sin duplicar la barra.
 * - Los módulos Administración y Reportes están en construcción.
 * - La función guardarSesion calcula automáticamente el RPE promedio.
 *
 * @version 4.0
 * @author Elevate Sports
 */

import { useState } from "react";
import FieldBackground from "./components/FieldBackground";
import Home from "./components/Home";
import Entrenamiento from "./components/Entrenamiento";
import GestionPlantilla from "./components/GestionPlantilla";
import MiClub from "./components/MiClub";

// ─────────────────────────────────────────────
// DATOS INICIALES DEL PLANTEL
// En producción estos datos vendrán de Supabase.
// Estructura: { id, name, pos, posCode, dob, contact,
//               status (P|A|L), rpe, photo, available }
// ─────────────────────────────────────────────
const INITIAL_ATHLETES = [
  { id:1,  name:"Carlos Ríos",    pos:"Delantero",     posCode:"ST", dob:"2008-03-12", contact:"300 111 2233", status:"P", rpe:8,    photo:"carlos",    available:true  },
  { id:2,  name:"David Cano",     pos:"Mediocampista", posCode:"CM", dob:"2008-07-08", contact:"318 667 7788", status:"P", rpe:7,    photo:"david",     available:true  },
  { id:3,  name:"Miguel Torres",  pos:"Portero",       posCode:"GK", dob:"2007-09-15", contact:"315 445 5566", status:"P", rpe:6,    photo:"miguel",    available:true  },
  { id:4,  name:"Felipe Ruiz",    pos:"Defensa",       posCode:"LB", dob:"2007-12-22", contact:"314 778 8899", status:"P", rpe:9,    photo:"felipe",    available:true  },
  { id:5,  name:"Pablo Vargas",   pos:"Mediocampista", posCode:"CM", dob:"2008-05-10", contact:"312 334 5566", status:"P", rpe:8,    photo:"pablo",     available:true  },
  { id:6,  name:"Roberto Castro", pos:"Defensa",       posCode:"CB", dob:"2008-01-22", contact:"311 445 6677", status:"P", rpe:7,    photo:"roberto",   available:true  },
  { id:7,  name:"Héctor Díaz",    pos:"Defensa",       posCode:"RB", dob:"2007-08-14", contact:"310 556 7788", status:"P", rpe:5,    photo:"hector",    available:true  },
  { id:8,  name:"Nicolás Ossa",   pos:"Delantero",     posCode:"LW", dob:"2008-11-03", contact:"313 667 8899", status:"P", rpe:7,    photo:"nicolas",   available:true  },
  { id:9,  name:"Kevin Pinto",    pos:"Delantero",     posCode:"RW", dob:"2009-02-18", contact:"317 778 9900", status:"P", rpe:6,    photo:"kevin",     available:true  },
  { id:10, name:"Luis Mora",      pos:"Defensa",       posCode:"CB", dob:"2008-04-25", contact:"316 889 0011", status:"P", rpe:7,    photo:"luis",      available:true  },
  { id:11, name:"Edgar Largo",    pos:"Mediocampista", posCode:"CM", dob:"2007-06-30", contact:"319 990 1122", status:"P", rpe:null, photo:"edgar",     available:true  },
  { id:12, name:"Andrés Mena",    pos:"Mediocampista", posCode:"CM", dob:"2007-11-05", contact:"311 223 3344", status:"P", rpe:null, photo:"andres",    available:true  },
  { id:13, name:"Sebastián Gil",  pos:"Defensa",       posCode:"CB", dob:"2008-06-20", contact:"320 334 4455", status:"A", rpe:null, photo:"sebastian", available:false },
  { id:14, name:"Tomás Vera",     pos:"Mediocampista", posCode:"CM", dob:"2009-04-17", contact:"316 889 9900", status:"A", rpe:null, photo:"tomas",     available:false },
  { id:15, name:"Julián Pérez",   pos:"Delantero",     posCode:"ST", dob:"2009-01-30", contact:"312 556 6677", status:"L", rpe:null, photo:"julian",    available:false },
];

// ─────────────────────────────────────────────
// HISTORIAL DE SESIONES INICIAL
// En producción vendrá de Supabase.
// ─────────────────────────────────────────────
const INITIAL_HISTORIAL = [
  { num:14, fecha:"Mar 18 Mar", presentes:14, total:18, rpeAvg:7.2, tipo:"Táctica",      nota:"Buena respuesta al pressing alto."              },
  { num:13, fecha:"Sáb 15 Mar", presentes:16, total:18, rpeAvg:8.1, tipo:"Físico",       nota:"Buena respuesta al trabajo de fuerza."           },
  { num:12, fecha:"Jue 13 Mar", presentes:15, total:18, rpeAvg:6.4, tipo:"Recuperación", nota:"Sesión suave post competencia."                  },
  { num:11, fecha:"Mar 11 Mar", presentes:13, total:18, rpeAvg:9.2, tipo:"Partido",      nota:"Alta intensidad. Revisar carga semana próxima."  },
  { num:10, fecha:"Sáb 08 Mar", presentes:17, total:18, rpeAvg:7.8, tipo:"Físico",       nota:"Excelente disposición del grupo."                },
];

export default function App() {
  // ── Estado global ──────────────────────────
  const [activeModule, setActiveModule] = useState("home");
  const [athletes,     setAthletes]     = useState(INITIAL_ATHLETES);
  const [historial,    setHistorial]    = useState(INITIAL_HISTORIAL);
  const [clubInfo,     setClubInfo]     = useState({
    nombre:      "Águilas de Lucero",
    disciplina:  "Fútbol",
    ciudad:      "Medellín",
    entrenador:  "Juan Felipe Cuervo",
    temporada:   "2025-26",
    categorias:  ["Sub-17"],
    campos:      ["Campo principal", "Campo auxiliar"],
    descripcion: "",
    telefono:    "",
    email:       "",
  });

  // ── Guardar sesión ─────────────────────────
  /**
   * Registra una nueva sesión en el historial.
   * Calcula automáticamente el RPE promedio de los jugadores presentes.
   * @param {string} nota  - Nota general del entrenador
   * @param {string} tipo  - Tipo de sesión (Táctica | Físico | Recuperación | Partido)
   */
  const guardarSesion = (nota, tipo) => {
    const presentes = athletes.filter(a => a.status === "P");
    const rpesValidos = presentes.filter(a => a.rpe).map(a => a.rpe);
    const rpePromedio = rpesValidos.length
      ? (rpesValidos.reduce((acc, v) => acc + v, 0) / rpesValidos.length).toFixed(1)
      : null;

    const num = historial.length > 0 ? historial[0].num + 1 : 1;
    const hoy = new Date();
    const dias   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const meses  = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const fecha  = `${dias[hoy.getDay()]} ${hoy.getDate()} ${meses[hoy.getMonth()]}`;

    setHistorial(prev => [{
      num,
      fecha,
      presentes: presentes.length,
      total:     athletes.length,
      rpeAvg:    rpePromedio,
      tipo:      tipo || "Sesión",
      nota,
    }, ...prev]);

    alert(`Sesión #${num} guardada correctamente.`);
  };

  // ── Métricas calculadas ────────────────────
  /**
   * Objeto de KPIs calculados en tiempo real desde el estado.
   * Se pasa como prop a Home y Entrenamiento.
   */
  const stats = {
    presentes:  athletes.filter(a => a.status === "P").length,
    ausentes:   athletes.filter(a => a.status === "A").length,
    lesionados: athletes.filter(a => a.status === "L").length,
    rpeAvg: (() => {
      const rpes = athletes.filter(a => a.status === "P" && a.rpe).map(a => a.rpe);
      return rpes.length
        ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1)
        : "—";
    })(),
    sesiones:   historial.length,
    asistencia: Math.round(
      (historial.reduce((a, s) => a + s.presentes, 0) /
       Math.max(historial.reduce((a, s) => a + s.total, 0), 1)) * 100
    ),
  };

  // ── Props del club para los hijos ──────────
  const clubProps = {
    ...clubInfo,
    categoria: (clubInfo.categorias || [])[0] || "Sub-17",
  };

  // ── Render ─────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#050a14", position: "relative" }}>
      {/* Fondo de estadio fijo — visible en todos los módulos */}
      <FieldBackground />

      {/* Contenido por encima del fondo */}
      <div style={{ position: "relative", zIndex: 2 }}>

        {/* ── MÓDULO: HOME ──────────────────────
            Incluye su propio topbar + navegación.
            No renderizamos barra externa aquí. */}
        {activeModule === "home" && (
          <Home
            club={clubProps}
            athletes={athletes}
            historial={historial}
            stats={stats}
            onNavigate={setActiveModule}
          />
        )}

        {/* ── MÓDULO: ENTRENAMIENTO ─────────────
            Gestión de sesiones: asistencia, RPE,
            planificación e historial. */}
        {activeModule === "entrenamiento" && (
          <>
            {/* Mini topbar para volver al home */}
            <div style={{ height:38, background:"rgba(0,0,0,0.92)", borderBottom:"1px solid rgba(200,255,0,0.15)", display:"flex", alignItems:"stretch" }}>
              <div onClick={() => setActiveModule("home")} style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", cursor:"pointer", borderRight:"1px solid rgba(255,255,255,0.08)" }}>
                ← Inicio
              </div>
              <div style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:"white", display:"flex", alignItems:"center", borderBottom:"2px solid #c8ff00", background:"rgba(200,255,0,0.05)" }}>
                Entrenamiento
              </div>
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", padding:"0 18px", fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1px" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#c8ff00", marginRight:6 }}/>
                {clubInfo.nombre} · {(clubInfo.categorias||[])[0]||"Sub-17"}
              </div>
            </div>
            <Entrenamiento
              athletes={athletes}
              setAthletes={setAthletes}
              historial={historial}
              onGuardar={guardarSesion}
              stats={stats}
              clubInfo={clubInfo}
            />
          </>
        )}

        {/* ── MÓDULO: GESTIÓN DE PLANTILLA ──────
            Pizarra táctica y gestión del plantel. */}
        {activeModule === "plantilla" && (
          <>
            <div style={{ height:38, background:"rgba(0,0,0,0.92)", borderBottom:"1px solid rgba(200,255,0,0.15)", display:"flex", alignItems:"stretch" }}>
              <div onClick={() => setActiveModule("home")} style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", cursor:"pointer", borderRight:"1px solid rgba(255,255,255,0.08)" }}>
                ← Inicio
              </div>
              <div style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:"white", display:"flex", alignItems:"center", borderBottom:"2px solid #c8ff00", background:"rgba(200,255,0,0.05)" }}>
                Gestión de plantilla
              </div>
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", padding:"0 18px", fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1px" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#c8ff00", marginRight:6 }}/>
                {clubInfo.nombre} · {(clubInfo.categorias||[])[0]||"Sub-17"}
              </div>
            </div>
            <GestionPlantilla athletes={athletes} setAthletes={setAthletes} />
          </>
        )}

        {/* ── MÓDULO: MI CLUB ───────────────────
            Configuración: categorías, campos, datos. */}
        {activeModule === "miclub" && (
          <>
            <div style={{ height:38, background:"rgba(0,0,0,0.92)", borderBottom:"1px solid rgba(200,255,0,0.15)", display:"flex", alignItems:"stretch" }}>
              <div onClick={() => setActiveModule("home")} style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", cursor:"pointer", borderRight:"1px solid rgba(255,255,255,0.08)" }}>
                ← Inicio
              </div>
              <div style={{ padding:"0 18px", fontSize:10, textTransform:"uppercase", letterSpacing:"2px", color:"white", display:"flex", alignItems:"center", borderBottom:"2px solid #c8ff00", background:"rgba(200,255,0,0.05)" }}>
                Mi club
              </div>
            </div>
            <MiClub clubInfo={clubInfo} setClubInfo={setClubInfo} />
          </>
        )}

        {/* ── MÓDULOS EN CONSTRUCCIÓN ───────────
            Administración y Reportes — próximamente. */}
        {(activeModule === "admin" || activeModule === "reportes") && (
          <div style={{ padding:60, textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:14 }}>
            <div style={{ fontSize:40, marginBottom:16, opacity:0.2 }}>🔧</div>
            <div style={{ textTransform:"uppercase", letterSpacing:"3px", fontSize:11 }}>
              Módulo en construcción — próximamente
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
