import { neon } from "@neondatabase/serverless"
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

await sql`
  CREATE TABLE IF NOT EXISTS finanzas (
    id SERIAL PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
    categoria TEXT NOT NULL,
    concepto TEXT NOT NULL,
    monto INTEGER NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    agendamiento_id INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`
console.log("✓ tabla finanzas creada")

const res = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'finanzas' ORDER BY ordinal_position`
res.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`))

process.exit(0)
