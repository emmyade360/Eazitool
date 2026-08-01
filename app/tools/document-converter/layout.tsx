import type { ReactNode } from "react";
import { toolMetadata } from "@/lib/tools/registry";
import { ToolSeoSections } from "@/components/tool-seo-sections";

export const metadata = toolMetadata("document-converter");

export default function DocumentConverterLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToolSeoSections toolId="document-converter" />
    </>
  );
}
