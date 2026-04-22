import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { LanguageProvider } from "@/components/language-context";
import { absoluteUrl, siteConfig } from "./seo";
import { getDirection, resolveLanguageCode } from "@/lib/i18n";

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
    <html lang={initialLanguage} dir={getDirection(initialLanguage)}>
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
          <div className="flex">
            <Sidebar />
            <main className="flex-1 pt-16 md:ml-64">
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
