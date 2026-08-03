const { neon } = require("@neondatabase/serverless")
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")
sql`SELECT id, titulo, plataforma, url FROM reels ORDER BY id`.then((r) => {
  for (const row of r) {
    console.log(`${row.id} | ${row.plataforma} | titulo(${row.titulo.length}): ${JSON.stringify(row.titulo)}`)
  }
})
