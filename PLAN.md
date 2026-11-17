# Plan — próxima sesión

Se trabaja en la rama `v2` y se publica con `vercel --prod`. `master` está igual a la última versión
publicada: solo se adelanta a `v2` cuando algo está listo (el proyecto auto-despliega desde `master`).

## 0. Publicar las reservas desde la web (hecho en `v2`, falta revisar y publicar)

Ya está todo construido y probado en local de punta a punta: calendario público (libre, pocas horas,
completo, bloqueado, cerrado), hora "solicitada", confirmar con precio y abono/comprobante o
rechazar, "Por confirmar" en Hoy, agenda en lista, aviso diario con "sin abono" y horas por
confirmar, editor Web → Horario y reservas.

Falta:
1. Revisar las capturas del panel con una hora pedida (ficha, Hoy, agenda en lista, editor) a
   390 y 1440 px.
2. `npx tsc --noEmit && npx eslint src && npm run build`.
3. Migrar production: `node --env-file=.env.local scripts/migrar.mjs --produccion` (aplica 007, 008
   y 009; la 009 recrea la vista `citas_con_saldo`, que no veía las columnas nuevas).
4. `vercel --prod`, revisar la web publicada y adelantar `master`: `git push origin v2:master`.
5. Confirmar con el cliente el horario de partida (L–V 11–20, sáb 11–18, dom cerrado; duraciones).

## 1. Para entregar al cliente

- Dominio (nic.cl) y conectarlo en Vercel; cambiar las URLs `tatuajes-azure.vercel.app` del código.
- Que configure en el panel: precios reales (tatuaje y láser), link de reseñas, fotos (retrato en
  alta, ejemplo de Realismo, galería), horario y textos.
- Clave definitiva del panel. Probar en su iPhone: firma, Face ID y avisos.
- El usuario borra `matness-studio` en Vercel (`vercel project rm matness-studio`) y revoca el bot
  de Telegram en BotFather.

## 2. Autoadministración pendiente

Listas del cotizador (agregar estilos, cambiar rangos de tamaño), textos de secciones, sumar a
Matness como segundo usuario desde Cuenta, título de Google.
