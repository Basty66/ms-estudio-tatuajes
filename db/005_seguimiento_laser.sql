-- ============================================================================
-- 005 — Seguimiento del borrado láser
-- ----------------------------------------------------------------------------
-- El láser se cuida distinto y se repite: un mensaje al día siguiente y otro
-- a las seis semanas, cuando la piel ya está lista para la próxima sesión.
-- ============================================================================

ALTER TABLE seguimientos DROP CONSTRAINT seguimientos_etapa_check;
ALTER TABLE seguimientos ADD CONSTRAINT seguimientos_etapa_check
  CHECK (etapa IN ('dia1', 'dia7', 'dia30', 'resena', 'laser1', 'laserProxima'));
