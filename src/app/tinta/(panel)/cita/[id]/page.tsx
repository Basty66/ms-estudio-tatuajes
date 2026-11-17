import Link from "next/link";
import { notFound } from "next/navigation";
import { EstadoCita, FilaPago, NuevoPago } from "@/componentes/panel/AccionesCita";
import { claseBoton } from "@/componentes/panel/Boton";
import { BotonSeguimiento, ConsentimientoCita } from "@/componentes/panel/Consentimiento";
import { Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { FotoDeCita } from "@/componentes/panel/Galeria";
import { Check, Telefono } from "@/componentes/panel/Iconos";
import { IconoWhatsapp } from "@/componentes/sitio/WhatsappFlotante";
import { leerContenido } from "@/db/contenido";
import { consentimientoDeCita, ETAPAS, fotosDeCita, seguimientosDeCita } from "@/db/consentimientos";
import { cita as leerCita, pagosDeCita } from "@/db/panel";
import { clp, ESTADO, nombreDonde, nombreEstilo, nombreTamano, nombreZona, TIPO } from "@/lib/admin/etiquetas";
import { ahoraChile, duracionTexto, fechaCorta, fechaLarga, fechaRelativa, hora, hoyChile, minutosEntre, sumarDias } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import { formatearTelefono } from "@/lib/admin/telefono";
import { esUrgente } from "@/lib/consentimiento";
import { rellenar } from "@/lib/contenido";
import { ESTILOS } from "@/lib/estudio";

export const dynamic = "force-dynamic";

const SITIO = "https://tatuajes-azure.vercel.app";

function whatsapp(telefono: string, mensaje: string) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * La ficha de una cita, en el orden en que se usa: lo que hay que saber antes
 * de empezar (alertas de salud), cuándo, el consentimiento y los pagos; a la
 * derecha qué se hace y, cuando ya se hizo, el seguimiento y la foto.
 */
export default async function FichaCita({ params }: { params: Promise<{ id: string }> }) {
  await operadorDelPanel();
  const c = await leerCita(Number((await params).id) || 0);
  if (!c || c.tipo === "bloqueo") notFound();
  const [pagos, { estudio, mensajes }, consentimiento, enviados, fotos] = await Promise.all([
    pagosDeCita(c.id),
    leerContenido(),
    consentimientoDeCita(c.id),
    seguimientosDeCita(c.id),
    fotosDeCita(c.id),
  ]);
  const nombre = (c.cliente ?? "").split(" ")[0];
  const cuando = `${fechaLarga(c.inicio)} a las ${hora(c.inicio)}`;
  const duracion = duracionTexto(minutosEntre(c.inicio, c.fin));
  const empezo = c.inicio <= ahoraChile();
  const hecha = c.estado === "completada";
  const activa = c.estado === "confirmada" || hecha;
  const manana = fechaRelativa(c.inicio).toLowerCase() === "mañana";

  const valores = {
    nombre,
    estudio: estudio.nombre,
    fecha: cuando,
    cuando: manana ? `de mañana a las ${hora(c.inicio)}` : `del ${cuando}`,
    duracion,
    direccion: `${estudio.direccion}, ${estudio.comuna}`,
    valor: c.precio != null ? clp(c.precio) : "",
    abono: c.pagado > 0 ? clp(c.pagado) : "",
    saldo: c.saldo != null && c.saldo > 0 ? clp(c.saldo) : "",
    cuidados: `${SITIO}/#cuidados`,
    link: estudio.resenas,
  };

  const conSeguimiento = hecha && c.telefono && (c.tipo === "tatuaje" || c.tipo === "retoque");
  const diasDesde = Math.round((Date.parse(hoyChile()) - Date.parse(c.inicio.slice(0, 10))) / 86_400_000);
  // Las alertas importan hasta que la sesión se hace; después quedan en el PDF.
  const alertas = activa && !hecha ? c.alertas : [];

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

      {alertas.length > 0 && (
        <section aria-label="Antes de empezar" className="mb-4 rounded-3xl border border-sangre/50 bg-sangre/[0.08] p-4 sm:p-5 lg:mb-5">
          <h2 className="text-[15px] font-semibold text-[#ff8a80]">Antes de empezar</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {alertas.map((a) => (
              <li key={a} className={`text-[16px] leading-snug ${esUrgente(a) ? "font-semibold text-piel" : "text-piel/85"}`}>
                {a}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start xl:gap-5">
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
                  <a href={whatsapp(c.telefono, rellenar(mensajes.confirmacion, valores))} target="_blank" rel="noopener noreferrer" className={claseBoton("cromo", "min-h-11 px-3 text-[14px]")}>
                    <IconoWhatsapp className="size-5 shrink-0" /> Confirmar
                  </a>
                  <a href={whatsapp(c.telefono, rellenar(mensajes.recordatorio, valores))} target="_blank" rel="noopener noreferrer" className={claseBoton("linea", "min-h-11 px-3 text-[14px]")}>
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
            <TituloBloque>Consentimiento</TituloBloque>
            <ConsentimientoCita citaId={c.id} resumen={consentimiento} telefono={c.telefono} activa={activa} hecha={hecha} />
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

          {hecha && (
            <Tarjeta>
              <TituloBloque>Después de la sesión</TituloBloque>
              <ul className="flex flex-col divide-y divide-linea/60">
                {conSeguimiento &&
                  c.telefono &&
                  ETAPAS.map((e) => {
                    const enviado = enviados[e.id];
                    const toca = diasDesde >= e.dia && diasDesde <= e.hasta;
                    const fecha = sumarDias(c.inicio.slice(0, 10), e.dia);
                    return (
                      <li key={e.id} className="flex min-h-14 items-center gap-3 py-2">
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{e.texto}</span>
                          <span className={`block text-[13px] ${toca && !enviado ? "text-stencil-claro" : "text-ceniza"}`}>
                            {enviado ? `Mandado el ${fechaCorta(enviado)}` : toca ? "Toca hoy" : diasDesde < e.dia ? `El ${fechaCorta(fecha)}` : "Ya pasó el momento"}
                          </span>
                        </span>
                        {enviado ? (
                          <Check className="size-5 text-[#6ee7b7]" />
                        ) : (
                          <BotonSeguimiento citaId={c.id} etapa={e.id} href={whatsapp(c.telefono!, rellenar(mensajes[e.id], valores))} enviado={false} toca={toca}>
                            Mandar
                          </BotonSeguimiento>
                        )}
                      </li>
                    );
                  })}
                {c.telefono && (
                  <li className="flex min-h-14 items-center gap-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">Reseña en Google</span>
                      <span className="block text-[13px] text-ceniza">
                        {enviados.resena ? `Pedida el ${fechaCorta(enviados.resena)}` : estudio.resenas ? "Si quedó contento, pídele una." : "Falta tu link de reseñas."}
                      </span>
                    </span>
                    {enviados.resena ? (
                      <Check className="size-5 text-[#6ee7b7]" />
                    ) : estudio.resenas ? (
                      <BotonSeguimiento citaId={c.id} etapa="resena" href={whatsapp(c.telefono, rellenar(mensajes.resena, valores))} enviado={false} toca={false}>
                        Pedir
                      </BotonSeguimiento>
                    ) : (
                      <Link href={`${PANEL}/web/estudio`} className={claseBoton("linea", "min-h-10 shrink-0 px-4 text-[13px]")}>
                        Agregarlo
                      </Link>
                    )}
                  </li>
                )}
                <li>
                  <FotoDeCita
                    cita={c.id}
                    fotos={fotos}
                    bloqueada={consentimiento?.estado === "firmado" && consentimiento.permite_fotos === false}
                    sinConsentimiento={consentimiento?.estado !== "firmado"}
                    inicial={{
                      alt: c.descripcion ?? "",
                      estilo: ESTILOS.find((e) => e.toLowerCase() === (nombreEstilo(c.estilo) ?? "").toLowerCase()) ?? (c.tipo === "laser" ? "Borrado láser" : undefined),
                      zona: nombreZona(c.zona) ?? undefined,
                    }}
                  />
                </li>
              </ul>
            </Tarjeta>
          )}

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
