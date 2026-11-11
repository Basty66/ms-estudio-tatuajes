/**
 * Flash de tatuaje en línea fina, dibujado acá mismo (nada sacado de
 * internet): daga, rosa, ojo, corazón sagrado, telaraña, luna, rayo y
 * estrella. Ya están en la página desde el principio y flotan despacio con
 * una animación CSS de transform: no dependen del scroll ni de JavaScript,
 * así no cargan la página. Son decoración: aria-hidden y sin eventos.
 */
export type TipoOrnamento = "daga" | "rosa" | "ojo" | "corazon" | "telarana" | "luna" | "rayo" | "estrella" | "filigrana";

function telarana(): string[] {
  // Radios desde la esquina y anillos que cuelgan un poco hacia el centro,
  // como una tela de verdad.
  const angulos = [0, 18, 36, 54, 72, 90].map((g) => (g * Math.PI) / 180);
  const largo = 200;
  const p = (r: number, a: number) => [r * Math.cos(a), r * Math.sin(a)] as const;
  const radios = angulos.map((a) => {
    const [x, y] = p(largo, a);
    return `M0 0 L${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const anillos = [42, 82, 122, 162].map((r) => {
    let d = "";
    angulos.forEach((a, i) => {
      const [x, y] = p(r, a);
      if (i === 0) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
      else {
        const medio = (angulos[i - 1] + a) / 2;
        const [cx, cy] = p(r * 0.86, medio);
        d += ` Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    });
    return d;
  });
  return [...radios, ...anillos];
}

const DIBUJOS: Record<TipoOrnamento, { vista: string; trazos: string[] }> = {
  daga: {
    vista: "0 0 100 300",
    trazos: [
      "M50 9 a9 9 0 1 1 0 18 a9 9 0 1 1 0 -18",
      "M44 27 H56 V76 H44 Z",
      "M44 36 L56 42 M44 46 L56 52 M44 56 L56 62 M44 66 L56 72",
      "M16 84 Q50 70 84 84 Q50 95 16 84 Z",
      "M16 84 q-9 -2 -6 -11 M84 84 q9 -2 6 -11",
      "M40 92 L60 92 L56 248 L50 292 L44 248 Z",
      "M50 98 V272",
    ],
  },
  rosa: {
    vista: "0 0 200 210",
    trazos: [
      "M100 80 c10 -4 18 4 14 12 c-4 9 -20 9 -24 -2 c-5 -14 10 -26 26 -22 c18 5 24 24 14 40",
      "M62 86 c-6 26 8 52 38 56 c30 -4 44 -30 38 -56",
      "M62 86 c10 -16 26 -22 38 -20 M138 86 c-10 -16 -26 -22 -38 -20",
      "M56 104 c-16 22 -2 52 30 58 c10 2 20 1 28 -2 M144 104 c16 22 2 52 -30 58",
      "M70 152 c-24 6 -40 26 -42 46 c20 -2 38 -16 42 -46 Z M130 152 c24 6 40 26 42 46 c-20 -2 -38 -16 -42 -46 Z",
      "M70 152 L36 192 M130 152 L164 192",
    ],
  },
  ojo: {
    vista: "0 -34 200 170",
    trazos: [
      "M8 60 Q100 -12 192 60 Q100 132 8 60 Z",
      "M100 36 a24 24 0 1 1 0 48 a24 24 0 1 1 0 -48",
      "M100 51 a9 9 0 1 1 0 18 a9 9 0 1 1 0 -18",
      "M100 6 V-28 M62 14 L50 -10 M138 14 L150 -10 M30 32 L12 14 M170 32 L188 14",
      "M100 100 q-7 14 0 22 q7 -8 0 -22",
    ],
  },
  corazon: {
    vista: "0 -10 200 220",
    trazos: [
      "M100 190 C40 150 10 110 22 74 C34 40 78 36 100 66 C122 36 166 40 178 74 C190 110 160 150 100 190 Z",
      "M48 84 c4 -14 16 -20 28 -18",
      "M100 64 c-14 -18 -4 -36 0 -58 c12 18 18 34 4 54",
      "M84 56 c-8 -10 -4 -20 0 -30 M116 56 c8 -10 4 -20 0 -30",
      "M26 106 C76 128 124 128 174 106",
      "M46 116 l-6 -12 M70 122 l-3 -13 M100 125 v-13 M130 122 l3 -13 M154 116 l6 -12",
    ],
  },
  telarana: { vista: "0 0 200 200", trazos: telarana() },
  luna: {
    vista: "0 0 140 130",
    trazos: [
      "M78 8 A54 54 0 1 0 78 122 A42 42 0 1 1 78 8 Z",
      "M118 30 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z",
      "M106 78 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z",
    ],
  },
  rayo: { vista: "0 0 60 122", trazos: ["M36 2 L8 66 H30 L22 120 L54 46 H32 Z"] },
  estrella: {
    vista: "0 0 64 64",
    trazos: ["M32 2 C34 24 40 30 62 32 C40 34 34 40 32 62 C30 40 24 34 2 32 C24 30 30 24 32 2 Z"],
  },
  filigrana: {
    vista: "0 0 320 60",
    trazos: [
      "M160 30 C120 30 110 4 80 12 C60 18 66 42 84 38 C96 35 94 22 84 22",
      "M160 30 C200 30 210 4 240 12 C260 18 254 42 236 38 C224 35 226 22 236 22",
      "M80 12 C50 4 30 30 4 30 M240 12 C270 4 290 30 316 30",
      "M160 18 l4 12 l-4 12 l-4 -12 Z",
    ],
  },
};

export function Ornamento({
  tipo,
  className = "",
  flotar = 14,
  ritmo = 9,
  retraso = 0,
  grosor = 1.3,
  brillo = true,
}: {
  tipo: TipoOrnamento;
  className?: string;
  /** Cuánto sube y baja (px) al flotar. 0 = quieto. */
  flotar?: number;
  /** Segundos que dura una ida y vuelta. */
  ritmo?: number;
  retraso?: number;
  grosor?: number;
  brillo?: boolean;
}) {
  const d = DIBUJOS[tipo];
  return (
    <span
      aria-hidden
      className={`ornamento pointer-events-none ${flotar ? "ornamento-flota" : ""} ${brillo ? "ornamento-brillo" : ""} ${className}`}
      style={
        {
          "--flotar": `${flotar}px`,
          animationDuration: `${ritmo}s`,
          animationDelay: `${-retraso}s`,
        } as React.CSSProperties
      }
    >
      <svg
        viewBox={d.vista}
        className="block h-auto w-full overflow-visible"
        fill="none"
        stroke="currentColor"
        strokeWidth={grosor}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {d.trazos.map((trazo, i) => (
          <path key={i} d={trazo} />
        ))}
      </svg>
    </span>
  );
}
