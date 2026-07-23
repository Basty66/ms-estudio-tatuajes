import { neon } from "@neondatabase/serverless"

const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS galeria (
      id SERIAL PRIMARY KEY,
      imagen_url TEXT NOT NULL,
      estilo TEXT NOT NULL DEFAULT 'general',
      titulo TEXT DEFAULT '',
      descripcion TEXT DEFAULT '',
      orden INTEGER DEFAULT 0,
      creado_en TIMESTAMP DEFAULT NOW()
    )
  `
  console.log("galeria OK")

  await sql`
    CREATE TABLE IF NOT EXISTS publicaciones (
      id SERIAL PRIMARY KEY,
      titulo TEXT NOT NULL,
      contenido TEXT DEFAULT '',
      imagen_url TEXT DEFAULT '',
      tipo TEXT DEFAULT 'post',
      publicado BOOLEAN DEFAULT true,
      creado_en TIMESTAMP DEFAULT NOW()
    )
  `
  console.log("publicaciones OK")

  await sql`
    CREATE TABLE IF NOT EXISTS resenas (
      id SERIAL PRIMARY KEY,
      autor TEXT NOT NULL,
      texto TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      fuente TEXT DEFAULT 'google',
      creado_en TIMESTAMP DEFAULT NOW()
    )
  `
  console.log("resenas OK")

  await sql`
    CREATE TABLE IF NOT EXISTS visitas (
      id SERIAL PRIMARY KEY,
      ruta TEXT DEFAULT '/',
      creado_en TIMESTAMP DEFAULT NOW()
    )
  `
  console.log("visitas OK")
}

migrate().then(() => { console.log("Done!"); process.exit(0) }).catch((e) => { console.error(e); process.exit(1) })
