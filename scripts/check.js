import { neon } from "@neondatabase/serverless"
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

const result = await sql`SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
console.log("Tables:", result.map(r => r.table_name))

const cols = await sql`SELECT * FROM agendamentos LIMIT 1`
console.log("Agendamentos columns:", cols.length > 0 ? Object.keys(cols[0]) : "empty table")

const test = await sql`
  INSERT INTO cotizaciones (nombre, whatsapp, estilo, zona, tamano, imagen_url)
  VALUES ('test', '+56912345678', 'realista', 'brazo', 'mediano', '')
  RETURNING id
`
console.log("Insert test:", test)

process.exit(0)
