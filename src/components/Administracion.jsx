/**
 * @component Administracion
 * @description Modulo de administracion financiera de Elevate Sports.
 * Tres tabs: Pagos, Movimientos, Resumen.
 *
 * @props { athletes, finanzas, setFinanzas }
 * @version 1.0
 * @author Elevate Sports
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PALETTE } from "../constants/palette";
import { createMovimiento, validatePago } from "../constants/schemas";
import { showToast } from "./Toast";
import ConfirmModal from "./ConfirmModal";

// ── Animation variants ──────────────────────────────────────────────────────
const kpiStagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};
const kpiItem = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
};
const tabPanel = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } },
};
const rowVariant = {
  initial: { opacity: 0, x: -8 },
  animate: (i) => ({
    opacity: 1, x: 0,
    transition: { type: "spring", stiffness: 320, damping: 28, delay: i * 0.04 },
  }),
};

const ADMIN = PALETTE.purple; // #7F77DD
const ADMIN_DIM = "rgba(127,119,221,0.12)";
const ADMIN_BORDER = "rgba(127,119,221,0.35)";
const MONTHLY_FEE = 80000;

/** Formato pesos colombianos: $80.000 */
const fmtCOP = (n) => "$" + Number(n).toLocaleString("es-CO");

/** Fecha ISO a legible */
const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const TABS = ["Pagos", "Movimientos", "Resumen"];

export default function Administracion({ athletes, finanzas, setFinanzas }) {
  const [activeTab, setActiveTab] = useState("Pagos");
  const [selectedMes, setSelectedMes] = useState("2026-03");

  // ── Movimientos form state ──
  const [movTipo, setMovTipo] = useState("ingreso");
  const [movConcepto, setMovConcepto] = useState("");
  const [movMonto, setMovMonto] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [movFecha, setMovFecha] = useState("2026-03-23");

  // ── Derived data ──
  const pagosDelMes = (finanzas.pagos || []).filter(p => p.mes === selectedMes);
  const totalRecaudado = pagosDelMes.filter(p => p.estado === "pagado").reduce((s, p) => s + p.monto, 0);
  const totalParcial = pagosDelMes.filter(p => p.estado === "parcial").reduce((s, p) => s + (p.monto / 2), 0);
  const totalPendiente = (athletes.length * MONTHLY_FEE) - totalRecaudado - totalParcial;
  const pctCobro = athletes.length ? Math.round(((totalRecaudado + totalParcial) / (athletes.length * MONTHLY_FEE)) * 100) : 0;
  const alDia = pagosDelMes.filter(p => p.estado === "pagado").length;

  const movimientos = finanzas.movimientos || [];
  const balanceTotal = movimientos.reduce((s, m) => m.tipo === "ingreso" ? s + m.monto : s - m.monto, 0);
  const ingresosMes = movimientos.filter(m => m.tipo === "ingreso" && m.fecha.startsWith(selectedMes)).reduce((s, m) => s + m.monto, 0);
  const egresosMes = movimientos.filter(m => m.tipo === "egreso" && m.fecha.startsWith(selectedMes)).reduce((s, m) => s + m.monto, 0);
  const tasaMorosidad = athletes.length ? Math.round((pagosDelMes.filter(p => p.estado === "pendiente").length / athletes.length) * 100) : 0;

  // ── Toggle payment status (with confirmation) ──
  const doTogglePago = (athleteId) => {
    const cycle = { pendiente: "pagado", pagado: "parcial", parcial: "pendiente" };
    setFinanzas(prev => ({
      ...prev,
      pagos: prev.pagos.map(p => {
        if (p.athleteId === athleteId && p.mes === selectedMes) {
          const nuevoEstado = cycle[p.estado] || "pendiente";
          const updated = {
            ...p,
            estado: nuevoEstado,
            fechaPago: nuevoEstado === "pendiente" ? null : (p.fechaPago || new Date().toISOString().slice(0, 10)),
          };
          const { valid, errors } = validatePago(updated);
          if (!valid) {
            showToast(`Error en pago: ${errors[0]}`, "error");
            return p;
          }
          return updated;
        }
        return p;
      }),
    }));
  };

  const togglePago = (athleteId) => {
    const pago = pagosDelMes.find(p => p.athleteId === athleteId);
    const athlete = athletes.find(a => a.id === athleteId);
    const cycle = { pendiente: "pagado", pagado: "parcial", parcial: "pendiente" };
    const next = cycle[pago?.estado] || "pendiente";
    setConfirmAction({
      title: "Cambiar estado de pago",
      message: `${athlete?.name || "Jugador"}: ${pago?.estado || "pendiente"} → ${next}`,
      onConfirm: () => { doTogglePago(athleteId); setConfirmAction(null); },
    });
  };

  // ── Add movement (validated via schema factory) ──
  const addMovimiento = () => {
    setFormError("");

    if (!movConcepto.trim()) {
      setFormError("El concepto no puede estar vacio");
      return;
    }
    if (!movMonto) {
      setFormError("Ingresa un monto valido");
      return;
    }
    const monto = Number(movMonto);
    if (isNaN(monto) || monto <= 0) {
      setFormError("El monto debe ser un numero positivo");
      return;
    }
    if (!movFecha) {
      setFormError("Selecciona una fecha");
      return;
    }

    const newMov = createMovimiento({
      tipo: movTipo,
      concepto: movConcepto,
      monto,
      fecha: movFecha,
    });

    if (!newMov) {
      setFormError("Datos invalidos — revisa los campos");
      return;
    }
    setFinanzas(prev => ({ ...prev, movimientos: [...prev.movimientos, newMov] }));
    setMovConcepto("");
    setMovMonto("");
    setFormError("");
  };

  // ── Styles ──
  const css = {
    container: { padding: 16, fontFamily: "'Arial Narrow', Arial, sans-serif" },
    tabs: { display: "flex", gap: 0, marginBottom: 16, borderBottom: `1px solid ${PALETTE.border}` },
    tab: (active) => ({
      padding: "10px 24px",
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "2px",
      color: active ? PALETTE.text : PALETTE.textMuted,
      background: active ? ADMIN_DIM : "transparent",
      borderBottom: active ? `2px solid ${ADMIN}` : "2px solid transparent",
      cursor: "pointer",
      transition: "color 0.15s, background 0.15s",
    }),
    kpiBar: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8, marginBottom: 16 },
    kpi: (color, i) => ({
      padding: "12px 18px",
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderTop: `3px solid ${color}`,
      border: `1px solid ${PALETTE.border}`,
      borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }),
    kpiVal: (color) => ({ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }),
    kpiLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: PALETTE.textMuted, marginTop: 4 },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { fontSize: 9, textTransform: "uppercase", letterSpacing: "1.5px", color: PALETTE.textMuted, padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${PALETTE.border}`, background: "rgba(0,0,0,0.6)" },
    td: { fontSize: 12, color: PALETTE.text, padding: "8px 12px", borderBottom: `1px solid ${PALETTE.border}` },
    badge: (estado) => ({
      display: "inline-block",
      padding: "3px 10px",
      fontSize: 9,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "1px",
      background: estado === "pagado" ? "rgba(29,158,117,0.18)" : estado === "parcial" ? "rgba(239,159,39,0.18)" : "rgba(226,75,74,0.18)",
      color: estado === "pagado" ? PALETTE.green : estado === "parcial" ? PALETTE.amber : PALETTE.danger,
      border: `1px solid ${estado === "pagado" ? PALETTE.green : estado === "parcial" ? PALETTE.amber : PALETTE.danger}`,
    }),
    toggleBtn: {
      padding: "4px 12px",
      fontSize: 9,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "1px",
      background: ADMIN_DIM,
      color: ADMIN,
      border: `1px solid ${ADMIN_BORDER}`,
      cursor: "pointer",
    },
    panel: { background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${PALETTE.border}`, borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" },
    panelTitle: { fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: PALETTE.textMuted, marginBottom: 14 },
    input: { width: "100%", fontSize: 13, border: `1px solid ${PALETTE.border}`, padding: "8px 10px", background: "rgba(255,255,255,0.05)", color: "white", fontFamily: "inherit", outline: "none" },
    select: { fontSize: 13, border: `1px solid ${PALETTE.border}`, padding: "8px 10px", background: "rgba(255,255,255,0.05)", color: "white", fontFamily: "inherit", outline: "none" },
    submitBtn: {
      padding: "8px 20px",
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "1.5px",
      background: ADMIN,
      color: "white",
      border: "none",
      cursor: "pointer",
    },
    card: (color) => ({
      padding: "20px 24px",
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderTop: `3px solid ${color}`,
      border: `1px solid ${PALETTE.border}`,
      borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }),
    mesSelect: { fontSize: 11, border: `1px solid ${ADMIN_BORDER}`, padding: "4px 8px", background: "rgba(0,0,0,0.5)", color: ADMIN, fontFamily: "inherit", outline: "none", marginLeft: 12 },
  };

  return (
    <div style={css.container}>

      {/* TABS */}
      <div style={css.tabs}>
        {TABS.map(t => (
          <div key={t} style={css.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
            {t}
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: PALETTE.textMuted }}>MES</span>
          <select style={css.mesSelect} value={selectedMes} onChange={e => setSelectedMes(e.target.value)}>
            <option value="2026-01">Enero 2026</option>
            <option value="2026-02">Febrero 2026</option>
            <option value="2026-03">Marzo 2026</option>
            <option value="2026-04">Abril 2026</option>
            <option value="2026-05">Mayo 2026</option>
            <option value="2026-06">Junio 2026</option>
          </select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* TAB PANELS — AnimatePresence for transitions */}
      {/* ═══════════════════════════════════════════ */}
      <AnimatePresence mode="wait">

      {/* TAB: PAGOS */}
      {activeTab === "Pagos" && (
        <motion.div key="tab-pagos" variants={tabPanel} initial="initial" animate="animate" exit="exit">
          {/* KPI BAR — staggered entry */}
          <motion.div variants={kpiStagger} initial="initial" animate="animate" style={css.kpiBar}>
            <motion.div variants={kpiItem} style={css.kpi(PALETTE.green, 0)}>
              <div style={css.kpiVal(PALETTE.green)}>{fmtCOP(totalRecaudado)}</div>
              <div style={css.kpiLabel}>TOTAL RECAUDADO</div>
            </motion.div>
            <motion.div variants={kpiItem} style={css.kpi(PALETTE.danger, 1)}>
              <div style={css.kpiVal(PALETTE.danger)}>{fmtCOP(totalPendiente)}</div>
              <div style={css.kpiLabel}>PENDIENTE</div>
            </motion.div>
            <motion.div variants={kpiItem} style={css.kpi(ADMIN, 2)}>
              <div style={css.kpiVal(ADMIN)}>{pctCobro}%</div>
              <div style={css.kpiLabel}>% COBRO</div>
            </motion.div>
            <motion.div variants={kpiItem} style={css.kpi(PALETTE.text, 3)}>
              <div style={css.kpiVal(PALETTE.text)}>{alDia}/{athletes.length}</div>
              <div style={css.kpiLabel}>JUGADORES AL DIA</div>
            </motion.div>
          </motion.div>

          {/* TABLE with animated rows */}
          <div style={{ overflowX: "auto" }}>
            <table style={css.table}>
              <thead>
                <tr>
                  <th style={css.th}>#</th>
                  <th style={css.th}>NOMBRE</th>
                  <th style={css.th}>POSICION</th>
                  <th style={css.th}>ESTADO</th>
                  <th style={css.th}>MONTO</th>
                  <th style={css.th}>FECHA PAGO</th>
                  <th style={css.th}>ACCION</th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((a, i) => {
                  const pago = pagosDelMes.find(p => p.athleteId === a.id);
                  const estado = pago ? pago.estado : "pendiente";
                  const fechaPago = pago ? pago.fechaPago : null;
                  return (
                    <motion.tr
                      key={a.id}
                      custom={i}
                      variants={rowVariant}
                      initial="initial"
                      animate="animate"
                      style={{ background: i % 2 === 0 ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.2)" }}
                    >
                      <td style={css.td}>{a.id}</td>
                      <td style={{ ...css.td, fontWeight: 700 }}>{a.name}</td>
                      <td style={{ ...css.td, fontSize: 10, textTransform: "uppercase", letterSpacing: "1px", color: PALETTE.textMuted }}>{a.pos}</td>
                      <td style={css.td}><span style={css.badge(estado)}>{estado}</span></td>
                      <td style={css.td}>{fmtCOP(MONTHLY_FEE)}</td>
                      <td style={{ ...css.td, color: PALETTE.textMuted }}>{fmtDate(fechaPago)}</td>
                      <td style={css.td}>
                        <button style={css.toggleBtn} onClick={() => togglePago(a.id)}>
                          CAMBIAR
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* TAB: MOVIMIENTOS */}
      {activeTab === "Movimientos" && (
        <motion.div key="tab-movimientos" variants={tabPanel} initial="initial" animate="animate" exit="exit">
          {/* BALANCE */}
          <div style={{ ...css.panel, borderTop: `3px solid ${ADMIN}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={css.panelTitle}>BALANCE ACUMULADO</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: balanceTotal >= 0 ? PALETTE.green : PALETTE.danger }}>
                  {fmtCOP(balanceTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div style={css.panel}>
            <div style={css.panelTitle}>REGISTRAR MOVIMIENTO</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: PALETTE.textMuted, marginBottom: 5 }}>TIPO</div>
                <select style={{ ...css.select, width: "100%" }} value={movTipo} onChange={e => setMovTipo(e.target.value)}>
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: PALETTE.textMuted, marginBottom: 5 }}>CONCEPTO</div>
                <input style={css.input} value={movConcepto} onChange={e => setMovConcepto(e.target.value.replace(/[<>{}]/g, ""))} placeholder="Descripcion del movimiento" maxLength={120} />
              </div>
              <div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: PALETTE.textMuted, marginBottom: 5 }}>MONTO</div>
                <input style={css.input} type="number" value={movMonto} onChange={e => { const v = e.target.value; if (v === "" || (Number(v) >= 0 && Number(v) <= 999999999)) setMovMonto(v); }} placeholder="0" min="1" step="1000" />
              </div>
              <div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "1px", color: PALETTE.textMuted, marginBottom: 5 }}>FECHA</div>
                <input style={css.input} type="date" value={movFecha} onChange={e => setMovFecha(e.target.value)} />
              </div>
              <button style={css.submitBtn} onClick={addMovimiento}>AGREGAR</button>
            </div>
            {formError && (
              <div style={{ marginTop:8, padding:"6px 12px", background:"rgba(226,75,74,0.12)", border:`1px solid ${PALETTE.danger}`, fontSize:10, color:PALETTE.danger, letterSpacing:"0.5px" }}>
                {formError}
              </div>
            )}
          </div>

          {/* LIST */}
          <div style={css.panel}>
            <div style={css.panelTitle}>HISTORIAL DE MOVIMIENTOS</div>
            {movimientos.length === 0 && (
              <div style={{ color: PALETTE.textMuted, fontSize: 12, padding: "12px 0" }}>Sin movimientos registrados.</div>
            )}
            {[...movimientos].reverse().map((m, i) => (
              <motion.div
                key={m.id}
                custom={i}
                variants={rowVariant}
                initial="initial"
                animate="animate"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderBottom: `1px solid ${PALETTE.border}`,
                  borderLeft: `3px solid ${m.tipo === "ingreso" ? PALETTE.green : PALETTE.danger}`,
                  marginBottom: 4,
                  background: m.tipo === "ingreso" ? "rgba(29,158,117,0.06)" : "rgba(226,75,74,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
                    color: m.tipo === "ingreso" ? PALETTE.green : PALETTE.danger,
                    width: 55,
                  }}>
                    {m.tipo === "ingreso" ? "INGRESO" : "EGRESO"}
                  </span>
                  <span style={{ fontSize: 12, color: PALETTE.text }}>{m.concepto}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <span style={{ fontSize: 10, color: PALETTE.textMuted }}>{fmtDate(m.fecha)}</span>
                  <span style={{
                    fontSize: 14, fontWeight: 700,
                    color: m.tipo === "ingreso" ? PALETTE.green : PALETTE.danger,
                  }}>
                    {m.tipo === "ingreso" ? "+" : "-"}{fmtCOP(m.monto)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB: RESUMEN */}
      {activeTab === "Resumen" && (
        <motion.div key="tab-resumen" variants={tabPanel} initial="initial" animate="animate" exit="exit">
          <motion.div
            variants={kpiStagger}
            initial="initial"
            animate="animate"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}
          >
            <motion.div variants={kpiItem} style={css.card(ADMIN)}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: PALETTE.textMuted, marginBottom: 8 }}>BALANCE TOTAL</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: balanceTotal >= 0 ? PALETTE.green : PALETTE.danger }}>{fmtCOP(balanceTotal)}</div>
            </motion.div>
            <motion.div variants={kpiItem} style={css.card(PALETTE.green)}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: PALETTE.textMuted, marginBottom: 8 }}>RECAUDO DEL MES</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: PALETTE.green }}>{fmtCOP(totalRecaudado + totalParcial)}</div>
            </motion.div>
            <motion.div variants={kpiItem} style={css.card(PALETTE.danger)}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: PALETTE.textMuted, marginBottom: 8 }}>GASTOS DEL MES</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: PALETTE.danger }}>{fmtCOP(egresosMes)}</div>
            </motion.div>
            <motion.div variants={kpiItem} style={css.card(PALETTE.amber)}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: PALETTE.textMuted, marginBottom: 8 }}>TASA DE MOROSIDAD</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: PALETTE.amber }}>{tasaMorosidad}%</div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      </AnimatePresence>

      {/* Modal de confirmacion */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmModal
            title={confirmAction.title}
            message={confirmAction.message}
            onConfirm={confirmAction.onConfirm}
            onCancel={() => setConfirmAction(null)}
            accentColor={ADMIN}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
