/**
 * Estimación de precio del cotizador. Es un rango orientativo: el precio
 * final lo pone el tatuador al ver el diseño.
 *
 * Los nombres y las zonas viven acá (los usa el mapa del cuerpo); los montos
 * se ajustan desde el panel (Web → Precios) y estos son los de fábrica.
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

/** Los montos que se ajustan desde el panel. El recargo de zona va en porcentaje: 10 = +10 %. */
export type Precios = {
  tamanos: Record<Tamano, { min: number; max: number }>;
  estilos: Record<EstiloPrecio, number>;
  zonas: Record<Zona, number>;
};

export const PRECIOS_BASE: Precios = {
  tamanos: Object.fromEntries(TAMANOS.map((t) => [t.id, { min: t.min, max: t.max }])) as Precios["tamanos"],
  estilos: Object.fromEntries(ESTILOS_PRECIO.map((e) => [e.id, e.extra])) as Precios["estilos"],
  zonas: Object.fromEntries(ZONAS.map((z) => [z.id, Math.round((z.factor - 1) * 100)])) as Precios["zonas"],
};

const monto = (v: unknown, base: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= 10_000_000 ? n : base;
};

/** Lo guardado, revisado monto por monto; lo que falte o no sea un número queda como de fábrica. */
export function normalizarPrecios(v: unknown): Precios {
  const g = (v ?? {}) as { tamanos?: Record<string, { min?: unknown; max?: unknown }>; estilos?: Record<string, unknown>; zonas?: Record<string, unknown> };
  const tamanos = { ...PRECIOS_BASE.tamanos };
  for (const t of TAMANOS) {
    const min = monto(g.tamanos?.[t.id]?.min, tamanos[t.id].min);
    const max = monto(g.tamanos?.[t.id]?.max, tamanos[t.id].max);
    tamanos[t.id] = { min: Math.min(min, max), max: Math.max(min, max) };
  }
  const estilos = { ...PRECIOS_BASE.estilos };
  for (const e of ESTILOS_PRECIO) estilos[e.id] = monto(g.estilos?.[e.id], estilos[e.id]);
  const zonas = { ...PRECIOS_BASE.zonas };
  for (const z of ZONAS) zonas[z.id] = Math.min(300, monto(g.zonas?.[z.id], zonas[z.id]));
  return { tamanos, estilos, zonas };
}

export function estimar(precios: Precios, tamano: Tamano, estilo: EstiloPrecio, zona: Zona): { min: number; max: number } {
  const t = precios.tamanos[tamano] ?? PRECIOS_BASE.tamanos.pequeno;
  const extra = precios.estilos[estilo] ?? 0;
  const factor = 1 + (precios.zonas[zona] ?? 0) / 100;
  // Redondeado a miles: un rango de $32.437 se lee como un error.
  const redondear = (n: number) => Math.round(n / 1000) * 1000;
  return { min: redondear((t.min + extra) * factor), max: redondear((t.max + extra) * factor) };
}

export function pesos(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}
