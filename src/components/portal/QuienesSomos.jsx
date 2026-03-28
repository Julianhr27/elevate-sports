/**
 * @component QuienesSomos
 * @description Pagina de storytelling de marca para Elevate Sports.
 * Secciones: hero con manifiesto, origen, equipo, valores, CTA final.
 * Disenio: glassmorphism panels, gradientes charcoal/neon, Framer Motion.
 *
 * @route /quienes-somos
 * @author @Arquitecto (Carlos) — Portal Corporativo
 * @version 1.0.0
 */

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PALETTE as C } from "../../constants/palette";

// ── Animation variants ──────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

// ── Data ────────────────────────────────────────────────────────────────────
const VALUES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke={C.neon} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke={C.neon} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Datos con proposito",
    body: "No acumulamos numeros. Convertimos metricas en decisiones que cambian resultados reales sobre el campo.",
    color: C.neon,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={C.purple} strokeWidth="1.5"/>
        <path d="M12 6v6l4 2" stroke={C.purple} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Velocidad de respuesta",
    body: "El cuerpo tecnico no puede esperar reportes lentos. Nuestra plataforma opera en tiempo real, decision a decision.",
    color: C.purple,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={C.amber} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke={C.amber} strokeWidth="1.5"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={C.amber} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Para el deporte colombiano",
    body: "Construido desde adentro. Nuestro equipo son deportistas, entrenadores y tecnologos que entienden la cancha.",
    color: C.amber,
  },
];

const MILESTONES = [
  { year: "2023", event: "Primer prototipo con un club de futbol sala en Bogota. 12 jugadores. 1 entrenador. Mucho aprendizaje." },
  { year: "2024", event: "Version 1 lanzada con 8 clubes piloto a lo largo de Colombia. Validacion de modelo de negocio." },
  { year: "2025", event: "Expansion a tres disciplinas: futbol, baloncesto y voleibol. Primer contrato institucional." },
  { year: "2026", event: "Elevate Sports CRM v8. Auth en la nube, sincronizacion offline-first y modulo tactico completo." },
];

// ── Sub-componentes ─────────────────────────────────────────────────────────
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

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function QuienesSomos() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      color: "white",
      fontFamily: "'Barlow', 'Arial Narrow', Arial, sans-serif",
    }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative",
        padding: "100px 32px 80px",
        maxWidth: 900,
        margin: "0 auto",
        textAlign: "center",
        overflow: "hidden",
      }}>
        {/* Gradient glow background */}
        <div style={{
          position: "absolute",
          top: "20%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600, height: 600,
          background: `radial-gradient(ellipse at center, ${C.neon}10 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          style={{ position: "relative" }}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
            <SectionLabel text="Nuestra historia" />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            style={{
              fontSize: "clamp(36px, 6vw, 64px)",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
              fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
              margin: "0 0 28px",
              background: `linear-gradient(135deg, #ffffff 0%, ${C.neon} 60%, #7C3AED 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Elevamos el deporte<br />colombiano con datos
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            style={{
              fontSize: "clamp(15px, 2vw, 18px)",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.8,
              maxWidth: 620,
              margin: "0 auto 40px",
              letterSpacing: "0.2px",
            }}
          >
            Empezamos con una frustracion sencilla: los entrenadores colombianos tomaban
            decisiones criticas sin datos. Construimos Elevate para cambiar eso.
          </motion.p>

          {/* Stats row */}
          <motion.div
            variants={stagger}
            style={{
              display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap",
            }}
          >
            {[
              { val: "80+", label: "Clubes activos" },
              { val: "3", label: "Disciplinas" },
              { val: "2K+", label: "Deportistas registrados" },
              { val: "1", label: "Mision" },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                style={{ textAlign: "center" }}
              >
                <div style={{
                  fontSize: "clamp(28px, 4vw, 42px)",
                  fontWeight: 900,
                  color: C.neon,
                  fontFamily: "'Barlow Condensed', Arial, sans-serif",
                  lineHeight: 1,
                }}>
                  {s.val}
                </div>
                <div style={{
                  fontSize: 10, textTransform: "uppercase",
                  letterSpacing: "2px", color: "rgba(255,255,255,0.4)",
                  marginTop: 6,
                }}>
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── ORIGEN ────────────────────────────────────────────────────── */}
      <section style={{
        padding: "80px 32px",
        maxWidth: 1100,
        margin: "0 auto",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 48,
          alignItems: "center",
        }}>
          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <SectionLabel text="Origen" />
            <h2 style={{
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
              color: "white",
              margin: "0 0 32px",
            }}>
              De la cancha al codigo
            </h2>
            <div style={{ position: "relative", paddingLeft: 24 }}>
              {/* Vertical line */}
              <div style={{
                position: "absolute", left: 6, top: 8, bottom: 8,
                width: 1, background: `linear-gradient(to bottom, ${C.neon}, transparent)`,
              }} />
              {MILESTONES.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  style={{ marginBottom: 28, position: "relative" }}
                >
                  {/* Dot */}
                  <div style={{
                    position: "absolute", left: -21, top: 5,
                    width: 8, height: 8, borderRadius: "50%",
                    background: i === MILESTONES.length - 1 ? C.neon : "rgba(255,255,255,0.2)",
                    border: `1px solid ${i === MILESTONES.length - 1 ? C.neon : "rgba(255,255,255,0.15)"}`,
                    boxShadow: i === MILESTONES.length - 1 ? `0 0 12px ${C.neonGlow}` : "none",
                  }} />
                  <div style={{
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "2px", color: C.neon, marginBottom: 5,
                  }}>
                    {m.year}
                  </div>
                  <div style={{
                    fontSize: 13, color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.6,
                  }}>
                    {m.event}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual panel */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <GlassCard style={{ padding: 40 }}>
              <div style={{
                fontSize: 10, textTransform: "uppercase", letterSpacing: "2px",
                color: C.textHint, marginBottom: 20,
              }}>
                Manifiesto Elevate
              </div>
              {[
                "El talento latinoamericano no necesita mas intuicion. Necesita informacion.",
                "Cada lesion prevenida es una carrera salvada. Cada dato es un argumento para el cuerpo tecnico.",
                "Construimos herramientas para entrenadores que quieren ganar con evidencia, no con suerte.",
                "Elevate no es un software. Es el sistema nervioso del deporte colombiano moderno.",
              ].map((quote, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13, color: "rgba(255,255,255,0.7)",
                    lineHeight: 1.8, marginBottom: 18,
                    paddingLeft: 14,
                    borderLeft: `2px solid ${i === 0 ? C.neon : i === 1 ? C.purple : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {quote}
                </div>
              ))}
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* ── VALORES ───────────────────────────────────────────────────── */}
      <section style={{
        padding: "80px 32px",
        background: "rgba(255,255,255,0.015)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <SectionLabel text="Valores" />
            <h2 style={{
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 800, letterSpacing: "-0.5px",
              color: "white", margin: 0,
            }}>
              Lo que nos mueve
            </h2>
          </motion.div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}>
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <GlassCard style={{
                  padding: 32,
                  height: "100%",
                  borderTop: `2px solid ${v.color}`,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: `${v.color}12`,
                    border: `1px solid ${v.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 20,
                  }}>
                    {v.icon}
                  </div>
                  <h3 style={{
                    fontSize: 15, fontWeight: 700, color: "white",
                    margin: "0 0 10px", letterSpacing: "-0.2px",
                  }}>
                    {v.title}
                  </h3>
                  <p style={{
                    fontSize: 13, color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.7, margin: 0,
                  }}>
                    {v.body}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section style={{
        padding: "100px 32px",
        textAlign: "center",
        maxWidth: 700,
        margin: "0 auto",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <SectionLabel text="Proximo paso" />
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900, letterSpacing: "-1px",
            lineHeight: 1.15,
            color: "white",
            margin: "0 0 20px",
          }}>
            Tu club merece tomar<br />
            <span style={{ color: C.neon }}>decisiones inteligentes</span>
          </h2>
          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.5)",
            lineHeight: 1.7, marginBottom: 40,
          }}>
            Empieza gratis hoy. Sin tarjeta de credito. Sin configuracion compleja.
            Solo tu plantel y los datos que necesitas.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: `0 0 24px ${C.neonGlow}` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/crm")}
              style={{
                padding: "14px 36px",
                fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "2px",
                background: C.neon, color: "#0a0a0f",
                border: "none", borderRadius: 8,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Comenzar gratis
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/contacto")}
              style={{
                padding: "14px 36px",
                fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "2px",
                background: "transparent", color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Hablar con el equipo
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
