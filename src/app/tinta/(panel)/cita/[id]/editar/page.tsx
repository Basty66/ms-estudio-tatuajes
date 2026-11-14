import { notFound } from "next/navigation";
import { Encabezado } from "@/componentes/panel/Encabezado";
import { FormularioCita } from "@/componentes/panel/FormularioCita";
import { leerContenido } from "@/db/contenido";
import { cita as leerCita } from "@/db/panel";
import { hoyChile, minutosEntre } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function EditarCita({ params }: { params: Promise<{ id: string }> }) {
  await operadorDelPanel();
  const c = await leerCita(Number((await params).id) || 0);
  if (!c || c.tipo === "bloqueo") notFound();
  return (
    <>
      <Encabezado volver={`${PANEL}/cita/${c.id}`} etiqueta={c.cliente ?? ""} titulo="Editar cita" />
      <FormularioCita
        precios={(await leerContenido()).precios}
        hoy={hoyChile()}
        fechaInicial={c.inicio.slice(0, 10)}
        edicion={{
          id: c.id,
          datos: {
            cliente: c.cliente ?? "",
            tipo: c.tipo,
            fecha: c.inicio.slice(0, 10),
            hora: c.inicio.slice(11, 16),
            duracion: minutosEntre(c.inicio, c.fin),
            zona: c.zona,
            lado: c.lado,
            tamano: c.tamano,
            estilo: c.estilo,
            descripcion: c.descripcion ?? "",
            precio: c.precio,
            notas: c.notas ?? "",
          },
        }}
      />
    </>
  );
}
