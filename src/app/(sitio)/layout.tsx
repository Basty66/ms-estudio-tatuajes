import { BarraMovil } from "@/componentes/sitio/BarraMovil";
import { Efectos } from "@/componentes/sitio/Efectos";
import { Navegacion } from "@/componentes/sitio/Navegacion";
import { WhatsappFlotante } from "@/componentes/sitio/WhatsappFlotante";

export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navegacion />
      <main>{children}</main>
      <BarraMovil />
      <WhatsappFlotante />
      <Efectos />
    </>
  );
}
