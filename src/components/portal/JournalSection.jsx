/**
 * @component JournalSection
 * @description Feed dinamico de noticias y updates de la marca Elevate.
 * Scroll reveal via useInView. Datos estaticos iniciales (Mateo los migrara a Supabase).
 * @author @Desarrollador (Andres)
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { PALETTE as C } from "../../constants/palette";
import { DEMO_JOURNAL } from "../../constants/portalData";

const CATEGORY_COLORS = {
  announcement: C.neon,
  feature: "#7C3AED",
  news: "#00e5ff",
  update: C.amber,
};

const CATEGORY_LABELS = {
  announcement: "Anuncio",
  feature: "Feature",
  news: "Noticia",
  update: "Update",
};

function JournalCard({ entry, index }) {
  const accent = CATEGORY_COLORS[entry.category] || C.neon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, borderColor: `${accent}44` }}
      style={{
        padding: "24px 24px",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        transition: "border-color 0.3s",
        cursor: "pointer",
      }}
    >
      {/* Category + date */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 12, flexWrap: "wrap", gap: 8,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 600, letterSpacing: "1.5px",
          textTransform: "uppercase", color: accent,
          background: `${accent}12`, padding: "3px 10px",
          borderRadius: 4,
        }}>
          {CATEGORY_LABELS[entry.category] || entry.category}
        </span>
        <span style={{
          fontSize: 11, color: C.textMuted,
        }}>
          {entry.published_at}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 16, fontWeight: 700, color: "white",
        margin: "0 0 8px", lineHeight: 1.3,
        fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
      }}>
        {entry.title}
      </h3>

      {/* Excerpt */}
      <p style={{
        fontSize: 13, color: C.textMuted, lineHeight: 1.6,
        margin: 0,
      }}>
        {entry.excerpt}
      </p>

      {/* Read more indicator */}
      <div style={{
        marginTop: 16, fontSize: 11, fontWeight: 600,
        color: accent, letterSpacing: "0.5px",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        Leer mas
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </motion.article>
  );
}

export default function JournalSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{
      padding: "100px 24px 80px",
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
          textTransform: "uppercase", color: "#00e5ff", marginBottom: 16,
        }}>
          Journal
        </div>
        <h2 style={{
          fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800,
          color: "white", margin: "0 0 16px",
          fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
        }}>
          Noticias y actualizaciones
        </h2>
        <p style={{
          fontSize: 15, color: C.textMuted, maxWidth: 500,
          margin: "0 auto", lineHeight: 1.7,
        }}>
          Lo ultimo del ecosistema Elevate. Lanzamientos, alianzas y el futuro del deporte colombiano.
        </p>
      </motion.div>

      {/* Journal cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
      }}>
        {DEMO_JOURNAL.map((entry, i) => (
          <JournalCard key={entry.slug} entry={entry} index={i} />
        ))}
      </div>
    </section>
  );
}
