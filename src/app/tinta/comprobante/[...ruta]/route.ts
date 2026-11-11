import { hayComprobantes, leerComprobante } from "@/lib/admin/almacen";
import { usuarioActual } from "@/lib/admin/sesion";

/**
 * Entrega un comprobante del almacén privado, solo con el panel desbloqueado.
 * Nunca hay un enlace directo al archivo: lleva datos bancarios de un tercero.
 */
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ ruta: string[] }> }) {
  if (!(await usuarioActual())) return new Response("Sin sesión", { status: 401 });
  if (!hayComprobantes) return new Response("Almacén no configurado", { status: 503 });
  const ruta = (await params).ruta.join("/");
  if (!ruta.startsWith("comprobantes/") || ruta.includes("..")) return new Response(null, { status: 404 });
  const archivo = await leerComprobante(ruta).catch(() => null);
  if (!archivo || archivo.statusCode !== 200 || !archivo.stream) return new Response(null, { status: 404 });
  return new Response(archivo.stream, {
    headers: {
      "Content-Type": archivo.blob.contentType ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
