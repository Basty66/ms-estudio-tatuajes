import { leerContenido } from "@/db/contenido";
import { consentimientoFirmado } from "@/db/consentimientos";
import { hayPrivado, leerPrivadoEntero } from "@/lib/admin/almacen";
import { nombreArchivo, pdfConsentimiento } from "@/lib/admin/pdf";
import { usuarioActual } from "@/lib/admin/sesion";

/**
 * El PDF de un consentimiento firmado, solo con el panel desbloqueado. Lleva
 * datos de salud: nunca hay un enlace directo ni se guarda en cachés.
 * Con ?descargar=1 se baja como archivo; sin eso se abre en el navegador.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await usuarioActual())) return new Response("Sin sesión", { status: 401 });
  if (!hayPrivado) return new Response("Almacén no configurado", { status: 503 });
  const id = Number((await params).id);
  const k = Number.isInteger(id) && id > 0 ? await consentimientoFirmado(id) : null;
  if (!k) return new Response(null, { status: 404 });
  const [firma, { estudio }] = await Promise.all([leerPrivadoEntero(k.firma), leerContenido()]);
  if (!firma) return new Response("No se encontró la firma", { status: 404 });

  const pdf = await pdfConsentimiento({ ...k, estudio }, firma);
  const descargar = new URL(request.url).searchParams.has("descargar");
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${descargar ? "attachment" : "inline"}; filename="${nombreArchivo(k.datos.nombre, k.firmado_en)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
