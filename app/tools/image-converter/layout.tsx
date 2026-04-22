import type { ReactNode } from "react";
import { buildMetadata } from "@/app/seo";

export const metadata = buildMetadata({
  title: "Free Image Format Converter Online | PNG, JPEG, WebP | Eazitool",
  description: "Convert images between PNG, JPEG, WebP, AVIF, TIFF, and HEIF instantly. 100% free, no signup required. Batch convert images online.",
  path: "/tools/image-converter",
  keywords: [
    "image format converter",
    "PNG to JPEG",
    "JPEG to PNG",
    "WebP converter",
    "convert image to WebP",
    "image conversion online",
    "free image converter",
  ],
});

export default function ImageConverterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
