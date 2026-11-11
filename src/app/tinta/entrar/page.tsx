import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PantallaDesbloqueo } from "@/componentes/panel/PantallaDesbloqueo";
import { PantallaEntrar } from "@/componentes/panel/PantallaEntrar";
import { sql } from "@/db/conexion";
import { credencialDeEsteAparato } from "@/lib/admin/biometria";
import { PANEL } from "@/lib/admin/ruta";
import { leerSesion, nombreDelAparato } from "@/lib/admin/sesion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar · Panel Matness" };

/**
 * A dónde volver después de entrar. Solo rutas del panel: si se aceptara
 * cualquier cosa, un enlace armado por otro podría mandar a alguien, recién
 * identificado, a un sitio ajeno que imite este.
 */
function destinoSeguro(volver: string | undefined): string {
  if (!volver) return PANEL;
  try {
    const url = new URL(volver, "https://panel.local");
    const propio = url.origin === "https://panel.local";
    const delPanel = url.pathname === PANEL || url.pathname.startsWith(`${PANEL}/`);
    if (propio && delPanel && !url.pathname.startsWith(`${PANEL}/entrar`)) {
      return url.pathname + url.search;
    }
  } catch {
    // Mal formado: al inicio.
  }
  return PANEL;
}

/** Solo nombre e id: esta lista se ve antes de entrar. */
async function equipoParaEntrar(): Promise<Array<{ id: number; nombre: string }>> {
  return (await sql`SELECT id, nombre FROM usuarios WHERE activo ORDER BY id`) as Array<{ id: number; nombre: string }>;
}

/**
 * Una sola dirección para los tres casos, que se decide acá en el servidor:
 *
 *   - panel desbloqueado → directo a donde iba;
 *   - sesión de este aparato pero bloqueada → PIN o Face ID / huella;
 *   - aparato sin sesión → nombre, clave del panel y PIN.
 */
export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>;
}) {
  const { volver } = await searchParams;
  const destino = destinoSeguro(volver);
  const sesion = await leerSesion();

  if (sesion && !sesion.bloqueada) redirect(destino);

  const aparato = nombreDelAparato((await headers()).get("user-agent"));

  if (sesion) {
    const biometria = Boolean(await credencialDeEsteAparato(sesion.id));
    return (
      <PantallaDesbloqueo
        nombre={sesion.nombre}
        biometria={biometria}
        aparato={aparato}
        destino={destino}
      />
    );
  }

  return <PantallaEntrar equipo={await equipoParaEntrar()} destino={destino} />;
}
