/**
 * Aplica las migraciones pendientes de db/ contra NEON_DATABASE_URL.
 *
 *   node --env-file=.env.local scripts/migrar.mjs                rama dev
 *   node --env-file=.env.local scripts/migrar.mjs --produccion   rama production
 *
 * Lleva la cuenta en la tabla `migraciones`. Cada archivo va en su propia
 * transacción: si uno falla, no queda a medias y los anteriores se respetan.
 * La salida se imprime completa, sin filtrar: así no se esconde el error que
 * abortó una migración.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

// Producción se pide a propósito con --produccion: lo normal es probar en dev.
const produccion = process.argv.includes("--produccion");
const variable = produccion ? "NEON_DATABASE_URL_PRODUCCION" : "NEON_DATABASE_URL";
const url = process.env[variable];
if (!url) {
  console.error(`Falta ${variable}.`);
  process.exit(1);
}

console.log(`Base: ${new URL(url).host}${produccion ? "  (PRODUCCIÓN)" : ""}\n`);

const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await cliente.connect();

try {
  await cliente.query(`
    CREATE TABLE IF NOT EXISTS migraciones (
      nombre      TEXT PRIMARY KEY,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  const { rows } = await cliente.query("SELECT nombre FROM migraciones");
  const hechas = new Set(rows.map((r) => r.nombre));
  const pendientes = readdirSync("db")
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .filter((f) => !hechas.has(f));

  if (pendientes.length === 0) console.log("Nada pendiente.");

  for (const archivo of pendientes) {
    process.stdout.write(`→ ${archivo} ... `);
    await cliente.query("BEGIN");
    try {
      await cliente.query(readFileSync(join("db", archivo), "utf8"));
      await cliente.query("INSERT INTO migraciones (nombre) VALUES ($1)", [archivo]);
      await cliente.query("COMMIT");
      console.log("ok");
    } catch (error) {
      await cliente.query("ROLLBACK");
      console.log("FALLÓ, revertida");
      throw error;
    }
  }
} catch (error) {
  console.error("\n", error);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
