import { neon } from "@neondatabase/serverless"
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

const cotizaciones = await sql`SELECT * FROM cotizaciones ORDER BY id DESC`
console.log("=== COTIZACIONES ===")
cotizaciones.forEach(c => console.log(`#${c.id}: ${c.nombre} - ${c.estilo} - ${c.zona} - ${c.tamano} - ${c.created_at}`))

const agendamentos = await sql`SELECT * FROM agendamentos ORDER BY id DESC`
console.log("\n=== AGENDAMENTOS ===")
agendamentos.forEach(a => console.log(`#${a.id}: ${a.nombre} - ${a.fecha} - ${a.estado || "pendiente"}`))

process.exit(0)
