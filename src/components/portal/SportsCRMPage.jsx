/**
 * @component SportsCRMPage
 * @description Pagina de producto dedicada para Elevate Sports CRM.
 * Ruta: /servicios/sports-crm
 * NO es un resumen — es la pagina de producto completa.
 * @author @Desarrollador (Andres)
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PALETTE as C } from "../../constants/palette";

const MODULES = [
  {
    title: "Gestion de Plantilla",
    description: "Registro completo del plantel con posiciones, disponibilidad, estado fisico y contacto de cada jugador. Visualizacion tipo FIFA con pizarra tactica interactiva y formaciones drag & drop.",
    accent: C.neon,
    features: ["Registro de jugadores", "Pizarra tactica FIFA", "Formaciones drag & drop", "Historial de disponibilidad", "Perfiles individuales"],
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="18" cy="22" r="3" fill="currentColor" opacity="0.5"/>
        <circle cx="30" cy="22" r="3" fill="currentColor" opacity="0.5"/>
        <circle cx="24" cy="30" r="3" fill="currentColor" opacity="0.5"/>
        <line x1="24" y1="10" x2="24" y2="38" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
        <circle cx="24" cy="19" r="8" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
      </svg>
    ),
  },
  {
    title: "Ciencia RPE",
    description: "Motor de fatiga basado en la escala Borg CR-10. Cada sesion de entrenamiento registra la percepcion de esfuerzo de cada jugador. El sistema calcula automaticamente el indice de salud, genera alertas de sobrecarga y toma snapshots post-sesion.",
    accent: "#7C3AED",
    features: ["Escala Borg CR-10", "Semaforo de salud individual", "Alertas de sobrecarga", "Health Snapshots automaticos", "Historial de fatiga 7 dias"],
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <path d="M8 36l8-14 7 8 6-12 7 6 4-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="24" cy="14" r="6" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M24 20v6" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M20 14h8" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
      </svg>
    ),
  },
  {
    title: "Finanzas del Club",
    description: "Administracion financiera integral. Control de mensualidades por jugador, registro de movimientos de caja (ingresos y egresos), semaforo de recaudo mensual y exportacion de reportes financieros para la junta directiva.",
    accent: C.amber,
    features: ["Control de mensualidades", "Caja de movimientos", "Semaforo de recaudo", "Exportar reportes PDF", "Balance automatico"],
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="14" width="32" height="20" rx="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 22h32" stroke="currentColor" strokeWidth="1"/>
        <circle cx="36" cy="30" r="2.5" fill="currentColor" opacity="0.5"/>
        <path d="M14 30h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 26h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      </svg>
    ),
  },
];

const STATS = [
  { value: "6", label: "Modulos integrados", accent: C.neon },
  { value: "15+", label: "Clubes en piloto", accent: "#7C3AED" },
  { value: "500+", label: "Atletas gestionados", accent: C.amber },
  { value: "<3s", label: "Tiempo de carga", accent: "#00e5ff" },
];

function ModuleCard({ mod, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "grid",
        gridTemplateColumns: index % 2 === 0 ? "1fr 1.2fr" : "1.2fr 1fr",
        gap: 40,
        alignItems: "center",
        padding: "60px 0",
        borderBottom: index < MODULES.length - 1 ? `1px solid ${C.border}` : "none",
      }}
    >
      {/* Info side */}
      <div style={{ order: index % 2 === 0 ? 1 : 2 }}>
        <div style={{ color: mod.accent, marginBottom: 16 }}>{mod.icon}</div>
        <h3 style={{
          fontSize: 28, fontWeight: 800, color: "white",
          margin: "0 0 16px",
          fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
        }}>
          {mod.title}
        </h3>
        <p style={{
          fontSize: 14, color: C.textMuted, lineHeight: 1.8,
          margin: "0 0 24px",
        }}>
          {mod.description}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {mod.features.map((f, i) => (
            <span key={i} style={{
              fontSize: 11, fontWeight: 500, padding: "5px 12px",
              borderRadius: 6, background: `${mod.accent}10`,
              border: `1px solid ${mod.accent}25`, color: mod.accent,
            }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Visual side — panel elevado */}
      <motion.div
        whileHover={{ rotateY: 2, rotateX: -2, y: -8 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          order: index % 2 === 0 ? 2 : 1,
          padding: "40px 32px",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          boxShadow: `0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
          perspective: "1000px",
          minHeight: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ color: mod.accent, marginBottom: 16, opacity: 0.6 }}>{mod.icon}</div>
          <div style={{
            fontSize: 11, color: C.textHint, textTransform: "uppercase",
            letterSpacing: "2px",
          }}>
            Modulo
          </div>
          <div style={{
            fontSize: 22, fontWeight: 700, color: mod.accent,
            fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
          }}>
            {mod.title}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SportsCRMPage() {
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <div style={{ overflowX: "hidden" }}>
      {/* ── Product Hero ── */}
      <section style={{
        padding: "80px 32px 60px",
        textAlign: "center",
        position: "relative",
      }}>
        {/* Background orb */}
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />

        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ position: "relative", zIndex: 2 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", borderRadius: 16,
            background: C.neonDim, border: `1px solid ${C.neonBorder}`,
            fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
            textTransform: "uppercase", color: C.neon, marginBottom: 24,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: C.neon, boxShadow: `0 0 8px ${C.neonGlow}`,
            }} />
            Producto Estrella
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 800, lineHeight: 1.1,
            color: "white", margin: "0 0 20px",
            fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
          }}>
            Elevate Sports{" "}
            <span style={{
              background: `linear-gradient(135deg, ${C.neon}, #7C3AED)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              CRM
            </span>
          </h1>

          <p style={{
            fontSize: 16, color: C.textMuted, maxWidth: 650,
            margin: "0 auto 40px", lineHeight: 1.7,
          }}>
            La herramienta definitiva para la estandarizacion de clubes deportivos en Colombia.
            Gestion de plantilla, ciencia del entrenamiento y finanzas en una sola plataforma
            disenada para entrenadores que piensan en grande.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: `0 0 30px ${C.neonGlow}` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/crm")}
              style={{
                padding: "14px 40px", fontSize: 14, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "1.5px",
                background: C.neon, color: "#0a0a0f", border: "none",
                borderRadius: 8, cursor: "pointer",
              }}
            >
              Acceder al CRM
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, borderColor: "#7C3AED" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/crm?demo=true")}
              style={{
                padding: "14px 40px", fontSize: 14, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "1.5px",
                background: "rgba(124,58,237,0.1)", color: "#7C3AED",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: 8, cursor: "pointer",
              }}
            >
              Iniciar Demo Gratis
            </motion.button>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 16, maxWidth: 700, margin: "48px auto 0",
          }}
        >
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: "16px 12px",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.accent }}>{s.value}</div>
              <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px" }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Modules Detail ── */}
      <section style={{ padding: "20px 32px 60px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{
          textAlign: "center", marginBottom: 40,
          fontSize: 10, fontWeight: 600, letterSpacing: "3px",
          textTransform: "uppercase", color: "#7C3AED",
        }}>
          Modulos del CRM
        </div>

        {MODULES.map((mod, i) => (
          <ModuleCard key={mod.title} mod={mod} index={i} />
        ))}
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{
        padding: "60px 32px 80px",
        textAlign: "center",
        borderTop: `1px solid ${C.border}`,
      }}>
        <h2 style={{
          fontSize: 28, fontWeight: 800, color: "white",
          margin: "0 0 16px",
          fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
        }}>
          Listo para transformar tu club?
        </h2>
        <p style={{
          fontSize: 14, color: C.textMuted, marginBottom: 32,
          maxWidth: 450, margin: "0 auto 32px",
        }}>
          Empieza con el demo gratuito y descubre lo que Elevate puede hacer por tu equipo.
        </p>
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: `0 0 30px ${C.neonGlow}` }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/crm?demo=true")}
          style={{
            padding: "16px 48px", fontSize: 15, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "1.5px",
            background: C.neon, color: "#0a0a0f", border: "none",
            borderRadius: 8, cursor: "pointer",
          }}
        >
          Probar Demo Gratis
        </motion.button>
      </section>
    </div>
  );
}
