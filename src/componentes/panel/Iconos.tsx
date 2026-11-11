/**
 * Íconos del panel: trazo de 1,6 px sobre una grilla de 24, para que se lean
 * igual de finos que la letra. Toman el color del texto.
 */
type P = { className?: string };

function Icono({ className = "size-5", children }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden>
      {children}
    </svg>
  );
}

export const Estrella = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden>
    <path d="M32 2 C34 24 40 30 62 32 C40 34 34 40 32 62 C30 40 24 34 2 32 C24 30 30 24 32 2 Z" fill="currentColor" />
  </svg>
);

export const Hoy = (p: P) => (
  <Icono {...p}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Icono>
);
export const Calendario = (p: P) => (
  <Icono {...p}>
    <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </Icono>
);
export const Mas = (p: P) => (
  <Icono {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icono>
);
export const Personas = (p: P) => (
  <Icono {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
  </Icono>
);
export const Menu = (p: P) => (
  <Icono {...p}>
    <circle cx="5" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="19" cy="12" r="1.2" fill="currentColor" />
  </Icono>
);
export const Billetera = (p: P) => (
  <Icono {...p}>
    <path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3M4 7.5A2.5 2.5 0 0 1 6.5 5H17v2.5M4 7.5h15a1 1 0 0 1 1 1V12" />
    <path d="M21 12h-4a2 2 0 0 0 0 4h4z" />
  </Icono>
);
export const Imagen = (p: P) => (
  <Icono {...p}>
    <rect x="3" y="3.5" width="18" height="17" rx="3" />
    <circle cx="9" cy="9" r="1.8" />
    <path d="m21 16-5-5-9 9.5" />
  </Icono>
);
export const Burbuja = (p: P) => (
  <Icono {...p}>
    <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5Z" />
  </Icono>
);
export const Ajustes = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </Icono>
);
export const Huella = (p: P) => (
  <Icono {...p}>
    <path d="M7.5 4.6A9 9 0 0 1 21 12.5M3.2 9A9 9 0 0 1 5 6.4M3 13.5V12M17.6 19.5A20 20 0 0 0 18 15v-2.5a6 6 0 0 0-9.4-5M6 12.5V15a17 17 0 0 0 1.4 6.8M12 12.5V15a14 14 0 0 1-1.6 6.6M15 13v2a16 16 0 0 1-.5 4M9 13a3 3 0 0 1 6 0" />
  </Icono>
);
export const Cara = (p: P) => (
  <Icono {...p}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M9 9.5v1M15 9.5v1M12 9.5V13h-1M9.5 15.5a3.5 3.5 0 0 0 5 0" />
  </Icono>
);
export const Borrar = (p: P) => (
  <Icono {...p}>
    <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1ZM17 9.5l-5 5M12 9.5l5 5" />
  </Icono>
);
export const Candado = (p: P) => (
  <Icono {...p}>
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Icono>
);
export const Flecha = (p: P) => (
  <Icono {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icono>
);
export const Atras = (p: P) => (
  <Icono {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Icono>
);
export const Campana = (p: P) => (
  <Icono {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9ZM10 19.5a2 2 0 0 0 4 0" />
  </Icono>
);
export const Reloj = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icono>
);
export const Check = (p: P) => (
  <Icono {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Icono>
);
export const Cerrar = (p: P) => (
  <Icono {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icono>
);
export const Subir = (p: P) => (
  <Icono {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </Icono>
);
export const Telefono = (p: P) => (
  <Icono {...p}>
    <path d="M5 3.5h3l1.5 4.5-2 1.2a11 11 0 0 0 7.3 7.3l1.2-2 4.5 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2Z" />
  </Icono>
);
export const Salir = (p: P) => (
  <Icono {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" />
  </Icono>
);
export const Bloqueo = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.7 5.7l12.6 12.6" />
  </Icono>
);
export const Buscar = (p: P) => (
  <Icono {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icono>
);
export const Papelera = (p: P) => (
  <Icono {...p}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />
  </Icono>
);
export const Ojo = (p: P) => (
  <Icono {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icono>
);
export const Documento = (p: P) => (
  <Icono {...p}>
    <path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v4h4M8.5 12h7M8.5 15.5h7" />
  </Icono>
);
