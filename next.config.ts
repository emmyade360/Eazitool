import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "pdf-parse", "pdfkit", "mammoth", "docx", "canvas", "pdfjs-dist", "pdf-to-img"],
};

export default nextConfig;
