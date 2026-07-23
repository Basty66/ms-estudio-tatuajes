import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"

const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

async function migrate() {
  const content = readFileSync("sql/scheduling.sql", "utf-8")
  const statements = content.split(";").filter(s => s.trim())

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt.trim())
      console.log("OK:", stmt.trim().slice(0, 60))
    } catch (e: any) {
      console.log("SKIP (already exists?):", e.message?.slice(0, 60))
    }
  }
  console.log("Scheduling migration done!")
}

migrate().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
