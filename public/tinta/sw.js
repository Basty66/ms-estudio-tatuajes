/**
 * Service worker del panel. Solo se encarga de los avisos.
 *
 * No intercepta páginas ni guarda nada en caché, a propósito (lo mismo que
 * aprendió piscina-oasis):
 *   1. Una página en caché se saltaría el candado: el panel bloqueado se
 *      vería igual, con teléfonos de clientes y comprobantes.
 *   2. Una agenda servida desde caché es peor que nada: se agenda mirando
 *      información vieja.
 *
 * Su alcance es /tinta gracias al encabezado Service-Worker-Allowed de
 * next.config.ts.
 */
const VERSION = "tinta-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("push", (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    datos = { cuerpo: evento.data ? evento.data.text() : "" };
  }

  evento.waitUntil(
    self.registration.showNotification(datos.titulo || "Matness", {
      body: datos.cuerpo || "",
      icon: "/tinta/panel-192.png",
      // La insignia va en la barra de estado y Android la pinta de una sola
      // tinta: tiene que ser una silueta blanca sobre transparente.
      badge: "/tinta/insignia.png",
      data: { url: datos.url || "/tinta" },
      tag: datos.tag || "aviso",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = (evento.notification.data && evento.notification.data.url) || "/tinta";

  // Si el panel ya está abierto, se trae al frente en vez de abrir otro.
  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if (v.url.includes("/tinta") && "focus" in v) {
          v.navigate(destino);
          return v.focus();
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});

self.VERSION_PANEL = VERSION;
