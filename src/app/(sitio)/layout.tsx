import { BarraMovil } from "@/componentes/sitio/BarraMovil";
import { ProveedorEstudio } from "@/componentes/sitio/DatosEstudio";
import { Efectos } from "@/componentes/sitio/Efectos";
import { Navegacion } from "@/componentes/sitio/Navegacion";
import { WhatsappFlotante } from "@/componentes/sitio/WhatsappFlotante";
import { leerContenido } from "@/db/contenido";

export default async function SitioLayout({ children }: { children: React.ReactNode }) {
  const { estudio } = await leerContenido();
  return (
    <ProveedorEstudio estudio={estudio}>
      <Navegacion />
      <main>{children}</main>
      <BarraMovil />
      <WhatsappFlotante />
      <Efectos />
    </ProveedorEstudio>
  );
}
