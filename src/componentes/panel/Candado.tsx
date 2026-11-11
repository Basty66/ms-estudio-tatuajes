"use client";

import { useEffect } from "react";
import { bloquearAhora } from "@/app/tinta/_acciones/entrar";
import { GRACIA_MS, MARCA_ABIERTA, MARCA_OCULTA } from "@/lib/admin/apertura";
import { PANEL } from "@/lib/admin/ruta";

function leer(clave: string): string | null {
  try {
    return sessionStorage.getItem(clave);
  } catch {
    // Sin almacenamiento no se puede saber si se cerró: se da por abierta y
    // queda el candado de media hora del servidor.
    return clave === MARCA_ABIERTA ? "sin-almacen" : null;
  }
}

/**
 * El candado del panel, como en la app del banco: la sesión se mantiene, pero
 * se pide PIN o huella cada vez que se vuelve a abrir.
 *
 *   - Se cerró la app y se abre de nuevo → candado. Se sabe porque la marca
 *     de sessionStorage no sobrevive al cierre (ver lib/apertura.ts).
 *   - Estuvo más de un minuto en segundo plano → candado. Se cuenta también
 *     si el teléfono recargó la página mientras tanto, porque la hora en que
 *     se ocultó queda anotada.
 *   - Volver de WhatsApp antes del minuto → nada.
 *
 * Además, en el servidor, media hora sin uso bloquea igual aunque nada de
 * esto llegue a correr.
 */
export function Candado() {
  useEffect(() => {
    let cerrando = false;

    async function cerrar() {
      if (cerrando) return;
      cerrando = true;
      try {
        await bloquearAhora();
      } catch {
        // Sin señal no se puede avisar al servidor; la pantalla de entrada
        // igual se muestra y el servidor bloquea solo a la media hora.
      }
      const aqui = window.location.pathname + window.location.search;
      window.location.replace(`${PANEL}/entrar?volver=${encodeURIComponent(aqui)}`);
    }

    if (leer(MARCA_ABIERTA) === null) {
      void cerrar();
      return;
    }
    const ocultaDesde = Number(leer(MARCA_OCULTA));
    if (ocultaDesde && Date.now() - ocultaDesde > GRACIA_MS) {
      void cerrar();
      return;
    }
    // Ya se evaluó: si quedara, una hora vieja podría bloquear de más después.
    // Solo si la página está a la vista: si cargó en segundo plano, esa hora
    // es justamente la que hay que medir al volver.
    if (document.visibilityState === "visible") {
      try {
        sessionStorage.removeItem(MARCA_OCULTA);
      } catch {
        // Ver leer().
      }
    }

    function cambio() {
      try {
        if (document.visibilityState === "hidden") {
          sessionStorage.setItem(MARCA_OCULTA, String(Date.now()));
          return;
        }
        const desde = Number(sessionStorage.getItem(MARCA_OCULTA));
        sessionStorage.removeItem(MARCA_OCULTA);
        if (desde && Date.now() - desde > GRACIA_MS) void cerrar();
      } catch {
        // Ver leer().
      }
    }

    document.addEventListener("visibilitychange", cambio);
    return () => document.removeEventListener("visibilitychange", cambio);
  }, []);

  return null;
}
