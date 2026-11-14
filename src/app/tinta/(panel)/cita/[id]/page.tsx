import Link from "next/link";
import { notFound } from "next/navigation";
import { EstadoCita, FilaPago, NuevoPago } from "@/componentes/panel/AccionesCita";
import { claseBoton } from "@/componentes/panel/Boton";
import { Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { Telefono } from "@/componentes/panel/Iconos";
import { IconoWhatsapp } from "@/componentes/sitio/WhatsappFlotante";
import { leerContenido } from "@/db/contenido";
import { cita as leerCita, pagosDeCita } from "@/db/panel";
import { clp, ESTADO, nombreDonde, nombreEstilo, nombreTamano, TIPO } from "@/lib/admin/etiquetas";
import { ahoraChile, duracionTexto, fechaLarga, fechaRelativa, hora, minutosEntre } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import { formatearTelefono } from "@/lib/admin/telefono";

export const dynamic = "force-dynamic";

const SITIO = "https://tatuajes-azure.vercel.app";

function whatsapp(telefono: string, mensaje: string) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

export default async function FichaCita({ params }: { params: Promise<{ id: string }> }) {
  await operadorDelPanel();
  const c = await leerCita(Number((await params).id) || 0);
  if (!c || c.tipo === "bloqueo") notFound();
  const [pagos, { estudio }] = await Promise.all([pagosDeCita(c.id), leerContenido()]);
  const nombre = (c.cliente ?? "").split(" ")[0];
  const cuando = `${fechaLarga(c.inicio)} a las ${hora(c.inicio)}`;
  const duracion = duracionTexto(minutosEntre(c.inicio, c.fin));
  const empezo = c.inicio <= ahoraChile();

  const confirmacion = [
    `Hola ${nombre} 👋 Te confirmo tu hora en ${estudio.nombre}:`,
    "",
    `📅 ${cuando.charAt(0).toUpperCase() + cuando.slice(1)}`,
    `⏱️ Aprox. ${duracion}`,
    `📍 ${estudio.direccion}, ${estudio.comuna}`,
    c.precio != null ? `💰 Valor: ${clp(c.precio)}` : null,
    c.pagado > 0 ? `✅ Abono recibido: ${clp(c.pagado)}` : null,
    c.saldo != null && c.saldo > 0 ? `💵 Saldo el día de la sesión: ${clp(c.saldo)}` : null,
    "",
    "Antes de venir: come bien, toma agua y evita el alcohol 24 h antes.",
    `Cuidados después de la sesión: ${SITIO}/#cuidados`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const recordatorio = [
    `Hola ${nombre}, te recuerdo tu sesión ${fechaRelativa(c.inicio).toLowerCase() === "mañana" ? "de mañana" : `del ${cuando}`}${fechaRelativa(c.inicio).toLowerCase() === "mañana" ? ` a las ${hora(c.inicio)}` : ""} en ${estudio.direccion}, ${estudio.comuna}.`,
    c.saldo != null && c.saldo > 0 ? `El saldo es ${clp(c.saldo)} (efectivo o transferencia).` : null,
    "Si necesitas cambiar algo, avísame por acá 🙌",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <Encabezado
        volver={`${PANEL}/agenda?dia=${c.inicio.slice(0, 10)}`}
        etiqueta={`${TIPO[c.tipo]} · ${ESTADO[c.estado]}`}
        titulo={c.cliente}
        accion={
          <Link href={`${PANEL}/cita/${c.id}/editar`} className={claseBoton("linea", "min-h-10 px-4 text-[14px]")}>
            Editar
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Tarjeta>
            <p className="text-[clamp(1.4rem,5vw,1.9rem)] leading-tight font-semibold first-letter:uppercase">{fechaRelativa(c.inicio)}</p>
            <p className="mt-1 text-[17px] tabular-nums">
              {hora(c.inicio)} a {hora(c.fin)} <span className="text-ceniza">· {duracion}</span>
            </p>
            {fechaRelativa(c.inicio) !== fechaLarga(c.inicio) && <p className="mt-1 text-[14px] text-ceniza first-letter:uppercase">{fechaLarga(c.inicio)}</p>}

            {c.telefono &&
              (!empezo && c.estado === "confirmada" ? (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <a href={whatsapp(c.telefono, confirmacion)} target="_blank" rel="noopener noreferrer" className={claseBoton("cromo", "min-h-11 px-3 text-[14px]")}>
                    <IconoWhatsapp className="size-5 shrink-0" /> Confirmar
                  </a>
                  <a href={whatsapp(c.telefono, recordatorio)} target="_blank" rel="noopener noreferrer" className={claseBoton("linea", "min-h-11 px-3 text-[14px]")}>
                    <IconoWhatsapp className="size-5 shrink-0" /> Recordar
                  </a>
                </div>
              ) : (
                <a href={`https://wa.me/${c.telefono}`} target="_blank" rel="noopener noreferrer" className={claseBoton("linea", "mt-5 min-h-11 w-full px-3 text-[14px]")}>
                  <IconoWhatsapp className="size-5 shrink-0" /> Escribirle por WhatsApp
                </a>
              ))}
            <div className="mt-5 border-t border-linea pt-4">
              <EstadoCita id={c.id} estado={c.estado} empezo={empezo} />
            </div>
          </Tarjeta>

          <Tarjeta>
            <TituloBloque>Pagos</TituloBloque>
            {c.precio == null ? (
              <p className="text-[14px] text-ceniza">
                Sin valor acordado{c.pagado > 0 ? ` · pagado ${clp(c.pagado)}` : ""}. Anótalo con Editar para ver el saldo.
              </p>
            ) : (
              <>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[14px] text-ceniza">
                    <span className="block text-[22px] leading-tight font-semibold text-piel tabular-nums">{clp(c.pagado)}</span>
                    pagado de {clp(c.precio)}
                  </p>
                  <p className="text-right text-[14px] text-ceniza">
                    <span className={`block text-[22px] leading-tight font-semibold tabular-nums ${c.saldo ? "text-[#fbbf24]" : "text-[#6ee7b7]"}`}>
                      {c.saldo ? clp(c.saldo) : "Listo"}
                    </span>
                    {c.saldo ? "por cobrar" : "pagada"}
                  </p>
                </div>
                <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-linea">
                  <div
                    className={`h-full rounded-full ${c.saldo ? "bg-stencil" : "bg-[#34d399]"}`}
                    style={{ width: `${c.precio > 0 ? Math.min(100, (c.pagado / c.precio) * 100) : 100}%` }}
                  />
                </div>
              </>
            )}
            {pagos.length > 0 && (
              <ul className="mt-3">
                {pagos.map((p) => (
                  <FilaPago key={p.id} p={p} />
                ))}
              </ul>
            )}
            <div className="mt-4">
              <NuevoPago citaId={c.id} saldo={c.saldo} tieneAbono={pagos.some((p) => p.tipo === "abono")} />
            </div>
          </Tarjeta>
        </div>

        <div className="flex flex-col gap-4 lg:gap-5">
          <Tarjeta>
            <TituloBloque>{c.tipo === "tatuaje" ? "El tatuaje" : TIPO[c.tipo]}</TituloBloque>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[15px]">
              <Dato t="Zona" v={nombreDonde(c.zona, c.lado)} />
              <Dato t="Estilo" v={nombreEstilo(c.estilo)} />
              <Dato t="Tamaño" v={nombreTamano(c.tamano)} />
              <Dato t="Valor" v={c.precio != null ? clp(c.precio) : null} />
              {c.descripcion && <Dato t="Diseño" v={c.descripcion} ancho />}
              {c.notas && <Dato t="Notas" v={c.notas} ancho />}
            </dl>
          </Tarjeta>

          <div className="flex items-center gap-2 rounded-3xl border border-linea bg-hollin/70 p-3 pl-4 sm:p-4 sm:pl-5">
            <Link href={`${PANEL}/cliente/${c.cliente_id}`} className="group flex min-w-0 flex-1 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#2f6bff,#0c1f6b)] font-gotica text-lg">
                {(c.cliente ?? "?").charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold group-hover:text-stencil-claro">Ficha de {nombre}</span>
                <span className="block truncate text-[13px] text-ceniza">{c.telefono ? formatearTelefono(c.telefono) : "Sin teléfono"} · historial y notas</span>
              </span>
            </Link>
            {c.telefono && (
              <a href={`tel:+${c.telefono}`} aria-label="Llamar" className="grid size-11 shrink-0 place-items-center rounded-full border border-linea text-ceniza hover:text-piel">
                <Telefono className="size-5" />
              </a>
            )}
          </div>

          <p className="text-center text-[12px] text-ceniza">Agendada por {c.creada_por}</p>
        </div>
      </div>
    </>
  );
}

function Dato({ t, v, ancho = false }: { t: string; v: string | null; ancho?: boolean }) {
  return (
    <div className={ancho ? "col-span-2" : ""}>
      <dt className="text-[12px] text-ceniza">{t}</dt>
      <dd className="mt-0.5 whitespace-pre-line">{v ?? "—"}</dd>
    </div>
  );
}
