-- ============================================================================
-- 003 — Consentimiento informado, seguimiento después de la sesión y fotos
--       de la galería ligadas a su cita
-- ----------------------------------------------------------------------------
-- Un consentimiento por cita. Nace "pendiente" cuando el tatuador lo pide
-- (link por WhatsApp o "Firmar aquí") y pasa a firmado en la misma fila.
--
-- Son datos de salud: datos sensibles (Ley 21.719). Por eso:
--   - Del link se guarda solo el hash del token, y se borra al firmar (un
--     solo uso). Vence a los 7 días.
--   - La firma va al almacén PRIVADO de Blob; acá queda solo su ruta.
--   - Se guarda una copia exacta del texto aceptado (`texto`): el PDF se arma
--     con eso, no con los textos de hoy, que el estudio puede cambiar.
--   - `conservar_hasta` = firma + 5 años. El cron diario borra lo vencido
--     (primero el archivo, después la fila).
-- ============================================================================

CREATE TABLE consentimientos (
  id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cita_id          INT NOT NULL UNIQUE REFERENCES citas(id) ON DELETE RESTRICT,
  cliente_id       INT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,

  -- El link: en el mensaje viaja el token, acá solo su hash.
  token_hash       TEXT UNIQUE,
  vence_en         TIMESTAMPTZ,
  pedido_por       TEXT NOT NULL,
  pedido_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Lo firmado. Todo NULL mientras está pendiente.
  firmado_en       TIMESTAMPTZ,
  donde            TEXT CHECK (donde IN ('link', 'estudio')),
  -- Nombre, RUT, nacimiento, teléfono y, si es menor, quien lo representa.
  datos            JSONB,
  -- Las respuestas de salud tal cual.
  salud            JSONB,
  -- Lo que el tatuador tiene que ver antes de empezar ("Alergia: látex").
  alertas          TEXT[] NOT NULL DEFAULT '{}',
  -- Permiso aparte y opcional para publicar fotos del tatuaje.
  permite_fotos    BOOLEAN,
  texto            JSONB,
  version          TEXT,
  firma            TEXT,
  -- sha256 de lo firmado: si alguien cambia la fila, deja de calzar.
  huella           TEXT,
  conservar_hasta  DATE,

  CHECK ((firmado_en IS NULL) = (firma IS NULL)),
  CHECK (firmado_en IS NULL OR token_hash IS NULL)
);
CREATE INDEX consentimientos_cliente ON consentimientos (cliente_id);
CREATE INDEX consentimientos_conservar ON consentimientos (conservar_hasta) WHERE conservar_hasta IS NOT NULL;

CREATE TRIGGER cambio_consentimientos AFTER INSERT OR UPDATE OR DELETE ON consentimientos FOR EACH STATEMENT EXECUTE FUNCTION marcar_cambio();

-- ----------------------------------------------------------------------------
-- Mensajes de después de la sesión: cuáles ya se mandaron, para no repetir
-- y para que "Hoy" muestre solo los que faltan.
-- ----------------------------------------------------------------------------
CREATE TABLE seguimientos (
  cita_id      INT NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
  etapa        TEXT NOT NULL CHECK (etapa IN ('dia1', 'dia7', 'dia30', 'resena')),
  enviado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enviado_por  TEXT NOT NULL,
  PRIMARY KEY (cita_id, etapa)
);

CREATE TRIGGER cambio_seguimientos AFTER INSERT OR UPDATE OR DELETE ON seguimientos FOR EACH STATEMENT EXECUTE FUNCTION marcar_cambio();

-- ----------------------------------------------------------------------------
-- Una foto de la galería puede venir de una cita ("Subir foto del trabajo").
-- ----------------------------------------------------------------------------
ALTER TABLE galeria ADD COLUMN cita_id INT REFERENCES citas(id) ON DELETE SET NULL;
CREATE INDEX galeria_cita ON galeria (cita_id) WHERE cita_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Dos bloques nuevos de contenido editable: los textos del consentimiento y
-- los mensajes de WhatsApp.
-- ----------------------------------------------------------------------------
ALTER TABLE contenido DROP CONSTRAINT contenido_clave_check;
ALTER TABLE contenido ADD CONSTRAINT contenido_clave_check
  CHECK (clave IN ('estudio', 'precios', 'tatuador', 'preguntas', 'cuidados', 'fotos', 'consentimiento', 'mensajes'));
