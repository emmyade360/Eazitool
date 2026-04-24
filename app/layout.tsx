import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { LanguageProvider } from "@/components/language-context";
import { absoluteUrl, siteConfig } from "./seo";
import { getDirection, resolveLanguageCode } from "@/lib/i18n";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Eazitool | Online File Conversion, Image Editing, and CV Tools",
    template: "%s | Eazitool",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "productivity",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Eazitool | Online File Conversion, Image Editing, and CV Tools",
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eazitool | Online File Conversion, Image Editing, and CV Tools",
    description: siteConfig.description,
  },
  verification: {
    google: "lE62NxiyAmI2du37leik-AOKYf0G6ECuSPliD2evG1M",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const initialLanguage = resolveLanguageCode(headerStore.get("accept-language"));

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: initialLanguage,
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/favicon.ico"),
  };

  return (
    <html lang={initialLanguage} dir={getDirection(initialLanguage)} data-scroll-behavior="smooth">
      <body className="min-h-screen bg-white">
        <LanguageProvider initialLanguage={initialLanguage}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
          <Navbar />
          {/* pt-16 clears fixed navbar; pb-16 md:pb-0 clears mobile bottom nav */}
          <main className="pt-16 pb-16 md:pb-0">
            {children}
          </main>
          <MobileNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
