/**
 * Teléfonos chilenos, en el formato que exige wa.me: 56 + 9 dígitos, sin "+",
 * sin espacios y sin guiones.
 *
 * Existe porque el mismo número llega escrito de cinco formas distintas y, sin
 * normalizar, la tabla de clientes se llena de duplicados y los enlaces de
 * WhatsApp quedan muertos.
 */
export function normalizarTelefono(entrada: string): string | null {
  const digitos = (entrada ?? "").replace(/\D/g, "");

  if (digitos.length === 11 && digitos.startsWith("56")) return digitos;
  if (digitos.length === 9) return `56${digitos}`;
  if (digitos.length === 10 && digitos.startsWith("0")) return `56${digitos.slice(1)}`;

  return null;
}

/** Para mostrar: +56 9 1234 5678 */
export function formatearTelefono(normalizado: string): string {
  if (!/^56\d{9}$/.test(normalizado)) return normalizado;
  const n = normalizado.slice(2);
  return `+56 ${n.slice(0, 1)} ${n.slice(1, 5)} ${n.slice(5)}`;
}

export function fechaLarga(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
