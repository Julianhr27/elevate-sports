/**
 * @component EcosystemSection
 * @description Grid 3D de paneles elevados — cada uno representa un proyecto/servicio de Elevate.
 * Glassmorphism + hover 3D con perspective/rotateX/Y.
 * @author @Desarrollador (Andres)
 */
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PALETTE as C } from "../../constants/palette";

const PROJECTS = [
  {
    name: "Elevate Sports CRM",
    slug: "sports-crm",
    status: "active",
    description: "Gestion integral de clubes deportivos. Plantilla, entrenamiento, ciencia RPE, finanzas y pizarra tactica en una sola plataforma.",
    accent: C.neon,
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 8v16M4 16h24" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
        <circle cx="10" cy="12" r="2" fill="currentColor" opacity="0.6"/>
        <circle cx="22" cy="20" r="2" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
    stats: [
      { label: "Modulos", value: "6" },
      { label: "Clubes activos", value: "12+" },
      { label: "Version", value: "2.0" },
    ],
  },
  {
    name: "Elevate Analytics",
    slug: "analytics",
    status: "coming_soon",
    description: "Inteligencia deportiva avanzada. Prediccion de lesiones con machine learning y analisis de rendimiento en tiempo real.",
    accent: "#7C3AED",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M6 24l6-8 5 4 4-6 5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="26" cy="17" r="2" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    stats: null,
  },
  {
    name: "Elevate Academy",
    slug: "academy",
    status: "coming_soon",
    description: "Plataforma de formacion para entrenadores. Cursos, certificaciones y comunidad de conocimiento deportivo.",
    accent: "#EF9F27",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 6l12 6-12 6-12-6 12-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M8 15v7c0 2 3.5 4 8 4s8-2 8-4v-7" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    stats: null,
  },
  {
    name: "Elevate Connect",
    slug: "connect",
    status: "coming_soon",
    description: "Red de conexion entre clubes, scouts y academias. Visibilidad para el talento emergente colombiano.",
    accent: "#00e5ff",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="22" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="24" cy="22" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M13 13l-3 6M19 13l3 6" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
      </svg>
    ),
    stats: null,
  },
];

function ElevatedCard({ project, index }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const isActive = project.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        perspective: "1000px",
        gridColumn: isActive ? "1 / -1" : "auto",
      }}
    >
      <motion.div
        animate={{
          rotateX: hovered ? -2 : 0,
          rotateY: hovered ? 2 : 0,
          y: hovered ? -8 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        onClick={isActive ? () => navigate("/servicios/sports-crm") : undefined}
        style={{
          padding: isActive ? "32px 36px" : "28px 24px",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${hovered ? `${project.accent}44` : C.border}`,
          borderRadius: 16,
          boxShadow: hovered
            ? `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${project.accent}15`
            : "0 8px 32px rgba(0,0,0,0.3)",
          transition: "border-color 0.3s, box-shadow 0.3s",
          cursor: isActive ? "pointer" : "default",
          overflow: "hidden",
        }}
      >
        {/* Accent line top */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${project.accent}, transparent)`,
          opacity: hovered ? 0.8 : 0.3,
          transition: "opacity 0.3s",
        }} />

        <div style={{
          display: "flex",
          flexDirection: isActive ? "row" : "column",
          gap: isActive ? 32 : 16,
          alignItems: isActive ? "center" : "flex-start",
          flexWrap: "wrap",
        }}>
          {/* Icon + Header */}
          <div style={{ flex: isActive ? "1 1 400px" : "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
            }}>
              <div style={{ color: project.accent }}>{project.icon}</div>
              <div>
                <h3 style={{
                  fontSize: isActive ? 22 : 16, fontWeight: 700,
                  color: "white", margin: 0, lineHeight: 1.2,
                  fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
                }}>
                  {project.name}
                </h3>
                {project.status === "coming_soon" && (
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: "1.5px",
                    textTransform: "uppercase", color: project.accent,
                    background: `${project.accent}15`, padding: "2px 8px",
                    borderRadius: 4, marginTop: 4, display: "inline-block",
                  }}>
                    Proximamente
                  </span>
                )}
                {isActive && (
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: "1.5px",
                    textTransform: "uppercase", color: C.neon,
                    background: C.neonDim, padding: "2px 8px",
                    borderRadius: 4, marginTop: 4, display: "inline-block",
                  }}>
                    Disponible
                  </span>
                )}
              </div>
            </div>
            <p style={{
              fontSize: 13, color: C.textMuted, lineHeight: 1.7,
              margin: 0, maxWidth: isActive ? 500 : "none",
            }}>
              {project.description}
            </p>
          </div>

          {/* Stats (solo CRM activo) */}
          {project.stats && (
            <div style={{
              display: "flex", gap: 20, flex: "0 0 auto",
            }}>
              {project.stats.map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 24, fontWeight: 800, color: project.accent,
                    fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
                  }}>
                    {s.value}
                  </div>
                  <div style={{
                    fontSize: 9, color: C.textMuted,
                    textTransform: "uppercase", letterSpacing: "1px",
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function EcosystemSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ textAlign: "center", marginBottom: 60 }}
      >
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "3px",
          textTransform: "uppercase", color: "#7C3AED", marginBottom: 16,
        }}>
          Ecosistema
        </div>
        <h2 style={{
          fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800,
          color: "white", margin: "0 0 16px",
          fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
        }}>
          Una marca, multiples soluciones
        </h2>
        <p style={{
          fontSize: 15, color: C.textMuted, maxWidth: 550,
          margin: "0 auto", lineHeight: 1.7,
        }}>
          Elevate construye herramientas que transforman el deporte colombiano.
          Cada proyecto resuelve un problema real del ecosistema deportivo.
        </p>
      </motion.div>

      {/* Projects grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
      }}>
        {PROJECTS.map((p, i) => (
          <ElevatedCard key={p.slug} project={p} index={i} />
        ))}
      </div>
    </section>
  );
}
