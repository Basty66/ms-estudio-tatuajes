import { neon } from "@neondatabase/serverless"
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

const rows = await sql`SELECT id, nombre, fecha, estado FROM agendamentos ORDER BY id`
console.log("AGENDAMENTOS:")
rows.forEach(r => console.log(`  #${r.id}: ${r.nombre} - ${r.fecha} - ${r.estado || "pendiente"}`))

const cotRows = await sql`SELECT id, nombre, estado FROM cotizaciones ORDER BY id`
console.log("\nCOTIZACIONES:")
cotRows.forEach(r => console.log(`  #${r.id}: ${r.nombre} - ${r.estado || "pendiente"}`))

process.exit(0)
