import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://eazitool.com";

export const siteConfig = {
  name: "Eazitool",
  shortName: "Eazitool",
  description:
    "Eazitool helps you resize, convert, upscale, and optimize documents, images, and CVs from one fast online workspace.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  keywords: [
    "image converter",
    "image resizer",
    "image upscaler",
    "document converter",
    "pdf to docx",
    "docx to pdf",
    "pdf to txt",
    "ats cv builder",
    "online productivity tools",
    "file conversion tools",
    "free PDF to Word converter",
    "image enlarger",
    "resize image online",
    "ATS resume builder",
  ],
};

export interface FaqItem {
  question: string;
  answer: string;
}

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function buildMetadata({
  title,
  description,
  path = "/",
  keywords = [],
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
}): Metadata {
  const url = absoluteUrl(path);

  return {
    // Absolute so the root layout's "%s | Eazitool" template is not appended —
    // these titles already carry the brand suffix.
    title: { absolute: title },
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Eazitool - Free Online File Conversion and Productivity Tools",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export function buildFaqSchema(path: string, faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: absoluteUrl(path),
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
