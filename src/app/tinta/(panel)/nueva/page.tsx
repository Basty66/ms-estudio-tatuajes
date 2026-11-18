import { Encabezado } from "@/componentes/panel/Encabezado";
import { FormularioCita } from "@/componentes/panel/FormularioCita";
import { leerContenido } from "@/db/contenido";
import { cotizacion as leerCotizacion, cliente as leerCliente, trabajoDe } from "@/db/panel";
import { textoCotizacion } from "@/lib/admin/etiquetas";
import { esFecha, hoyChile } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function NuevaCita({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; cliente?: string; cotizacion?: string; trabajo?: string; valor?: string; sesiones?: string }>;
}) {
  await operadorDelPanel();
  const { fecha, cliente, cotizacion, trabajo, valor, sesiones } = await searchParams;
  const [elegido, cotizada, seguir] = await Promise.all([
    cliente ? leerCliente(Number(cliente) || 0) : null,
    cotizacion ? leerCotizacion(Number(cotizacion) || 0) : null,
    trabajo ? trabajoDe(Number(trabajo) || 0) : null,
  ]);
  // Lo acordado por WhatsApp desde Cotizaciones (valor final y sesiones) llega en el link de "Agendar".
  const acordado = { valorFinal: Number(valor) > 0 ? Math.round(Number(valor)) : null, sesiones: Number(sesiones) >= 1 ? Math.round(Number(sesiones)) : 1 };
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
            sesiones: acordado.sesiones,
            valorFinal: acordado.sesiones > 1 ? acordado.valorFinal : null,
            precio: acordado.sesiones > 1 ? null : acordado.valorFinal,
          },
        }
      : undefined;
  return (
    <>
      <Encabezado
        volver={seguir ? `${PANEL}/cita/${trabajo}` : desde ? `${PANEL}/cotizaciones` : elegido ? `${PANEL}/cliente/${elegido.id}` : PANEL}
        etiqueta="Agenda"
        titulo={seguir ? `Sesión ${seguir.vivas + 1}` : "Nueva cita"}
      />
      <FormularioCita
        precios={(await leerContenido()).precios}
        hoy={hoyChile()}
        fechaInicial={esFecha(fecha) ? fecha : hoyChile()}
        cliente={seguir ? { id: seguir.cliente_id, nombre: seguir.cliente, telefono: seguir.telefono } : elegido ? { id: elegido.id, nombre: elegido.nombre, telefono: elegido.telefono } : null}
        desde={seguir ? undefined : desde}
        seguir={seguir}
      />
    </>
  );
}
