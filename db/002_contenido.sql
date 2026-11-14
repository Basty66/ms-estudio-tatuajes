-- ============================================================================
-- 002 — Contenido de la web que se cambia desde el panel
-- ----------------------------------------------------------------------------
-- Un bloque JSON por tema: datos del estudio, precios del cotizador, textos
-- del tatuador, preguntas, cuidados y fotos fijas de la web. Lo que no está
-- acá sale de los valores de fábrica del código (src/lib/contenido.ts), así
-- que una fila borrada o mal formada nunca deja la portada en blanco.
-- ============================================================================

CREATE TABLE contenido (
  clave           TEXT PRIMARY KEY
                  CHECK (clave IN ('estudio', 'precios', 'tatuador', 'preguntas', 'cuidados', 'fotos')),
  valor           JSONB NOT NULL,
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_por TEXT NOT NULL
);

CREATE TRIGGER cambio_contenido AFTER INSERT OR UPDATE OR DELETE ON contenido FOR EACH STATEMENT EXECUTE FUNCTION marcar_cambio();
