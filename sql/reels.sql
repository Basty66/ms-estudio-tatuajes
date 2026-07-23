-- Ejecutar en Neon SQL Editor
CREATE TABLE IF NOT EXISTS reels (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  titulo TEXT DEFAULT '',
  plataforma TEXT NOT NULL DEFAULT 'instagram',
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  creado_en TIMESTAMP DEFAULT NOW()
);
