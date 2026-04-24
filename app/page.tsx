'use client';

import Link from "next/link";
import { useLanguage } from "@/components/language-context";
import { getToolCategories } from "@/components/tools-data";
import { HOME_COPY } from "@/lib/i18n";

export default function Home() {
  const { language } = useLanguage();
  const copy = HOME_COPY[language] ?? HOME_COPY.en;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 py-14 sm:px-6 md:py-28">
        <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500 blur-3xl md:h-96 md:w-96" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyan-500 blur-3xl md:h-96 md:w-96" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              {copy.heroBadge}
            </div>

            <h1 className="mb-5 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-6xl">
              {copy.heroTitle}{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {copy.heroHighlight}
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-base text-slate-300 sm:text-lg md:text-xl">
              {copy.heroSubtitle}
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/tools/image-converter"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-600 sm:px-8 sm:py-4 sm:text-base"
              >
                {copy.primaryCta}
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/tools/cv-builder"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:px-8 sm:py-4 sm:text-base"
              >
                {copy.secondaryCta}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-slate-400 sm:gap-8">
              {copy.trustItems.map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-green-400 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs sm:text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white px-4 py-8 shadow-sm sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {copy.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-blue-600 sm:text-3xl md:text-4xl">{stat.number}</p>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/solution cards */}
      <section className="bg-slate-50 px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl md:mb-16">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">{copy.problemTitle}</h2>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">{copy.problemBody}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {copy.cards.map((item) => (
              <div key={item.problem} className="group rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-lg sm:p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 sm:mb-6 sm:h-14 sm:w-14">
                  <svg className="h-6 w-6 text-red-500 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="mb-3 font-semibold text-slate-700 sm:mb-4 sm:text-lg">{item.problem}</p>
                <div className="mb-3 flex items-center gap-2 sm:mb-4">
                  <svg className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-xs font-medium text-green-600 sm:text-sm">{copy.withEazitool}</span>
                </div>
                <p className="text-sm text-slate-600 sm:text-base">{item.solution}</p>
                <Link href={item.href} className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700 sm:mt-4">
                  {item.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center md:mb-16">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">{copy.simpleTitle}</h2>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">{copy.simpleBody}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {copy.steps.map((item, index) => (
              <div key={item.title} className="relative text-center">
                <div className="absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/30 sm:h-12 sm:w-12 sm:text-lg">
                  {index + 1}
                </div>
                <div className="rounded-2xl bg-slate-50 p-6 pt-8 sm:p-8 sm:pt-10">
                  <h3 className="mb-2 text-lg font-bold text-slate-900 sm:mb-3 sm:text-xl">{item.title}</h3>
                  <p className="text-sm text-slate-600 sm:text-base">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-gradient-to-br from-blue-600 to-cyan-600 px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">{copy.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-blue-100 sm:text-lg">{copy.ctaBody}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:mt-8">
            <Link
              href="/tools/image-converter"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 sm:px-8 sm:py-4 sm:text-base"
            >
              {copy.ctaButton}
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center md:mb-12">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{copy.faqTitle}</h2>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">{copy.faqBody}</p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {copy.faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                <h3 className="font-semibold text-slate-900 sm:text-lg">{faq.question}</h3>
                <p className="mt-2 text-sm text-slate-600 sm:text-base">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-slate-900 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs text-slate-500 sm:text-sm">{copy.footer}</p>
        </div>
      </section>
    </div>
  );
}
