import type { ReactNode } from "react";
import { buildMetadata } from "@/app/seo";

export const metadata = buildMetadata({
  title: "All Free Online Tools | PDF, Image, CV and Job Safety | Eazitool",
  description:
    "Browse every Eazitool tool: convert PDFs and images, resize and upscale photos, build an ATS CV, and check suspicious job offers. Free, no signup.",
  path: "/tools",
  keywords: [
    "free online tools",
    "file conversion tools",
    "job seeker tools",
    "PDF tools online",
    "image tools online",
  ],
});

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return children;
}
