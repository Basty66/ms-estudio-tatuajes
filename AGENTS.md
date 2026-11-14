# AGENTS.md — Matness Studio (MS Estudio de Tatuajes)

Contexto para asistentes de código que trabajen en este repo.

> ⚠️ **Nunca escribas valores de secretos en este archivo ni en el código.** El repositorio es
> público. Aquí van solo los *nombres* de las variables; los valores viven en `.env.local`
> (ignorado por git) y en Vercel.

## Qué es

Sitio del estudio (Av. Manso 529, Melipilla) + panel privado del tatuador.

- Producción: `https://tatuajes-azure.vercel.app` (Vercel, región `gru1`).
- La v2 vive en la rama `v2`. **`master` todavía tiene el sitio viejo (Vite + Telegram) y el proyecto
  auto-despliega desde ahí: un push a `master` vuelve a poner el sitio viejo.**

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS v4 + Motion.
- Postgres en Neon (`sa-east-1`) con `@neondatabase/serverless`.
  Sin ORM: SQL con plantillas etiquetadas y migraciones numeradas en `db/`.
- Vercel Blob: un almacén **público** (galería) y uno **privado** (comprobantes de pago).
- Avisos push con `web-push` (VAPID). Reemplazan al bot de Telegram del sitio viejo.
- Face ID / huella con WebAuthn (`@simplewebauthn` v14).

El panel copia el patrón de `~/Proyectos/piscina-oasis` (ver su `PLAN.md`): sesión propia de 90 días,
PIN de 4 dígitos, candado por inactividad, biometría por aparato, PWA solo en la ruta del panel.

## Estructura

```
src/app/(sitio)/        Portada pública (orden de secciones en src/lib/estudio.ts → SECCIONES)
src/app/not-found.tsx   404 del láser. También es lo que ve quien prueba /admin.
src/app/tinta/          Panel (ruta "secreta"; constante PANEL en src/lib/admin/ruta.ts)
  entrar/               Nombre → clave del panel → PIN; o desbloqueo con PIN / Face ID
  (panel)/              Hoy, agenda, nueva, cita/[id], clientes, cliente/[id], finanzas,
                        cotizaciones, galeria, web/*, cuenta, mas
  (panel)/web/          Lo que se cambia de la web: fotos fijas, precios, contacto,
                        tatuador, preguntas y cuidados
  _acciones/            Server Actions (entrar, avisos, panel, contenido). CADA una comprueba la sesión.
  cambios/              "¿Cambió algo?" + versión publicada (el panel se refresca solo)
  comprobante/[...]     Entrega comprobantes del almacén privado, solo con sesión
src/app/api/cotizacion  POST público del cotizador → guarda y avisa por push (10/h por origen)
src/app/api/mantencion/avisos  Cron diario (vercel.json): sesiones de hoy y mañana
src/proxy.ts            Barrera barata del panel (en Next 16 se llama proxy, no middleware)
src/db/                 conexion.ts, lecturas del panel (panel.ts) y contenido de la web (contenido.ts)
src/lib/contenido.ts    Contenido editable: tipos, valores de fábrica y revisión de lo guardado
src/lib/admin/          sesion, pin, biometria, apertura (candado), avisos, almacen, fecha (hora de Chile)
src/lib/cuerpo.ts       Siluetas del mapa del cotizador (generado; trazos MIT de react-native-body-highlighter)
public/tinta/           manifest.webmanifest, sw.js e íconos de la PWA del panel
db/                     Migraciones SQL (scripts/migrar.mjs las aplica)
```

## Reglas del repo

- La doble reserva la impide Postgres (`citas_sin_choque`, EXCLUDE sobre el rango). El error `23P01`
  se traduce a "choca con la cita de X".
- El saldo no se guarda: sale de la vista `citas_con_saldo` (suma de `pagos`).
- Las horas de las citas son hora local de Chile sin zona y viajan como texto (`YYYY-MM-DDTHH:MI`).
- Nada que exporte un archivo `"use server"` puede mandar avisos o escribir sin sesión.
- Constantes o listas que use una página del servidor no pueden vivir en un archivo `"use client"`
  (llegarían como referencia de cliente, no como valor).
- Comprobantes: primero se borra el archivo, después la fila.
- El contenido de la web (tabla `contenido`, un JSON por bloque) siempre pasa por `mezclar()`: lo que
  falte o venga mal vuelve al valor de fábrica. La portada nunca lee la tabla directo.
- WhatsApp, Instagram y dirección llegan a los componentes de cliente por `useEstudio()`
  (layout del sitio); no importar `ESTUDIO` para mostrarlos, son solo los de fábrica.

## Base de datos

- Desarrollo usa la rama `dev` de Neon (`NEON_DATABASE_URL` en `.env.local`). La URL de producción
  está guardada aparte como `NEON_DATABASE_URL_PRODUCCION` y no se usa en local.
- Migrar: `node --env-file=.env.local scripts/migrar.mjs` (lleva la cuenta en `migraciones`).
  Primero en `dev`; en producción solo después de revisar, con `--produccion`.
- Variables en Vercel: `node scripts/variables-vercel.mjs preview|production` las carga desde
  `.env.local` sin imprimir valores (en producción usa `NEON_DATABASE_URL_PRODUCCION`).

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `NEON_DATABASE_URL` | Postgres (endpoint `-pooler`) |
| `ADMIN_CLAVE` | Clave del panel, se pide una vez por aparato. Sin ella no se entra |
| `NEXT_PUBLIC_VAPID_PUBLICA` / `VAPID_PRIVADA` / `VAPID_CONTACTO` | Avisos push |
| `CRON_SECRET` | Protege `/api/mantencion/avisos` (Vercel lo manda como Bearer) |
| `BLOB_READ_WRITE_TOKEN` | Almacén público de la galería |
| `BLOB_PRIVADO_READ_WRITE_TOKEN` | Almacén privado de comprobantes |

## Verificación

`npx tsc --noEmit`, `npx eslint src` y `npm run build` antes de desplegar. Face ID y los avisos
necesitan HTTPS: en el teléfono se prueban en un despliegue de Vercel, no por la IP local.

## Pendientes

**Próxima sesión: ver [`PLAN.md`](PLAN.md)** (consentimiento informado digital y lo que necesita el tatuador).

- [x] `db/001` aplicado en la rama `production` de Neon (2026-11-10). Usuario inicial: Cristian.
- [x] `db/002_contenido.sql` (contenido editable de la web) aplicado en `dev` y en `production` (2026-11-14).
- [x] Variables del panel cargadas en Vercel para **Preview** (con la base `dev`).
- [x] Variables del panel en Vercel para **Production** (2026-11-14) y v2 con panel publicada en producción.
- [ ] Clave definitiva del panel en producción: cambiar `ADMIN_CLAVE` en `.env.local`, volver a correr
      `node scripts/variables-vercel.mjs production` y redesplegar.
- [ ] Almacén privado de comprobantes (`BLOB_PRIVADO_READ_WRITE_TOKEN`).
- [ ] Consentimiento informado digital y limpieza de lo que dejó el sitio viejo (ver `PLAN.md`).
- [ ] Quitar de Vercel las variables del sitio viejo y rotar sus credenciales.
- [ ] Probar Face ID y avisos en un iPhone y un Android reales, con la app instalada.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
