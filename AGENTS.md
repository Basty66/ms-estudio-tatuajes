# AGENTS.md — MS Estudio de Tatuajes / Matness Tattoos

Contexto para asistentes de código (Claude, OpenCode, etc.) que trabajen en este repo.

> ⚠️ **Nunca escribas valores de secretos en este archivo ni en el código.** Este archivo
> se commitea al repositorio (público). Aquí solo van los *nombres* de las variables de
> entorno y qué hacen; los valores viven exclusivamente en Vercel.

## Qué es

Sitio web de MS Estudio de Tatuajes / Matness Tattoos (Melipilla, Chile):
landing pública + panel admin + backend en Vercel + base de datos PostgreSQL (Neon)
+ notificaciones por Telegram.

- URL oficial: `https://tatuajes-azure.vercel.app`
- (El dominio `tatuajes.vercel.app` pertenece a otro proyecto viejo, "MFL Tattoo".)

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion + Phosphor Icons
- **Backend:** Vercel Edge Functions (`api/`) con `@neondatabase/serverless`
- **Base de datos:** PostgreSQL en Neon (`NEON_DATABASE_URL`)
- **Auth admin:** JWT firmado con `jose` (HS256, 8 h de expiración)
- **Notificaciones:** Telegram Bot API

## Estructura clave

```
api/
├── lib/
│   ├── auth.ts        # JWT: createToken() y verifyRequest() + safeEqual (anti timing-attack)
│   ├── fecha.ts       # parseDateStr()/todayStr() — parseo de fechas sin bug de UTC
│   ├── ratelimit.ts   # Rate limit en memoria (5 req/min por IP) para agendar y cotizar
│   └── telegram.ts    # notifyArtist() → envía mensaje al bot de Telegram
├── admin/             # 8 endpoints protegidos con verifyRequest() (Bearer JWT)
│   ├── auth.ts        # POST login (comparación tiempo constante) + GET métricas
│   ├── citas.ts       # CRUD citas + auto-crea registro en finanzas al confirmar
│   ├── cotizaciones.ts
│   ├── disponibilidad.ts  # Template semanal + excepciones por fecha
│   ├── finanzas.ts    # Ingresos/gastos con resumen por categoría
│   ├── galeria.ts     # GET público (landing), POST/DELETE/PATCH protegidos
│   ├── publicaciones.ts
│   └── reels.ts
├── agendar.ts         # Público: agenda cita — inserción atómica anti race-condition
├── cotizar.ts         # Público: guarda cotización + valida base64 (máx 200 KB)
├── disponibilidad.ts  # Público: devuelve calendario
└── resenas.ts
src/
├── pages/Admin.tsx    # Panel admin completo (dashboard, citas, finanzas, galería...)
├── components/        # Hero, Gallery, Cotizador, Agenda, FAQ, Reviews, etc.
└── lib/precios.ts
```

## Flujos importantes

1. **Cliente agenda/cotiza** → `agendar.ts` / `cotizar.ts` (rate limit 5/min/IP) → inserta en
   Neon → `notifyArtist()` avisa por Telegram.
2. **Login admin:** `/admin` → POST contraseña a `api/admin/auth` → recibe JWT → lo guarda en
   `sessionStorage` como `admin_token` → todas las llamadas admin llevan
   `Authorization: Bearer <token>`. Si el token expira o es inválido → 401 → `handleLogout()`.
3. **Confirmar cita:** modal de precio → PATCH cita (estado=confirmada) → inserta ingreso
   automático en finanzas → abre WhatsApp con mensaje pre-llenado (50 % abono, dirección, etc.).

## Variables de entorno (Vercel · Production)

Definir en Vercel → Settings → Environment Variables. **No poner los valores aquí.**

| Variable | Descripción |
| --- | --- |
| `NEON_DATABASE_URL` | Cadena de conexión a PostgreSQL (Neon) |
| `ADMIN_PASSWORD` | Contraseña del panel admin (larga y aleatoria) |
| `JWT_SECRET` | Secret para firmar los JWT. Fallback a `ADMIN_PASSWORD` si falta, pero debe estar definido. Generar con `openssl rand -base64 48` |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram |
| `TELEGRAM_CHAT_ID` | Chat ID que recibe las notificaciones |
| `GOOGLE_PLACES_API_KEY` | API Key de Google Cloud (Places API). Gratis: $200/mes de crédito. Ver setup abajo. |
| `GOOGLE_PLACE_ID` | Place ID de "MS Estudio de Tatuajes" en Google Maps |

## Deploy

- Repo: `Basty66/ms-estudio-tatuajes`, branch `master`, auto-deploy de Vercel desde GitHub.
- `vercel.json` tiene rewrites: `/api/*` → sus funciones, el resto → `/`.
- Build: `npm run build` (tsc + vite).
- Typechecks separados:
  - `npx tsc -p tsconfig.app.json --noEmit` (frontend)
  - `npx tsc -p api/tsconfig.json --noEmit` (backend)

Verificar siempre que los typechecks y el build pasen antes de hacer push.

## Tareas pendientes

- [ ] **Rotar `ADMIN_PASSWORD`** en Vercel (se expuso en un chat) y confirmar que sigue siendo
      larga y aleatoria.
- [ ] **Rotar `VERCEL_OIDC_TOKEN`** en el dashboard de Vercel (Settings → Git → OIDC Token).
      El antiguo `.env.test` con este token ya se eliminó del repo, pero conviene reescribir el
      historial de git (`git filter-repo`) porque quedó en commits previos.
- [ ] **Cambiar el bot de Telegram al del cliente** cuando entregue su `TELEGRAM_BOT_TOKEN` y
      `TELEGRAM_CHAT_ID` (actualmente usa los del desarrollador).

## Mejoras opcionales (no urgentes)

- Migrar el JWT de `sessionStorage` a una cookie `httpOnly` (más resistente a XSS).
- Code-splitting del bundle (el build avisa que supera 500 KB).
- Rate limiting con almacenamiento persistente (Upstash Redis / Vercel KV) en vez de en memoria,
  si el tráfico crece.
- Subir imágenes de cotización a un blob store (Vercel Blob / S3 / Cloudinary) y guardar solo la
  URL, en vez de base64 en la base de datos.

## Setup Google Reviews (gratis)

### Paso 1: Crear proyecto en Google Cloud
1. Ir a https://console.cloud.google.com
2. Crear nuevo proyecto: "MS Estudio - Reviews"
3. Seleccionar el proyecto

### Paso 2: Habilitar APIs
1. APIs & Services → Library
2. Buscar y habilitar: **Places API**
3. Buscar y habilitar: **Maps JavaScript API** (opcional, para futuro)

### Paso 3: Crear API Key
1. APIs & Services → Credentials
2. Create Credentials → API Key
3. Copiar la key generada
4. (Recomendado) Restringir la key a solo Places API

### Paso 4: Obtener Place ID
1. Ir a https://developers.google.com/maps/documentation/places/web-service/place-id
2. Buscar "MS Estudio de Tatuajes Melipilla"
3. Copiar el Place ID (empieza con `ChIJ...`)

### Paso 5: Configurar en Vercel
1. Vercel → Settings → Environment Variables
2. Agregar:
   - `GOOGLE_PLACES_API_KEY` = tu API key
   - `GOOGLE_PLACE_ID` = tu Place ID
3. Redesplegar

### Notas
- Google da $200/mes gratis. Un estudio con 100 reseñas no gasta nada.
- Las reseñas se cachean 30 min para no exceder cuota.
- Si no se configuran las env vars, la sección de Google Reviews no aparece (no rompe nada).
