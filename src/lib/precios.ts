/**
 * Estimación de precio del cotizador. Es un rango orientativo: el precio
 * final lo pone el tatuador al ver el diseño. Los valores vienen del sitio
 * anterior y se moverán a la base para que se ajusten desde el panel.
 */
export const TAMANOS = [
  { id: "pequeno", nombre: "Pequeño", detalle: "hasta 8 cm", min: 25_000, max: 45_000 },
  { id: "mediano", nombre: "Mediano", detalle: "8 a 15 cm", min: 50_000, max: 90_000 },
  { id: "grande", nombre: "Grande", detalle: "15 a 25 cm", min: 90_000, max: 150_000 },
  { id: "manga", nombre: "Manga o espalda", detalle: "varias sesiones", min: 150_000, max: 250_000 },
] as const;

export const ESTILOS_PRECIO = [
  { id: "fineline", nombre: "Fineline", extra: 0 },
  { id: "lettering", nombre: "Lettering", extra: 0 },
  { id: "blackwork", nombre: "Blackwork", extra: 0 },
  { id: "color", nombre: "Color", extra: 15_000 },
  { id: "realismo", nombre: "Realismo", extra: 20_000 },
] as const;

/**
 * Las zonas difíciles de tatuar (piel fina, hueso cerca, curvas, movimiento)
 * cuestan más. Son las mismas que se tocan en el mapa del cotizador
 * (src/lib/cuerpo.ts); el lado no cambia el precio.
 */
export const ZONAS = [
  { id: "antebrazo", nombre: "Antebrazo", factor: 1 },
  { id: "brazo", nombre: "Brazo", factor: 1 },
  { id: "hombro", nombre: "Hombro", factor: 1 },
  { id: "omoplato", nombre: "Omóplato", factor: 1.1 },
  { id: "muslo", nombre: "Muslo", factor: 1.1 },
  { id: "gluteo", nombre: "Glúteo", factor: 1.1 },
  { id: "pantorrilla", nombre: "Pantorrilla", factor: 1.1 },
  { id: "pierna", nombre: "Canilla", factor: 1.1 },
  { id: "nuca", nombre: "Nuca", factor: 1.1 },
  { id: "mano", nombre: "Mano", factor: 1.2 },
  { id: "cuello", nombre: "Cuello", factor: 1.2 },
  { id: "abdomen", nombre: "Abdomen", factor: 1.2 },
  { id: "espalda-baja", nombre: "Espalda baja", factor: 1.2 },
  { id: "pecho", nombre: "Pecho", factor: 1.3 },
  { id: "espalda-alta", nombre: "Espalda alta", factor: 1.3 },
  { id: "costillas", nombre: "Costillas", factor: 1.3 },
  { id: "rodilla", nombre: "Rodilla", factor: 1.3 },
  { id: "pie", nombre: "Pie", factor: 1.3 },
] as const;

export type Tamano = (typeof TAMANOS)[number]["id"];
export type EstiloPrecio = (typeof ESTILOS_PRECIO)[number]["id"];
export type Zona = (typeof ZONAS)[number]["id"];

export function estimar(tamano: Tamano, estilo: EstiloPrecio, zona: Zona): { min: number; max: number } {
  const t = TAMANOS.find((x) => x.id === tamano) ?? TAMANOS[0];
  const e = ESTILOS_PRECIO.find((x) => x.id === estilo) ?? ESTILOS_PRECIO[0];
  const z = ZONAS.find((x) => x.id === zona) ?? ZONAS[0];
  // Redondeado a miles: un rango de $32.437 se lee como un error.
  const redondear = (n: number) => Math.round(n / 1000) * 1000;
  return { min: redondear((t.min + e.extra) * z.factor), max: redondear((t.max + e.extra) * z.factor) };
}

export function pesos(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}
