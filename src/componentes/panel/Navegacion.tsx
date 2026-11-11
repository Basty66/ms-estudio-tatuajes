"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PANEL } from "@/lib/admin/ruta";
import { Mas } from "./Iconos";
import { PRINCIPALES, SECUNDARIAS } from "./secciones";

function activa(ruta: string, href: string) {
  if (href === PANEL) return ruta === PANEL;
  if (href === `${PANEL}/mas`) return SECUNDARIAS.some((s) => ruta.startsWith(s.href)) || ruta === href;
  if (href === `${PANEL}/agenda`) return ruta.startsWith(href) || ruta.startsWith(`${PANEL}/cita`);
  if (href === `${PANEL}/clientes`) return ruta.startsWith(href) || ruta.startsWith(`${PANEL}/cliente/`);
  return ruta.startsWith(href);
}

/**
 * Teléfono: barra abajo, al alcance del pulgar, con "Nueva" al centro porque
 * es lo que más se hace. Escritorio: columna fija a la izquierda con todo.
 */
export function Navegacion({ sinVer }: { sinVer: number }) {
  const ruta = usePathname();

  return (
    <>
      <nav
        aria-label="Panel"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-linea/80 bg-tinta/[0.92] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto grid max-w-md grid-cols-5 px-2">
          {PRINCIPALES.map(({ href, texto, Icono, destacada }) => {
            const esta = activa(ruta, href);
            return (
              <li key={href} className="flex justify-center">
                <Link
                  href={href}
                  aria-current={esta ? "page" : undefined}
                  className={`relative flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${esta ? "text-piel" : "text-ceniza"}`}
                >
                  {destacada ? (
                    <span className="grid size-11 place-items-center rounded-full bg-[image:var(--acero)] text-tinta shadow-[0_0_24px_-4px_rgba(47,107,255,0.9)]">
                      <Icono className="size-6" />
                    </span>
                  ) : (
                    <>
                      <span className="relative">
                        <Icono className="size-6" />
                        {texto === "Más" && sinVer > 0 && (
                          <span className="absolute -top-1 -right-2 grid min-w-4 place-items-center rounded-full bg-stencil px-1 text-[10px] leading-4 text-piel">{sinVer}</span>
                        )}
                      </span>
                      {texto}
                      {esta && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-stencil shadow-[0_0_10px_2px_rgba(47,107,255,0.9)]" />}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav aria-label="Panel" className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-linea/80 bg-hollin/60 px-4 py-6 backdrop-blur-xl lg:flex">
        <Link href={PANEL} className="texto-acero px-3 font-gotica text-[34px] leading-none">
          Matness
        </Link>
        <p className="mt-1 px-3 text-[11px] font-semibold tracking-[0.2em] text-ceniza uppercase">Panel del estudio</p>
        <Link
          href={`${PANEL}/nueva`}
          className="boton-cromo mt-8 flex min-h-12 items-center justify-center gap-2 rounded-full bg-[image:var(--acero)] text-[15px] font-semibold text-tinta shadow-[0_0_30px_-8px_rgba(47,107,255,0.9)]"
        >
          <Mas className="size-5" /> Nueva cita
        </Link>
        <ul className="mt-6 flex flex-col gap-1">
          {[...PRINCIPALES.filter((p) => !p.destacada && p.texto !== "Más"), ...SECUNDARIAS].map(({ href, texto, Icono }) => {
            const esta = activa(ruta, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={esta ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors ${esta ? "bg-white/[0.06] text-piel ring-1 ring-white/10" : "text-ceniza hover:bg-white/[0.03] hover:text-piel"}`}
                >
                  <Icono className={`size-5 ${esta ? "text-stencil-claro" : ""}`} />
                  <span className="flex-1">{texto}</span>
                  {texto === "Cotizaciones" && sinVer > 0 && <span className="rounded-full bg-stencil px-2 text-[12px] font-semibold text-piel">{sinVer}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        <a href="/" target="_blank" rel="noopener noreferrer" className="mt-auto px-3 text-[13px] text-ceniza hover:text-piel">
          Ver la web ↗
        </a>
      </nav>
    </>
  );
}
