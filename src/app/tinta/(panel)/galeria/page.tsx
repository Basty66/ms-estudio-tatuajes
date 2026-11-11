import Image from "next/image";
import { Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { FotoGaleria, SubirFoto } from "@/componentes/panel/Galeria";
import { galeria } from "@/db/panel";
import { hayGaleria } from "@/lib/admin/almacen";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import { TRABAJOS } from "@/lib/estudio";

export const dynamic = "force-dynamic";

/**
 * Los trabajos de la sección "Trabajos" de la web. Mientras no se suba
 * ninguno, la web muestra los de muestra que vienen en el código.
 */
export default async function Galeria() {
  await operadorDelPanel();
  const fotos = await galeria();

  return (
    <>
      <Encabezado volver={`${PANEL}/mas`} etiqueta={`${fotos.filter((f) => f.visible).length} en la web`} titulo="Galería" />

      {hayGaleria ? (
        <SubirFoto />
      ) : (
        <p className="rounded-2xl border border-[#f59e0b]/40 bg-[#f59e0b]/[0.06] p-4 text-[14px] text-[#fbbf24]">
          Para subir fotos falta conectar un almacén de Vercel Blob al proyecto (BLOB_READ_WRITE_TOKEN).
        </p>
      )}

      {fotos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((f, i) => (
            <FotoGaleria
              key={f.id}
              f={{ id: f.id, visible: f.visible, src: f.url, alt: f.alt, estilo: f.estilo, zona: f.zona, ancho: f.ancho, alto: f.alto }}
              primera={i === 0}
              ultima={i === fotos.length - 1}
            />
          ))}
        </ul>
      ) : (
        <Tarjeta className="mt-4">
          <TituloBloque>En la web ahora (de muestra)</TituloBloque>
          <ul className="grid grid-cols-3 gap-2">
            {TRABAJOS.map((t) => (
              <li key={t.src} className="relative aspect-[4/5] overflow-hidden rounded-xl">
                <Image src={t.src} alt={t.alt} fill sizes="30vw" className="object-cover" />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-ceniza">Apenas subas el primer trabajo, la web pasa a mostrar los de acá.</p>
        </Tarjeta>
      )}
    </>
  );
}
