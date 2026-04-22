import type { ReactNode } from "react";
import { buildMetadata } from "@/app/seo";

export const metadata = buildMetadata({
  title: "Free PDF to DOCX Converter Online | Document Converter | Eazitool",
  description: "Convert PDF to DOCX, DOCX to PDF, PDF to TXT instantly. 100% free, no signup required. Fast document conversion tool for job applications and workflows.",
  path: "/tools/document-converter",
  keywords: [
    "free PDF to DOCX converter",
    "PDF to Word",
    "DOCX to PDF",
    "convert PDF to editable document",
    "PDF to TXT converter",
    "document conversion online",
  ],
});

export default function DocumentConverterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
