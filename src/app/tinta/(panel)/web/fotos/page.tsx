import { Encabezado } from "@/componentes/panel/Encabezado";
import { FotoWeb } from "@/componentes/panel/FotosWeb";
import { bloqueGuardado, leerContenido } from "@/db/contenido";
import { hayGaleria } from "@/lib/admin/almacen";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import { LUGARES_FOTO } from "@/lib/contenido";

export const dynamic = "force-dynamic";

/** Las fotos fijas de la portada, agrupadas por sección. Las del portafolio están en Galería. */
export default async function FotosDeLaWeb() {
  await operadorDelPanel();
  const [{ fotos }, guardadas] = await Promise.all([leerContenido(), bloqueGuardado("fotos")]);
  const cambiadas = new Set(Object.keys((guardadas ?? {}) as object));
  const grupos = [...new Set(LUGARES_FOTO.map((l) => l.grupo))];

  return (
    <>
      <Encabezado volver={`${PANEL}/web`} titulo="Fotos de la web" />
      {!hayGaleria && (
        <p className="mb-4 rounded-2xl border border-[#f59e0b]/40 bg-[#f59e0b]/[0.06] p-4 text-[14px] text-[#fbbf24]">
          Para cambiar fotos falta conectar el almacén de fotos en Vercel (BLOB_READ_WRITE_TOKEN).
        </p>
      )}
      <p className="mb-6 text-[14px] text-ceniza">Mejor en vertical (4:5). Se achican solas antes de subir, así que sirven las del teléfono tal cual.</p>
      <div className="flex flex-col gap-8">
        {grupos.map((g) => (
          <section key={g}>
            <h2 className="mb-3 text-[12px] font-semibold tracking-[0.16em] text-ceniza uppercase">{g}</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {LUGARES_FOTO.filter((l) => l.grupo === g).map((l) => (
                <FotoWeb key={`${l.clave}-${fotos[l.clave]?.src}`} clave={l.clave} titulo={l.titulo} foto={fotos[l.clave]} cambiada={cambiadas.has(l.clave)} puedeSubir={hayGaleria} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
