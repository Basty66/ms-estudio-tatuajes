"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PANEL } from "@/lib/admin/ruta";

const CADA_MS = 15_000;
const VERSION = process.env.NEXT_PUBLIC_VERSION;

/**
 * Mantiene el panel al día sin recargar a mano, y avisa cuando hay una
 * versión nueva publicada.
 *
 * Cada 15 segundos —solo con la app a la vista— pregunta a /tinta/cambios si
 * hubo algo nuevo, y recién entonces pide los datos otra vez. Lo que se esté
 * escribiendo no se pierde: se actualiza lo que viene del servidor, no los
 * formularios abiertos.
 *
 * Si el servidor ya corre otra versión, la app instalada sigue con la vieja
 * hasta que se recargue: se muestra una barra para hacerlo con un toque.
 *
 * 401 significa que la sesión se bloqueó: se pide la página y el layout manda
 * a la pantalla de PIN.
 */
export function MantenerAlDia() {
  const router = useRouter();
  const [nueva, setNueva] = useState(false);

  useEffect(() => {
    let ultimo: string | null = null;
    let consultando = false;

    async function mirar() {
      if (document.visibilityState !== "visible" || consultando) return;
      consultando = true;
      try {
        const r = await fetch(`${PANEL}/cambios`, { cache: "no-store" });
        if (r.status === 401) return router.refresh();
        if (!r.ok) return;
        const datos = (await r.json()) as { ultimo: string; version: string };
        if (ultimo !== null && datos.ultimo !== ultimo) router.refresh();
        ultimo = datos.ultimo;
        if (VERSION && datos.version && datos.version !== VERSION) setNueva(true);
      } catch {
        // Sin señal: se vuelve a intentar en la próxima vuelta.
      } finally {
        consultando = false;
      }
    }

    void mirar();
    const reloj = setInterval(mirar, CADA_MS);
    const alVolver = () => void mirar();
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [router]);

  return (
    <AnimatePresence>
      {nueva && (
        <motion.div
          role="status"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="fixed inset-x-3 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-stencil/60 bg-hollin/95 p-3 pl-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_-12px_rgba(47,107,255,0.9)] backdrop-blur-xl"
          style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inset-0 animate-ping rounded-full bg-stencil" />
            <span className="relative size-2.5 rounded-full bg-stencil" />
          </span>
          <p className="flex-1 text-[14px] leading-snug">
            <span className="font-semibold">Hay una versión nueva del panel.</span>{" "}
            <span className="text-ceniza">Actualiza para tener lo último.</span>
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="boton-cromo min-h-10 shrink-0 rounded-full bg-[image:var(--acero)] px-4 text-[14px] font-semibold text-tinta"
          >
            Actualizar
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
