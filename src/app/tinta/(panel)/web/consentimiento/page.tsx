import { Encabezado } from "@/componentes/panel/Encabezado";
import { EditarConsentimiento } from "@/componentes/panel/EditoresWeb";
import { leerContenido } from "@/db/contenido";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function Consentimiento() {
  await operadorDelPanel();
  const { consentimiento } = await leerContenido();
  return (
    <>
      <Encabezado volver={`${PANEL}/web`} titulo="Consentimiento" />
      <p className="-mt-2 mb-5 max-w-2xl text-[14px] text-ceniza">Lo que el cliente lee y acepta antes de firmar. Revísalo con la vista previa antes de guardar.</p>
      <EditarConsentimiento inicial={consentimiento} />
    </>
  );
}
