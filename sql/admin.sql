-- Run in Neon SQL Editor

-- Galería: imágenes subidas por el admin
CREATE TABLE IF NOT EXISTS galeria (
  id SERIAL PRIMARY KEY,
  imagen_url TEXT NOT NULL,
  estilo TEXT NOT NULL DEFAULT 'general',
  titulo TEXT DEFAULT '',
  descripcion TEXT DEFAULT '',
  orden INTEGER DEFAULT 0,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Publicaciones / posts del admin
CREATE TABLE IF NOT EXISTS publicaciones (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT DEFAULT '',
  imagen_url TEXT DEFAULT '',
  tipo TEXT DEFAULT 'post',
  publicado BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Resenas de Google
CREATE TABLE IF NOT EXISTS resenas (
  id SERIAL PRIMARY KEY,
  autor TEXT NOT NULL,
  texto TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  fuente TEXT DEFAULT 'google',
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Métricas simples (page views)
CREATE TABLE IF NOT EXISTS visitas (
  id SERIAL PRIMARY KEY,
  ruta TEXT DEFAULT '/',
  creado_en TIMESTAMP DEFAULT NOW()
);
