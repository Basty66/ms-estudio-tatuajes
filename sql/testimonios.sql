-- Testimonios de clientes (enviados por el público)
-- Ejecutar en el SQL Editor de Neon.

CREATE TABLE IF NOT EXISTS testimonios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  texto TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  aprobado BOOLEAN DEFAULT false,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonios_creado ON testimonios (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_testimonios_aprobado ON testimonios (aprobado);
