import { headers } from "next/headers";
import { salir } from "@/app/tinta/_acciones/entrar";
import { ActivarAvisos } from "@/componentes/panel/ActivarAvisos";
import { BiometriaAparato } from "@/componentes/panel/BiometriaAparato";
import { claseBoton } from "@/componentes/panel/Boton";
import { CambiarPin } from "@/componentes/panel/CambiarPin";
import { Encabezado } from "@/componentes/panel/Encabezado";
import { Salir } from "@/componentes/panel/Iconos";
import { LLAVE_PUBLICA } from "@/lib/admin/avisos";
import { credencialDeEsteAparato } from "@/lib/admin/biometria";
import { operadorDelPanel } from "@/lib/admin/panel";
import { nombreDelAparato } from "@/lib/admin/sesion";

export const dynamic = "force-dynamic";

/** Lo de ESTE aparato: Face ID / huella, avisos, PIN y cerrar la sesión. */
export default async function Cuenta() {
  const yo = await operadorDelPanel();
  const aparato = nombreDelAparato((await headers()).get("user-agent"));
  const bio = Boolean(await credencialDeEsteAparato(yo.id));

  return (
    <>
      <Encabezado etiqueta={`${yo.nombre} · ${aparato}`} titulo="Cuenta" />
      <div className="flex flex-col gap-3 lg:max-w-2xl">
        <BiometriaAparato activa={bio} aparato={aparato} />
        <ActivarAvisos llave={LLAVE_PUBLICA} />
        <CambiarPin />
        <form action={salir} className="mt-3">
          <button type="submit" className={claseBoton("peligro", "w-full")}>
            <Salir className="size-5" /> Cerrar sesión en este aparato
          </button>
        </form>
        <p className="mt-2 text-center text-[12px] text-ceniza">
          La sesión dura 90 días en este aparato. El panel se bloquea al cerrarlo o tras 30 minutos sin uso.
          <br />
          Versión {process.env.NEXT_PUBLIC_VERSION}
        </p>
      </div>
    </>
  );
}
