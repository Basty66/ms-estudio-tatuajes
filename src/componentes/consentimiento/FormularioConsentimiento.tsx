"use client";

import { useEffect, useRef, useState } from "react";
import { normalizarTelefono } from "@/lib/admin/telefono";
import {
  edad,
  EDAD_MINIMA,
  MAYORIA_DE_EDAD,
  normalizarRut,
  RELACIONES,
  type Firma as DatosFirma,
  type PreguntaSalud,
  type Representante,
  type TextoAceptado,
} from "@/lib/consentimiento";
import { Firma, type ManejoFirma } from "./Firma";

/**
 * El consentimiento, del lado del cliente: cuatro pasos cortos (datos, salud,
 * lo que acepta y firma), pensados para hacerse con una mano en el navegador
 * de WhatsApp. Una sola acción por pantalla, siempre a la vista abajo.
 *
 * Lo escrito se guarda en este navegador mientras se llena (sin la firma): si
 * WhatsApp recarga la página al volver de otra app, no se pierde nada. Se
 * borra al firmar.
 */
type Props = {
  token: string;
  /** Vista previa del panel: se recorre igual, pero no se guarda ni se envía nada. */
  muestra?: boolean;
  /** En la vista previa se parte donde están los textos que se editan. */
  pasoInicial?: number;
  enEstudio: boolean;
  volver: string | null;
  hoy: string;
  cuando: string;
  detalle: string;
  nombre: string;
  telefono: string;
  texto: TextoAceptado;
  preguntas: PreguntaSalud[];
  estudio: { nombre: string; whatsapp: string };
};

type Respuesta = { si: boolean | null; detalle: string };
type Borrador = {
  paso: number;
  nombre: string;
  rut: string;
  nacimiento: string;
  telefono: string;
  rep: { relacion: Representante["relacion"] | ""; nombre: string; rut: string };
  salud: Record<string, Respuesta>;
  otras: string;
  acepta: { acepto: boolean; datos: boolean; representante: boolean; fotos: boolean };
};

const PASOS = ["Tus datos", "Tu salud", "Lo que aceptas", "Firma"] as const;

const campo =
  "min-h-13 w-full min-w-0 rounded-2xl border border-linea bg-tinta/80 px-4 text-[17px] text-piel placeholder:text-ceniza/50 transition-[border-color,box-shadow] duration-200 focus:border-stencil focus:shadow-[0_0_0_4px_rgba(47,107,255,0.18)] focus:outline-none aria-[invalid=true]:border-[#ff8a80]";

/** "123456785" → "12.345.678-5", mientras se escribe. */
function rutMientras(v: string): string {
  const l = v.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
  if (l.length < 2) return l;
  const cuerpo = l.slice(0, -1).replace(/\D/g, "");
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${l.slice(-1)}`;
}

/** "20031998" → "20/03/1998", mientras se escribe. */
function fechaMientras(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join("/");
}

/** "20/03/1998" → "1998-03-20", o null si la fecha no existe. */
function fechaIso(v: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return null;
  const [, d, mes, a] = m;
  const f = new Date(Number(a), Number(mes) - 1, Number(d));
  if (f.getFullYear() !== Number(a) || f.getMonth() !== Number(mes) - 1 || f.getDate() !== Number(d)) return null;
  return `${a}-${mes}-${d}`;
}

export function FormularioConsentimiento(p: Props) {
  const clave = `consentimiento:${p.token.slice(0, 16)}`;
  const vacio: Borrador = {
    paso: p.pasoInicial ?? 0,
    nombre: p.nombre,
    rut: "",
    nacimiento: "",
    telefono: p.telefono,
    rep: { relacion: "", nombre: "", rut: "" },
    salud: Object.fromEntries(p.preguntas.map((q) => [q.id, { si: null, detalle: "" }])),
    otras: "",
    acepta: { acepto: false, datos: false, representante: false, fotos: false },
  };
  const [b, setB] = useState<Borrador>(vacio);
  const [error, setError] = useState<{ texto: string; campo?: string } | null>(null);
  const [hayFirma, setHayFirma] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<{ url: string; archivo: string } | null>(null);
  // Hacia dónde se movió: la pantalla nueva entra desde ese lado.
  const [direccion, setDireccion] = useState<"adelante" | "atras">("adelante");
  const firma = useRef<ManejoFirma>(null);
  const arriba = useRef<HTMLDivElement>(null);

  // Retomar lo que quedó a medias en este navegador.
  useEffect(() => {
    if (p.muestra) return;
    try {
      const guardado = sessionStorage.getItem(clave);
      if (guardado) {
        const g = JSON.parse(guardado) as Borrador;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una sola vez al montar
        setB({ ...vacio, ...g, salud: { ...vacio.salud, ...g.salud }, acepta: { ...vacio.acepta, ...g.acepta }, paso: Math.min(g.paso, 2) });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (listo || p.muestra) return;
    try {
      sessionStorage.setItem(clave, JSON.stringify(b));
    } catch {}
  }, [b, clave, listo, p.muestra]);

  const poner = (cambio: Partial<Borrador>) => {
    setB((x) => ({ ...x, ...cambio }));
    setError(null);
  };

  const nac = fechaIso(b.nacimiento);
  const anios = nac ? edad(nac, p.hoy) : null;
  const menor = anios !== null && anios < MAYORIA_DE_EDAD;
  const muyChico = anios !== null && anios < EDAD_MINIMA;
  const relacion = RELACIONES.find((r) => r.id === b.rep.relacion)?.texto.toLowerCase();

  /** El primer problema del paso, con el campo al que hay que ir. */
  function revisar(paso: number): { texto: string; campo?: string } | null {
    if (paso === 0) {
      if (b.nombre.trim().length < 3) return { texto: "Escribe tu nombre completo.", campo: "nombre" };
      if (!normalizarRut(b.rut)) return { texto: "Revisa el RUT: el dígito verificador no calza.", campo: "rut" };
      if (!nac || nac >= p.hoy || (anios ?? 0) > 110) return { texto: "Revisa tu fecha de nacimiento (día/mes/año).", campo: "nacimiento" };
      if (muyChico) return { texto: `El estudio tatúa desde los ${EDAD_MINIMA} años.`, campo: "nacimiento" };
      if (!normalizarTelefono(b.telefono)) return { texto: "Revisa tu teléfono. Ej.: 9 1234 5678.", campo: "telefono" };
      if (menor) {
        if (!b.rep.relacion) return { texto: "Elige quién te representa.", campo: "relacion" };
        if (b.rep.nombre.trim().length < 3) return { texto: `Escribe el nombre de tu ${relacion}.`, campo: "rep-nombre" };
        const rr = normalizarRut(b.rep.rut);
        if (!rr) return { texto: `Revisa el RUT de tu ${relacion}.`, campo: "rep-rut" };
        if (rr === normalizarRut(b.rut)) return { texto: "El RUT de tu representante no puede ser el tuyo.", campo: "rep-rut" };
      }
    }
    if (paso === 1) {
      const falta = p.preguntas.find((q) => b.salud[q.id]?.si === null);
      if (falta) return { texto: "Contesta Sí o No en cada pregunta.", campo: `p-${falta.id}` };
      const sinDetalle = p.preguntas.find((q) => q.detalle && b.salud[q.id]?.si && !b.salud[q.id].detalle.trim());
      if (sinDetalle) return { texto: `Cuéntanos ${sinDetalle.detalle?.toLowerCase()}`, campo: `d-${sinDetalle.id}` };
    }
    if (paso === 2) {
      const a = b.acepta;
      if (!a.acepto) return { texto: "Para seguir, marca que aceptas los riesgos y los compromisos.", campo: "a-acepto" };
      if (menor && !a.representante) return { texto: `Tu ${relacion} tiene que aceptar que te autoriza.`, campo: "a-representante" };
      if (!a.datos) return { texto: "Sin tu autorización para guardar los datos no se puede registrar.", campo: "a-datos" };
    }
    if (paso === 3 && !hayFirma) return { texto: "Firma en el recuadro." };
    return null;
  }

  function seguir() {
    const problema = revisar(b.paso);
    if (problema) {
      setError(problema);
      if (problema.campo) document.getElementById(problema.campo)?.focus();
      if (problema.campo) document.getElementById(problema.campo)?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (b.paso < 3) {
      setDireccion("adelante");
      poner({ paso: b.paso + 1 });
      requestAnimationFrame(() => arriba.current?.scrollIntoView({ block: "start" }));
      return;
    }
    void enviar();
  }

  async function enviar() {
    const png = firma.current?.exportar();
    if (!png) return setError({ texto: "La firma quedó muy corta. Firma de nuevo en el recuadro." });
    if (p.muestra) return setError({ texto: "Es la vista previa: acá el cliente enviaría su firma." });
    const cuerpo: DatosFirma & { token: string; estudio: boolean } = {
      token: p.token,
      estudio: p.enEstudio,
      datos: {
        nombre: b.nombre,
        rut: b.rut,
        nacimiento: nac ?? "",
        telefono: b.telefono,
        representante: menor ? { nombre: b.rep.nombre, rut: b.rep.rut, relacion: b.rep.relacion as Representante["relacion"] } : null,
      },
      salud: {
        respuestas: Object.fromEntries(p.preguntas.map((q) => [q.id, { si: Boolean(b.salud[q.id]?.si), detalle: b.salud[q.id]?.detalle }])),
        otras: b.otras,
      },
      acepta: { acepto: b.acepta.acepto, datos: b.acepta.datos, representante: b.acepta.representante },
      permiteFotos: b.acepta.fotos,
      firma: png,
    };
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/consentimiento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
      if (!r.ok) {
        const j = (await r.json().catch(() => null)) as { error?: string } | null;
        return setError({ texto: j?.error ?? "No se pudo enviar. Revisa tu conexión y vuelve a intentarlo." });
      }
      const pdf = await r.blob();
      const archivo = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") ?? "")?.[1] ?? "consentimiento.pdf";
      try {
        sessionStorage.removeItem(clave);
      } catch {}
      setListo({ url: URL.createObjectURL(pdf), archivo });
      window.scrollTo({ top: 0 });
    } catch {
      setError({ texto: "No hubo conexión. Revisa la señal y vuelve a intentarlo: lo que escribiste sigue acá." });
    } finally {
      setEnviando(false);
    }
  }

  if (listo) return <Listo {...p} url={listo.url} archivo={listo.archivo} nombre={b.nombre.split(" ")[0]} />;

  const marcarSalud = (id: string, r: Partial<Respuesta>) => poner({ salud: { ...b.salud, [id]: { ...b.salud[id], ...r } } });
  const aceptar = (k: keyof Borrador["acepta"]) => (v: boolean) => poner({ acepta: { ...b.acepta, [k]: v } });
  const invalido = (c: string) => error?.campo === c || undefined;

  return (
    <div ref={arriba} className="scroll-mt-4">
      <Encabezado paso={b.paso} />

      <section key={b.paso} className={`mt-10 ${direccion === "adelante" ? "paso-adelante" : "paso-atras"}`} aria-labelledby="titulo-paso">
        {b.paso === 0 && (
          <>
            <h1 id="titulo-paso" className="font-gotica text-[clamp(2.75rem,12vw,4.25rem)] leading-[0.92]">
              Consentimiento
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-piel/90">
              {p.cuando}
              <span className="block text-ceniza">{p.detalle}</span>
            </p>
            <p className="mt-6 max-w-[34rem] text-[15px] leading-relaxed text-ceniza">
              Antes de la sesión necesito saber unas cosas de tu salud y que aceptes los riesgos. Son dos minutos, y lo que respondas solo lo ve el estudio.
            </p>

            <div className="mt-10 flex flex-col gap-6">
              <Campo id="nombre" rotulo="Nombre completo">
                <input id="nombre" value={b.nombre} onChange={(e) => poner({ nombre: e.target.value.slice(0, 80) })} autoComplete="name" className={campo} aria-invalid={invalido("nombre")} />
              </Campo>
              <div className="grid gap-6 sm:grid-cols-2">
                <Campo id="rut" rotulo="RUT">
                  <input id="rut" value={b.rut} onChange={(e) => poner({ rut: rutMientras(e.target.value) })} placeholder="12.345.678-5" inputMode="text" autoCapitalize="characters" className={`${campo} tabular-nums`} aria-invalid={invalido("rut")} />
                </Campo>
                <Campo id="nacimiento" rotulo="Fecha de nacimiento">
                  <input id="nacimiento" value={b.nacimiento} onChange={(e) => poner({ nacimiento: fechaMientras(e.target.value) })} placeholder="día/mes/año" inputMode="numeric" autoComplete="bday" className={`${campo} tabular-nums`} aria-invalid={invalido("nacimiento")} />
                </Campo>
              </div>
              <Campo id="telefono" rotulo="Teléfono">
                <input id="telefono" value={b.telefono} onChange={(e) => poner({ telefono: e.target.value.slice(0, 20) })} placeholder="+56 9 1234 5678" inputMode="tel" autoComplete="tel" className={`${campo} tabular-nums`} aria-invalid={invalido("telefono")} />
              </Campo>
            </div>

            {menor && !muyChico && (
              <div className="panel-surge mt-10 border-t border-linea pt-8">
                <h2 className="text-[20px] font-semibold">Tienes {anios} años</h2>
                <p className="mt-2 max-w-[34rem] text-[15px] leading-relaxed text-ceniza">
                  Tu madre, padre o tutor legal tiene que autorizarte, firmar este consentimiento y acompañarte durante toda la sesión.
                </p>
                <div className="mt-6 flex flex-col gap-6">
                  <fieldset>
                    <legend className="mb-2.5 text-[15px] font-semibold">Quién te representa</legend>
                    <div id="relacion" tabIndex={-1} className="flex flex-wrap gap-2 outline-none">
                      {RELACIONES.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          aria-pressed={b.rep.relacion === r.id}
                          onClick={() => poner({ rep: { ...b.rep, relacion: r.id } })}
                          className={`min-h-11 rounded-full border px-5 text-[15px] font-semibold transition-colors ${
                            b.rep.relacion === r.id ? "border-stencil bg-stencil/20 text-piel" : "border-linea text-ceniza hover:text-piel"
                          }`}
                        >
                          {r.texto}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Campo id="rep-nombre" rotulo="Su nombre completo">
                      <input id="rep-nombre" value={b.rep.nombre} onChange={(e) => poner({ rep: { ...b.rep, nombre: e.target.value.slice(0, 80) } })} className={campo} aria-invalid={invalido("rep-nombre")} />
                    </Campo>
                    <Campo id="rep-rut" rotulo="Su RUT">
                      <input id="rep-rut" value={b.rep.rut} onChange={(e) => poner({ rep: { ...b.rep, rut: rutMientras(e.target.value) } })} placeholder="12.345.678-5" autoCapitalize="characters" className={`${campo} tabular-nums`} aria-invalid={invalido("rep-rut")} />
                    </Campo>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {b.paso === 1 && (
          <>
            <TituloPaso>Tu salud</TituloPaso>
            <p className="mt-3 max-w-[34rem] text-[15px] leading-relaxed text-ceniza">
              Con esto sé si hay que tomar algún cuidado o esperar. Un &ldquo;sí&rdquo; casi nunca impide tatuarse.
            </p>
            <ul className="mt-8 divide-y divide-linea/80 border-y border-linea/80">
              {p.preguntas.map((q) => {
                const r = b.salud[q.id];
                return (
                  <li key={q.id} className="py-5">
                    <div className="flex items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <p id={`t-${q.id}`} className="text-[16px] leading-snug">
                          {q.texto}
                        </p>
                        {q.ayuda && <p className="mt-1 text-[13px] leading-snug text-ceniza">{q.ayuda}</p>}
                      </div>
                      <SiNo id={`p-${q.id}`} etiqueta={`t-${q.id}`} valor={r?.si ?? null} cambiar={(si) => marcarSalud(q.id, { si })} marcado={invalido(`p-${q.id}`)} />
                    </div>
                    {r?.si && q.detalle && (
                      <input
                        id={`d-${q.id}`}
                        value={r.detalle}
                        onChange={(e) => marcarSalud(q.id, { detalle: e.target.value.slice(0, 200) })}
                        placeholder={q.detalle}
                        aria-label={`${q.texto} ${q.detalle}`}
                        aria-invalid={invalido(`d-${q.id}`)}
                        className={`${campo} panel-surge mt-3`}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-8">
              <Campo id="otras" rotulo="¿Algo más que deba saber de tu salud?" nota="Opcional">
                <textarea id="otras" value={b.otras} onChange={(e) => poner({ otras: e.target.value.slice(0, 300) })} rows={3} className={`${campo} resize-none py-3 leading-snug`} />
              </Campo>
            </div>
          </>
        )}

        {b.paso === 2 && (
          <>
            <TituloPaso>Lo que aceptas</TituloPaso>

            <div className="mt-8 grid gap-8 sm:grid-cols-2 sm:gap-6">
              <div>
                <h2 className="text-[15px] font-semibold">Riesgos {p.texto.procedimiento.startsWith("el ") ? `del ${p.texto.procedimiento.slice(3)}` : `de ${p.texto.procedimiento}`}</h2>
                <Vinetas items={p.texto.riesgos} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold">Te comprometes a</h2>
                <Vinetas items={p.texto.compromisos} />
              </div>
            </div>
            <Casilla id="a-acepto" marcada={b.acepta.acepto} cambiar={aceptar("acepto")} invalido={invalido("a-acepto")} destacada>
              {p.texto.declaraciones.acepto}
            </Casilla>
            {menor && (
              <Casilla id="a-representante" marcada={b.acepta.representante} cambiar={aceptar("representante")} invalido={invalido("a-representante")} destacada>
                <span className="font-semibold">Tu {relacion}: </span>
                {p.texto.declaraciones.representante}
              </Casilla>
            )}

            <div className="mt-10 border-t border-linea pt-8">
              <h2 className="text-[15px] font-semibold">Tus datos</h2>
              <Casilla id="a-datos" marcada={b.acepta.datos} cambiar={aceptar("datos")} invalido={invalido("a-datos")}>
                {p.texto.declaraciones.datos}{" "}
                <a href="/privacidad" target="_blank" rel="noopener" className="font-semibold text-stencil-claro underline decoration-stencil/40 underline-offset-4" onClick={(e) => e.stopPropagation()}>
                  Cómo se cuidan
                </a>
              </Casilla>
            </div>

            <div className="mt-8">
              <h2 className="flex items-baseline justify-between gap-2 text-[15px] font-semibold">
                Fotos <span className="text-[13px] font-normal text-ceniza">Opcional</span>
              </h2>
              <Casilla id="a-fotos" marcada={b.acepta.fotos} cambiar={aceptar("fotos")}>
                {p.texto.declaraciones.fotos}
              </Casilla>
            </div>
          </>
        )}

        {b.paso === 3 && (
          <>
            <TituloPaso>Firma</TituloPaso>
            <p className="mt-3 text-[16px] leading-relaxed text-piel/90">
              {menor ? (
                <>
                  Firma tu {relacion}, <span className="font-semibold">{b.rep.nombre.trim()}</span>.
                </>
              ) : (
                <>
                  Firma <span className="font-semibold">{b.nombre.trim()}</span>.
                </>
              )}
            </p>
            <div className="mt-6">
              <Firma ref={firma} etiqueta="Recuadro para firmar" alCambiar={(hay) => (setHayFirma(hay), setError(null))} />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[13px] text-ceniza">Quedan registradas la fecha y la hora. Te llevas una copia en PDF.</p>
                <button type="button" onClick={() => firma.current?.borrar()} className="min-h-11 shrink-0 rounded-full px-3 text-[14px] font-semibold text-ceniza hover:text-piel">
                  Borrar
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* La acción del paso, siempre a la vista. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-linea/80 bg-tinta/[0.92] backdrop-blur-xl" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto w-full max-w-[40rem] px-4 pt-3 sm:px-6">
          {error && (
            <p role="alert" className="mb-2.5 text-[14px] leading-snug font-semibold text-[#ff8a80]">
              {error.texto}
            </p>
          )}
          <div className="flex items-center gap-2">
            {b.paso > 0 && (
              <button type="button" onClick={() => (setDireccion("atras"), poner({ paso: b.paso - 1 }))} className="min-h-13 rounded-full px-5 text-[15px] font-semibold text-ceniza transition-colors hover:text-piel">
                Atrás
              </button>
            )}
            <button
              type="button"
              onClick={seguir}
              disabled={enviando || (b.paso === 0 && muyChico)}
              className="boton-cromo inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-full bg-[image:var(--acero)] px-6 text-[16px] font-semibold text-tinta shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(47,107,255,0.8)] transition-[transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-40"
            >
              {enviando ? "Enviando…" : b.paso === 3 ? "Firmar y enviar" : `Seguir: ${PASOS[b.paso + 1].toLowerCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Encabezado({ paso }: { paso: number }) {
  return (
    <header>
      <div className="flex items-center justify-between gap-4">
        <span className="texto-acero font-gotica text-[26px] leading-none">Matness</span>
        <span className="text-[13px] text-ceniza tabular-nums">
          Paso {paso + 1} de {PASOS.length}
        </span>
      </div>
      <ol className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Pasos">
        {PASOS.map((t, i) => (
          <li key={t} aria-current={i === paso ? "step" : undefined}>
            <span className="block h-1 overflow-hidden rounded-full bg-linea">
              <span
                className={`block h-full origin-left rounded-full bg-stencil shadow-[0_0_12px_rgba(47,107,255,0.8)] transition-transform duration-500 ease-[var(--ease-salida)] ${
                  i <= paso ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </span>
            <span className={`mt-2 hidden text-[12px] sm:block ${i === paso ? "font-semibold text-piel" : "text-ceniza"}`}>{t}</span>
          </li>
        ))}
      </ol>
    </header>
  );
}

function TituloPaso({ children }: { children: React.ReactNode }) {
  return (
    <h1 id="titulo-paso" className="font-gotica text-[clamp(2.5rem,10vw,3.5rem)] leading-[0.95]">
      {children}
    </h1>
  );
}

function Campo({ id, rotulo, nota, children }: { id: string; rotulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-3 text-[15px] font-semibold">
        {rotulo}
        {nota && <span className="text-[13px] font-normal text-ceniza">{nota}</span>}
      </label>
      {children}
    </div>
  );
}

function SiNo({ id, etiqueta, valor, cambiar, marcado }: { id: string; etiqueta: string; valor: boolean | null; cambiar: (v: boolean) => void; marcado?: boolean }) {
  const boton = "relative z-10 min-h-11 w-14 rounded-full text-[15px] font-semibold transition-colors duration-300";
  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={etiqueta}
      tabIndex={-1}
      className={`relative flex shrink-0 rounded-full border p-1 outline-none transition-colors ${marcado ? "border-[#ff8a80]" : "border-linea"}`}
    >
      {/* El marcador se desliza entre No y Sí: se mueve con transform, no se redibuja. */}
      <span
        aria-hidden
        className={`absolute top-1 bottom-1 left-1 w-14 rounded-full transition-[transform,background-color,opacity,box-shadow] duration-300 ease-[var(--ease-salida)] ${
          valor === null ? "scale-90 opacity-0" : "opacity-100"
        } ${valor ? "translate-x-full bg-stencil shadow-[0_0_18px_-4px_rgba(47,107,255,0.9)]" : "translate-x-0 bg-piel"}`}
      />
      <button type="button" role="radio" aria-checked={valor === false} onClick={() => cambiar(false)} className={`${boton} ${valor === false ? "text-tinta" : "text-ceniza hover:text-piel"}`}>
        No
      </button>
      <button type="button" role="radio" aria-checked={valor === true} onClick={() => cambiar(true)} className={`${boton} ${valor === true ? "text-white" : "text-ceniza hover:text-piel"}`}>
        Sí
      </button>
    </div>
  );
}

function Vinetas({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {items.map((x) => (
        <li key={x} className="flex gap-3 text-[15px] leading-relaxed text-piel/85">
          <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-stencil" />
          {x}
        </li>
      ))}
    </ul>
  );
}

function Casilla({
  id,
  marcada,
  cambiar,
  invalido,
  destacada = false,
  children,
}: {
  id: string;
  marcada: boolean;
  cambiar: (v: boolean) => void;
  invalido?: boolean;
  /** La casilla principal del paso: con fondo, para que no se pierda después de las listas. */
  destacada?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`mt-4 flex cursor-pointer items-start gap-3.5 rounded-2xl text-[15px] leading-relaxed transition-colors ${
        destacada ? `border p-4 ${marcada ? "border-stencil/60 bg-stencil/[0.08]" : invalido ? "border-[#ff8a80]/60 bg-hollin/60" : "border-linea bg-hollin/60"}` : "py-2"
      }`}
    >
      <input id={id} type="checkbox" checked={marcada} onChange={(e) => cambiar(e.target.checked)} className="peer sr-only" aria-invalid={invalido} />
      <span
        aria-hidden
        data-marcada={marcada ? "si" : "no"}
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border transition-[background-color,border-color,box-shadow] duration-200 peer-focus-visible:shadow-[0_0_0_4px_rgba(47,107,255,0.3)] ${
          marcada ? "border-stencil bg-stencil shadow-[0_0_16px_-4px_rgba(47,107,255,0.9)]" : invalido ? "border-[#ff8a80]" : "border-ceniza/60"
        }`}
      >
        <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path className="visto-trazo" d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
      <span className="min-w-0">{children}</span>
    </label>
  );
}

function Listo({ url, archivo, nombre, enEstudio, volver, cuando, estudio }: Props & { url: string; archivo: string; nombre: string }) {
  return (
    <div className="panel-surge flex min-h-[70dvh] flex-col justify-center">
      <span className="texto-acero font-gotica text-[26px] leading-none">Matness</span>
      <span aria-hidden className="relative mt-12 grid size-16 place-items-center">
        <span className="sello-onda absolute inset-0 rounded-full border border-stencil" />
        <span className="sello grid size-16 place-items-center rounded-full bg-stencil text-white shadow-[0_0_48px_-6px_rgba(47,107,255,0.95)]">
          <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
      </span>
      {/* El nombre se entinta detrás de una aguja, como el de la portada. */}
      <h1 className="relative mt-8 self-start font-gotica text-[clamp(3rem,13vw,4.5rem)] leading-[0.9]">
        <span className="entintar block">Listo, {nombre}</span>
        <span aria-hidden className="entintar-aguja pointer-events-none absolute inset-0">
          <span className="absolute -top-2 -bottom-2 left-0 w-0.5 rounded-full bg-stencil-claro shadow-[0_0_14px_3px_rgba(47,107,255,0.9)]" />
        </span>
      </h1>
      <p className="mt-4 max-w-[30rem] text-[17px] leading-relaxed text-piel/90">
        Tu consentimiento quedó firmado.{" "}
        {enEstudio ? `Devuélvele el teléfono a ${estudio.nombre}.` : <>Nos vemos el {cuando.charAt(0).toLowerCase() + cuando.slice(1)}.</>}
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <a
          href={url}
          download={archivo}
          className="boton-cromo inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[image:var(--acero)] px-7 text-[16px] font-semibold text-tinta shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(47,107,255,0.8)]"
        >
          Descargar mi copia
        </a>
        {enEstudio && volver && (
          <a href={volver} className="inline-flex min-h-13 items-center justify-center rounded-full border border-linea px-7 text-[15px] font-semibold text-ceniza hover:text-piel">
            Volver a la cita
          </a>
        )}
      </div>
    </div>
  );
}
