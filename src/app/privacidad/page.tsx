import type { Metadata } from "next";
import Link from "next/link";
import { leerContenido } from "@/db/contenido";
import { formatearTelefono } from "@/lib/admin/telefono";
import { ANIOS_QUE_SE_GUARDA } from "@/lib/consentimiento";
import { enlaceWhatsapp } from "@/lib/contenido";

/**
 * Política de privacidad (Ley 21.719). Los datos del responsable y el
 * contacto salen del panel (Web → Contacto y dirección), así que se mantiene
 * al día sola. Si cambia lo que se recoge, se cambia acá y la fecha de abajo.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacidad · Matness",
  description: "Qué datos guarda el estudio, para qué, cuánto tiempo y cómo pedir verlos o borrarlos.",
};

const ACTUALIZADA = "17 de noviembre de 2026";

export default async function Privacidad() {
  const { estudio } = await leerContenido();
  const whatsapp = enlaceWhatsapp(estudio.whatsapp, "Hola, quiero hacer una consulta sobre mis datos personales.");

  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute -top-56 left-1/2 -z-10 h-[50vh] w-[120vw] -translate-x-1/2 rounded-full bg-stencil/10 blur-[120px]" />
      <header className="mx-auto flex w-full max-w-[44rem] items-center justify-between gap-4 px-4 sm:px-6" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}>
        <Link href="/" className="texto-acero font-gotica text-[26px] leading-none">
          {estudio.nombre}
        </Link>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-full px-3 text-[14px] text-ceniza hover:text-piel">
          Volver a la web
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[44rem] px-4 pt-14 pb-24 sm:px-6">
        <h1 className="font-gotica text-[clamp(2.75rem,11vw,4.5rem)] leading-[0.92]">Privacidad</h1>
        <p className="mt-6 max-w-[38rem] text-[18px] leading-relaxed text-piel/90">
          Qué datos guardo, para qué, por cuánto tiempo y cómo pedir verlos o borrarlos. Sin letra chica.
        </p>

        <Seccion titulo="Quién responde por tus datos">
          <p>
            {estudio.responsable}, {estudio.direccion}, {estudio.comuna}. Para cualquier cosa sobre tus datos, escríbeme por{" "}
            <a href={whatsapp} className="enlace">
              WhatsApp al {formatearTelefono(estudio.whatsapp)}
            </a>
            {estudio.correo ? (
              <>
                {" "}o a{" "}
                <a href={`mailto:${estudio.correo}`} className="enlace">
                  {estudio.correo}
                </a>
              </>
            ) : null}
            .
          </p>
        </Seccion>

        <Seccion titulo="Qué datos y para qué">
          <dl className="flex flex-col gap-6">
            <Dato titulo="Cotizador de la web">
              Zona, tamaño, estilo y la idea que escribas, para avisarme y saber qué se cotiza. No pide nombre ni teléfono. Para frenar abusos se guarda una huella cifrada de la conexión que cambia cada día y no permite saber quién eres.
            </Dato>
            <Dato titulo="Agenda">Tu nombre, tu WhatsApp y, si me lo das, tu Instagram. Sirven para agendar, confirmar y recordarte la hora, y mandarte los cuidados después.</Dato>
            <Dato titulo="Pagos">Monto, fecha y comprobante de transferencia, para llevar las cuentas del estudio como exige la ley tributaria.</Dato>
            <Dato titulo="Consentimiento informado">
              Nombre, RUT, fecha de nacimiento, teléfono, tus respuestas de salud y tu firma; si eres menor de edad, también los datos de quien te representa. Sirven para saber si puedes tatuarte de forma segura y como respaldo de lo que aceptaste. Los datos de salud son sensibles: solo se guardan con tu autorización expresa, que das al firmar.
            </Dato>
            <Dato titulo="Fotos de tu tatuaje">Solo se publican si lo autorizas aparte en el consentimiento. Puedes retirar ese permiso cuando quieras y la foto se baja.</Dato>
          </dl>
        </Seccion>

        <Seccion titulo="Cuánto tiempo">
          <ul className="flex flex-col gap-2">
            <li>El consentimiento firmado, {ANIOS_QUE_SE_GUARDA} años desde la firma. Después se borra solo.</li>
            <li>Los datos de la agenda, mientras sigas siendo cliente o hasta que pidas borrarlos.</li>
            <li>Los pagos, el plazo que exige la ley tributaria.</li>
          </ul>
        </Seccion>

        <Seccion titulo="Quién más los ve">
          <p>
            Nadie fuera del estudio. No se venden ni se comparten. Se guardan en servicios de alojamiento (Vercel y Neon) que los procesan solo por encargo del estudio: la base de datos y los consentimientos, en São Paulo, Brasil; las fotos publicadas en la web, en Estados Unidos.
          </p>
        </Seccion>

        <Seccion titulo="Cómo se cuidan">
          <p>
            El panel del estudio se abre con clave, PIN y Face ID o huella. Los consentimientos y comprobantes van en un almacenamiento privado que no tiene enlaces públicos. Todo viaja cifrado. La web no usa cookies de publicidad ni de seguimiento.
          </p>
        </Seccion>

        <Seccion titulo="Tus derechos">
          <p>
            Puedes pedir ver tus datos, corregirlos, borrarlos, oponerte a que se usen, llevártelos o que se bloqueen mientras se revisa algo. Escríbeme por{" "}
            <a href={whatsapp} className="enlace">
              WhatsApp
            </a>{" "}
            y te respondo dentro de los plazos de la ley. Si no quedas conforme, puedes reclamar ante la Agencia de Protección de Datos Personales.
          </p>
        </Seccion>

        <p className="mt-16 border-t border-linea pt-6 text-[14px] text-ceniza">Actualizada el {ACTUALIZADA}.</p>
      </main>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="text-[clamp(1.35rem,4.5vw,1.6rem)] leading-tight font-semibold tracking-[-0.01em]">{titulo}</h2>
      <div className="mt-4 max-w-[38rem] text-[16.5px] leading-relaxed text-piel/85 [&_.enlace]:font-semibold [&_.enlace]:text-stencil-claro [&_.enlace]:underline [&_.enlace]:decoration-stencil/40 [&_.enlace]:underline-offset-4">
        {children}
      </div>
    </section>
  );
}

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-semibold text-piel">{titulo}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
