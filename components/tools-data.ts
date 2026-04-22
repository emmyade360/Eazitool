export const TOOL_CATEGORIES = [
  {
    category: "AI Tools",
    icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.309 48.309 0 01-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5",
    color: "blue",
    items: [
      {
        label: "ATS CV Builder",
        href: "/tools/cv-builder",
        description: "AI-powered, ATS-compliant resume builder via Groq",
        badge: "AI",
        icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
      },
    ],
  },
  {
    category: "Document Converter",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    color: "violet",
    items: [
      { label: "PDF to DOCX", href: "/tools/document-converter?from=pdf&to=docx", description: "Convert PDF to editable Word document" },
      { label: "DOCX to PDF", href: "/tools/document-converter?from=docx&to=pdf", description: "Convert Word document to PDF" },
      { label: "PDF to TXT", href: "/tools/document-converter?from=pdf&to=txt", description: "Extract plain text from PDF" },
      { label: "TXT to PDF", href: "/tools/document-converter?from=txt&to=pdf", description: "Convert plain text file to PDF" },
      { label: "DOCX to TXT", href: "/tools/document-converter?from=docx&to=txt", description: "Extract plain text from Word document" },
    ],
  },
  {
    category: "Image Conversions",
    icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
    color: "emerald",
    items: [
      { label: "PNG to JPEG", href: "/tools/image-converter?from=png&to=jpeg", description: "Compress PNG to JPEG format" },
      { label: "JPEG to PNG", href: "/tools/image-converter?from=jpeg&to=png", description: "Convert JPEG to lossless PNG" },
      { label: "PNG to WebP", href: "/tools/image-converter?from=png&to=webp", description: "Convert PNG to modern WebP" },
      { label: "JPEG to WebP", href: "/tools/image-converter?from=jpeg&to=webp", description: "Convert JPEG to modern WebP" },
      { label: "WebP to PNG", href: "/tools/image-converter?from=webp&to=png", description: "Convert WebP to PNG" },
      { label: "WebP to JPEG", href: "/tools/image-converter?from=webp&to=jpeg", description: "Convert WebP to JPEG" },
      { label: "Any to WebP", href: "/tools/image-converter?from=any&to=webp", description: "Convert any image to WebP" },
    ],
  },
  {
    category: "Image Tools",
    icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
    color: "emerald",
    items: [
      { label: "Image Resizer", href: "/tools/image-resizer", description: "Resize images to exact dimensions with fit controls" },
      { label: "Image Upscaler", href: "/tools/image-upscaler", description: "Enlarge images up to 4x with high-quality resampling" },
    ],
  },
] as const;
