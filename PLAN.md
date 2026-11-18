# Plan — próxima sesión

Se trabaja en la rama `v2` y se publica con `vercel --prod`. `master` está igual a la última versión
publicada: solo se adelanta a `v2` cuando algo está listo (el proyecto auto-despliega desde `master`).

## 0. Reservas desde la web (publicado el 2026-11-17)

Cupos fijados por el tatuador (no duraciones por tamaño): el cliente elige día y cupo en el
calendario de la web; el tatuador confirma con la hora de término, el valor final y el abono.
Migraciones 007, 008 y 009 aplicadas en production.

Falta confirmar con el cliente los cupos de partida: L–V 11:00 y 16:00 (termina 20:00), sábado
12:00 (termina 18:00), domingo cerrado. Se cambian en Web → Horario y reservas.

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
