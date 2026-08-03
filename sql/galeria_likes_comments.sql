-- Likes y comentarios para galería
-- Ejecutar en Neon SQL Editor

-- Likes de galería (un like por IP por imagen)
CREATE TABLE IF NOT EXISTS galeria_likes (
  id SERIAL PRIMARY KEY,
  galeria_id INTEGER NOT NULL REFERENCES galeria(id) ON DELETE CASCADE,
  ip TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW(),
  UNIQUE(galeria_id, ip)
);

-- Comentarios de galería
CREATE TABLE IF NOT EXISTS galeria_comentarios (
  id SERIAL PRIMARY KEY,
  galeria_id INTEGER NOT NULL REFERENCES galeria(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  texto TEXT NOT NULL,
  eliminado BOOLEAN DEFAULT false,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_galeria_likes_id ON galeria_likes(galeria_id);
CREATE INDEX IF NOT EXISTS idx_galeria_comentarios_id ON galeria_comentarios(galeria_id);
