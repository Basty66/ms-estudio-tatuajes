import { formatearTelefono } from "@/lib/admin/telefono";
import { enlaceWhatsapp, type DatosEstudio } from "@/lib/contenido";
import { SECCIONES } from "@/lib/estudio";
import { BotonMagnetico } from "./BotonMagnetico";
import { NombreCromo } from "./NombreCromo";
import { Ornamento } from "./Ornamento";

function Escudo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-stencil-claro" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6z" />
      <path d="m9.5 12 1.8 1.8 3.4-3.6" />
    </svg>
  );
}

export function Pie({ estudio }: { estudio: DatosEstudio }) {
  return (
    <footer id="ubicacion" className="relative overflow-hidden border-t border-linea/70">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 pt-24 pb-10 sm:px-8 lg:grid-cols-12 lg:pt-36">
        <div className="lg:col-span-5">
          <h2 className="text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-semibold tracking-[-0.02em]">
            {estudio.direccion}, {estudio.comuna}.
          </h2>
          <p className="mt-5 max-w-md text-lg text-ceniza">
            Atiendo solo con hora reservada, para que el estudio sea tuyo mientras te tatúas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BotonMagnetico href="#cotiza">Cotizar y pedir hora</BotonMagnetico>
            <BotonMagnetico href={enlaceWhatsapp(estudio.whatsapp, "Hola, quiero consultar por un tatuaje.")} variante="linea" externo>
              WhatsApp
            </BotonMagnetico>
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-6 text-[15px]">
            <div>
              <dt className="text-ceniza">Instagram</dt>
              <dd className="mt-1">
                <a href={`https://instagram.com/${estudio.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-stencil-claro">
                  @{estudio.instagram}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-ceniza">WhatsApp</dt>
              <dd className="mt-1">
                <a href={`https://wa.me/${estudio.whatsapp}`} className="hover:text-stencil-claro">
                  {formatearTelefono(estudio.whatsapp)}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-linea lg:aspect-auto lg:h-full lg:min-h-[420px]">
            <iframe
              src={estudio.mapa}
              title={`Mapa: ${estudio.nombreLargo}, ${estudio.direccion}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="mapa-oscuro absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </div>

      <nav aria-label="Secciones" className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-linea pt-8 text-[15px] sm:flex sm:flex-wrap sm:gap-x-8">
          {SECCIONES.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-ceniza transition-colors hover:text-piel">
                {s.texto}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative mx-auto mt-16 max-w-[1400px] px-4 sm:px-8">
        <Ornamento tipo="filigrana" className="relative mx-auto mb-6 block w-64 opacity-70" flotar={0} />
        <NombreCromo animar={false} className="w-full opacity-90" />
      </div>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 pt-6 pb-28 text-[13px] text-ceniza sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:pr-28 lg:pb-8">
        <span>
          © {new Date().getFullYear()} {estudio.nombreLargo} · Hecho en {estudio.comuna}
        </span>
        {/* Lo que la gente busca al final de una web: cómo se cuidan sus datos. */}
        <a href="/privacidad" className="-mx-2 inline-flex min-h-11 items-center gap-2 self-start rounded-full px-2 text-[14px] text-piel/80 transition-colors hover:text-piel sm:self-auto">
          <Escudo />
          Privacidad y datos
        </a>
      </div>
    </footer>
  );
}
