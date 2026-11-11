"use client";

import { useEffect, useState, useTransition } from "react";
import { desuscribirAvisos, probarAviso, suscribirAvisos } from "@/app/tinta/_acciones/avisos";
import { PANEL } from "@/lib/admin/ruta";
import { Boton } from "./Boton";
import { Campana } from "./Iconos";

/**
 * Activar los avisos en ESTE aparato.
 *
 * Cada teléfono y cada computador se suscribe por separado: la suscripción
 * identifica al navegador, no a la persona. Por eso hay que tocarlo una vez en
 * cada uno.
 *
 * Todo paso que pueda fallar lo dice. La primera versión se quedaba esperando
 * en silencio a que el service worker estuviera listo —y si no llegaba a
 * registrarse, esa espera no terminaba nunca— dejando el botón como si nada
 * hubiera pasado y cero suscripciones guardadas.
 */
type Estado =
  | "cargando"
  | "sin-soporte"
  | "necesita-instalar"
  | "apagado"
  | "encendido"
  | "bloqueado";

type Mensaje = { texto: string; malo: boolean };

/** La llave VAPID viaja en base64url y el navegador la pide como bytes. */
function aBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}

function mismosBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function nombreDelAparato(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Navegador";
}

/**
 * Registra el service worker y espera a que quede activo.
 *
 * Usa el registro que devuelve `register()` y escucha a su worker, en vez de
 * `navigator.serviceWorker.ready`. `ready` no falla nunca: si el alcance
 * registrado no coincide exactamente con la dirección de la página, no
 * resuelve jamás — se probó: con la clave escrita en la URL, el alcance quedó
 * como "https://admin:...@.../admin" y la página como "https://.../admin", y
 * el botón se quedaba pensando para siempre. Esto no depende de esa
 * coincidencia y además tiene tope de tiempo.
 */
async function prepararWorker(): Promise<ServiceWorkerRegistration> {
  const registro = await navigator.serviceWorker.register(`${PANEL}/sw.js`, { scope: PANEL });
  if (registro.active) return registro;

  const worker = registro.installing ?? registro.waiting;
  if (!worker) return registro;

  await new Promise<void>((resolver, rechazar) => {
    const tope = setTimeout(
      () => rechazar(new Error("el service worker no quedó activo a tiempo")),
      15000,
    );
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") {
        clearTimeout(tope);
        resolver();
      } else if (worker.state === "redundant") {
        clearTimeout(tope);
        rechazar(new Error("el navegador descartó el service worker"));
      }
    });
  });

  return registro;
}

/** El registro existente del panel, sin esperar nada. */
async function registroActual(): Promise<ServiceWorkerRegistration | undefined> {
  return navigator.serviceWorker.getRegistration(PANEL);
}

export function ActivarAvisos({ llave }: { llave: string }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [pendiente, iniciar] = useTransition();

  useEffect(() => {
    async function mirar() {
      if (!llave) return setEstado("sin-soporte");

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        // En iPhone el push solo existe dentro de la app instalada en la
        // pantalla de inicio. En Safari normal la API ni siquiera aparece.
        const esIOS = /iPhone|iPad/.test(navigator.userAgent);
        const instalada = window.matchMedia("(display-mode: standalone)").matches;
        return setEstado(esIOS && !instalada ? "necesita-instalar" : "sin-soporte");
      }

      if (Notification.permission === "denied") return setEstado("bloqueado");

      try {
        const registro = await prepararWorker();
        const suscripcion = await registro.pushManager.getSubscription();
        if (!suscripcion) return setEstado("apagado");

        // Una suscripción hecha con otra llave VAPID ya no recibe nada: el
        // servicio push rechaza lo que firmamos con la llave actual.
        const llaveDeEsta = suscripcion.options.applicationServerKey;
        if (llaveDeEsta && !mismosBytes(new Uint8Array(llaveDeEsta), aBytes(llave))) {
          await suscripcion.unsubscribe();
          return setEstado("apagado");
        }

        // Que el teléfono tenga la suscripción no significa que el servidor
        // la tenga. Antes bastaba con lo primero para mostrar "activados", y
        // así quedó Bastian: el teléfono suscrito, la base sin su fila
        // (se borró al reemplazar los usuarios de relleno) y ningún aviso.
        // Se vuelve a registrar cada vez que se abre el panel; si ya estaba,
        // solo se actualiza.
        const datos = suscripcion.toJSON() as {
          endpoint: string;
          keys: { p256dh: string; auth: string };
        };
        const r = await suscribirAvisos(
          { endpoint: datos.endpoint, keys: datos.keys },
          nombreDelAparato(),
        );
        if (r.ok) return setEstado("encendido");

        setEstado("apagado");
        setMensaje({ texto: r.error ?? "No se pudo registrar este aparato.", malo: true });
      } catch {
        // Que no se pueda comprobar no significa que no se pueda activar:
        // se deja intentarlo y el error aparecerá al tocar el botón.
        setEstado("apagado");
      }
    }
    void mirar();
  }, [llave]);

  async function encender() {
    setMensaje(null);

    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") {
      setEstado(permiso === "denied" ? "bloqueado" : "apagado");
      setMensaje({ texto: "No se dio permiso para los avisos.", malo: true });
      return;
    }

    let datos: { endpoint: string; keys: { p256dh: string; auth: string } };
    try {
      const registro = await prepararWorker();
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: aBytes(llave),
      });
      datos = suscripcion.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    } catch (e) {
      setMensaje({ texto: `El navegador no pudo suscribirse: ${(e as Error).message}`, malo: true });
      return;
    }

    iniciar(async () => {
      const r = await suscribirAvisos(
        { endpoint: datos.endpoint, keys: datos.keys },
        nombreDelAparato(),
      );
      if (!r.ok) {
        setMensaje({ texto: r.error ?? "No se pudo guardar la suscripción.", malo: true });
        return;
      }
      setEstado("encendido");
      setMensaje({ texto: "Listo. Prueba el aviso para confirmarlo.", malo: false });
    });
  }

  async function apagar() {
    try {
      const registro = await registroActual();
      const suscripcion = await registro?.pushManager.getSubscription();
      if (suscripcion) {
        await suscripcion.unsubscribe();
        iniciar(async () => {
          await desuscribirAvisos(suscripcion.endpoint);
        });
      }
    } catch {
      // Si el navegador ya no la tiene, basta con olvidarla acá.
    }
    setEstado("apagado");
    setMensaje(null);
  }

  function probar() {
    setMensaje(null);
    iniciar(async () => {
      const r = await probarAviso();
      setMensaje({
        texto:
          r.enviados > 0
            ? `Enviado a ${r.enviados} ${r.enviados === 1 ? "aparato" : "aparatos"}. Debería sonar ahora.`
            : "Ningún aparato registrado: la suscripción no llegó a guardarse.",
        malo: r.enviados === 0,
      });
    });
  }

  if (estado === "cargando" || estado === "sin-soporte") return null;

  return (
    <Caja encendido={estado === "encendido"} Icono={Campana} titulo={estado === "encendido" ? "Avisos activados en este aparato" : "Avisos en este aparato"}>
      {estado === "necesita-instalar" ? (
        <p className="text-[14px] text-ceniza">
          En iPhone los avisos solo funcionan con el panel instalado. Toca <b className="text-piel">Compartir → Agregar a inicio</b>, abre el panel
          desde ese ícono y vuelve acá.
        </p>
      ) : estado === "bloqueado" ? (
        <p className="text-[14px] text-ceniza">Este navegador tiene los avisos bloqueados. Hay que permitirlos en los ajustes del sitio y volver a entrar.</p>
      ) : estado === "apagado" ? (
        <>
          <p className="text-[14px] text-ceniza">Suena cuando alguien cotiza en la web y la mañana anterior a cada sesión. Se activa en cada aparato por separado.</p>
          <Boton disabled={pendiente} onClick={encender} className="min-h-11">
            {pendiente ? "Activando…" : "Activar avisos"}
          </Boton>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Boton disabled={pendiente} onClick={probar} className="min-h-11">
            {pendiente ? "Enviando…" : "Mandar aviso de prueba"}
          </Boton>
          <Boton variante="fantasma" disabled={pendiente} onClick={apagar} className="min-h-11">
            Desactivar aquí
          </Boton>
        </div>
      )}
      {mensaje && (
        <p role={mensaje.malo ? "alert" : undefined} className={`text-[14px] font-semibold ${mensaje.malo ? "text-[#ff8a80]" : "text-[#6ee7b7]"}`}>
          {mensaje.texto}
        </p>
      )}
    </Caja>
  );
}

export function Caja({
  encendido,
  Icono,
  titulo,
  children,
}: {
  encendido: boolean;
  Icono: (p: { className?: string }) => React.ReactNode;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`flex flex-col gap-3 rounded-3xl border p-4 sm:p-5 ${encendido ? "border-[#34d399]/30 bg-[#34d399]/[0.06]" : "border-linea bg-hollin/70"}`}>
      <p className="flex items-center gap-3 font-semibold">
        <span className={`grid size-9 place-items-center rounded-xl border ${encendido ? "border-[#34d399]/40 text-[#6ee7b7]" : "border-linea text-stencil-claro"}`}>
          <Icono className="size-5" />
        </span>
        {titulo}
      </p>
      {children}
    </section>
  );
}
