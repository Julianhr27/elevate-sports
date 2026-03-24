/**
 * @module migrationService
 * @description Sistema de migraciones versionadas para schema de datos.
 * Detecta version en localStorage vs version de la app y aplica
 * migraciones en orden sin perder datos.
 *
 * @author @Data (Mateo-Data_Engine)
 * @version 1.0.0
 */

const SCHEMA_KEY = "elevate_schema_version";
const CURRENT_VERSION = "1.2.0";

/**
 * Registry de migraciones.
 * Cada entrada: { from, to, migrate(data) → data }
 * data = { athletes, historial, clubInfo, matchStats, finanzas }
 */
const MIGRATIONS = [
  {
    from: null, // no version (legacy)
    to: "1.0.0",
    migrate: (data) => {
      // Legacy → 1.0.0: asegurar que todas las entidades existan
      return {
        athletes: data.athletes || [],
        historial: data.historial || [],
        clubInfo: data.clubInfo || {},
        matchStats: data.matchStats || { played:0, won:0, drawn:0, lost:0, goalsFor:0, goalsAgainst:0, points:0 },
        finanzas: data.finanzas || { pagos:[], movimientos:[] },
      };
    },
  },
  {
    from: "1.0.0",
    to: "1.1.0",
    migrate: (data) => {
      // 1.1.0: agregar savedAt a sesiones que no lo tengan
      return {
        ...data,
        historial: (data.historial || []).map(s => ({
          ...s,
          savedAt: s.savedAt || new Date().toISOString(),
        })),
      };
    },
  },
  {
    from: "1.1.0",
    to: "1.2.0",
    migrate: (data) => {
      // 1.2.0: asegurar available derivado de status en athletes
      return {
        ...data,
        athletes: (data.athletes || []).map(a => ({
          ...a,
          available: a.available ?? (a.status === "P"),
        })),
        // Asegurar finanzas tiene estructura correcta
        finanzas: {
          pagos: data.finanzas?.pagos || [],
          movimientos: data.finanzas?.movimientos || [],
        },
      };
    },
  },
];

/**
 * Lee la version actual del schema en localStorage.
 * @returns {string|null}
 */
function getStoredVersion() {
  return localStorage.getItem(SCHEMA_KEY) || null;
}

/**
 * Guarda la version actual del schema.
 */
function setStoredVersion(version) {
  localStorage.setItem(SCHEMA_KEY, version);
}

/**
 * Lee todos los datos actuales de localStorage.
 */
function readAllData() {
  const read = (key, fallback) => {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
    catch { return fallback; }
  };
  return {
    athletes: read("elevate_athletes", []),
    historial: read("elevate_historial", []),
    clubInfo: read("elevate_clubInfo", {}),
    matchStats: read("elevate_matchStats", { played:0, won:0, drawn:0, lost:0, goalsFor:0, goalsAgainst:0, points:0 }),
    finanzas: read("elevate_finanzas", { pagos:[], movimientos:[] }),
  };
}

/**
 * Escribe datos migrados de vuelta a localStorage.
 */
function writeAllData(data) {
  const write = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
  };
  write("elevate_athletes", data.athletes);
  write("elevate_historial", data.historial);
  write("elevate_clubInfo", data.clubInfo);
  write("elevate_matchStats", data.matchStats);
  write("elevate_finanzas", data.finanzas);
}

/**
 * Ejecuta migraciones pendientes.
 * @returns {{ migrated: boolean, from: string|null, to: string, steps: number }}
 */
export function runMigrations() {
  const storedVersion = getStoredVersion();

  if (storedVersion === CURRENT_VERSION) {
    return { migrated: false, from: storedVersion, to: CURRENT_VERSION, steps: 0 };
  }

  // Si no hay datos (fresh install), solo setear version
  const mode = localStorage.getItem("elevate_mode");
  if (!mode) {
    setStoredVersion(CURRENT_VERSION);
    return { migrated: false, from: null, to: CURRENT_VERSION, steps: 0 };
  }

  // Encontrar migraciones pendientes
  let currentVersion = storedVersion;
  let data = readAllData();
  let steps = 0;

  for (const migration of MIGRATIONS) {
    if (migration.from === currentVersion) {
      try {
        data = migration.migrate(data);
        currentVersion = migration.to;
        steps++;
      } catch (e) {
        console.error(`[migrationService] Failed at ${migration.from} → ${migration.to}:`, e);
        break;
      }
    }
  }

  if (steps > 0) {
    writeAllData(data);
  }

  setStoredVersion(CURRENT_VERSION);
  return { migrated: steps > 0, from: storedVersion, to: CURRENT_VERSION, steps };
}

/** Version actual del schema de la app */
export const APP_SCHEMA_VERSION = CURRENT_VERSION;
