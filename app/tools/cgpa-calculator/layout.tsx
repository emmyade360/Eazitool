import type { ReactNode } from "react";
import { toolMetadata } from "@/lib/tools/registry";
import { ToolSeoSections } from "@/components/tool-seo-sections";

export const metadata = toolMetadata("cgpa-calculator");

export default function CgpaCalculatorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToolSeoSections toolId="cgpa-calculator" />
    </>
  );
}
