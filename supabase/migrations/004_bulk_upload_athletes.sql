-- ════════════════════════════════════════════════════════════
-- ELEVATE SPORTS — Migration 004: Bulk Upload Support
-- Agrega campos para carga masiva y tabla de logs de upload
--
-- @author @Data (Mateo-Data_Engine)
-- @version 1.0.0
-- ════════════════════════════════════════════════════════════

-- ── 1. Nuevos campos en athletes ──
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS apellido text DEFAULT '';
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS numero_dorsal smallint;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS documento_identidad text DEFAULT '';
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS contacto_emergencia text DEFAULT '';
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Indice de deduplicacion: mismo documento en el mismo club = duplicado
CREATE UNIQUE INDEX IF NOT EXISTS idx_athletes_doc_club
  ON athletes(club_id, documento_identidad)
  WHERE documento_identidad IS NOT NULL AND documento_identidad != '';

-- ── 2. Tabla de logs de uploads masivos ──
CREATE TABLE IF NOT EXISTS bulk_upload_logs (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  club_id     uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  uploaded_by text NOT NULL DEFAULT 'admin',
  file_name   text NOT NULL,
  total_rows  integer NOT NULL DEFAULT 0,
  valid_rows  integer NOT NULL DEFAULT 0,
  invalid_rows integer NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'success'
              CHECK (status IN ('success', 'partial', 'failed')),
  error_details jsonb DEFAULT '[]',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bulk_logs_club ON bulk_upload_logs(club_id);

-- RLS
ALTER TABLE bulk_upload_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_bulk_upload_logs" ON bulk_upload_logs
  FOR ALL USING (true) WITH CHECK (true);

-- ── 3. Trigger para updated_at en athletes ──
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_athletes_updated_at ON athletes;
CREATE TRIGGER trg_athletes_updated_at
  BEFORE UPDATE ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
