"use client";

import { useEffect } from "react";
import { PANEL } from "@/lib/admin/ruta";

/**
 * Registra el service worker del panel desde /tinta/sw.js: el alcance de un
 * service worker es la carpeta desde donde se sirve, así que puesto en la raíz
 * se apoderaría también del sitio público.
 */
export function RegistrarPanel() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(`${PANEL}/sw.js`, { scope: PANEL }).catch((error) => {
      // Sin service worker el panel funciona, pero no hay avisos: que quede en la consola.
      console.error("No se pudo registrar el service worker del panel:", error);
    });
  }, []);
  return null;
}
