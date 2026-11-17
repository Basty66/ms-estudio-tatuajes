import { Encabezado } from "@/componentes/panel/Encabezado";
import { EditarPreguntas } from "@/componentes/panel/EditoresWeb";
import { leerContenido } from "@/db/contenido";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function Preguntas() {
  await operadorDelPanel();
  const { preguntas } = await leerContenido();
  return (
    <>
      <Encabezado volver={`${PANEL}/web`} titulo="Preguntas frecuentes" />
      <p className="-mt-2 mb-5 text-[14px] text-ceniza">También las lee Google para mostrarlas en los resultados.</p>
      <EditarPreguntas inicial={preguntas} />
    </>
  );
}
