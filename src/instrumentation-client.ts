import { initBotId } from "botid/client/core";

// Verificación anti-bots invisible (Vercel BotID) para pedir hora: cada hora
// pedida aparta un cupo, y sin esto alguien podría llenar el calendario de
// mentira. No hay captcha: el navegador se verifica solo. La cotización no va
// acá porque sale con sendBeacon, que no lleva la verificación.
initBotId({ protect: [{ path: "/api/reserva", method: "POST" }] });
