import type { ReactNode } from "react";
import { toolMetadata } from "@/lib/tools/registry";
import { ToolSeoSections } from "@/components/tool-seo-sections";

export const metadata = toolMetadata("invoice-generator");

export default function InvoiceGeneratorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToolSeoSections toolId="invoice-generator" />
    </>
  );
}
