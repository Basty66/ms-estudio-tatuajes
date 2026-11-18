import { headers } from "next/headers";
import { Encabezado } from "@/componentes/panel/Encabezado";
import { EditarMensajes } from "@/componentes/panel/EditoresWeb";
import { leerContenido } from "@/db/contenido";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import { DOMINIO } from "@/lib/sitio";

export const dynamic = "force-dynamic";

export default async function Mensajes() {
  await operadorDelPanel();
  const [{ mensajes, estudio }, h] = await Promise.all([leerContenido(), headers()]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? DOMINIO;
  return (
    <>
      <Encabezado volver={`${PANEL}/web`} titulo="Mensajes de WhatsApp" />
      <p className="-mt-2 mb-5 max-w-2xl text-[14px] text-ceniza">Los textos que arma el panel al tocar un botón de WhatsApp. Al lado ves cómo le llegan al cliente.</p>
      <EditarMensajes inicial={mensajes} resenas={estudio.resenas} origen={`${host.startsWith("localhost") ? "http" : "https"}://${host}`} />
    </>
  );
}
