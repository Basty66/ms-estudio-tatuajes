import { neon } from "@neondatabase/serverless"

// Uso (PowerShell):
//   vercel env pull .env.local --yes
//   $line = (Get-Content .env.local | Where-Object { $_ -like "NEON_DATABASE_URL=*" } | Select-Object -First 1)
//   $env:NEON_DATABASE_URL = $line.Substring($line.IndexOf("=") + 1).Trim('"').Trim("'")
//   node scripts/fix-finanzas.mjs
//   Remove-Item .env.local

const url = process.env.NEON_DATABASE_URL
if (!url) {
  console.error("Falta NEON_DATABASE_URL en el entorno.")
  process.exit(1)
}

const sql = neon(url)

// 1) Migración: columna baucher en agendamentos
await sql`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agendamentos' AND column_name='baucher') THEN
      ALTER TABLE agendamentos ADD COLUMN baucher TEXT DEFAULT '';
    END IF;
  END $$;
`
console.log("[1] Columna 'baucher' lista (agendamentos).")

// 2) Reporte de registros corruptos: ingreso en $0 ligado a una cita (bug del auto-insert)
const corruptos = await sql`
  SELECT f.id, f.monto, f.concepto, f.agendamiento_id, a.nombre AS cliente, a.estado
  FROM finanzas f
  LEFT JOIN agendamentos a ON f.agendamiento_id = a.id
  WHERE f.agendamiento_id IS NOT NULL AND f.monto = 0
  ORDER BY f.id
`
console.log(`[2] Registros corruptos detectados (monto=0 con cita): ${corruptos.length}`)
for (const r of corruptos) {
  console.log(`    id=${r.id} | cita=${r.agendamiento_id} (${r.cliente ?? "?"} / ${r.estado ?? "?"}) | "${r.concepto}"`)
}

// 3) Borrar los corruptos
if (corruptos.length > 0) {
  const del = await sql`
    DELETE FROM finanzas
    WHERE agendamiento_id IS NOT NULL AND monto = 0
    RETURNING id
  `
  console.log(`[3] Eliminados: ${del.length} registros en $0.`)
}

// 4) Estado final de finanzas
const resumen = await sql`
  SELECT
    COUNT(*) AS total,
    COALESCE(SUM(monto) FILTER (WHERE tipo = 'ingreso'), 0)::int AS ingresos,
    COALESCE(SUM(monto) FILTER (WHERE tipo = 'gasto'), 0)::int AS gastos,
    COUNT(*) FILTER (WHERE tipo = 'ingreso' AND agendamiento_id IS NOT NULL AND monto > 0) AS ingresos_de_citas
  FROM finanzas
`
console.log("[4] Estado final finanzas:", JSON.stringify(resumen[0]))
console.log("    Pendiente: revisar manualmente que ninguna cita completada quede sin su ingreso real.")
