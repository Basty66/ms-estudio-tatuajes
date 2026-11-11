import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Puerta del panel (/tinta).
 *
 * Solo mira que venga la cookie de sesión, sin tocar la base: es la barrera
 * barata. La comprobación de verdad —sesión viva, persona activa, panel
 * desbloqueado— la hacen el layout, cada página y cada acción.
 *
 * En Next 16 esto se llama `proxy.ts`, no `middleware.ts`: con el nombre
 * antiguo el archivo no se ejecuta y el panel queda abierto creyendo que está
 * protegido.
 */
const COOKIE_SESION = "sesion_panel";

/**
 * Lo que abre sin sesión: el manifest, el service worker y los íconos (el
 * navegador los pide por su cuenta, y un service worker que responde una
 * redirección no se registra nunca) y la propia pantalla de entrada.
 */
const LIBRES = /^\/tinta\/(entrar|manifest\.webmanifest|sw\.js|[\w-]+\.(png|svg))$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (LIBRES.test(pathname)) return NextResponse.next();

  const parametros = new URLSearchParams(request.nextUrl.search);
  parametros.delete("_rsc");
  const ruta = pathname + (parametros.size > 0 ? `?${parametros}` : "");

  if (!request.cookies.has(COOKIE_SESION)) {
    const entrar = new URL("/tinta/entrar", request.url);
    if (ruta !== "/tinta") entrar.searchParams.set("volver", ruta);
    return NextResponse.redirect(entrar);
  }

  // Si la sesión resulta estar bloqueada, el panel necesita saber a dónde se
  // iba para volver ahí después del PIN.
  const cabeceras = new Headers(request.headers);
  cabeceras.set("x-ruta-panel", ruta);
  return NextResponse.next({ request: { headers: cabeceras } });
}

export const config = {
  matcher: ["/tinta", "/tinta/:path*"],
};
