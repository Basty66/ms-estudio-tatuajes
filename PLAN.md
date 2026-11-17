# Plan — próxima sesión

Se trabaja en la rama `v2` y al terminar se publica en **producción** con `vercel --prod` (nunca con
un push a `master`: eso vuelve a poner el sitio viejo).

## 1. Que el tatuador cambie todo sin pedirle nada a nadie

Ya se cambia desde el panel (Web): fotos, galería, precios del cotizador (montos por tamaño y
recargos por estilo y zona), contacto, reseñas, textos del tatuador, preguntas, cuidados,
consentimiento y mensajes de WhatsApp, cada uno con vista previa antes de guardar.

Sigue fijo en el código, en orden de lo que más se pide:

- **Cotizador**: agregar o quitar estilos (p. ej. Microrrealismo), cambiar el nombre y el rango de
  cada tamaño ("hasta 8 cm"). Hoy solo se cambian los montos.
- **Agenda**: las horas y duraciones que sugiere "Nueva cita", y los días de atención.
- **Equipo**: sumar a Matness como segundo usuario desde Cuenta (hoy es un INSERT a mano).
- **Textos de cada sección**: bajadas de los títulos, los cuatro pasos de "Una sesión" y la
  sección del láser.
- **Google**: título y descripción de la portada.
- Videos del hero y del láser (pesan: evaluar si vale la pena subirlos desde el teléfono).

Patrón a seguir: un bloque más en la tabla `contenido` (migración que amplía el CHECK de `clave`),
su `normalizar…` en `src/lib/contenido.ts`, su editor en `EditoresWeb.tsx` y su vista previa en
`VistaEnVivo.tsx`.

## 2. Pendiente de la entrega del consentimiento

- Probar Face ID, avisos y la firma con el dedo en un iPhone y un Android reales, con la app
  instalada.
- Clave definitiva del panel en producción (ver `AGENTS.md`).
- Conseguir el link de reseñas de Google (Perfil de Empresa → Pedir reseñas) y pegarlo en
  Web → Contacto y datos.
- Ley 21.719: el Congreso aprobó postergarla a 2027 (noviembre 2026); confirmar la fecha cuando
  se publique.
- Menores: no se encontró el texto oficial del reglamento. El formulario pide representante,
  su firma y que acompañe toda la sesión.

## Al terminar

`npx tsc --noEmit`, `npx eslint src`, `npm run build`, probar en el teléfono y publicar con
`vercel --prod` desde `v2`. Revisar la URL de producción después de publicar.
