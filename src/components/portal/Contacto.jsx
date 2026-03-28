/**
 * @component Contacto
 * @description Pagina de contacto y soporte para Elevate Sports.
 * Formulario validado con sanitizacion + canales de contacto directo.
 * Disenio: glassmorphism, Framer Motion, paleta charcoal/neon.
 *
 * @route /contacto
 * @author @Arquitecto (Carlos) — Portal Corporativo
 * @version 1.0.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PALETTE as C } from "../../constants/palette";
import { sanitizeText, sanitizeTextFinal } from "../../utils/sanitize";

// ── Animation variants ──────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

// ── Canales de contacto ────────────────────────────────────────────────────
const CHANNELS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={C.neon} strokeWidth="1.5"/>
        <polyline points="22,6 12,13 2,6" stroke={C.neon} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    label: "Email",
    value: "hola@elevatesports.co",
    sub: "Respondemos en menos de 24h",
    color: C.neon,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.58 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke={C.purple} strokeWidth="1.5"/>
      </svg>
    ),
    label: "WhatsApp",
    value: "+57 300 000 0000",
    sub: "Lunes a viernes, 8am - 6pm",
    color: C.purple,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={C.amber} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: "Chat en vivo",
    value: "Desde el CRM",
    sub: "Disponible dentro de la plataforma",
    color: C.amber,
  },
];

const MOTIVOS = [
  "Demo del producto",
  "Soporte tecnico",
  "Precios y planes",
  "Partnership o integracion",
  "Prensa o medios",
  "Otro",
];

// ── Componentes auxiliares ─────────────────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      fontSize: 9, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "3px", color: C.neon, marginBottom: 20,
    }}>
      <div style={{ width: 24, height: 1, background: C.neon }} />
      {text}
      <div style={{ width: 24, height: 1, background: C.neon }} />
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 9, textTransform: "uppercase", letterSpacing: "1.5px",
        color: error ? C.danger : C.textHint, fontWeight: 600,
      }}>
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: 10, color: C.danger }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const buildInputStyle = (hasError) => ({
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${hasError ? C.danger : "rgba(255,255,255,0.1)"}`,
  borderRadius: 6,
  padding: "10px 14px",
  fontSize: 13,
  color: "white",
  fontFamily: "'Barlow', Arial, sans-serif",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 200ms",
});

// ── Componente principal ───────────────────────────────────────────────────
export default function Contacto() {
  const [form, setForm] = useState({
    nombre: "", email: "", club: "", motivo: "", mensaje: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (field) => (e) => {
    const raw = e.target.value;
    const value = (field === "mensaje" || field === "email")
      ? raw
      : sanitizeText(raw);
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    const nombre  = sanitizeTextFinal(form.nombre);
    const email   = sanitizeTextFinal(form.email);
    const motivo  = form.motivo;
    const mensaje = sanitizeTextFinal(form.mensaje);

    if (!nombre || nombre.length < 2) errs.nombre = "Ingresa tu nombre completo";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email invalido";
    if (!motivo) errs.motivo = "Selecciona el motivo de contacto";
    if (!mensaje || mensaje.length < 20) errs.mensaje = "El mensaje debe tener al menos 20 caracteres";

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSending(true);
    // Simulacion de envio — reemplazar con endpoint real cuando exista
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSubmitted(true);
  };

  return (
    <div style={{
      minHeight: "100vh",
      color: "white",
      fontFamily: "'Barlow', 'Arial Narrow', Arial, sans-serif",
    }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{
        padding: "80px 32px 60px",
        textAlign: "center",
        maxWidth: 700,
        margin: "0 auto",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500, height: 400,
          background: `radial-gradient(ellipse, ${C.neon}08 0%, transparent 65%)`,
          pointerEvents: "none",
        }} />
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          style={{ position: "relative" }}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <SectionLabel text="Contacto" />
          </motion.div>
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 900, letterSpacing: "-1.5px",
              lineHeight: 1.1,
              fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
              margin: "0 0 20px",
            }}
          >
            Hablemos de tu{" "}
            <span style={{
              background: `linear-gradient(90deg, ${C.neon}, #7C3AED)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              club
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: 15, color: "rgba(255,255,255,0.5)",
              lineHeight: 1.7, margin: 0,
            }}
          >
            Cuentanos que necesitas. Te respondemos rapido con una solucion concreta,
            no con un discurso de ventas.
          </motion.p>
        </motion.div>
      </section>

      {/* ── CONTENIDO PRINCIPAL ───────────────────────────────────────── */}
      <section style={{
        padding: "0 32px 100px",
        maxWidth: 1100,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 48,
        alignItems: "start",
      }}>

        {/* ── FORMULARIO ── */}
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "rgba(57,255,20,0.06)",
                border: `1px solid ${C.neon}40`,
                borderRadius: 12,
                padding: "60px 40px",
                textAlign: "center",
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: `${C.neon}18`,
                border: `2px solid ${C.neon}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke={C.neon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: 22, fontWeight: 800, color: "white",
                margin: "0 0 12px", letterSpacing: "-0.3px",
              }}>
                Mensaje recibido
              </h3>
              <p style={{
                fontSize: 14, color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7, margin: "0 0 32px",
              }}>
                Gracias por escribirnos. Te contactaremos antes de 24 horas
                al email que nos dejaste.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSubmitted(false);
                  setForm({ nombre: "", email: "", club: "", motivo: "", mensaje: "" });
                }}
                style={{
                  padding: "10px 28px",
                  fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "1.5px",
                  background: "transparent", color: C.neon,
                  border: `1px solid ${C.neon}50`, borderRadius: 6,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Enviar otro mensaje
              </motion.button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              onSubmit={handleSubmit}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: 40,
                display: "flex", flexDirection: "column", gap: 24,
              }}
            >
              <div style={{
                fontSize: 10, textTransform: "uppercase",
                letterSpacing: "2px", color: C.textHint,
              }}>
                Formulario de contacto
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <FormField label="Nombre completo *" error={errors.nombre}>
                  <input
                    type="text"
                    placeholder="Julian Perez"
                    value={form.nombre}
                    onChange={handleChange("nombre")}
                    style={buildInputStyle(!!errors.nombre)}
                  />
                </FormField>

                <FormField label="Email *" error={errors.email}>
                  <input
                    type="email"
                    placeholder="julian@miclub.co"
                    value={form.email}
                    onChange={handleChange("email")}
                    style={buildInputStyle(!!errors.email)}
                  />
                </FormField>
              </div>

              <FormField label="Club u organizacion" error={errors.club}>
                <input
                  type="text"
                  placeholder="Club Deportivo Ejemplo"
                  value={form.club}
                  onChange={handleChange("club")}
                  style={buildInputStyle(!!errors.club)}
                />
              </FormField>

              <FormField label="Motivo de contacto *" error={errors.motivo}>
                <select
                  value={form.motivo}
                  onChange={handleChange("motivo")}
                  style={{
                    ...buildInputStyle(!!errors.motivo),
                    background: "rgba(20,20,32,0.95)",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Selecciona un motivo...</option>
                  {MOTIVOS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Mensaje *" error={errors.mensaje}>
                <textarea
                  placeholder="Cuentanos sobre tu club, cuantos deportistas tienen, que problema quieres resolver..."
                  value={form.mensaje}
                  onChange={handleChange("mensaje")}
                  rows={5}
                  style={{
                    ...buildInputStyle(!!errors.mensaje),
                    resize: "vertical",
                    lineHeight: 1.7,
                    minHeight: 120,
                  }}
                />
                <div style={{
                  fontSize: 9, color: C.textHint, textAlign: "right", marginTop: -2,
                }}>
                  {form.mensaje.length} / 1000 caracteres
                </div>
              </FormField>

              <motion.button
                type="submit"
                disabled={sending}
                whileHover={sending ? {} : { scale: 1.02, boxShadow: `0 0 20px ${C.neonGlow}` }}
                whileTap={sending ? {} : { scale: 0.98 }}
                style={{
                  width: "100%", padding: "14px 0",
                  fontSize: 12, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "2px",
                  background: sending ? "rgba(57,255,20,0.3)" : C.neon,
                  color: "#0a0a0f",
                  border: "none", borderRadius: 8,
                  cursor: sending ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "background 200ms",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}
              >
                {sending ? (
                  <>
                    <div style={{
                      width: 14, height: 14,
                      border: "2px solid #0a0a0f",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    Enviando...
                  </>
                ) : (
                  "Enviar mensaje"
                )}
              </motion.button>

              <div style={{ fontSize: 10, color: C.textHint, textAlign: "center" }}>
                Tus datos son confidenciales y no los compartimos con terceros.
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── SIDEBAR: canales directos ── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div style={{
            fontSize: 10, textTransform: "uppercase",
            letterSpacing: "2px", color: C.textHint,
          }}>
            Contacto directo
          </div>

          {CHANNELS.map((ch) => (
            <motion.div
              key={ch.label}
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderLeft: `3px solid ${ch.color}`,
                borderRadius: 10,
                padding: "20px 22px",
                display: "flex", alignItems: "center", gap: 16,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `${ch.color}10`,
                border: `1px solid ${ch.color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {ch.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 9, textTransform: "uppercase",
                  letterSpacing: "1.5px", color: ch.color,
                  marginBottom: 4, fontWeight: 700,
                }}>
                  {ch.label}
                </div>
                <div style={{
                  fontSize: 13, color: "white",
                  fontWeight: 600, marginBottom: 3,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {ch.value}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted }}>
                  {ch.sub}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Horario */}
          <div style={{
            background: `${C.purple}08`,
            border: `1px solid ${C.purple}20`,
            borderRadius: 10,
            padding: "20px 22px",
            marginTop: 8,
          }}>
            <div style={{
              fontSize: 9, textTransform: "uppercase",
              letterSpacing: "2px", color: C.purple,
              marginBottom: 12, fontWeight: 700,
            }}>
              Horario de atencion
            </div>
            {[
              { day: "Lunes a Viernes", time: "8:00 am - 6:00 pm" },
              { day: "Sabados", time: "9:00 am - 1:00 pm" },
              { day: "Domingos", time: "Cerrado" },
            ].map((h) => (
              <div
                key={h.day}
                style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 11, marginBottom: 8,
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{h.day}</span>
                <span style={{ color: "white", fontWeight: 600 }}>{h.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
