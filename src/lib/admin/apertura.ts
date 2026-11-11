/**
 * Marcas de "la app está abierta ahora", compartidas por el candado del panel
 * y la pantalla de entrada.
 *
 * Van en sessionStorage a propósito: vive lo que vive la ventana de la app.
 * Al cerrarla —deslizarla fuera en el teléfono, cerrar la pestaña— se borra
 * sola, y la próxima apertura llega sin marca: eso es lo que dice "se cerró,
 * pide PIN o huella". La sesión, en cambio, está en una cookie de 90 días y
 * sobrevive.
 */
export const MARCA_ABIERTA = "panel-abierto";
export const MARCA_OCULTA = "panel-oculto-desde";

/**
 * Cuánto se puede estar fuera de la app sin que se bloquee: lo justo para ir a
 * WhatsApp a responderle a un cliente y volver.
 */
export const GRACIA_MS = 60_000;

/** Se llama al entrar o desbloquear, justo antes de ir al panel. */
export function marcarAbierta(): void {
  try {
    sessionStorage.setItem(MARCA_ABIERTA, "1");
    sessionStorage.removeItem(MARCA_OCULTA);
  } catch {
    // Sin almacenamiento (modo privado estricto) no hay cómo saber si se
    // cerró; queda el candado de media hora sin uso, que va en el servidor.
  }
}

/**
 * Para el <script> que corre antes de pintar el panel: si la app viene de
 * cerrarse, esconde todo mientras se pone el candado, para que no alcancen a
 * verse los datos de clientes ni por un instante.
 */
export const OCULTAR_SI_SE_CERRO = `try{if(!sessionStorage.getItem(${JSON.stringify(
  MARCA_ABIERTA,
)})){var s=document.createElement("style");s.textContent="body{visibility:hidden}";document.head.appendChild(s)}}catch(_){}`;
