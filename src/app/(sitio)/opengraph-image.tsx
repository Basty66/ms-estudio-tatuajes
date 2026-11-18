import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { GOTICA_TTF } from "@/lib/admin/fuente-gotica";

/**
 * La imagen que aparece al compartir el link (WhatsApp, Instagram, Google):
 * el nombre en la gótica del estudio, un trabajo real y qué se hace y dónde.
 */
export const alt = "Matness Studio · Tatuajes y borrado láser en Melipilla";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Imagen() {
  // La foto va en JPEG baseline: el JPEG progresivo rompe el renderizador de la imagen.
  const foto = await readFile(join(process.cwd(), "public/images/compartir.jpg"), "base64");
  // Schibsted Grotesk (OFL), la letra de los textos de la web; la gótica es la del PDF.
  const sans = await readFile(join(process.cwd(), "src/app/(sitio)/fuentes/schibsted-500.ttf"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#07080d", position: "relative", fontFamily: "Sans" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "radial-gradient(70% 90% at 15% 0%, rgba(47,107,255,0.35), transparent 70%)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 0 0 80px", width: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, letterSpacing: 6, color: "#8aa8ff", textTransform: "uppercase" }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: "#2f6bff", boxShadow: "0 0 16px #2f6bff" }} />
            Melipilla · Chile
          </div>
          <div style={{ fontFamily: "Gotica", fontSize: 150, lineHeight: 1, color: "#f3f4f7", marginTop: 24, textShadow: "0 8px 40px rgba(47,107,255,0.55)" }}>Matness</div>
          <div style={{ fontFamily: "Gotica", fontSize: 64, lineHeight: 1, color: "#d9dce2", marginTop: 4 }}>Studio</div>
          <div style={{ width: 220, height: 5, borderRadius: 5, background: "#cfdcff", marginTop: 30, boxShadow: "0 0 18px 3px rgba(47,107,255,0.9)" }} />
          <div style={{ fontSize: 34, color: "#efe8e2", marginTop: 34, lineHeight: 1.3 }}>Tatuajes y borrado láser. Cotiza al instante y reserva tu hora.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, paddingRight: 70 }}>
          <img
            src={`data:image/jpeg;base64,${foto}`}
            width={400}
            height={500}
            style={{ objectFit: "cover", borderRadius: 36, border: "2px solid rgba(255,255,255,0.12)", boxShadow: "0 30px 80px rgba(47,107,255,0.45)" }}
            alt=""
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Sans", data: sans, style: "normal", weight: 500 },
        { name: "Gotica", data: Buffer.from(GOTICA_TTF, "base64"), style: "normal", weight: 400 },
      ],
    },
  );
}
