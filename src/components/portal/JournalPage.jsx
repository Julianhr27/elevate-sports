/**
 * @component JournalPage
 * @description Pagina dedicada de noticias y actualizaciones de la marca Elevate.
 * Ruta: /journal
 * Cada noticia es un destino, no un resumen.
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

function FeaturedArticle({ entry }) {
  const accent = CATEGORY_COLORS[entry.category] || C.neon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -4 }}
      style={{
        padding: "40px 36px",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        marginBottom: 32,
      }}
    >
      {/* Accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }} />

      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
        flexWrap: "wrap",
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
          textTransform: "uppercase", color: accent,
          background: `${accent}12`, padding: "4px 12px",
          borderRadius: 4,
        }}>
          {CATEGORY_LABELS[entry.category]}
        </span>
        <span style={{ fontSize: 12, color: C.textMuted }}>{entry.published_at}</span>
      </div>

      <h2 style={{
        fontSize: 26, fontWeight: 800, color: "white",
        margin: "0 0 16px", lineHeight: 1.3,
        fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
      }}>
        {entry.title}
      </h2>

      <p style={{
        fontSize: 15, color: C.textMuted, lineHeight: 1.8,
        margin: "0 0 20px", maxWidth: 700,
      }}>
        {entry.excerpt}
      </p>

      {entry.content && (
        <p style={{
          fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.7,
          margin: 0, maxWidth: 700,
        }}>
          {entry.content}
        </p>
      )}
    </motion.article>
  );
}

function ArticleCard({ entry, index }) {
  const accent = CATEGORY_COLORS[entry.category] || C.neon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, borderColor: `${accent}44` }}
      style={{
        padding: "28px 24px",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        transition: "border-color 0.3s",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14, flexWrap: "wrap", gap: 8,
        }}>
          <span style={{
            fontSize: 9, fontWeight: 600, letterSpacing: "1.5px",
            textTransform: "uppercase", color: accent,
            background: `${accent}12`, padding: "3px 10px",
            borderRadius: 4,
          }}>
            {CATEGORY_LABELS[entry.category]}
          </span>
          <span style={{ fontSize: 11, color: C.textMuted }}>{entry.published_at}</span>
        </div>

        <h3 style={{
          fontSize: 18, fontWeight: 700, color: "white",
          margin: "0 0 10px", lineHeight: 1.3,
          fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
        }}>
          {entry.title}
        </h3>

        <p style={{
          fontSize: 13, color: C.textMuted, lineHeight: 1.6,
          margin: 0,
        }}>
          {entry.excerpt}
        </p>
      </div>

      <div style={{
        marginTop: 20, fontSize: 11, fontWeight: 600,
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

export default function JournalPage() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });

  const featured = DEMO_JOURNAL[0];
  const rest = DEMO_JOURNAL.slice(1);

  return (
    <div style={{ overflowX: "hidden" }}>
      {/* ── Page Header ── */}
      <section ref={headerRef} style={{
        padding: "80px 32px 40px",
        textAlign: "center",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: "-10%", right: "10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ position: "relative", zIndex: 2 }}
        >
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "3px",
            textTransform: "uppercase", color: "#00e5ff", marginBottom: 16,
          }}>
            Journal
          </div>
          <h1 style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 800, color: "white", margin: "0 0 16px",
            fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
          }}>
            Noticias y actualizaciones
          </h1>
          <p style={{
            fontSize: 15, color: C.textMuted, maxWidth: 550,
            margin: "0 auto", lineHeight: 1.7,
          }}>
            Lo ultimo del ecosistema Elevate. Lanzamientos, alianzas
            y el futuro del deporte colombiano.
          </p>
        </motion.div>
      </section>

      {/* ── Featured Article ── */}
      <section style={{ padding: "0 32px", maxWidth: 900, margin: "0 auto" }}>
        <FeaturedArticle entry={featured} />
      </section>

      {/* ── Article Grid ── */}
      <section style={{
        padding: "20px 32px 80px",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {rest.map((entry, i) => (
            <ArticleCard key={entry.slug} entry={entry} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
