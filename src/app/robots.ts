import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

/** Google ve la web; el panel, el API y los links de consentimiento quedan fuera. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/tinta", "/api/", "/consentimiento/"] },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
