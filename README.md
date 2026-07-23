# MS Estudio de Tatuajes | Matness Tattoos

Sitio web profesional para estudio de tatuajes en Melipilla, Chile. Sistema completo con panel admin, notificaciones Telegram, finanzas, agenda, galería dinámica y más.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS v4 + Framer Motion
- **Backend:** Vercel Edge Functions + Neon PostgreSQL
- **Notificaciones:** Telegram Bot API
- **Estilos:** Phosphor Icons, Cinzel, Rajdhani, Bebas Neue, Inter

## Estructura

```
├── api/                    # Edge Functions (backend)
│   ├── admin/              # Panel admin (auth, citas, cotizaciones, finanzas, etc.)
│   ├── lib/                # Utilidades compartidas (telegram.ts)
│   ├── agendar.ts          # Booking público
│   ├── cotizar.ts          # Cotizador público
│   ├── disponibilidad.ts   # Calendario público
│   ├── resenas.ts          # Reseñas públicas
│   └── reels.ts            # Reels (desactivado)
├── src/
│   ├── components/         # Componentes React
│   │   ├── Hero.tsx         # Hero con animación de tinta CSS
│   │   ├── SobreElTatuador.tsx
│   │   ├── Gallery.tsx      # Galería dinámica con lightbox
│   │   ├── CuidadosPost.tsx # Tips post-tatuaje
│   │   ├── Cotizador.tsx    # Cotizador con WhatsApp
│   │   ├── Agenda.tsx       # Calendario de reservas
│   │   ├── FAQ.tsx          # Preguntas frecuentes
│   │   ├── BlogSection.tsx  # Blog público
│   │   ├── Reviews.tsx      # Reseñas de Google
│   │   ├── Ubicacion.tsx    # Mapa + dirección
│   │   ├── Navbar.tsx       # Navegación
│   │   ├── Footer.tsx
│   │   └── WhatsAppFloat.tsx
│   ├── pages/
│   │   └── Admin.tsx        # Panel admin completo
│   ├── lib/
│   │   └── precios.ts       # Lógica de cotización
│   ├── App.tsx              # Router + layout
│   └── index.css            # Estilos globales + animaciones
├── sql/                     # Esquemas de base de datos
├── public/                  # Archivos estáticos
├── index.html               # HTML + SEO meta tags
└── vercel.json              # Config Vercel
```

## Features

### Landing Page
- Hero con animación CSS de tinta (ink blobs + partículas)
- Sobre el tatuador con foto, especialidades, trayectoria
- Galería dinámica con filtros por estilo y lightbox
- Cuidados post-tatuaje (5 categorías)
- Cotizador instantáneo con rango de precio (zona, tamaño, estilo)
- Agenda/calendario con disponibilidad en tiempo real
- FAQ acordeón (8 preguntas)
- Blog público con publicaciones del admin
- Reseñas de Google
- Ubicación con Google Maps
- WhatsApp Float + botón compartir
- Contador de tatuajes realizados (500+)
- Skeleton loaders en carga

### Panel Admin (`/admin`)
- Dashboard con métricas
- Gestión de citas: CRUD, filtros, confirmar con precio y 50% abono
- WhatsApp automático: mensajes pre-llenados al confirmar/cancelar/completar
- Chatear con cliente antes de confirmar
- Modal de precio profesional con formato CLP y cálculo automático
- Auto-finanzas: confirmar cita → ingreso automático
- Gestión de cotizaciones: aceptar/rechazar/eliminar
- Galería: subir imágenes, ordenar, eliminar
- Publicaciones: crear/editar/eliminar posts
- Disponibilidad semanal: template + excepciones por fecha
- Calendario visual de disponibilidad
- Finanzas: ingresos, gastos, resumen, por categoría
- Reseñas manuales

### Notificaciones
- **Telegram Bot:** notifica al tatuador cuando alguien agenda o cotiza
- Variables de entorno: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

### SEO
- JSON-LD Structured Data (TattooParlor)
- Open Graph / Facebook tags
- Twitter Card
- Sitemap.xml + Robots.txt
- Meta description, keywords, geo tags

## Configuración

### Variables de entorno (Vercel)
```
ADMIN_PASSWORD=admin123
NEON_DATABASE_URL=postgresql://...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### Base de datos (Neon)
Ejecutar los archivos SQL en orden:
1. `sql/init.sql`
2. `sql/admin.sql`
3. `sql/migrate.sql`
4. `sql/reels.sql`

### Acceso admin
URL: `/admin`
Contraseña: definida en `ADMIN_PASSWORD`

## Deploy

Conectado a Vercel con auto-deploy desde GitHub (branch `master`).

```bash
npm run build   # tsc + vite build
git push        # auto-deploy en Vercel
```

## Créditos

Desarrollado para MS Estudio de Tatuajes / Matness Tattoos - Melipilla, Chile.
