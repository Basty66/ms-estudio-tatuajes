import Link from "next/link";
import { notFound } from "next/navigation";
import { EstadoCita, FilaPago, NuevoPago } from "@/componentes/panel/AccionesCita";
import { claseBoton } from "@/componentes/panel/Boton";
import { Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { Telefono } from "@/componentes/panel/Iconos";
import { IconoWhatsapp } from "@/componentes/sitio/WhatsappFlotante";
import { cita as leerCita, pagosDeCita } from "@/db/panel";
import { clp, ESTADO, nombreEstilo, nombreTamano, nombreZona, textoLado, TIPO } from "@/lib/admin/etiquetas";
import { duracionTexto, fechaLarga, fechaRelativa, hora, minutosEntre } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import { formatearTelefono } from "@/lib/admin/telefono";
import { ESTUDIO } from "@/lib/estudio";

export const dynamic = "force-dynamic";

const SITIO = "https://tatuajes-azure.vercel.app";

function whatsapp(telefono: string, mensaje: string) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

export default async function FichaCita({ params }: { params: Promise<{ id: string }> }) {
  await operadorDelPanel();
  const c = await leerCita(Number((await params).id) || 0);
  if (!c || c.tipo === "bloqueo") notFound();
  const pagos = await pagosDeCita(c.id);
  const nombre = (c.cliente ?? "").split(" ")[0];
  const cuando = `${fechaLarga(c.inicio)} a las ${hora(c.inicio)}`;
  const duracion = duracionTexto(minutosEntre(c.inicio, c.fin));

  const confirmacion = [
    `Hola ${nombre} 👋 Te confirmo tu hora en ${ESTUDIO.nombre}:`,
    "",
    `📅 ${cuando.charAt(0).toUpperCase() + cuando.slice(1)}`,
    `⏱️ Aprox. ${duracion}`,
    `📍 ${ESTUDIO.direccion}, ${ESTUDIO.comuna}`,
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
    `Hola ${nombre}, te recuerdo tu sesión ${fechaRelativa(c.inicio).toLowerCase() === "mañana" ? "de mañana" : `del ${cuando}`}${fechaRelativa(c.inicio).toLowerCase() === "mañana" ? ` a las ${hora(c.inicio)}` : ""} en ${ESTUDIO.direccion}, ${ESTUDIO.comuna}.`,
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

      <Tarjeta>
        <p className="text-[clamp(1.4rem,5vw,1.9rem)] leading-tight font-semibold first-letter:uppercase">{fechaRelativa(c.inicio)}</p>
        <p className="mt-1 text-[17px] tabular-nums">
          {hora(c.inicio)} a {hora(c.fin)} <span className="text-ceniza">· {duracion}</span>
        </p>
        {c.estado === "confirmada" && <p className="mt-1 text-[14px] text-ceniza first-letter:uppercase">{fechaLarga(c.inicio)}</p>}

        {c.telefono && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <a href={whatsapp(c.telefono, confirmacion)} target="_blank" rel="noopener noreferrer" className={claseBoton("cromo", "min-h-11 px-3 text-[14px]")}>
              <IconoWhatsapp className="size-5" /> Confirmar
            </a>
            <a href={whatsapp(c.telefono, recordatorio)} target="_blank" rel="noopener noreferrer" className={claseBoton("linea", "min-h-11 px-3 text-[14px]")}>
              <IconoWhatsapp className="size-5" /> Recordar
            </a>
          </div>
        )}
        <div className="mt-5 border-t border-linea pt-4">
          <EstadoCita id={c.id} estado={c.estado} />
        </div>
      </Tarjeta>

      <Tarjeta className="mt-4">
        <TituloBloque>Pagos</TituloBloque>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Monto texto="Valor" valor={c.precio != null ? clp(c.precio) : "—"} />
          <Monto texto="Pagado" valor={clp(c.pagado)} color="text-[#6ee7b7]" />
          <Monto texto="Saldo" valor={c.saldo != null ? clp(c.saldo) : "—"} color={c.saldo ? "text-[#fbbf24]" : ""} />
        </div>
        {c.precio == null && <p className="mt-3 text-[13px] text-ceniza">Sin precio acordado todavía: edita la cita para anotarlo y ver el saldo.</p>}
        {pagos.length > 0 && (
          <ul className="mt-4">
            {pagos.map((p) => (
              <FilaPago key={p.id} p={p} />
            ))}
          </ul>
        )}
        <div className="mt-4">
          <NuevoPago citaId={c.id} saldo={c.saldo} tieneAbono={pagos.some((p) => p.tipo === "abono")} />
        </div>
      </Tarjeta>

      <Tarjeta className="mt-4">
        <TituloBloque>El tatuaje</TituloBloque>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[15px]">
          <Dato t="Zona" v={c.zona ? `${nombreZona(c.zona)}${c.lado ? ` ${textoLado(c.lado)}` : ""}` : null} />
          <Dato t="Estilo" v={nombreEstilo(c.estilo)} />
          <Dato t="Tamaño" v={nombreTamano(c.tamano)} />
          <Dato t="Agendó" v={c.creada_por} />
          {c.descripcion && <Dato t="Diseño" v={c.descripcion} ancho />}
          {c.notas && <Dato t="Notas" v={c.notas} ancho />}
        </dl>
      </Tarjeta>

      <Tarjeta className="mt-4">
        <TituloBloque>Cliente</TituloBloque>
        <div className="flex items-center gap-3">
          <Link href={`${PANEL}/cliente/${c.cliente_id}`} className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{c.cliente}</span>
            <span className="block text-[14px] text-ceniza">{c.telefono ? formatearTelefono(c.telefono) : "Sin teléfono"} · ver historial</span>
          </Link>
          {c.telefono && (
            <a href={`tel:+${c.telefono}`} aria-label="Llamar" className="grid size-11 place-items-center rounded-full border border-linea text-ceniza hover:text-piel">
              <Telefono className="size-5" />
            </a>
          )}
        </div>
      </Tarjeta>
    </>
  );
}

function Monto({ texto, valor, color = "" }: { texto: string; valor: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-linea bg-tinta/50 p-3">
      <p className="text-[12px] text-ceniza">{texto}</p>
      <p className={`mt-0.5 truncate text-[17px] font-semibold tabular-nums ${color}`}>{valor}</p>
    </div>
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
