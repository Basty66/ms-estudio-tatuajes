"use client";

import { useState } from "react";
import { formatearTelefono } from "@/lib/admin/telefono";
import type { TextosConsentimiento } from "@/lib/consentimiento";
import { LARGO, LLAVES, rellenar, type DatosEstudio, type Mensajes, type Par, type TextosCuidados, type TextosTatuador } from "@/lib/contenido";
import { ESTILOS_PRECIO, estimar, OBJETIVOS_LASER, pesos, TAMANOS, ZONAS, type EstiloPrecio, type Precios, type Tamano, type Zona } from "@/lib/precios";
import { Tarjeta, TituloBloque } from "./Encabezado";
import { BarraGuardar, Campo, Lineas, ListaPares, useEditor } from "./EditorWeb";
import { TarjetaGracias } from "@/componentes/sitio/TarjetaGracias";
import { Boton } from "./Boton";
import { campo } from "./FormularioCita";
import { DobleVisto, Externo, Flecha } from "./Iconos";

// ------------------------------------------------------------- estudio --

export function EditarEstudio({ inicial }: { inicial: DatosEstudio }) {
  const e = useEditor("estudio", {
    whatsapp: formatearTelefono(inicial.whatsapp),
    instagram: inicial.instagram,
    direccion: inicial.direccion,
    comuna: inicial.comuna,
    resenas: inicial.resenas,
    responsable: inicial.responsable,
    correo: inicial.correo,
  });
  const poner = (p: Partial<typeof e.valor>) => e.cambiar({ ...e.valor, ...p });
  const numero = e.valor.whatsapp.replace(/\D/g, "");

  return (
    <>
      <div className="flex flex-col gap-4 lg:max-w-2xl">
        <Tarjeta>
          <TituloBloque>Contacto</TituloBloque>
          <div className="flex flex-col gap-4">
            <Campo etiqueta="WhatsApp" valor={e.valor.whatsapp} cambiar={(v) => poner({ whatsapp: v })} max={20} inputMode="tel" placeholder="+56 9 1234 5678" />
            <Campo etiqueta="Instagram" valor={e.valor.instagram} cambiar={(v) => poner({ instagram: v })} max={31} placeholder="matness_tattoos" />
            <p className="text-[13px] text-ceniza">
              Todos los botones de WhatsApp de la web van a este número.{" "}
              {numero.length >= 9 && (
                <a href={`https://wa.me/${numero.length === 9 ? `56${numero}` : numero}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-stencil-claro">
                  Probarlo <Externo className="size-3.5" />
                </a>
              )}
            </p>
          </div>
        </Tarjeta>
        <Tarjeta>
          <TituloBloque>Dónde queda</TituloBloque>
          <div className="flex flex-col gap-4">
            <Campo etiqueta="Dirección" valor={e.valor.direccion} cambiar={(v) => poner({ direccion: v })} max={80} />
            <Campo etiqueta="Comuna" valor={e.valor.comuna} cambiar={(v) => poner({ comuna: v })} max={40} />
            <p className="text-[13px] text-ceniza">Si cambias la dirección, el mapa de la web pasa a buscar la nueva.</p>
          </div>
        </Tarjeta>
        <Tarjeta>
          <TituloBloque>Reseñas en Google</TituloBloque>
          <div className="flex flex-col gap-4">
            <Campo etiqueta="Link para dejar una reseña" valor={e.valor.resenas} cambiar={(v) => poner({ resenas: v.trim() })} max={300} placeholder="https://g.page/r/…/review" inputMode="url" />
            <p className="text-[13px] leading-snug text-ceniza">
              Sale de tu Perfil de Empresa en Google: abre Google Maps, entra a tu negocio y toca <span className="text-piel">Pedir reseñas</span> para copiar el link. Con él, cada cita hecha ofrece pedirle una reseña al cliente.{" "}
              {e.valor.resenas && (
                <a href={e.valor.resenas} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-stencil-claro">
                  Probarlo <Externo className="size-3.5" />
                </a>
              )}
            </p>
          </div>
        </Tarjeta>
        <Tarjeta>
          <TituloBloque>Quién cuida los datos</TituloBloque>
          <div className="flex flex-col gap-4">
            <Campo etiqueta="Nombre del responsable" valor={e.valor.responsable} cambiar={(v) => poner({ responsable: v })} max={80} placeholder="MS Estudio de Tatuajes" />
            <Campo etiqueta="Correo (opcional)" valor={e.valor.correo} cambiar={(v) => poner({ correo: v.trim() })} max={120} placeholder="contacto@…" inputMode="email" />
            <p className="text-[13px] leading-snug text-ceniza">Aparece en el consentimiento y en la página de privacidad. Puede ser tu nombre o el del estudio.</p>
          </div>
        </Tarjeta>
      </div>
      <BarraGuardar {...e} />
    </>
  );
}

// ------------------------------------------------------------- precios --

function Monto({ valor, cambiar, etiqueta, sufijo }: { valor: number; cambiar: (n: number) => void; etiqueta: string; sufijo?: string }) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{etiqueta}</span>
      {!sufijo && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ceniza">$</span>}
      <input
        inputMode="numeric"
        value={sufijo ? String(valor) : valor.toLocaleString("es-CL")}
        onChange={(ev) => cambiar(Number(ev.target.value.replace(/\D/g, "").slice(0, 8)) || 0)}
        className={`${campo} min-h-11 text-right tabular-nums ${sufijo ? "pr-8" : "pl-7"}`}
      />
      {sufijo && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ceniza">{sufijo}</span>}
    </label>
  );
}

export function EditarPrecios({ inicial }: { inicial: Precios }) {
  const e = useEditor("precios", inicial);
  const p = e.valor;
  const [prueba, setPrueba] = useState<{ tamano: Tamano; estilo: EstiloPrecio; zona: Zona }>({ tamano: "mediano", estilo: "fineline", zona: "antebrazo" });
  const rango = estimar(p, prueba.tamano, prueba.estilo, prueba.zona);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start xl:gap-5">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Tarjeta className="border-stencil/40">
            <TituloBloque>Probar</TituloBloque>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  ["tamano", TAMANOS],
                  ["estilo", ESTILOS_PRECIO],
                  ["zona", ZONAS],
                ] as const
              ).map(([k, lista]) => (
                <select
                  key={k}
                  aria-label={k}
                  value={prueba[k]}
                  onChange={(ev) => setPrueba({ ...prueba, [k]: ev.target.value })}
                  className={`${campo} min-h-11 px-2 text-[14px] [color-scheme:dark]`}
                >
                  {lista.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nombre}
                    </option>
                  ))}
                </select>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-ceniza">La web muestra:</p>
            <p className="text-[24px] font-semibold tabular-nums">
              {pesos(rango.min)} a {pesos(rango.max)}
            </p>
          </Tarjeta>

          <Tarjeta>
            <TituloBloque>Tamaño: desde y hasta</TituloBloque>
            <ul className="flex flex-col gap-3">
              {TAMANOS.map((t) => (
                <li key={t.id} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_7.5rem]">
                  <span className="col-span-2 min-w-0 leading-tight sm:col-span-1">
                    <span className="block truncate font-semibold">{t.nombre}</span>
                    <span className="block text-[12px] text-ceniza">{t.detalle}</span>
                  </span>
                  <Monto etiqueta={`${t.nombre} desde`} valor={p.tamanos[t.id].min} cambiar={(n) => e.cambiar({ ...p, tamanos: { ...p.tamanos, [t.id]: { ...p.tamanos[t.id], min: n } } })} />
                  <Monto etiqueta={`${t.nombre} hasta`} valor={p.tamanos[t.id].max} cambiar={(n) => e.cambiar({ ...p, tamanos: { ...p.tamanos, [t.id]: { ...p.tamanos[t.id], max: n } } })} />
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta>
            <TituloBloque>Recargo por estilo</TituloBloque>
            <ul className="flex flex-col gap-3">
              {ESTILOS_PRECIO.map((x) => (
                <li key={x.id} className="grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-2">
                  <span className="font-semibold">{x.nombre}</span>
                  <Monto etiqueta={`Recargo ${x.nombre}`} valor={p.estilos[x.id]} cambiar={(n) => e.cambiar({ ...p, estilos: { ...p.estilos, [x.id]: n } })} />
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta>
            <TituloBloque>Borrado láser</TituloBloque>
            <p className="-mt-1 mb-3 text-[13px] text-ceniza">Precio de una sesión según el tamaño del tatuaje. La zona no lo cambia.</p>
            <ul className="flex flex-col gap-3">
              {TAMANOS.map((t) => (
                <li key={t.id} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_7.5rem]">
                  <span className="col-span-2 min-w-0 leading-tight sm:col-span-1">
                    <span className="block truncate font-semibold">{t.nombre}</span>
                    <span className="block text-[12px] text-ceniza">{t.detalle}</span>
                  </span>
                  <Monto etiqueta={`Láser ${t.nombre} desde`} valor={p.laser.tamanos[t.id].min} cambiar={(n) => e.cambiar({ ...p, laser: { ...p.laser, tamanos: { ...p.laser.tamanos, [t.id]: { ...p.laser.tamanos[t.id], min: n } } } })} />
                  <Monto etiqueta={`Láser ${t.nombre} hasta`} valor={p.laser.tamanos[t.id].max} cambiar={(n) => e.cambiar({ ...p, laser: { ...p.laser, tamanos: { ...p.laser.tamanos, [t.id]: { ...p.laser.tamanos[t.id], max: n } } } })} />
                </li>
              ))}
            </ul>
            <p className="mt-5 mb-3 text-[13px] text-ceniza">Cuántas sesiones calcula la web:</p>
            <ul className="flex flex-col gap-3">
              {OBJETIVOS_LASER.map((o) => (
                <li key={o.id} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_6rem_6rem]">
                  <span className="col-span-2 min-w-0 truncate font-semibold sm:col-span-1">{o.nombre}</span>
                  <Monto etiqueta={`${o.nombre}: sesiones desde`} sufijo="ses." valor={p.laser.sesiones[o.id].min} cambiar={(n) => e.cambiar({ ...p, laser: { ...p.laser, sesiones: { ...p.laser.sesiones, [o.id]: { ...p.laser.sesiones[o.id], min: Math.min(30, n) } } } })} />
                  <Monto etiqueta={`${o.nombre}: sesiones hasta`} sufijo="ses." valor={p.laser.sesiones[o.id].max} cambiar={(n) => e.cambiar({ ...p, laser: { ...p.laser, sesiones: { ...p.laser.sesiones, [o.id]: { ...p.laser.sesiones[o.id], max: Math.min(30, n) } } } })} />
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>

        <Tarjeta>
          <TituloBloque>Recargo por zona</TituloBloque>
          <p className="-mt-1 mb-3 text-[13px] text-ceniza">Piel fina, hueso cerca o mucho movimiento. 10 % = el rango sube un 10 %.</p>
          <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {[...ZONAS]
              .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
              .map((z) => (
                <li key={z.id} className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-2">
                  <span className="truncate">{z.nombre}</span>
                  <Monto etiqueta={`Recargo ${z.nombre}`} sufijo="%" valor={p.zonas[z.id]} cambiar={(n) => e.cambiar({ ...p, zonas: { ...p.zonas, [z.id]: Math.min(300, n) } })} />
                </li>
              ))}
          </ul>
        </Tarjeta>
      </div>
      <BarraGuardar {...e} />
    </>
  );
}

// ------------------------------------------------------------ tatuador --

export function EditarTatuador({ inicial }: { inicial: TextosTatuador }) {
  const e = useEditor("tatuador", inicial);
  const t = e.valor;
  const poner = (p: Partial<TextosTatuador>) => e.cambiar({ ...t, ...p });

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start xl:gap-5">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Tarjeta>
            <TituloBloque>Presentación</TituloBloque>
            <Campo etiqueta="La frase grande" valor={t.frase} cambiar={(v) => poner({ frase: v })} max={LARGO.frase} lineas={5} />
          </Tarjeta>
          <Tarjeta>
            <TituloBloque>Tres datos</TituloBloque>
            <ListaPares valor={t.datos} cambiar={(datos) => poner({ datos })} rotulos={["Dato", "Detalle"]} largos={[LARGO.titulo, LARGO.item]} fijos />
          </Tarjeta>
          <Tarjeta>
            <TituloBloque>Especialidades</TituloBloque>
            <Lineas etiqueta="Estilos" valor={t.especialidades} cambiar={(especialidades) => poner({ especialidades })} max={LARGO.titulo} />
          </Tarjeta>
        </div>
        <div className="flex flex-col gap-4 lg:gap-5">
          <Tarjeta>
            <TituloBloque>Cómo trabajo</TituloBloque>
            <ListaPares valor={t.lugar} cambiar={(lugar) => poner({ lugar })} rotulos={["Dato", "Detalle"]} largos={[LARGO.titulo, LARGO.item]} fijos />
          </Tarjeta>
        </div>
      </div>
      <BarraGuardar {...e} />
    </>
  );
}

// ----------------------------------------------------------- preguntas --

export function EditarPreguntas({ inicial }: { inicial: Par[] }) {
  const e = useEditor("preguntas", inicial);
  return (
    <>
      <div className="lg:max-w-2xl">
        <ListaPares valor={e.valor} cambiar={e.cambiar} rotulos={["Pregunta", "Respuesta"]} largos={[120, 800]} tope={20} />
      </div>
      <BarraGuardar {...e} />
    </>
  );
}

// ------------------------------------------------------------ cuidados --

export function EditarCuidados({ inicial }: { inicial: TextosCuidados }) {
  const e = useEditor("cuidados", inicial);
  const c = e.valor;
  const etapa = (i: number, p: Partial<TextosCuidados["etapas"][number]>) => e.cambiar({ ...c, etapas: c.etapas.map((x, j) => (j === i ? { ...x, ...p } : x)) });

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start xl:gap-5">
        <ol className="flex flex-col gap-4 lg:gap-5">
          {c.etapas.map((x, i) => (
            <li key={i}>
              <Tarjeta>
                <TituloBloque>Etapa {i + 1}</TituloBloque>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
                    <Campo etiqueta="Cuándo" valor={x.cuando} cambiar={(v) => etapa(i, { cuando: v })} max={LARGO.titulo} />
                    <Campo etiqueta="Corto" valor={x.corto} cambiar={(v) => etapa(i, { corto: v })} max={14} />
                  </div>
                  <Lineas etiqueta="Pasos" valor={x.pasos} cambiar={(pasos) => etapa(i, { pasos })} />
                </div>
              </Tarjeta>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-4 lg:gap-5">
          <Tarjeta>
            <TituloBloque>Evitar hasta que sane</TituloBloque>
            <Lineas etiqueta="Cosas a evitar" valor={c.evitar} cambiar={(evitar) => e.cambiar({ ...c, evitar })} />
          </Tarjeta>
          <Tarjeta>
            <TituloBloque>Escribir de inmediato si hay</TituloBloque>
            <Lineas etiqueta="Señales de alerta" valor={c.alertas} cambiar={(alertas) => e.cambiar({ ...c, alertas })} />
          </Tarjeta>
          <p className="px-1 text-[13px] text-ceniza">Las etapas son cuatro porque la web las dibuja como un recorrido de cuatro puntos.</p>
        </div>
      </div>
      <BarraGuardar {...e} />
    </>
  );
}

// ------------------------------------------------------ consentimiento --

export function EditarConsentimiento({ inicial }: { inicial: TextosConsentimiento }) {
  const e = useEditor("consentimiento", inicial);
  const c = e.valor;
  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start xl:gap-5">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Tarjeta>
            <TituloBloque>Riesgos del tatuaje</TituloBloque>
            <Lineas etiqueta="Uno por línea" nota="También para retoques" valor={c.riesgosTatuaje} cambiar={(riesgosTatuaje) => e.cambiar({ ...c, riesgosTatuaje })} max={200} />
          </Tarjeta>
          <Tarjeta>
            <TituloBloque>Riesgos del láser</TituloBloque>
            <Lineas etiqueta="Uno por línea" valor={c.riesgosLaser} cambiar={(riesgosLaser) => e.cambiar({ ...c, riesgosLaser })} max={200} />
          </Tarjeta>
        </div>
        <div className="flex flex-col gap-4 lg:gap-5">
          <Tarjeta>
            <TituloBloque>A qué se compromete</TituloBloque>
            <Lineas etiqueta="Uno por línea" valor={c.compromisos} cambiar={(compromisos) => e.cambiar({ ...c, compromisos })} max={200} />
          </Tarjeta>
          <div className="px-1 text-[13px] leading-relaxed text-ceniza">
            <p>Lo ya firmado no cambia: cada consentimiento guarda el texto exacto que aceptó la persona.</p>
            <p className="mt-2">
              Las preguntas de salud y las declaraciones (veracidad, datos personales y fotos) son fijas: están escritas para cumplir la ley de datos personales.
            </p>
          </div>
        </div>
      </div>
      <BarraGuardar {...e} />
    </>
  );
}

// ------------------------------------------------------------ mensajes --

const MENSAJES: Array<{ clave: keyof Mensajes; titulo: string; cuando: string }> = [
  { clave: "confirmacion", titulo: "Confirmar la hora", cuando: "Botón Confirmar de la cita, antes de la sesión." },
  { clave: "recordatorio", titulo: "Recordar la hora", cuando: "Botón Recordar de la cita, el día antes." },
  { clave: "respuestaCotizacion", titulo: "Responder una cotización", cuando: "Botón Responder en Cotizaciones: al abrir WhatsApp eliges el chat." },
  { clave: "consentimiento", titulo: "Pedir el consentimiento", cuando: "Con el link para firmar. Tiene que llevar {link}." },
  { clave: "dia1", titulo: "Cuidados: día siguiente", cuando: "Aparece en Hoy el día después de un tatuaje." },
  { clave: "dia7", titulo: "Cuidados: una semana", cuando: "Aparece en Hoy a los 7 días." },
  { clave: "dia30", titulo: "Cuidados: un mes", cuando: "Aparece en Hoy a los 30 días." },
  { clave: "laser1", titulo: "Láser: día siguiente", cuando: "Aparece en Hoy el día después de una sesión de láser." },
  { clave: "laserProxima", titulo: "Láser: próxima sesión", cuando: "Aparece en Hoy a las seis semanas, para volver a agendar." },
  { clave: "resena", titulo: "Pedir una reseña", cuando: "En la cita hecha, con tu link de Google. Tiene que llevar {link}." },
  { clave: "reservaRechazada", titulo: "No puedo esa hora", cuando: "Al rechazar una hora pedida desde la web. {link} lleva al calendario." },
];

/** Lo que se ve en la vista previa: una cita inventada pero creíble. */
const MUESTRA: Record<string, string> = {
  codigo: "MS-K7Q2",
  detalle: "mediano en antebrazo derecho, fineline",
  rango: "$50.000 a $90.000",
  nombre: "Camila",
  estudio: "Matness",
  fecha: "jueves 20 de noviembre a las 15:00",
  cuando: "de mañana a las 15:00",
  duracion: "3 h",
  direccion: "Av. Manso 529, segundo piso, Melipilla",
  valor: "$80.000",
  abono: "$20.000",
  saldo: "$60.000",
  cuidados: "tatuajes-azure.vercel.app/#cuidados",
};

/** *negrita*, _cursiva_ y ~tachado~, como los muestra WhatsApp. */
function formatoWhatsapp(texto: string): React.ReactNode[] {
  return texto.split(/(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g).map((parte, i) => {
    const dentro = parte.slice(1, -1);
    if (/^\*[^*\n]+\*$/.test(parte)) return <strong key={i}>{dentro}</strong>;
    if (/^_[^_\n]+_$/.test(parte)) return <em key={i}>{dentro}</em>;
    if (/^~[^~\n]+~$/.test(parte)) return <s key={i}>{dentro}</s>;
    return parte;
  });
}

/** Un globo de WhatsApp: así lo va a leer el cliente. */
export function GloboWhatsapp({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-[#0b141a] p-3 [background-image:radial-gradient(rgb(255_255_255/0.035)_1px,transparent_1px)] [background-size:14px_14px]">
      <div className="relative ml-auto max-w-[88%] rounded-xl rounded-tr-sm bg-[#005c4b] px-3 pt-2 pb-5 text-[14.5px] leading-[1.35] whitespace-pre-wrap text-[#e9edef] [overflow-wrap:anywhere]">
        {texto ? formatoWhatsapp(texto) : <span className="text-[#e9edef]/50">Mensaje vacío</span>}
        <span className="absolute right-2 bottom-1 flex items-center gap-1 text-[11px] text-[#e9edef]/60">
          15:02 <DobleVisto className="size-3.5 text-[#53bdeb]" />
        </span>
      </div>
    </div>
  );
}

export function EditarMensajes({ inicial, resenas, origen }: { inicial: Mensajes; resenas: string; origen: string }) {
  const e = useEditor("mensajes", inicial);
  const m = e.valor;
  // Uno abierto a la vez: así la pantalla no se llena de cuadros de texto.
  const [abierto, setAbierto] = useState<keyof Mensajes | null>("confirmacion");
  const [repetir, setRepetir] = useState(0);
  const valores = (clave: keyof Mensajes) => ({
    ...MUESTRA,
    cuidados: `${origen}/#cuidados`,
    link: clave === "resena" ? resenas || "https://g.page/r/tu-link/review" : clave === "reservaRechazada" ? `${origen}/#cotiza` : `${origen}/consentimiento/8fK2…`,
  });

  return (
    <>
      <p className="mb-4 max-w-2xl text-[13px] leading-relaxed text-ceniza">
        Las palabras entre llaves, como <code className="rounded bg-tinta px-1 text-stencil-claro">{"{nombre}"}</code>, se cambian por los datos de cada cita. Si una línea lleva un dato que no hay (por ejemplo, sin abono), esa línea no se manda. Para negrita en WhatsApp, entre asteriscos: <code className="rounded bg-tinta px-1 text-stencil-claro">*así*</code>.
      </p>
      <ul className="flex flex-col overflow-hidden rounded-3xl border border-linea bg-hollin/70">
        {MENSAJES.map(({ clave, titulo, cuando }) => {
          const abiertoEste = abierto === clave;
          const texto = rellenar(m[clave], valores(clave));
          return (
            <li key={clave} className="border-b border-linea/70 last:border-0">
              <button
                type="button"
                aria-expanded={abiertoEste}
                onClick={() => setAbierto(abiertoEste ? null : clave)}
                className="flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-tinta/40 sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{titulo}</span>
                  <span className="block truncate text-[13px] text-ceniza">{abiertoEste ? cuando : texto.split("\n")[0]}</span>
                </span>
                <Flecha className={`size-4 shrink-0 text-ceniza transition-transform duration-300 ${abiertoEste ? "rotate-90" : ""}`} />
              </button>
              {abiertoEste && (
                <div className="panel-surge grid grid-cols-1 gap-4 px-4 pb-5 sm:px-5 xl:grid-cols-2 xl:gap-6">
                  <div className="min-w-0">
                    <Campo etiqueta="Mensaje" valor={m[clave]} cambiar={(v) => e.cambiar({ ...m, [clave]: v })} max={800} lineas={clave === "confirmacion" ? 12 : 5} />
                    <p className="mt-2 flex flex-wrap gap-1.5 text-[12px] text-ceniza">
                      {LLAVES[clave].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => e.cambiar({ ...m, [clave]: `${m[clave]}${m[clave].endsWith(" ") || m[clave].endsWith("\n") || !m[clave] ? "" : " "}{${k}}` })}
                          className="rounded-full border border-linea px-2.5 py-1 font-mono text-stencil-claro transition-colors hover:border-stencil/60"
                        >
                          {`{${k}}`}
                        </button>
                      ))}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-2 text-[12px] font-semibold tracking-[0.14em] text-ceniza uppercase">Así le llega</p>
                    <GloboWhatsapp texto={texto} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <section className="mt-6 rounded-3xl border border-linea bg-hollin/70 p-4 sm:p-5">
        <h2 className="font-semibold">Tarjeta de gracias en la web</h2>
        <p className="mt-0.5 mb-4 text-[13px] text-ceniza">Aparece cuando alguien cotiza y toca Pedir hora. El código también va en su WhatsApp y en Cotizaciones.</p>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-center">
          <div className="flex min-w-0 flex-col gap-4">
            <Campo etiqueta="Título" valor={m.graciasTitulo} cambiar={(v) => e.cambiar({ ...m, graciasTitulo: v })} max={60} />
            <Campo etiqueta="Nota" valor={m.graciasNota} cambiar={(v) => e.cambiar({ ...m, graciasNota: v })} max={160} lineas={3} />
          </div>
          <div className="flex flex-col items-center gap-4 overflow-hidden py-8">
            <TarjetaGracias
              key={repetir}
              datos={{ codigo: "MS-K7Q2", titulo: m.graciasTitulo, nota: m.graciasNota, rango: "$50.000 a $90.000", extra: "", detalle: "Mediano · antebrazo (lado izquierdo) · fineline" }}
            />
            <Boton variante="linea" onClick={() => setRepetir((n) => n + 1)} className="min-h-10 px-4 text-[13px]">
              Ver la animación de nuevo
            </Boton>
          </div>
        </div>
      </section>
      <BarraGuardar {...e} />
    </>
  );
}
