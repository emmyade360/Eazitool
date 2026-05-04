import type { ReactNode } from "react";
import { buildMetadata } from "@/app/seo";
import AdSenseUnit from "@/components/AdSenseUnit";

export const metadata = buildMetadata({
  title: "Free Image Resizer Online | Resize Images to Exact Dimensions | Eazitool",
  description: "Resize images to exact dimensions with fit controls. Supports PNG, JPEG, WebP, AVIF, TIFF. Preserve aspect ratio or stretch. No quality loss.",
  path: "/tools/image-resizer",
  keywords: [
    "resize image online",
    "image resizer",
    "resize for social media",
    "resize image to exact size",
    "photo resizer online",
    "resize image without losing quality",
  ],
});

export default function ImageResizerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <AdSenseUnit className="py-8" />
    </>
  );
}
