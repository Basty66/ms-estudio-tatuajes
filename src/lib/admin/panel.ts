import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { PANEL } from "@/lib/admin/ruta";
import { leerSesion, type Usuario } from "@/lib/admin/sesion";

/**
 * Quién opera el panel, o a la pantalla de entrada.
 *
 * Se llama en el layout Y en cada página. No sobra: al navegar dentro del
 * panel, Next vuelve a pedir la página pero reutiliza el layout sin
 * ejecutarlo. Con la comprobación solo en el layout, un panel que se bloqueó
 * por inactividad seguiría mostrando datos al cambiar de pestaña.
 *
 * Va envuelta en cache() para que layout y página, en la misma petición,
 * consulten la base una sola vez.
 *
 * Al redirigir recuerda a dónde se iba (el proxy deja la ruta en una
 * cabecera): quien toca la notificación de una cita tiene que terminar en
 * esa cita después de poner el PIN, no en el inicio.
 */
export const operadorDelPanel = cache(async (): Promise<Usuario> => {
  const sesion = await leerSesion();

  if (!sesion || sesion.bloqueada) {
    const ruta = (await headers()).get("x-ruta-panel");
    redirect(ruta ? `${PANEL}/entrar?volver=${encodeURIComponent(ruta)}` : `${PANEL}/entrar`);
  }

  return { id: sesion.id, nombre: sesion.nombre };
});
