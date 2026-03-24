/**
 * @file initialStates.js
 * @description Define los dos entornos de datos: DEMO (datos simulados) y
 * PRODUCTION (esquema vacio para club real). Usados por App.jsx en el onboarding.
 *
 * @author @Arquitecto (Julian)
 * @version 1.0.0
 */

// ─────────────────────────────────────────────────────────────
// DEMO STATE — Datos simulados para explorar la plataforma
// ─────────────────────────────────────────────────────────────

export const DEMO_ATHLETES = [
  { id:1,  name:"Carlos Rios",    pos:"Delantero",     posCode:"ST", dob:"2008-03-12", contact:"300 111 2233", status:"P", rpe:8,    photo:"carlos",    available:true  },
  { id:2,  name:"David Cano",     pos:"Mediocampista", posCode:"CM", dob:"2008-07-08", contact:"318 667 7788", status:"P", rpe:7,    photo:"david",     available:true  },
  { id:3,  name:"Miguel Torres",  pos:"Portero",       posCode:"GK", dob:"2007-09-15", contact:"315 445 5566", status:"P", rpe:6,    photo:"miguel",    available:true  },
  { id:4,  name:"Felipe Ruiz",    pos:"Defensa",       posCode:"LB", dob:"2007-12-22", contact:"314 778 8899", status:"P", rpe:9,    photo:"felipe",    available:true  },
  { id:5,  name:"Pablo Vargas",   pos:"Mediocampista", posCode:"CM", dob:"2008-05-10", contact:"312 334 5566", status:"P", rpe:8,    photo:"pablo",     available:true  },
  { id:6,  name:"Roberto Castro", pos:"Defensa",       posCode:"CB", dob:"2008-01-22", contact:"311 445 6677", status:"P", rpe:7,    photo:"roberto",   available:true  },
  { id:7,  name:"Hector Diaz",    pos:"Defensa",       posCode:"RB", dob:"2007-08-14", contact:"310 556 7788", status:"P", rpe:5,    photo:"hector",    available:true  },
  { id:8,  name:"Nicolas Ossa",   pos:"Delantero",     posCode:"LW", dob:"2008-11-03", contact:"313 667 8899", status:"P", rpe:7,    photo:"nicolas",   available:true  },
  { id:9,  name:"Kevin Pinto",    pos:"Delantero",     posCode:"RW", dob:"2009-02-18", contact:"317 778 9900", status:"P", rpe:6,    photo:"kevin",     available:true  },
  { id:10, name:"Luis Mora",      pos:"Defensa",       posCode:"CB", dob:"2008-04-25", contact:"316 889 0011", status:"P", rpe:7,    photo:"luis",      available:true  },
  { id:11, name:"Edgar Largo",    pos:"Mediocampista", posCode:"CM", dob:"2007-06-30", contact:"319 990 1122", status:"P", rpe:null, photo:"edgar",     available:true  },
  { id:12, name:"Andres Mena",    pos:"Mediocampista", posCode:"CM", dob:"2007-11-05", contact:"311 223 3344", status:"P", rpe:null, photo:"andres",    available:true  },
  { id:13, name:"Sebastian Gil",  pos:"Defensa",       posCode:"CB", dob:"2008-06-20", contact:"320 334 4455", status:"A", rpe:null, photo:"sebastian", available:false },
  { id:14, name:"Tomas Vera",     pos:"Mediocampista", posCode:"CM", dob:"2009-04-17", contact:"316 889 9900", status:"A", rpe:null, photo:"tomas",     available:false },
  { id:15, name:"Julian Perez",   pos:"Delantero",     posCode:"ST", dob:"2009-01-30", contact:"312 556 6677", status:"L", rpe:null, photo:"julian",    available:false },
];

export const DEMO_HISTORIAL = [
  { num:14, fecha:"Mar 18 Mar", presentes:14, total:18, rpeAvg:7.2, tipo:"Tactica",      nota:"Buena respuesta al pressing alto."              },
  { num:13, fecha:"Sab 15 Mar", presentes:16, total:18, rpeAvg:8.1, tipo:"Fisico",       nota:"Buena respuesta al trabajo de fuerza."           },
  { num:12, fecha:"Jue 13 Mar", presentes:15, total:18, rpeAvg:6.4, tipo:"Recuperacion", nota:"Sesion suave post competencia."                  },
  { num:11, fecha:"Mar 11 Mar", presentes:13, total:18, rpeAvg:9.2, tipo:"Partido",      nota:"Alta intensidad. Revisar carga semana proxima."  },
  { num:10, fecha:"Sab 08 Mar", presentes:17, total:18, rpeAvg:7.8, tipo:"Fisico",       nota:"Excelente disposicion del grupo."                },
];

export const DEMO_MATCH_STATS = {
  played: 5, won: 3, drawn: 1, lost: 1,
  goalsFor: 12, goalsAgainst: 6, points: 10,
};

export const DEMO_CLUB_INFO = {
  nombre:      "Aguilas de Lucero",
  disciplina:  "Futbol",
  ciudad:      "Medellin",
  entrenador:  "Juan Felipe Cuervo",
  temporada:   "2025-26",
  categorias:  ["Sub-17"],
  campos:      ["Campo principal", "Campo auxiliar"],
  descripcion: "",
  telefono:    "",
  email:       "",
};

export const DEMO_FINANZAS = {
  pagos: [
    { athleteId:1, mes:"2026-03", monto:80000, estado:"pagado", fechaPago:"2026-03-05" },
    { athleteId:2, mes:"2026-03", monto:80000, estado:"pagado", fechaPago:"2026-03-08" },
    { athleteId:3, mes:"2026-03", monto:80000, estado:"pendiente", fechaPago:null },
    { athleteId:4, mes:"2026-03", monto:80000, estado:"pagado", fechaPago:"2026-03-03" },
    { athleteId:5, mes:"2026-03", monto:80000, estado:"parcial", fechaPago:"2026-03-10" },
    { athleteId:6, mes:"2026-03", monto:80000, estado:"pendiente", fechaPago:null },
    { athleteId:7, mes:"2026-03", monto:80000, estado:"pagado", fechaPago:"2026-03-07" },
    { athleteId:8, mes:"2026-03", monto:80000, estado:"pendiente", fechaPago:null },
    { athleteId:9, mes:"2026-03", monto:80000, estado:"pagado", fechaPago:"2026-03-12" },
    { athleteId:10, mes:"2026-03", monto:80000, estado:"pagado", fechaPago:"2026-03-06" },
    { athleteId:11, mes:"2026-03", monto:80000, estado:"pendiente", fechaPago:null },
    { athleteId:12, mes:"2026-03", monto:80000, estado:"pagado", fechaPago:"2026-03-09" },
    { athleteId:13, mes:"2026-03", monto:80000, estado:"pendiente", fechaPago:null },
    { athleteId:14, mes:"2026-03", monto:80000, estado:"pendiente", fechaPago:null },
    { athleteId:15, mes:"2026-03", monto:80000, estado:"pendiente", fechaPago:null },
  ],
  movimientos: [
    { id:1, tipo:"ingreso", concepto:"Mensualidades marzo (parcial)", monto:560000, fecha:"2026-03-12" },
    { id:2, tipo:"egreso",  concepto:"Alquiler cancha mes marzo",     monto:200000, fecha:"2026-03-01" },
    { id:3, tipo:"egreso",  concepto:"Balones x5",                    monto:175000, fecha:"2026-03-05" },
    { id:4, tipo:"ingreso", concepto:"Inscripcion torneo interbarrial", monto:150000, fecha:"2026-03-10" },
  ],
};

// ─────────────────────────────────────────────────────────────
// PRODUCTION STATE — Esquema vacio para club real
// Sigue la estructura exacta de SCHEMA_MODEL.json
// ─────────────────────────────────────────────────────────────

export const EMPTY_ATHLETES = [];

export const EMPTY_HISTORIAL = [];

export const EMPTY_MATCH_STATS = {
  played: 0, won: 0, drawn: 0, lost: 0,
  goalsFor: 0, goalsAgainst: 0, points: 0,
};

export const EMPTY_FINANZAS = {
  pagos: [],
  movimientos: [],
};

/**
 * Crea un ClubInfo vacio con los datos del formulario de registro.
 * @param {Object} form - Datos del formulario de onboarding
 * @returns {Object} ClubInfo valido para el esquema
 */
export function createEmptyClubInfo(form) {
  return {
    nombre:      form.nombre || "",
    disciplina:  form.disciplina || "Futbol",
    ciudad:      form.ciudad || "",
    entrenador:  form.entrenador || "",
    temporada:   form.temporada || "2025-26",
    categorias:  form.categorias ? [form.categorias] : ["General"],
    campos:      form.campo ? [form.campo] : [],
    descripcion: "",
    telefono:    form.telefono || "",
    email:       form.email || "",
  };
}

// ─────────────────────────────────────────────────────────────
// KEYS DE LOCALSTORAGE — para limpieza selectiva
// ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = [
  "elevate_athletes",
  "elevate_historial",
  "elevate_clubInfo",
  "elevate_matchStats",
  "elevate_finanzas",
  "elevate_mode",
  "elevate_roles",
  "elevate_roles_v2",
  "elevate_instructions",
  "elevate_tacticas",
  "elevate_healthSnapshots",
];
