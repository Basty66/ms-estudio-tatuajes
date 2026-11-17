-- ============================================================================
-- 004 — El cotizador también cotiza borrado láser
-- ----------------------------------------------------------------------------
-- Una cotización de láser guarda en `estilo` lo que se busca (borrar del todo
-- o aclarar para un cover), en `minimo`/`maximo` el precio de UNA sesión y
-- aparte cuántas sesiones se calcularon.
-- ============================================================================

ALTER TABLE cotizaciones
  ADD COLUMN tipo TEXT NOT NULL DEFAULT 'tatuaje' CHECK (tipo IN ('tatuaje', 'laser')),
  ADD COLUMN sesiones_min SMALLINT CHECK (sesiones_min > 0),
  ADD COLUMN sesiones_max SMALLINT CHECK (sesiones_max >= sesiones_min);
