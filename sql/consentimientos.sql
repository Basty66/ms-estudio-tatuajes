-- Consentimiento informado digital
-- Ejecutar en el SQL Editor de Neon.

CREATE TABLE IF NOT EXISTS consentimientos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  rut TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT DEFAULT '',
  direccion TEXT DEFAULT '',

  -- Zona y descripción del tatuaje
  zona_tatuaje TEXT DEFAULT '',
  descripcion_tatuaje TEXT DEFAULT '',

  -- Declaraciones de salud (booleanos)
  mayor_edad BOOLEAN NOT NULL DEFAULT false,
  bajo_efectos BOOLEAN NOT NULL DEFAULT false,       -- bajo efectos de alcohol/drogas
  embarazo_lactancia BOOLEAN NOT NULL DEFAULT false,
  problemas_coagulacion BOOLEAN NOT NULL DEFAULT false,
  diabetes BOOLEAN NOT NULL DEFAULT false,
  alergias BOOLEAN NOT NULL DEFAULT false,
  alergias_detalle TEXT DEFAULT '',
  enfermedad_cardiaca BOOLEAN NOT NULL DEFAULT false,
  epilepsia BOOLEAN NOT NULL DEFAULT false,
  vih_hepatitis BOOLEAN NOT NULL DEFAULT false,
  medicamentos TEXT DEFAULT '',
  condiciones_otras TEXT DEFAULT '',

  -- Aceptaciones (deben ser true para enviar)
  acepta_riesgos BOOLEAN NOT NULL DEFAULT false,
  acepta_cuidados BOOLEAN NOT NULL DEFAULT false,
  acepta_veracidad BOOLEAN NOT NULL DEFAULT false,
  acepta_datos BOOLEAN NOT NULL DEFAULT false,

  -- Firma digital (imagen base64 del canvas) y metadatos
  firma_url TEXT NOT NULL,
  firmado_en TIMESTAMP DEFAULT NOW(),
  ip_firma TEXT DEFAULT '',

  -- Vínculo opcional con una cita
  agendamiento_id INTEGER,

  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consentimientos_creado ON consentimientos (creado_en DESC);
