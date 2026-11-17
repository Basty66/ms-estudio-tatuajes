import { Encabezado } from "@/componentes/panel/Encabezado";
import { FormularioCita } from "@/componentes/panel/FormularioCita";
import { leerContenido } from "@/db/contenido";
import { cotizacion as leerCotizacion, cliente as leerCliente } from "@/db/panel";
import { textoCotizacion } from "@/lib/admin/etiquetas";
import { esFecha, hoyChile } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function NuevaCita({ searchParams }: { searchParams: Promise<{ fecha?: string; cliente?: string; cotizacion?: string }> }) {
  await operadorDelPanel();
  const { fecha, cliente, cotizacion } = await searchParams;
  const [elegido, cotizada] = await Promise.all([
    cliente ? leerCliente(Number(cliente) || 0) : null,
    cotizacion ? leerCotizacion(Number(cotizacion) || 0) : null,
  ]);
  // Lo cotizado en la web pasa tal cual a la cita; el código queda en las notas.
  const t = cotizada ? textoCotizacion(cotizada) : null;
  const desde =
    cotizada && t && cotizada.estado !== "agendada"
      ? {
          id: cotizada.id,
          codigo: cotizada.codigo,
          rango: t.rango,
          datos: {
            tipo: cotizada.tipo,
            zona: cotizada.zona,
            lado: cotizada.lado,
            tamano: cotizada.tamano,
            estilo: cotizada.tipo === "tatuaje" ? cotizada.estilo : null,
            descripcion: cotizada.idea ?? (cotizada.tipo === "laser" ? t.detalle.charAt(0).toUpperCase() + t.detalle.slice(1) : ""),
            notas: `Cotización ${cotizada.codigo ?? "de la web"}: ${t.rango}.`,
          },
        }
      : undefined;
  return (
    <>
      <Encabezado volver={desde ? `${PANEL}/cotizaciones` : elegido ? `${PANEL}/cliente/${elegido.id}` : PANEL} etiqueta="Agenda" titulo="Nueva cita" />
      <FormularioCita
        precios={(await leerContenido()).precios}
        hoy={hoyChile()}
        fechaInicial={esFecha(fecha) ? fecha : hoyChile()}
        cliente={elegido ? { id: elegido.id, nombre: elegido.nombre, telefono: elegido.telefono } : null}
        desde={desde}
      />
    </>
  );
}
