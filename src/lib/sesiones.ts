import { clp } from "@/lib/admin/etiquetas";

/**
 * Trabajos de varias sesiones: cuánto se cobra en cada una para llegar al
 * valor final y cómo se dice en los mensajes. Sin "use client" ni
 * "server-only": lo usan los formularios del panel, las fichas y las acciones.
 *
 * Cada sesión es una cita con su propio precio (lo que se cobra ese día); el
 * valor final y cuántas sesiones se acordaron van en todas las del trabajo.
 */

/** Tope de sesiones de un trabajo (también lo revisa la base). */
export const MAX_SESIONES = 40;

/**
 * Lo que se cobra en la sesión `n` de `sesiones`: partes iguales redondeadas a
 * mil, y la última cuadra el valor final. Una sesión fuera de lo acordado no
 * tiene valor sugerido.
 */
export function valorDeSesion(valorFinal: number, sesiones: number, n: number): number | null {
  if (sesiones <= 1) return n === 1 ? valorFinal : null;
  if (n > sesiones) return null;
  const parte = Math.round(valorFinal / sesiones / 1000) * 1000;
  return n < sesiones ? parte : Math.max(0, valorFinal - parte * (sesiones - 1));
}

/** "1 sesión", "3 sesiones" */
export const textoSesiones = (n: number) => `${n} ${n === 1 ? "sesión" : "sesiones"}`;

/** "$100.000" si las partes son iguales, "aprox. $83.000" si no. Vacío con una sola sesión. */
export function textoCadaSesion(valorFinal: number, sesiones: number): string {
  if (sesiones <= 1) return "";
  const parte = valorDeSesion(valorFinal, sesiones, 1) ?? 0;
  const ultima = valorDeSesion(valorFinal, sesiones, sesiones) ?? 0;
  return parte === ultima ? clp(parte) : `aprox. ${clp(parte)}`;
}

/**
 * Para cuando no se sabe el nombre (una cotización de la web): "Hola {nombre}, ya vi…" queda "Hola, ya vi…".
 * Sin esto, la línea del saludo no se mandaría entera (rellenar() salta las líneas con datos que faltan).
 */
export const sinNombre = (plantilla: string) => plantilla.replace(/ ?\{nombre\}/g, "");

/** Las llaves del mensaje "Valor final y sesiones". Lo que falta queda vacío y esa línea no se manda. */
export function valoresPropuesta(d: { nombre: string; valorFinal: number | null; sesiones: number; abono: number | null; duracion: string; datosAbono: string }) {
  return {
    nombre: d.nombre,
    valor: d.valorFinal ? clp(d.valorFinal) : "",
    sesiones: textoSesiones(d.sesiones),
    cadaSesion: d.valorFinal ? textoCadaSesion(d.valorFinal, d.sesiones) : "",
    duracion: d.duracion,
    abono: d.abono ? clp(d.abono) : "",
    datosAbono: d.datosAbono,
  };
}
