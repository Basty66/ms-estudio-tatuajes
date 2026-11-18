import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITIO, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITIO}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];
}
