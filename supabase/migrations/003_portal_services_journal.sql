-- ════════════════════════════════════════════════════════════
-- Migration 003 — Portal Corporativo: Services & Journal
-- Fecha: 2026-03-28
-- Autor: @Data (Mateo-Data_Engine)
-- Descripcion: Tablas globales para el portal corporativo Elevate.
--   - services: proyectos/servicios de la marca
--   - journal_entries: noticias y actualizaciones
--   Ambas tablas son GLOBALES (sin club_id) — son de la marca, no de un club.
-- ════════════════════════════════════════════════════════════

-- ── Tabla: services ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  icon          text,
  status        text DEFAULT 'active' CHECK (status IN ('active', 'coming_soon', 'deprecated')),
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

COMMENT ON TABLE public.services IS 'Proyectos y servicios del ecosistema Elevate (global, sin club_id)';

-- ── Tabla: journal_entries ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  excerpt       text,
  content       text,
  category      text DEFAULT 'news' CHECK (category IN ('update', 'feature', 'news', 'announcement')),
  image_url     text,
  is_published  boolean DEFAULT false,
  published_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

COMMENT ON TABLE public.journal_entries IS 'Noticias y actualizaciones del portal Elevate (global, sin club_id)';

-- ── Trigger: updated_at automatico ──────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS: SELECT publico, CUD solo admin ─────────────────────
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- SELECT: cualquier visitante puede leer servicios y noticias
CREATE POLICY "services_select_public"
  ON public.services FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "journal_select_public"
  ON public.journal_entries FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: solo usuarios autenticados con role = 'admin'
CREATE POLICY "services_admin_insert"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "services_admin_update"
  ON public.services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "services_admin_delete"
  ON public.services FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "journal_admin_insert"
  ON public.journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "journal_admin_update"
  ON public.journal_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "journal_admin_delete"
  ON public.journal_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Seed Data ───────────────────────────────────────────────

-- Servicios del ecosistema Elevate
INSERT INTO public.services (name, slug, description, icon, status, sort_order) VALUES
  ('Elevate Sports CRM', 'sports-crm', 'Gestion integral de clubes deportivos. Plantilla, entrenamiento, ciencia RPE, finanzas y pizarra tactica en una sola plataforma.', 'crm', 'active', 1),
  ('Elevate Analytics', 'analytics', 'Inteligencia deportiva avanzada. Prediccion de lesiones con machine learning y analisis de rendimiento en tiempo real.', 'analytics', 'coming_soon', 2),
  ('Elevate Academy', 'academy', 'Plataforma de formacion para entrenadores. Cursos, certificaciones y comunidad de conocimiento deportivo.', 'academy', 'coming_soon', 3),
  ('Elevate Connect', 'connect', 'Red de conexion entre clubes, scouts y academias. Visibilidad para el talento emergente colombiano.', 'connect', 'coming_soon', 4)
ON CONFLICT (slug) DO NOTHING;

-- Noticias del journal
INSERT INTO public.journal_entries (title, slug, excerpt, category, is_published, published_at) VALUES
  ('Lanzamiento oficial de Elevate Sports CRM', 'lanzamiento-elevate-sports-crm',
   'Despues de meses de desarrollo, Elevate Sports CRM esta disponible para clubes deportivos en Colombia. Gestion de plantilla, entrenamiento y finanzas en una sola plataforma.',
   'announcement', true, '2026-03-15T10:00:00Z'),
  ('Nuevo modulo de Ciencia RPE integrado', 'modulo-ciencia-rpe',
   'El motor de fatiga basado en la escala Borg CR-10 ya esta activo. Semaforo de salud individual por jugador, alertas de sobrecarga y snapshots automaticos post-sesion.',
   'feature', true, '2026-03-20T14:00:00Z'),
  ('Elevate se asocia con clubes de Bogota y Medellin', 'alianzas-bogota-medellin',
   'Clubes de formacion Sub-17 en Bogota y Medellin adoptan Elevate Sports CRM como herramienta de gestion. El objetivo: estandarizar la operacion deportiva a nivel nacional.',
   'news', true, '2026-03-25T09:00:00Z'),
  ('Proximamente: Elevate Analytics para analisis predictivo', 'proximamente-elevate-analytics',
   'Estamos desarrollando un modulo de inteligencia deportiva que usara machine learning para predecir riesgo de lesiones y optimizar cargas de entrenamiento.',
   'update', true, '2026-03-28T12:00:00Z')
ON CONFLICT (slug) DO NOTHING;
