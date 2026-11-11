/**
 * Reduce una foto en el navegador antes de subirla.
 *
 * Una foto de celular pesa entre 3 y 8 MB y el cuerpo de una acción de
 * servidor admite 4,5 MB. Reducida al lado máximo de 1400 px con calidad 0.82
 * queda en 200–400 KB, que además se abre al instante cuando alguien revisa un
 * comprobante desde el teléfono.
 *
 * Se usa createImageBitmap con imageOrientation 'from-image': con `new Image()`
 * las fotos verticales de iPhone llegan acostadas, porque la orientación va en
 * los metadatos EXIF y el canvas los ignora.
 */
const LADO_MAXIMO = 1400;
const CALIDAD = 0.82;

export async function reducirImagen(archivo: File): Promise<Blob> {
  // Un PDF no se reduce: se sube tal cual.
  if (archivo.type === "application/pdf") return archivo;

  const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new Error("No se pudo preparar la imagen.");
  contexto.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const reducida = await new Promise<Blob | null>((resolver) =>
    lienzo.toBlob(resolver, "image/jpeg", CALIDAD),
  );
  if (!reducida) throw new Error("No se pudo reducir la imagen.");
  return reducida;
}
