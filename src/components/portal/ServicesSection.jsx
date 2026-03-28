/**
 * @component ServicesSection
 * @description Showcase del CRM como servicio elite de Elevate.
 * 3 cards premium: Gestion de Plantilla, Ciencia RPE, Finanzas.
 * @author @Desarrollador (Andres)
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { PALETTE as C } from "../../constants/palette";

const SERVICES = [
  {
    title: "Gestion de Plantilla",
    description: "Control total del plantel. Registro de jugadores, posiciones, disponibilidad, pizarra tactica con drag & drop estilo FIFA y formaciones dinamicas.",
    accent: C.neon,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="6" y="10" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="15" cy="18" r="2.5" fill="currentColor" opacity="0.5"/>
        <circle cx="25" cy="18" r="2.5" fill="currentColor" opacity="0.5"/>
        <circle cx="20" cy="24" r="2.5" fill="currentColor" opacity="0.5"/>
        <line x1="20" y1="10" x2="20" y2="30" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
      </svg>
    ),
    features: ["Plantel completo", "Pizarra FIFA", "Formaciones", "Historial medico"],
  },
  {
    title: "Ciencia RPE",
    description: "Motor de fatiga basado en la escala Borg CR-10. Semaforo de salud por jugador, alertas de sobrecarga y snapshots automaticos post-sesion.",
    accent: "#7C3AED",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M8 28l6-10 5 6 4-8 5 4 4-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="20" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M20 16v4" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    features: ["Escala Borg CR-10", "Semaforo de salud", "Alertas automaticas", "Historial 7 dias"],
  },
  {
    title: "Finanzas del Club",
    description: "Administracion financiera completa. Control de mensualidades, movimientos de caja, semaforo de recaudo y exportacion de reportes.",
    accent: C.amber,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="8" y="12" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 18h24" stroke="currentColor" strokeWidth="1"/>
        <circle cx="28" cy="24" r="2" fill="currentColor" opacity="0.5"/>
        <path d="M12 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    features: ["Mensualidades", "Caja de movimientos", "Semaforo financiero", "Exportar reportes"],
  },
];

function ServiceCard({ service, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      style={{
        padding: "32px 28px",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent glow */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 120, height: 120, borderRadius: "50%",
        background: `radial-gradient(circle, ${service.accent}10, transparent)`,
        pointerEvents: "none",
      }} />

      <div style={{ color: service.accent, marginBottom: 20 }}>
        {service.icon}
      </div>

      <h3 style={{
        fontSize: 20, fontWeight: 700, color: "white",
        margin: "0 0 12px",
        fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
      }}>
        {service.title}
      </h3>

      <p style={{
        fontSize: 13, color: C.textMuted, lineHeight: 1.7,
        margin: "0 0 20px",
      }}>
        {service.description}
      </p>

      {/* Feature pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {service.features.map((f, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 500, letterSpacing: "0.5px",
            padding: "4px 10px", borderRadius: 6,
            background: `${service.accent}10`,
            border: `1px solid ${service.accent}25`,
            color: service.accent,
          }}>
            {f}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function ServicesSection({ onAccessCRM, onStartDemo }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="services" style={{
      padding: "100px 24px",
      maxWidth: 1100, margin: "0 auto",
    }}>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ textAlign: "center", marginBottom: 60 }}
      >
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "3px",
          textTransform: "uppercase", color: C.neon, marginBottom: 16,
        }}>
          Servicios
        </div>
        <h2 style={{
          fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800,
          color: "white", margin: "0 0 16px",
          fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
        }}>
          Elevate Sports CRM
        </h2>
        <p style={{
          fontSize: 15, color: C.textMuted, maxWidth: 600,
          margin: "0 auto", lineHeight: 1.7,
        }}>
          La herramienta definitiva para la estandarizacion de clubes deportivos en Colombia.
          Todo lo que un entrenador necesita, en un solo lugar.
        </p>
      </motion.div>

      {/* Service cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
        marginBottom: 48,
      }}>
        {SERVICES.map((s, i) => (
          <ServiceCard key={s.title} service={s} index={i} />
        ))}
      </div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}
      >
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: `0 0 30px ${C.neonGlow}` }}
          whileTap={{ scale: 0.97 }}
          onClick={onAccessCRM}
          style={{
            padding: "14px 40px", fontSize: 14, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "1.5px",
            background: C.neon, color: "#0a0a0f", border: "none",
            borderRadius: 8, cursor: "pointer",
            fontFamily: "'Barlow', Arial, sans-serif",
          }}
        >
          Acceder al CRM
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04, borderColor: "#7C3AED" }}
          whileTap={{ scale: 0.97 }}
          onClick={onStartDemo}
          style={{
            padding: "14px 40px", fontSize: 14, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "1.5px",
            background: "rgba(124,58,237,0.1)", color: "#7C3AED",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: 8, cursor: "pointer",
            fontFamily: "'Barlow', Arial, sans-serif",
          }}
        >
          Iniciar Demo Gratis
        </motion.button>
      </motion.div>
    </section>
  );
}
