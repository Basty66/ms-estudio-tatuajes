import Link from "next/link";
import type { Cita } from "@/db/panel";
import { clp, ESTADO, resumenTatuaje, TIPO } from "@/lib/admin/etiquetas";
import { fechaCorta, hora } from "@/lib/admin/fecha";
import { PANEL } from "@/lib/admin/ruta";
import { Bloqueo, Flecha } from "./Iconos";

/** Una cita en una lista: la hora manda, después quién y qué, y si debe plata. */
export function FilaCita({ c, conFecha = false }: { c: Cita; conFecha?: boolean }) {
  if (c.tipo === "bloqueo") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-linea px-4 py-3 text-ceniza">
        <span className="w-12 shrink-0 text-[15px] font-semibold tabular-nums">{hora(c.inicio)}</span>
        <Bloqueo className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-[14px]">
          Bloqueado hasta las {hora(c.fin)}
          {c.descripcion ? ` · ${c.descripcion}` : ""}
        </span>
      </div>
    );
  }

  const apagada = c.estado === "cancelada" || c.estado === "no_vino";
  return (
    <Link
      href={`${PANEL}/cita/${c.id}`}
      className={`group flex items-center gap-4 rounded-2xl border border-linea bg-tinta/50 px-4 py-3 transition-[border-color,background-color] hover:border-stencil/60 hover:bg-tinta/80 ${apagada ? "opacity-55" : ""}`}
    >
      <span className="w-12 shrink-0">
        <span className="block text-[17px] leading-tight font-semibold tabular-nums">{hora(c.inicio)}</span>
        <span className="block text-[12px] text-ceniza capitalize tabular-nums">{conFecha ? fechaCorta(c.inicio).split(" ").slice(1).join(" ") : hora(c.fin)}</span>
      </span>
      <span aria-hidden className={`h-10 w-0.5 shrink-0 rounded-full ${c.tipo === "laser" ? "bg-[#a78bfa]" : c.tipo === "retoque" ? "bg-ceniza" : "bg-stencil"} shadow-[0_0_10px_rgba(47,107,255,0.6)]`} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[16px] font-semibold ${apagada ? "line-through" : ""}`}>{c.cliente}</span>
        <span className="block truncate text-[13px] text-ceniza">
          {TIPO[c.tipo]}
          {resumenTatuaje(c) ? ` · ${resumenTatuaje(c)}` : ""}
        </span>
      </span>
      <span className="shrink-0 text-right">
        {apagada ? (
          <span className="text-[12px] text-ceniza">{ESTADO[c.estado]}</span>
        ) : c.saldo != null && c.saldo > 0 ? (
          <>
            <span className="block text-[11px] text-ceniza">debe</span>
            <span className="block text-[14px] font-semibold text-[#fbbf24] tabular-nums">{clp(c.saldo)}</span>
          </>
        ) : c.precio != null ? (
          <span className="block text-[12px] font-semibold text-[#6ee7b7]">Pagada</span>
        ) : (
          <span className="block text-[12px] text-ceniza">Sin precio</span>
        )}
      </span>
      <Flecha className="hidden size-4 shrink-0 text-ceniza transition-transform group-hover:translate-x-0.5 sm:block" />
    </Link>
  );
}
