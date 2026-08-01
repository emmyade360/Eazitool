import type { ReactNode } from "react";
import { toolMetadata } from "@/lib/tools/registry";
import { ToolSeoSections } from "@/components/tool-seo-sections";

export const metadata = toolMetadata("image-upscaler");

export default function ImageUpscalerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToolSeoSections toolId="image-upscaler" />
    </>
  );
}
