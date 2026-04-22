import type { MetadataRoute } from "next";
import { siteConfig } from "./seo";

const routes = [
  "",
  "/tools/cv-builder",
  "/tools/document-converter",
  "/tools/image-converter",
  "/tools/image-resizer",
  "/tools/image-upscaler",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
