/**
 * Carga en Vercel las variables del panel que están en .env.local, sin
 * imprimir ningún valor.
 *
 *   node scripts/variables-vercel.mjs preview      → base: rama dev de Neon
 *   node scripts/variables-vercel.mjs production   → base: rama production
 *
 * En producción, NEON_DATABASE_URL toma el valor de NEON_DATABASE_URL_PRODUCCION.
 * Cargar variables no publica nada: rigen desde el próximo despliegue.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const entorno = process.argv[2];
if (entorno !== "preview" && entorno !== "production") {
  console.error("Uso: node scripts/variables-vercel.mjs preview|production");
  process.exit(1);
}

const local = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .map((l) => l.match(/^([A-Z_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim().replace(/^"|"$/g, "")]),
);

const valores = {
  NEON_DATABASE_URL: entorno === "production" ? local.NEON_DATABASE_URL_PRODUCCION : local.NEON_DATABASE_URL,
  ADMIN_CLAVE: local.ADMIN_CLAVE,
  NEXT_PUBLIC_VAPID_PUBLICA: local.NEXT_PUBLIC_VAPID_PUBLICA,
  VAPID_PRIVADA: local.VAPID_PRIVADA,
  VAPID_CONTACTO: local.VAPID_CONTACTO,
  CRON_SECRET: local.CRON_SECRET,
};

if (entorno === "production" && (valores.ADMIN_CLAVE ?? "").length < 10) {
  console.log("Ojo: la clave del panel es corta para producción. Conviene cambiarla en .env.local y volver a correr esto.\n");
}

for (const [nombre, valor] of Object.entries(valores)) {
  if (!valor) {
    console.log(`${nombre}: falta en .env.local`);
    process.exitCode = 1;
    continue;
  }
  const r = spawnSync("vercel", ["env", "add", nombre, entorno, "--yes", "--force"], { input: valor, encoding: "utf8" });
  console.log(`${nombre}: ${r.status === 0 ? "ok" : "FALLÓ"}`);
  if (r.status !== 0) {
    console.log(`${r.stdout ?? ""}${r.stderr ?? ""}`.replaceAll(valor, "***").slice(-600));
    process.exitCode = 1;
  }
}
