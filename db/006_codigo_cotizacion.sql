-- ============================================================================
-- 006 — Código de cotización
-- ----------------------------------------------------------------------------
-- La tarjeta de "gracias por tu cotización" muestra un código (MS-K7Q2) que
-- también va en el mensaje de WhatsApp: con él, el tatuador encuentra en el
-- panel qué cotizó cada persona que le escribe.
-- ============================================================================

ALTER TABLE cotizaciones ADD COLUMN codigo TEXT CHECK (codigo ~ '^MS-[A-Z2-9]{4}$');
CREATE INDEX cotizaciones_codigo ON cotizaciones (codigo) WHERE codigo IS NOT NULL;
