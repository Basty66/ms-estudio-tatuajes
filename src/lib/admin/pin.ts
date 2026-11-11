/**
 * Reglas del PIN, compartidas por el teclado y el servidor.
 *
 * El teclado las aplica para avisar al instante, sin ida y vuelta; el servidor
 * las vuelve a aplicar porque lo que diga el navegador no obliga a nada.
 */

/** Cuatro dígitos: el teclado entra solo al tocar el cuarto, sin botón extra. */
export const pinValido = (pin: string) => /^\d{4}$/.test(pin);

/**
 * Los PIN que se prueban primero: repetidos (0000, 7777) y escaleras (1234,
 * 9876). Con cinco intentos, uno de estos cae casi seguro.
 */
export function pinDemasiadoFacil(pin: string): boolean {
  const d = pin.split("").map(Number);
  const pasos = d.slice(1).map((n, i) => n - d[i]);
  return pasos.every((p) => p === 0) || pasos.every((p) => p === 1) || pasos.every((p) => p === -1);
}

export const MENSAJE_PIN_FACIL = "Ese PIN es de los primeros que alguien probaría. Elige otro.";
