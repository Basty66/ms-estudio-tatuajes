import { Encabezado } from "@/componentes/panel/Encabezado";
import { FormularioCita } from "@/componentes/panel/FormularioCita";
import { cliente as leerCliente } from "@/db/panel";
import { esFecha, hoyChile } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function NuevaCita({ searchParams }: { searchParams: Promise<{ fecha?: string; cliente?: string }> }) {
  await operadorDelPanel();
  const { fecha, cliente } = await searchParams;
  const elegido = cliente ? await leerCliente(Number(cliente) || 0) : null;
  return (
    <>
      <Encabezado volver={elegido ? `${PANEL}/cliente/${elegido.id}` : PANEL} etiqueta="Agenda" titulo="Nueva cita" />
      <FormularioCita
        hoy={hoyChile()}
        fechaInicial={esFecha(fecha) ? fecha : hoyChile()}
        cliente={elegido ? { id: elegido.id, nombre: elegido.nombre, telefono: elegido.telefono } : null}
      />
    </>
  );
}
