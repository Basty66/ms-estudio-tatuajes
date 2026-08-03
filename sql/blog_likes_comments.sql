-- Likes y comentarios para publicaciones
-- Ejecutar en Neon SQL Editor

-- Likes (un like por IP por publicación)
CREATE TABLE IF NOT EXISTS publicacion_likes (
  id SERIAL PRIMARY KEY,
  publicacion_id INTEGER NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  ip TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW(),
  UNIQUE(publicacion_id, ip)
);

-- Comentarios
CREATE TABLE IF NOT EXISTS publicacion_comentarios (
  id SERIAL PRIMARY KEY,
  publicacion_id INTEGER NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  texto TEXT NOT NULL,
  eliminado BOOLEAN DEFAULT false,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_likes_publicacion ON publicacion_likes(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion ON publicacion_comentarios(publicacion_id);
