-- ============================================================================
-- 001 — Panel del estudio: equipo, sesiones, agenda, pagos, gastos y galería
-- ----------------------------------------------------------------------------
-- Sigue lo que funcionó en piscina-oasis:
--   - La doble reserva no se evita mirando la agenda: la impide Postgres con
--     un constraint de exclusión sobre el rango de horas.
--   - El saldo no se guarda: se deriva de la tabla `pagos` en una vista.
--   - Nada se borra en cascada: un cliente con citas no se puede borrar.
--   - Las horas se guardan como hora de Chile sin zona (timestamp): el cambio
--     de horario de abril y septiembre no corre las citas de lugar.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ----------------------------------------------------------------------------
-- Equipo y entrada
-- ----------------------------------------------------------------------------
CREATE TABLE usuarios (
  id                 SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre             TEXT NOT NULL,
  activo             BOOLEAN NOT NULL DEFAULT TRUE,
  recibe_avisos      BOOLEAN NOT NULL DEFAULT TRUE,
  -- PIN con scrypt y sal propia, nunca en claro.
  pin_hash           TEXT,
  -- Cinco intentos fallidos = quince minutos de espera (ver lib/admin/sesion.ts).
  intentos_fallidos  SMALLINT NOT NULL DEFAULT 0,
  bloqueado_hasta    TIMESTAMPTZ,
  ultimo_ingreso     TIMESTAMPTZ,
  creado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Se entra eligiendo el nombre: dos personas activas no pueden llamarse igual.
CREATE UNIQUE INDEX usuarios_nombre_activo ON usuarios (lower(nombre)) WHERE activo;

-- En la cookie viaja un token aleatorio; acá se guarda solo su hash.
CREATE TABLE sesiones (
  token_hash          TEXT PRIMARY KEY,
  usuario_id          SMALLINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  dispositivo         TEXT,
  creada_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_uso          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vence_en            TIMESTAMPTZ NOT NULL,
  -- La sesión dice QUIÉN es el dueño del aparato (90 días); esto dice que lo
  -- está usando AHORA. Pasado el plazo se pide PIN o Face ID / huella.
  desbloqueada_hasta  TIMESTAMPTZ
);
CREATE INDEX sesiones_usuario ON sesiones (usuario_id);

-- Face ID / huella (WebAuthn): solo la llave pública. La cara o la huella
-- nunca salen del teléfono.
CREATE TABLE credenciales_biometricas (
  id            TEXT PRIMARY KEY,
  usuario_id    SMALLINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  llave_publica TEXT NOT NULL,
  contador      BIGINT NOT NULL DEFAULT 0,
  transportes   TEXT[],
  dispositivo   TEXT,
  creada_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_uso    TIMESTAMPTZ
);
CREATE INDEX credenciales_usuario ON credenciales_biometricas (usuario_id);

-- El desafío de cada ceremonia vive cinco minutos y se usa una sola vez.
CREATE TABLE desafios_biometricos (
  id          TEXT PRIMARY KEY,
  desafio     TEXT NOT NULL,
  usuario_id  SMALLINT REFERENCES usuarios(id) ON DELETE CASCADE,
  vence_en    TIMESTAMPTZ NOT NULL
);

-- Avisos push: una fila por navegador y aparato donde alguien los activó.
CREATE TABLE suscripciones_push (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id    SMALLINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  endpoint      TEXT NOT NULL UNIQUE,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  dispositivo   TEXT,
  creada_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_envio  TIMESTAMPTZ,
  fallos        SMALLINT NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- Clientes
-- ----------------------------------------------------------------------------
CREATE TABLE clientes (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre      TEXT NOT NULL CHECK (length(trim(nombre)) > 0),
  -- Formato internacional sin "+": 56912345678. Es lo que pide wa.me.
  telefono    TEXT CHECK (telefono ~ '^56[0-9]{9}$'),
  instagram   TEXT,
  notas       TEXT,
  creado_por  TEXT NOT NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- El teléfono identifica al cliente: al anotar una cita se autocompleta.
CREATE UNIQUE INDEX clientes_telefono ON clientes (telefono) WHERE telefono IS NOT NULL;
CREATE INDEX clientes_nombre ON clientes (lower(nombre));

-- ----------------------------------------------------------------------------
-- Agenda
-- ----------------------------------------------------------------------------
CREATE TABLE citas (
  id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Sin cliente solo los bloqueos (día libre, convención, trámite).
  cliente_id     INT REFERENCES clientes(id) ON DELETE RESTRICT,
  tipo           TEXT NOT NULL DEFAULT 'tatuaje'
                 CHECK (tipo IN ('tatuaje', 'laser', 'retoque', 'bloqueo')),
  estado         TEXT NOT NULL DEFAULT 'confirmada'
                 CHECK (estado IN ('confirmada', 'completada', 'cancelada', 'no_vino')),
  inicio         TIMESTAMP NOT NULL,
  fin            TIMESTAMP NOT NULL,
  rango          TSRANGE GENERATED ALWAYS AS (tsrange(inicio, fin, '[)')) STORED,
  -- Lo mismo que se elige en el cotizador de la web.
  zona           TEXT,
  lado           TEXT CHECK (lado IN ('izq', 'der')),
  tamano         TEXT,
  estilo         TEXT,
  descripcion    TEXT,
  -- Total acordado en pesos. Puede quedar vacío hasta ver el diseño.
  precio         INT CHECK (precio >= 0),
  notas          TEXT,
  creada_por     TEXT NOT NULL,
  creada_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (fin > inicio),
  CHECK ((tipo = 'bloqueo') = (cliente_id IS NULL))
);

-- La garantía contra la doble reserva: dos citas vivas no pueden pisarse,
-- y un bloqueo tampoco puede pisar una cita. Las canceladas no cuentan.
ALTER TABLE citas ADD CONSTRAINT citas_sin_choque
  EXCLUDE USING gist (rango WITH &&) WHERE (estado IN ('confirmada', 'completada'));

CREATE INDEX citas_inicio ON citas (inicio);
CREATE INDEX citas_cliente ON citas (cliente_id);

-- ----------------------------------------------------------------------------
-- Pagos: una fila por transferencia o pago en efectivo, con su comprobante.
-- ----------------------------------------------------------------------------
CREATE TABLE pagos (
  id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cita_id      INT NOT NULL REFERENCES citas(id) ON DELETE RESTRICT,
  monto        INT NOT NULL CHECK (monto > 0),
  tipo         TEXT NOT NULL CHECK (tipo IN ('abono', 'saldo', 'otro')),
  medio        TEXT NOT NULL CHECK (medio IN ('transferencia', 'efectivo', 'otro')),
  -- Ruta del archivo en el almacén PRIVADO. Nunca una URL pública: un
  -- comprobante lleva nombre, RUT y cuenta bancaria de un tercero.
  comprobante  TEXT,
  fecha        DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Santiago')::DATE,
  anotado_por  TEXT NOT NULL,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX pagos_cita ON pagos (cita_id);
CREATE INDEX pagos_fecha ON pagos (fecha);

-- El estado de pago se deriva, no se escribe: un "pagado" anotado a mano
-- termina contradiciendo la suma real.
CREATE VIEW citas_con_saldo AS
SELECT c.*,
       COALESCE(p.pagado, 0)::INT AS pagado,
       CASE WHEN c.precio IS NULL THEN NULL
            ELSE GREATEST(c.precio - COALESCE(p.pagado, 0), 0)::INT END AS saldo
FROM citas c
LEFT JOIN (SELECT cita_id, SUM(monto) AS pagado FROM pagos GROUP BY cita_id) p
  ON p.cita_id = c.id;

-- ----------------------------------------------------------------------------
-- Gastos del estudio (tintas, agujas, arriendo...)
-- ----------------------------------------------------------------------------
CREATE TABLE gastos (
  id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha        DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Santiago')::DATE,
  categoria    TEXT NOT NULL CHECK (categoria IN ('insumos', 'arriendo', 'servicios', 'publicidad', 'equipos', 'otro')),
  descripcion  TEXT,
  monto        INT NOT NULL CHECK (monto > 0),
  anotado_por  TEXT NOT NULL,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX gastos_fecha ON gastos (fecha);

-- ----------------------------------------------------------------------------
-- Galería: los trabajos que se muestran en la web.
-- ----------------------------------------------------------------------------
CREATE TABLE galeria (
  id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url        TEXT NOT NULL,
  ruta       TEXT NOT NULL,
  alt        TEXT NOT NULL,
  estilo     TEXT NOT NULL,
  zona       TEXT NOT NULL,
  ancho      INT NOT NULL CHECK (ancho > 0),
  alto       INT NOT NULL CHECK (alto > 0),
  orden      INT NOT NULL DEFAULT 0,
  visible    BOOLEAN NOT NULL DEFAULT TRUE,
  subida_por TEXT NOT NULL,
  creada_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Cotizaciones de la web: lo que la gente cotiza antes de escribir. Sin datos
-- personales: no se pide nombre ni teléfono, eso llega por WhatsApp.
-- ----------------------------------------------------------------------------
CREATE TABLE cotizaciones (
  id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  zona       TEXT NOT NULL,
  lado       TEXT CHECK (lado IN ('izq', 'der')),
  tamano     TEXT NOT NULL,
  estilo     TEXT NOT NULL,
  idea       TEXT CHECK (length(idea) <= 600),
  minimo     INT NOT NULL,
  maximo     INT NOT NULL,
  -- Hash del IP con sal del día: alcanza para limitar abusos, no identifica a nadie.
  origen     TEXT NOT NULL,
  vista      BOOLEAN NOT NULL DEFAULT FALSE,
  creada_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX cotizaciones_creada ON cotizaciones (creada_en DESC);
CREATE INDEX cotizaciones_origen ON cotizaciones (origen, creada_en);

-- ----------------------------------------------------------------------------
-- "¿Cambió algo?": cada escritura avanza este contador, y el panel abierto en
-- otro aparato se actualiza solo cuando lo ve moverse (ver /tinta/cambios).
-- ----------------------------------------------------------------------------
CREATE SEQUENCE cambios;

CREATE FUNCTION marcar_cambio() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM nextval('cambios');
  RETURN NULL;
END $$;

CREATE TRIGGER cambio_clientes AFTER INSERT OR UPDATE OR DELETE ON clientes FOR EACH STATEMENT EXECUTE FUNCTION marcar_cambio();
CREATE TRIGGER cambio_citas AFTER INSERT OR UPDATE OR DELETE ON citas FOR EACH STATEMENT EXECUTE FUNCTION marcar_cambio();
CREATE TRIGGER cambio_pagos AFTER INSERT OR UPDATE OR DELETE ON pagos FOR EACH STATEMENT EXECUTE FUNCTION marcar_cambio();
CREATE TRIGGER cambio_gastos AFTER INSERT OR UPDATE OR DELETE ON gastos FOR EACH STATEMENT EXECUTE FUNCTION marcar_cambio();
CREATE TRIGGER cambio_galeria AFTER INSERT OR UPDATE OR DELETE ON galeria FOR EACH STATEMENT EXECUTE FUNCTION marcar_cambio();
CREATE TRIGGER cambio_cotizaciones AFTER INSERT OR UPDATE OR DELETE ON cotizaciones FOR EACH STATEMENT EXECUTE FUNCTION marcar_cambio();

-- Las citas guardan cuándo se tocaron por última vez.
CREATE FUNCTION tocar_cita() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizada_en := NOW();
  RETURN NEW;
END $$;
CREATE TRIGGER citas_tocada BEFORE UPDATE ON citas FOR EACH ROW EXECUTE FUNCTION tocar_cita();

-- ----------------------------------------------------------------------------
-- Quienes usan el panel. El PIN lo crea cada uno la primera vez que entra.
-- De momento, solo Cristian; Matness se agrega cuando empiece a usarlo.
-- ----------------------------------------------------------------------------
INSERT INTO usuarios (nombre) VALUES ('Cristian');
