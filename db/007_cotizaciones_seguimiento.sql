-- ============================================================================
-- 007 — Qué pasó con cada cotización
-- ----------------------------------------------------------------------------
-- La cotización no trae nombre ni teléfono: la persona escribe por WhatsApp
-- con su código. Desde el panel se responde y, si agenda, se crea la cita con
-- lo cotizado. Acá queda en qué va cada una y con qué cita terminó.
-- ============================================================================

ALTER TABLE cotizaciones
  ADD COLUMN estado TEXT NOT NULL DEFAULT 'nueva' CHECK (estado IN ('nueva', 'respondida', 'agendada', 'descartada')),
  ADD COLUMN cita_id INT REFERENCES citas(id) ON DELETE SET NULL;

CREATE INDEX cotizaciones_estado ON cotizaciones (estado, creada_en DESC);
CREATE INDEX cotizaciones_cita ON cotizaciones (cita_id) WHERE cita_id IS NOT NULL;
