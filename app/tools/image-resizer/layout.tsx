import type { ReactNode } from "react";
import { toolMetadata } from "@/lib/tools/registry";
import { ToolSeoSections } from "@/components/tool-seo-sections";

export const metadata = toolMetadata("image-resizer");

export default function ImageResizerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToolSeoSections toolId="image-resizer" />
    </>
  );
}
