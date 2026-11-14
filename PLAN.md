# Plan — próxima sesión

Consentimiento informado digital y lo que más le sirve al tatuador en el panel. Se trabaja en la
rama `v2` y al terminar se publica en **producción** con `vercel --prod` (nunca con un push a
`master`: eso vuelve a poner el sitio viejo).

## 0. Antes de escribir código

Verificar, no suponer:

- **Ley 21.719** (protección de datos personales): fecha exacta de entrada en vigor (se recuerda
  diciembre de 2026) y qué exige para datos de salud, que son datos sensibles: consentimiento
  expreso, finalidad, plazo de conservación, derechos de acceso y eliminación, medidas de seguridad.
- **Tatuajes a menores en Chile**: la norma real. La sección de preguntas de la web dice "desde los
  18; entre 16 y 17 con autorización notarial y ambos padres presentes": confirmarlo antes de
  usarlo en un texto legal.

Preguntarle al dueño del estudio, en una sola tanda:

1. ¿El consentimiento se manda por WhatsApp antes de la sesión, se firma en el estudio, o ambos?
2. ¿Cuánto tiempo se guardan los consentimientos firmados?
3. ¿Qué se hace con los datos de consentimientos del sitio viejo: se migran o se borran?

## 1. Consentimiento informado digital

- Desde la ficha de cita: **"Mandar consentimiento por WhatsApp"** (link con token aleatorio, de un
  solo uso y con vencimiento, a una página pública no indexada) y **"Firmar aquí"** para hacerlo en
  el teléfono del estudio.
- Contenido:
  - Datos del cliente: nombre, RUT, fecha de nacimiento y teléfono.
  - Declaración de salud. Base del sitio viejo: alergias (con detalle), coagulación o
    anticoagulantes, diabetes, enfermedad cardíaca, epilepsia, VIH o hepatitis, embarazo o
    lactancia, alcohol o drogas el día de la sesión y medicamentos. Evaluar sumar problemas de piel
    en la zona (queloides, psoriasis) y quitar lo que no haga falta: pedir solo lo necesario.
  - Riesgos que se aceptan y declaración de que la información es verdadera.
  - Aceptación del tratamiento de datos, separada del resto.
  - Permiso **opcional y aparte** para publicar fotos del tatuaje.
  - Firma en pantalla, fecha y hora, y versión del texto aceptado.
- Sin foto de carnet. Si para un menor hay que guardar la autorización notarial, va al almacén
  **privado**.
- La firma y el PDF van al almacén privado de Blob y solo se ven con sesión del panel (mismo patrón
  que `/tinta/comprobante`). Cada consentimiento queda ligado a su cliente y a su cita.
- En el panel:
  - Aviso **"Falta consentimiento"** en Hoy y en la ficha de la cita.
  - Las alertas de salud (alergias, anticoagulantes) visibles en la ficha antes de tatuar.
  - Ver o descargar el PDF.
  - Borrar los datos de un cliente cuando lo pida.
- Requisito: el almacén privado de Blob (`BLOB_PRIVADO_READ_WRITE_TOKEN`). El código viejo de
  referencia está en el historial: `git show c4e1413^:api/consentimiento.ts` (también
  `sql/consentimientos.sql`, `src/components/Consentimiento.tsx` y `src/lib/pdfConsentimiento.ts`).

## 2. Limpieza del sitio viejo

- Revisar los archivos que dejó el sitio viejo en el almacén de Blob y borrar, con confirmación del
  dueño, los que tengan datos personales.
- Averiguar si sigue existiendo la tabla de consentimientos del sitio viejo y aplicar lo que se
  decida (migrarla al formato nuevo o borrarla).
- Quitar de Vercel las variables del sitio viejo y rotar sus credenciales.

## 3. Útil para el tatuador

Proponer y que el dueño elija la prioridad; no hacerlo todo sin preguntar.

- Página de privacidad en la web (la ley la pide si se recogen datos).
- Cuidados por WhatsApp desde una cita hecha: día siguiente, día 7 y día 30. Si se menciona el
  retoque, se cobra: **el estudio no ofrece retoque gratis**.
- Foto del trabajo terminado desde la cita, directo a la galería.
- Registro de tintas y agujas (lote) por sesión, si la autoridad sanitaria lo exige: verificarlo.
- Pedir reseña de Google al cerrar una cita (nunca inventar reseñas).

## 4. También pendiente

- Clave definitiva del panel en producción (ver `AGENTS.md`).
- Probar Face ID y avisos en un iPhone y un Android reales, con la app instalada.

## Al terminar

`npx tsc --noEmit`, `npx eslint src`, `npm run build`, probar en el teléfono y publicar con
`vercel --prod` desde `v2`. Revisar la URL de producción después de publicar.
