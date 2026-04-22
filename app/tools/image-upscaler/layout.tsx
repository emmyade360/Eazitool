import type { ReactNode } from "react";
import { buildMetadata } from "@/app/seo";

export const metadata = buildMetadata({
  title: "Free AI Image Upscaler Online | Enlarge Images Without Pixelation | Eazitool",
  description: "Upscale images up to 4x with AI-powered quality enhancement. No pixelation, no quality loss. Supports PNG, JPEG, WebP and more. 100% free.",
  path: "/tools/image-upscaler",
  keywords: [
    "AI image upscaler",
    "enlarge image without pixelation",
    "upscale image online",
    "increase image resolution",
    "image enlarger",
    "free image upscaler",
  ],
});

export default function ImageUpscalerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
