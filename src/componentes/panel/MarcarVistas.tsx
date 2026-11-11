"use client";

import { useEffect } from "react";
import { marcarCotizacionesVistas } from "@/app/tinta/_acciones/panel";

/** Al abrir la lista, las cotizaciones nuevas pasan a vistas (y se apaga el número de la barra). */
export function MarcarVistas({ hay }: { hay: boolean }) {
  useEffect(() => {
    if (hay) void marcarCotizacionesVistas();
  }, [hay]);
  return null;
}
