/**
 * @module supabaseService
 * @description Capa de persistencia Supabase para Elevate Sports.
 * API compatible con storageService — reemplaza localStorage por Supabase.
 * Si Supabase no está disponible, fallback a localStorage transparente.
 *
 * Patrón: write-through (escribe a Supabase + localStorage como cache).
 *
 * @author @Data (Mateo-Data_Engine)
 * @version 2.0.0
 */

import { supabase, isSupabaseReady } from "../lib/supabase";
import { validateSesion } from "../constants/schemas";

// ── Error handler (inyectado desde App) ──
let _onError = null;
export function setSupabaseErrorHandler(handler) { _onError = handler; }

function reportError(msg, error) {
  console.error(`[supabaseService] ${msg}`, error?.message || error);
  if (_onError) _onError(msg);
}

// ── Club ID en memoria ──
// Fuente de verdad: profile del usuario autenticado.
// Fallback: localStorage para offline-first y compatibilidad.
let _clubId = null;
export function getClubId() { return _clubId; }
export function setClubId(id) {
  _clubId = id;
  try { if (id) localStorage.setItem("elevate_club_id", id); else localStorage.removeItem("elevate_club_id"); }
  catch { /* noop */ }
}

/**
 * Carga club_id desde el profile del usuario autenticado.
 * Si no hay sesion, fallback a localStorage.
 * @returns {Promise<string|null>}
 */
export async function loadClubIdFromProfile() {
  if (!isSupabaseReady) return _clubId;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // No autenticado — fallback a localStorage
      _clubId = localStorage.getItem("elevate_club_id") || null;
      return _clubId;
    }
    const { data, error } = await supabase.from("profiles").select("club_id").eq("id", user.id).single();
    if (!error && data?.club_id) {
      setClubId(data.club_id);
      return data.club_id;
    }
  } catch { /* noop */ }
  // Fallback
  _clubId = localStorage.getItem("elevate_club_id") || null;
  return _clubId;
}

// Restaurar club_id al boot (sincrono, desde cache)
try {
  _clubId = localStorage.getItem("elevate_club_id") || null;
} catch { /* noop */ }

// ════════════════════════════════════════════════
// CLUB
// ════════════════════════════════════════════════

/**
 * Crea un club nuevo en Supabase.
 * @param {Object} form - Datos del formulario de registro
 * @param {string} mode - "demo" | "production"
 * @returns {Promise<string|null>} club_id o null si falla
 */
export async function createClub(form, mode = "production") {
  if (!isSupabaseReady) return null;
  const { data, error } = await supabase.from("clubs").insert({
    nombre: form.nombre || "",
    disciplina: form.disciplina || "Futbol",
    ciudad: form.ciudad || "",
    entrenador: form.entrenador || "",
    temporada: form.temporada || "2025-26",
    categorias: form.categorias ? [form.categorias] : ["General"],
    campos: form.campo ? [form.campo] : [],
    descripcion: "",
    telefono: form.telefono || "",
    email: form.email || "",
    mode,
  }).select("id").single();

  if (error) { reportError("Error creando club", error); return null; }
  setClubId(data.id);
  return data.id;
}

/** Lee el club actual */
export async function getClub() {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase.from("clubs").select("*").eq("id", _clubId).single();
  if (error) { reportError("Error leyendo club", error); return null; }
  return data;
}

/** Actualiza info del club */
export async function updateClub(fields) {
  if (!isSupabaseReady || !_clubId) return false;
  const { error } = await supabase.from("clubs").update(fields).eq("id", _clubId);
  if (error) { reportError("Error actualizando club", error); return false; }
  return true;
}

// ════════════════════════════════════════════════
// ATHLETES
// ════════════════════════════════════════════════

/** Lee todos los atletas del club */
export async function getAthletes() {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase
    .from("athletes").select("*").eq("club_id", _clubId).order("id");
  if (error) { reportError("Error leyendo atletas", error); return null; }
  return data.map(dbToAthlete);
}

/** Inserta un atleta */
export async function insertAthlete(athlete) {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase.from("athletes")
    .insert(athleteToDb(athlete)).select().single();
  if (error) { reportError("Error creando atleta", error); return null; }
  return dbToAthlete(data);
}

/** Actualiza atletas en batch (para RPE, status, etc.) */
export async function updateAthletes(athletes) {
  if (!isSupabaseReady || !_clubId) return false;
  const updates = athletes.map(a => supabase.from("athletes")
    .update({ status: a.status, rpe: a.rpe, available: a.available ?? (a.status === "P") })
    .eq("id", a.id).eq("club_id", _clubId));
  const results = await Promise.all(updates);
  const failed = results.filter(r => r.error);
  if (failed.length) reportError(`Error actualizando ${failed.length} atletas`, failed[0].error);
  return failed.length === 0;
}

/** Sincroniza plantel completo (upsert) */
export async function syncAthletes(athletes) {
  if (!isSupabaseReady || !_clubId) return false;
  const rows = athletes.map(athleteToDb);
  const { error } = await supabase.from("athletes").upsert(rows, { onConflict: "id" });
  if (error) { reportError("Error sincronizando plantel", error); return false; }
  return true;
}

// ════════════════════════════════════════════════
// BULK INSERT ATHLETES
// ════════════════════════════════════════════════

/**
 * Inserta deportistas en lote (carga masiva).
 * Vincula cada fila al club_id activo. Registra log de upload.
 * @param {Array} athletes - Filas validadas del parser CSV
 * @param {string} [fileName] - Nombre del archivo original
 * @param {number} [invalidCount] - Cantidad de filas invalidas (para log)
 * @returns {Promise<{ success: boolean, inserted: number, errors: string[] }>}
 */
export async function bulkInsertAthletes(athletes, fileName = "bulk_upload.csv", invalidCount = 0) {
  if (!isSupabaseReady || !_clubId) return { success: false, inserted: 0, errors: ["Supabase no disponible o club_id no definido"] };
  if (!athletes?.length) return { success: false, inserted: 0, errors: ["No hay atletas para insertar"] };

  const errors = [];

  // Mapear filas del parser al schema de athletes
  const rows = athletes.map(a => ({
    club_id: _clubId,
    name: a.nombre || "",
    apellido: a.apellido || "",
    pos: a.posicion || "GEN",
    pos_code: a.posicion || "GEN",
    dob: a.fecha_nacimiento || null,
    numero_dorsal: a.dorsal || null,
    documento_identidad: a.documento_identidad || "",
    contacto_emergencia: a.contacto_emergencia || "",
    contact: a.contacto_emergencia || "",
    status: "P",
    available: true,
  }));

  // Insertar en lote
  const { data, error } = await supabase.from("athletes").insert(rows).select("id");

  if (error) {
    reportError("Error en carga masiva de atletas", error);
    errors.push(error.message);
  }

  const inserted = data?.length || 0;
  const status = error ? "failed" : (invalidCount > 0 ? "partial" : "success");

  // Registrar log de upload
  try {
    await supabase.from("bulk_upload_logs").insert({
      club_id: _clubId,
      file_name: fileName,
      total_rows: athletes.length + invalidCount,
      valid_rows: inserted,
      invalid_rows: invalidCount,
      status,
      error_details: errors.length ? errors : [],
    });
  } catch (logErr) {
    console.warn("[bulkInsert] No se pudo registrar log de upload", logErr);
  }

  return { success: !error, inserted, errors };
}

// ════════════════════════════════════════════════
// SESSIONS (historial)
// ════════════════════════════════════════════════

/** Lee historial de sesiones (más reciente primero) */
export async function getSessions() {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase
    .from("sessions").select("*").eq("club_id", _clubId).order("saved_at", { ascending: false });
  if (error) { reportError("Error leyendo historial", error); return null; }
  return data.map(dbToSession);
}

/** Guarda una nueva sesión */
export async function insertSession(sesion) {
  if (!isSupabaseReady || !_clubId) return null;

  // Validar antes de persistir (0 datos basura en la nube)
  const validation = validateSesion(sesion);
  if (!validation.valid) {
    reportError(`Sesión #${sesion.num} inválida: ${validation.errors[0]}`);
  }

  const { data, error } = await supabase.from("sessions")
    .insert(sessionToDb(sesion)).select().single();
  if (error) { reportError("Error guardando sesión", error); return null; }
  return dbToSession(data);
}

// ════════════════════════════════════════════════
// FINANZAS (payments + movements)
// ════════════════════════════════════════════════

export async function getPayments() {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase
    .from("payments").select("*").eq("club_id", _clubId);
  if (error) { reportError("Error leyendo pagos", error); return null; }
  return data.map(dbToPayment);
}

export async function upsertPayment(pago) {
  if (!isSupabaseReady || !_clubId) return false;
  const { error } = await supabase.from("payments").upsert(paymentToDb(pago), {
    onConflict: "club_id,athlete_id,mes",
  });
  if (error) { reportError("Error guardando pago", error); return false; }
  return true;
}

export async function getMovements() {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase
    .from("movements").select("*").eq("club_id", _clubId).order("fecha", { ascending: false });
  if (error) { reportError("Error leyendo movimientos", error); return null; }
  return data.map(dbToMovement);
}

export async function insertMovement(mov) {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase.from("movements")
    .insert(movementToDb(mov)).select().single();
  if (error) { reportError("Error guardando movimiento", error); return null; }
  return dbToMovement(data);
}

// ════════════════════════════════════════════════
// MATCH STATS
// ════════════════════════════════════════════════

export async function getMatchStats() {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase
    .from("match_stats").select("*").eq("club_id", _clubId).single();
  if (error && error.code !== "PGRST116") { reportError("Error leyendo stats", error); return null; }
  return data ? dbToMatchStats(data) : null;
}

export async function upsertMatchStats(stats) {
  if (!isSupabaseReady || !_clubId) return false;
  const { error } = await supabase.from("match_stats").upsert({
    club_id: _clubId,
    played: stats.played || 0,
    won: stats.won || 0,
    drawn: stats.drawn || 0,
    lost: stats.lost || 0,
    goals_for: stats.goalsFor || 0,
    goals_against: stats.goalsAgainst || 0,
    points: stats.points || 0,
  }, { onConflict: "club_id" });
  if (error) { reportError("Error guardando match stats", error); return false; }
  return true;
}

// ════════════════════════════════════════════════
// HEALTH SNAPSHOTS
// ════════════════════════════════════════════════

export async function insertHealthSnapshots(snapshots) {
  if (!isSupabaseReady || !_clubId || !snapshots.length) return false;
  const rows = snapshots.map(s => ({
    club_id: _clubId,
    athlete_id: s.athleteId,
    athlete_name: s.athleteName,
    session_num: s.sessionNum,
    salud: s.salud,
    risk_level: s.riskLevel,
    rpe_avg_7d: s.rpeAvg7d,
    rpe_actual: s.rpeActual,
  }));
  const { error } = await supabase.from("health_snapshots").insert(rows);
  if (error) { reportError("Error guardando snapshots de salud", error); return false; }
  return true;
}

export async function getAthleteHealthHistory(athleteId, limit = 20) {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase.from("health_snapshots")
    .select("*").eq("club_id", _clubId).eq("athlete_id", athleteId)
    .order("created_at", { ascending: false }).limit(limit);
  if (error) { reportError("Error leyendo historial de salud", error); return null; }
  return data;
}

export async function getAtRiskAthletes() {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase.from("health_snapshots")
    .select("*").eq("club_id", _clubId).eq("risk_level", "riesgo")
    .order("created_at", { ascending: false }).limit(50);
  if (error) { reportError("Error leyendo atletas en riesgo", error); return null; }
  return data;
}

// ════════════════════════════════════════════════
// TACTICAL DATA
// ════════════════════════════════════════════════

export async function getTacticalData() {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase
    .from("tactical_data").select("*").eq("club_id", _clubId).single();
  if (error && error.code !== "PGRST116") return null;
  return data;
}

export async function saveTacticalData(rolesData, instructions, tactics) {
  if (!isSupabaseReady || !_clubId) return false;
  const { error } = await supabase.from("tactical_data").upsert({
    club_id: _clubId,
    roles_data: rolesData || {},
    instructions: instructions || "",
    tactics: tactics || "",
  }, { onConflict: "club_id" });
  if (error) { reportError("Error guardando datos tácticos", error); return false; }
  return true;
}

// ════════════════════════════════════════════════
// USER SESSION (RBAC)
// ════════════════════════════════════════════════

export async function createUserSession(role, userName) {
  if (!isSupabaseReady || !_clubId) return null;
  const { data, error } = await supabase.from("user_sessions")
    .insert({ club_id: _clubId, role, user_name: userName }).select().single();
  if (error) { reportError("Error creando sesión de usuario", error); return null; }
  return data;
}

// ════════════════════════════════════════════════
// FULL SYNC: localStorage → Supabase
// Migración one-shot de datos existentes
// ════════════════════════════════════════════════

/**
 * Migra todos los datos de localStorage a Supabase.
 * Idempotente — safe to call multiple times.
 * @param {Object} localData - { clubInfo, athletes, historial, finanzas, matchStats }
 * @returns {Promise<{ success: boolean, clubId: string|null }>}
 */
export async function migrateLocalToSupabase(localData) {
  if (!isSupabaseReady) return { success: false, clubId: null };

  try {
    // 1. Crear club
    const clubId = await createClub(localData.clubInfo, localData.mode || "production");
    if (!clubId) throw new Error("No se pudo crear el club");

    // 2. Insertar atletas (mapeando IDs)
    if (localData.athletes?.length) {
      const rows = localData.athletes.map(a => ({
        club_id: clubId,
        name: a.name,
        pos: a.pos,
        pos_code: a.posCode,
        dob: a.dob || null,
        contact: a.contact || "",
        status: a.status || "P",
        rpe: a.rpe,
        photo: a.photo || "",
        available: a.available ?? (a.status === "P"),
      }));
      const { error } = await supabase.from("athletes").insert(rows);
      if (error) throw error;
    }

    // 3. Insertar sesiones
    if (localData.historial?.length) {
      const rows = localData.historial.map(s => ({
        club_id: clubId,
        num: s.num,
        fecha: s.fecha,
        presentes: s.presentes,
        total: s.total,
        rpe_avg: s.rpeAvg && s.rpeAvg !== "—" ? Number(s.rpeAvg) : null,
        rpe_by_athlete: s.rpeByAthlete || {},
        tipo: s.tipo || "Sesion",
        nota: s.nota || "",
        saved_at: s.savedAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from("sessions").insert(rows);
      if (error) throw error;
    }

    // 4. Insertar pagos
    const pagos = localData.finanzas?.pagos || [];
    if (pagos.length) {
      // Necesitamos mapear athlete IDs locales a IDs de Supabase
      const { data: dbAthletes } = await supabase
        .from("athletes").select("id, name").eq("club_id", clubId);
      const nameToId = new Map((dbAthletes || []).map(a => [a.name, a.id]));
      const localAthletes = localData.athletes || [];

      const rows = pagos.map(p => {
        const localAthlete = localAthletes.find(a => a.id === p.athleteId);
        const dbId = localAthlete ? nameToId.get(localAthlete.name) : null;
        return dbId ? {
          club_id: clubId,
          athlete_id: dbId,
          mes: p.mes,
          monto: p.monto,
          estado: p.estado,
          fecha_pago: p.fechaPago || null,
        } : null;
      }).filter(Boolean);
      if (rows.length) {
        await supabase.from("payments").insert(rows);
      }
    }

    // 5. Insertar movimientos
    const movs = localData.finanzas?.movimientos || [];
    if (movs.length) {
      const rows = movs.map(m => ({
        club_id: clubId,
        tipo: m.tipo,
        concepto: m.concepto,
        monto: m.monto,
        fecha: m.fecha,
      }));
      await supabase.from("movements").insert(rows);
    }

    // 6. Match stats
    if (localData.matchStats) {
      await supabase.from("match_stats").insert({
        club_id: clubId,
        played: localData.matchStats.played || 0,
        won: localData.matchStats.won || 0,
        drawn: localData.matchStats.drawn || 0,
        lost: localData.matchStats.lost || 0,
        goals_for: localData.matchStats.goalsFor || 0,
        goals_against: localData.matchStats.goalsAgainst || 0,
        points: localData.matchStats.points || 0,
      });
    }

    return { success: true, clubId };
  } catch (error) {
    reportError("Error en migración localStorage → Supabase", error);
    return { success: false, clubId: null };
  }
}

// ════════════════════════════════════════════════
// MAPPERS: DB ↔ App format
// ════════════════════════════════════════════════

function dbToAthlete(row) {
  return {
    id: row.id,
    name: row.name,
    pos: row.pos,
    posCode: row.pos_code,
    dob: row.dob,
    contact: row.contact,
    status: row.status,
    rpe: row.rpe,
    photo: row.photo,
    available: row.available,
  };
}

function athleteToDb(a) {
  return {
    id: a.id, // mantener ID si viene del app
    club_id: _clubId,
    name: a.name,
    pos: a.pos,
    pos_code: a.posCode,
    dob: a.dob || null,
    contact: a.contact || "",
    status: a.status || "P",
    rpe: a.rpe,
    photo: a.photo || "",
    available: a.available ?? (a.status === "P"),
  };
}

function dbToSession(row) {
  return {
    num: row.num,
    fecha: row.fecha,
    presentes: row.presentes,
    total: row.total,
    rpeAvg: row.rpe_avg,
    rpeByAthlete: row.rpe_by_athlete || {},
    tipo: row.tipo,
    nota: row.nota,
    savedAt: row.saved_at,
  };
}

function sessionToDb(s) {
  return {
    club_id: _clubId,
    num: s.num,
    fecha: s.fecha,
    presentes: s.presentes,
    total: s.total,
    rpe_avg: s.rpeAvg && s.rpeAvg !== "—" ? Number(s.rpeAvg) : null,
    rpe_by_athlete: s.rpeByAthlete || {},
    tipo: s.tipo || "Sesion",
    nota: s.nota || "",
    saved_at: s.savedAt || new Date().toISOString(),
  };
}

function dbToPayment(row) {
  return {
    athleteId: row.athlete_id,
    mes: row.mes,
    monto: row.monto,
    estado: row.estado,
    fechaPago: row.fecha_pago,
  };
}

function paymentToDb(p) {
  return {
    club_id: _clubId,
    athlete_id: p.athleteId,
    mes: p.mes,
    monto: p.monto,
    estado: p.estado,
    fecha_pago: p.fechaPago || null,
  };
}

function dbToMovement(row) {
  return {
    id: row.id,
    tipo: row.tipo,
    concepto: row.concepto,
    monto: row.monto,
    fecha: row.fecha,
  };
}

function movementToDb(m) {
  return {
    club_id: _clubId,
    tipo: m.tipo,
    concepto: m.concepto,
    monto: m.monto,
    fecha: m.fecha,
  };
}

function dbToMatchStats(row) {
  return {
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goals_for,
    goalsAgainst: row.goals_against,
    points: row.points,
  };
}
