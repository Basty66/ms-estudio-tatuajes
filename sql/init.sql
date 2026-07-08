-- Run this in the Neon SQL Editor

CREATE TABLE IF NOT EXISTS agendamentos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  fecha TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  creado_en TIMESTAMP DEFAULT NOW()
);
