-- ============================================================================
-- 008 — Reservas desde la web
-- ----------------------------------------------------------------------------
-- Después de cotizar, la persona elige día y hora entre las libres. La cita
-- nace "solicitada": aparta la hora (nadie más la puede tomar) hasta que el
-- tatuador la confirma con el precio final y el abono, o hasta que vence.
--
-- El constraint contra la doble reserva pasa a contar también las
-- solicitadas: dos personas no pueden pedir la misma hora.
-- ============================================================================

ALTER TABLE citas DROP CONSTRAINT citas_estado_check;
ALTER TABLE citas ADD CONSTRAINT citas_estado_check
  CHECK (estado IN ('solicitada', 'confirmada', 'completada', 'cancelada', 'no_vino'));

ALTER TABLE citas DROP CONSTRAINT citas_sin_choque;
ALTER TABLE citas ADD CONSTRAINT citas_sin_choque
  EXCLUDE USING gist (rango WITH &&) WHERE (estado IN ('solicitada', 'confirmada', 'completada'));

-- De dónde vino la cita y, si fue de la web, un hash de la conexión (con sal
-- del día) para frenar abusos sin saber quién es.
ALTER TABLE citas
  ADD COLUMN origen TEXT NOT NULL DEFAULT 'panel' CHECK (origen IN ('panel', 'web')),
  ADD COLUMN origen_red TEXT;
CREATE INDEX citas_solicitadas ON citas (creada_en) WHERE estado = 'solicitada';

-- El horario de atención y las reglas de las reservas se cambian desde el panel.
ALTER TABLE contenido DROP CONSTRAINT contenido_clave_check;
ALTER TABLE contenido ADD CONSTRAINT contenido_clave_check
  CHECK (clave IN ('estudio', 'precios', 'tatuador', 'preguntas', 'cuidados', 'fotos', 'consentimiento', 'mensajes', 'reservas'));
