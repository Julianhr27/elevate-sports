/**
 * @file portalData.js
 * @description Datos demo para el Portal Corporativo Elevate.
 * Servicios y noticias de la marca. Fuente local hasta migrar a Supabase.
 *
 * @author @Data (Mateo-Data_Engine)
 * @version 1.0.0
 */

// ─────────────────────────────────────────────────────────────
// SERVICIOS — Proyectos del ecosistema Elevate
// ─────────────────────────────────────────────────────────────

export const DEMO_SERVICES = [
  {
    id: "svc-001",
    name: "Elevate Sports CRM",
    slug: "sports-crm",
    description: "Gestion integral de clubes deportivos. Plantilla, entrenamiento, ciencia RPE, finanzas y pizarra tactica en una sola plataforma.",
    icon: "crm",
    status: "active",
    sort_order: 1,
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-03-28T00:00:00Z",
  },
  {
    id: "svc-002",
    name: "Elevate Analytics",
    slug: "analytics",
    description: "Inteligencia deportiva avanzada. Prediccion de lesiones con machine learning y analisis de rendimiento en tiempo real.",
    icon: "analytics",
    status: "coming_soon",
    sort_order: 2,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-28T00:00:00Z",
  },
  {
    id: "svc-003",
    name: "Elevate Academy",
    slug: "academy",
    description: "Plataforma de formacion para entrenadores. Cursos, certificaciones y comunidad de conocimiento deportivo.",
    icon: "academy",
    status: "coming_soon",
    sort_order: 3,
    created_at: "2026-03-15T00:00:00Z",
    updated_at: "2026-03-28T00:00:00Z",
  },
  {
    id: "svc-004",
    name: "Elevate Connect",
    slug: "connect",
    description: "Red de conexion entre clubes, scouts y academias. Visibilidad para el talento emergente colombiano.",
    icon: "connect",
    status: "coming_soon",
    sort_order: 4,
    created_at: "2026-03-20T00:00:00Z",
    updated_at: "2026-03-28T00:00:00Z",
  },
];

// ─────────────────────────────────────────────────────────────
// JOURNAL — Noticias y updates de la marca
// ─────────────────────────────────────────────────────────────

export const DEMO_JOURNAL = [
  {
    id: "jrn-001",
    title: "Lanzamiento oficial de Elevate Sports CRM",
    slug: "lanzamiento-elevate-sports-crm",
    excerpt: "Despues de meses de desarrollo, Elevate Sports CRM esta disponible para clubes deportivos en Colombia. Gestion de plantilla, entrenamiento y finanzas en una sola plataforma.",
    content: "",
    category: "announcement",
    image_url: null,
    is_published: true,
    published_at: "2026-03-15",
  },
  {
    id: "jrn-002",
    title: "Nuevo modulo de Ciencia RPE integrado",
    slug: "modulo-ciencia-rpe",
    excerpt: "El motor de fatiga basado en la escala Borg CR-10 ya esta activo. Semaforo de salud individual por jugador, alertas de sobrecarga y snapshots automaticos post-sesion.",
    content: "",
    category: "feature",
    image_url: null,
    is_published: true,
    published_at: "2026-03-20",
  },
  {
    id: "jrn-003",
    title: "Elevate se asocia con clubes de Bogota y Medellin",
    slug: "alianzas-bogota-medellin",
    excerpt: "Clubes de formacion Sub-17 en Bogota y Medellin adoptan Elevate Sports CRM como herramienta de gestion. El objetivo: estandarizar la operacion deportiva a nivel nacional.",
    content: "",
    category: "news",
    image_url: null,
    is_published: true,
    published_at: "2026-03-25",
  },
  {
    id: "jrn-004",
    title: "Proximamente: Elevate Analytics para analisis predictivo",
    slug: "proximamente-elevate-analytics",
    excerpt: "Estamos desarrollando un modulo de inteligencia deportiva que usara machine learning para predecir riesgo de lesiones y optimizar cargas de entrenamiento.",
    content: "",
    category: "update",
    image_url: null,
    is_published: true,
    published_at: "2026-03-28",
  },
];
