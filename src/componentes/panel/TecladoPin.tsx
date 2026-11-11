"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Borrar } from "./Iconos";

const LARGO = 4;

/** Lo comparten las teclas, el botón de borrar y el de la huella. */
export const TAMANO_TECLA = "size-[min(4.75rem,10dvh)]";

/**
 * Teclado de PIN, como el de desbloqueo del teléfono.
 *
 * Teclas grandes porque se usa con el pulgar y con guantes recién sacados, y
 * el PIN entra solo al tocar el cuarto dígito: un botón "Entrar" extra es un
 * toque más cada vez que se abre el panel.
 *
 * `alCompletar` dice si el PIN sirvió. Si no, los puntos tiemblan y se
 * vacían para volver a probar.
 *
 * También acepta el teclado físico, para quien lo usa desde el computador.
 */
export function TecladoPin({
  alCompletar,
  ocupado = false,
  esquina,
}: {
  alCompletar: (pin: string) => Promise<boolean>;
  ocupado?: boolean;
  /** Lo que va a la izquierda del cero: el botón de Face ID / huella. */
  esquina?: React.ReactNode;
}) {
  const [digitos, setDigitos] = useState("");
  const [sacudir, setSacudir] = useState(0);
  const [probando, setProbando] = useState(false);
  const bloqueado = ocupado || probando;

  // Lo tecleado vive también en una referencia, que es la que manda. Con solo
  // el estado, varias teclas seguidas del teclado físico leían el mismo valor
  // viejo —el estado se actualiza recién en el siguiente render— y de "2580"
  // quedaba "0".
  const tecleado = useRef("");
  const ocupadoAhora = useRef(false);
  useEffect(() => {
    ocupadoAhora.current = ocupado;
  }, [ocupado]);

  const poner = (valor: string) => {
    tecleado.current = valor;
    setDigitos(valor);
  };

  // La comprobación se lanza acá y no dentro de setDigitos: React puede
  // llamar dos veces a un actualizador de estado, y eso mandaría el PIN dos
  // veces y gastaría dos intentos de cinco.
  const tocar = useCallback(
    (d: string) => {
      const actual = tecleado.current;
      if (ocupadoAhora.current || actual.length >= LARGO) return;
      const nuevo = actual + d;
      poner(nuevo);
      if (nuevo.length < LARGO) return;

      setProbando(true);
      void alCompletar(nuevo)
        .catch(() => false)
        .then((sirvio) => {
          setProbando(false);
          if (!sirvio) {
            setSacudir((n) => n + 1);
            poner("");
          }
        });
    },
    [alCompletar],
  );

  const borrar = useCallback(() => {
    if (ocupadoAhora.current || tecleado.current.length >= LARGO) return;
    poner(tecleado.current.slice(0, -1));
  }, []);

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) tocar(e.key);
      else if (e.key === "Backspace") borrar();
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [tocar, borrar]);

  // El tamaño sale del ALTO de la pantalla y no del ancho. En un Android de
  // 360×640 con la barra del navegador, teclas fijas de 76 px dejaban la
  // última fila fuera de la pantalla. Con 10 % del alto (y 76 px como tope)
  // las cuatro filas caben siempre, y en un teléfono grande se ven igual que
  // antes.
  const tecla =
    `grid ${TAMANO_TECLA} place-items-center rounded-full ` +
    "border border-linea bg-hollin/80 text-[clamp(1.375rem,3.6dvh,1.75rem)] font-medium text-piel tabular-nums " +
    "transition-all duration-150 ease-out " +
    "active:scale-90 active:border-stencil active:bg-stencil/25 disabled:opacity-40 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stencil-claro";

  return (
    <div className="flex w-full max-w-[17rem] flex-col items-center gap-[clamp(0.875rem,3dvh,2rem)]">
      <div
        key={sacudir}
        role="status"
        aria-label={`${digitos.length} de ${LARGO} dígitos`}
        className={`flex gap-4 ${sacudir > 0 ? "panel-sacude" : ""}`}
      >
        {Array.from({ length: LARGO }, (_, i) => (
          <span
            key={i}
            className={`size-3.5 rounded-full border-2 transition-all duration-200 ${
              i < digitos.length
                ? "scale-110 border-stencil bg-stencil shadow-[0_0_14px_2px_rgba(47,107,255,0.8)]"
                : "border-ceniza/50 bg-transparent"
            } ${probando ? "animate-pulse" : ""}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 justify-items-center gap-x-5 gap-y-[clamp(0.5rem,1.8dvh,1rem)]">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" className={tecla} disabled={bloqueado} onClick={() => tocar(d)}>
            {d}
          </button>
        ))}
        <span className={`grid ${TAMANO_TECLA} place-items-center`}>{esquina}</span>
        <button type="button" className={tecla} disabled={bloqueado} onClick={() => tocar("0")}>
          0
        </button>
        <button
          type="button"
          aria-label="Borrar"
          disabled={bloqueado || digitos.length === 0}
          onClick={borrar}
          className={`grid ${TAMANO_TECLA} place-items-center rounded-full text-ceniza transition-all duration-150 active:scale-90 disabled:opacity-30`}
        >
          <Borrar className="size-7" />
        </button>
      </div>
    </div>
  );
}
