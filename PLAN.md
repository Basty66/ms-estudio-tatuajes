# Plan — próxima sesión

Se trabaja en la rama `v2` y se publica con `vercel --prod`. `master` está igual a la última versión
publicada: solo se adelanta a `v2` cuando algo está listo (el proyecto auto-despliega desde `master`).

## 0. Terminar las reservas desde la web (a medias, NO publicado)

El usuario lo pidió: después de cotizar, la persona ve un calendario con días libres, completos,
bloqueados y cerrados, elige hora, deja nombre y WhatsApp, y la hora queda apartada "por confirmar"
hasta que el tatuador la confirma con el precio final y el abono (con comprobante).

Hecho (en `v2`, sin publicar):
- `db/007` (estado de cotizaciones) y `db/008` (estado `solicitada`, constraint anti-choque que la
  cuenta, `citas.origen`/`origen_red`, bloque `reservas`) aplicados en `dev`. **Faltan en production.**
- `src/lib/reservas.ts`: horario editable, duraciones, `horasLibres`, `estadoDia`.
- `src/db/reservas.ts` (liberar vencidas, ocupados, disponibilidad) y `/api/disponibilidad`.
- `/api/reserva`: crea cliente + cita `solicitada` + une la cotización + aviso push.
- `src/componentes/sitio/ReservarHora.tsx`: hoja con el calendario, leyenda, horas, datos y la
  tarjeta animada al terminar.
- Mensajes editables `reservaTitulo`, `reservaNota`, `reservaRechazada`.

Falta:
1. Cotizador: botón principal "Elegir día y hora" (si `reservas.activas`) que abre `ReservarHora`
   con el pedido y el código; WhatsApp queda como secundario. Separar `anotar()` en registrar
   (beacon) y mostrar la tarjeta. Pasar `reservas` y los textos desde `page.tsx` y `VistaEnVivo`.
   La barra pegada del teléfono también abre el calendario.
2. Panel: `"solicitada"` en el tipo `Cita` (db/panel.ts), en `ESTADO` ("Por confirmar") y en
   `FilaCita` (marca ámbar). `ocupado()` debe contar `solicitada`.
3. Ficha de cita `solicitada`: aviso "Pidió esta hora desde la web · se libera en X h" y un bloque
   Confirmar: precio final, abono (monto, medio y comprobante opcional, igual que NuevoPago) →
   acción `confirmarReserva` (sube comprobante, precio, pago y estado `confirmada` en una sentencia;
   si falla, borra el archivo). "No puedo esa hora" → `cancelada` + WhatsApp con `reservaRechazada`.
   Ocultar Confirmar/Recordar y EstadoCita mientras esté solicitada; el consentimiento después.
4. Hoy: tarjeta "Por confirmar" con las solicitadas.
5. Agenda: vista en **lista** (todas las que vienen, por día, en orden) además del calendario.
6. Aviso de la mañana: mañana con "sin abono" cuando `pagado = 0`, horas por confirmar, y liberar
   las vencidas (`liberarVencidas`).
7. Editor Web → "Horario y reservas" (`reservas`): interruptor, 7 días con horas, duraciones por
   tamaño y láser, anticipación, semanas, plazo para confirmar; agregarlo a la lista de Web.
8. Probar en 390/768/1024/1440, `tsc`, `eslint`, `build`; migrar production (007 y 008) con
   `node --env-file=.env.local scripts/migrar.mjs --produccion`; `vercel --prod`; adelantar
   `master` a `v2`.

Valores de partida del horario (inventados, confirmarlos con el cliente): lunes a viernes 11–20,
sábado 11–18, domingo cerrado; pequeño 1 h, mediano 3 h, grande 5 h, manga 6 h, láser 1 h;
24 h de anticipación, 6 semanas, 48 h para confirmar.

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
