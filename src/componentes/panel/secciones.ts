import { PANEL } from "@/lib/admin/ruta";
import { Ajustes, Billetera, Burbuja, Calendario, Hoy, Imagen, Mas, Menu, Mundo, Personas } from "./Iconos";

/**
 * Las secciones del panel. Viven fuera de <Navegacion> (que es de cliente)
 * para que las páginas del servidor, como "Más", también puedan leerlas.
 */
export const PRINCIPALES = [
  { href: PANEL, texto: "Hoy", Icono: Hoy },
  { href: `${PANEL}/agenda`, texto: "Agenda", Icono: Calendario },
  { href: `${PANEL}/nueva`, texto: "Nueva", Icono: Mas, destacada: true },
  { href: `${PANEL}/clientes`, texto: "Clientes", Icono: Personas },
  { href: `${PANEL}/mas`, texto: "Más", Icono: Menu },
];

export const SECUNDARIAS = [
  { href: `${PANEL}/finanzas`, texto: "Finanzas", detalle: "Ingresos, gastos y saldos por cobrar", Icono: Billetera },
  { href: `${PANEL}/cotizaciones`, texto: "Cotizaciones", detalle: "Lo que la gente cotiza en la web", Icono: Burbuja },
  { href: `${PANEL}/galeria`, texto: "Galería", detalle: "Los trabajos que se ven en la web", Icono: Imagen },
  { href: `${PANEL}/web`, texto: "Web", detalle: "Fotos, precios, contacto y textos de la web", Icono: Mundo },
  { href: `${PANEL}/cuenta`, texto: "Cuenta", detalle: "Face ID, avisos, PIN y sesión", Icono: Ajustes },
];

