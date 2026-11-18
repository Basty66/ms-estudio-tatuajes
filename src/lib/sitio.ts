/**
 * La dirección pública del sitio, en un solo lugar: los links de los mensajes
 * (cuidados, consentimiento, reseñas), el SEO y los avisos salen de acá.
 *
 * Para el dominio propio basta con definir NEXT_PUBLIC_SITIO en Vercel
 * ("https://matness.cl") y volver a publicar. Sin "server-only": también lo
 * usan componentes del navegador.
 */
export const SITIO = (process.env.NEXT_PUBLIC_SITIO || "https://tatuajes-azure.vercel.app").replace(/\/+$/, "");

/** "tatuajes-azure.vercel.app": la dirección sin https, como se escribe en un mensaje. */
export const DOMINIO = new URL(SITIO).host;
