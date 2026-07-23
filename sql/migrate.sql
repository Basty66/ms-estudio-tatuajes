-- Complete migration: creates all missing tables and columns

CREATE TABLE IF NOT EXISTS cotizaciones (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  estilo TEXT NOT NULL,
  zona TEXT NOT NULL,
  tamano TEXT NOT NULL,
  imagen_url TEXT DEFAULT '',
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disponibilidad (
  id SERIAL PRIMARY KEY,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  activo BOOLEAN DEFAULT true,
  hora_inicio TEXT DEFAULT '10:00',
  hora_fin TEXT DEFAULT '19:00',
  slots_max INTEGER DEFAULT 3
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'disponibilidad_dia_semana_key') THEN
    ALTER TABLE disponibilidad ADD CONSTRAINT disponibilidad_dia_semana_key UNIQUE (dia_semana);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS excepciones_fecha (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  slots_max INTEGER,
  activo BOOLEAN DEFAULT true,
  motivo TEXT DEFAULT ''
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agendamentos' AND column_name='estado') THEN
    ALTER TABLE agendamentos ADD COLUMN estado TEXT DEFAULT 'pendiente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agendamentos' AND column_name='admin_notas') THEN
    ALTER TABLE agendamentos ADD COLUMN admin_notas TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agendamentos' AND column_name='duracion') THEN
    ALTER TABLE agendamentos ADD COLUMN duracion INTEGER DEFAULT 120;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agendamentos' AND column_name='hora') THEN
    ALTER TABLE agendamentos ADD COLUMN hora TEXT DEFAULT '';
  END IF;
END $$;

INSERT INTO disponibilidad (dia_semana, activo, hora_inicio, hora_fin, slots_max)
VALUES
  (1, true, '10:00', '19:00', 3),
  (2, true, '10:00', '19:00', 3),
  (3, true, '10:00', '19:00', 3),
  (4, true, '10:00', '19:00', 3),
  (5, true, '10:00', '19:00', 3),
  (6, true, '10:00', '14:00', 2)
ON CONFLICT (dia_semana) DO NOTHING;
