import type { MetadataRoute } from "next";
import { siteConfig } from "./seo";
import { getSitemapEntries } from "@/lib/tools/registry";

const STATIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/tools", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [...STATIC_ROUTES, ...getSitemapEntries()].map((entry) => ({
    url: `${siteConfig.url}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
