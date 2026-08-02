import { neon } from "@neondatabase/serverless"

const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

await sql`ALTER TABLE reels ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT ''`
console.log("✓ columna video_url agregada a reels")

process.exit(0)
