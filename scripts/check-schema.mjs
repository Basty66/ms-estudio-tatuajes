import { neon } from "@neondatabase/serverless"
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

const r = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'agendamentos' ORDER BY ordinal_position`
r.forEach(c => console.log(c.column_name, c.data_type))
process.exit(0)
