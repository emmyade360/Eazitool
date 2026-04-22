'use client';

import Link from "next/link";
import { useLanguage } from "@/components/language-context";
import { getToolCategories } from "@/components/tools-data";
import { HOME_COPY } from "@/lib/i18n";

export default function Home() {
  const { language } = useLanguage();
  const copy = HOME_COPY[language] ?? HOME_COPY.en;
  const toolCategories = getToolCategories(language);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-6 py-20 md:py-28">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-cyan-500 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              {copy.heroBadge}
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
              {copy.heroTitle}{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {copy.heroHighlight}
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300 md:text-xl">
              {copy.heroSubtitle}
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/tools/image-converter"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/40"
              >
                {copy.primaryCta}
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/tools/cv-builder"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {copy.secondaryCta}
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-slate-400">
              {copy.trustItems.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-12 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {copy.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-blue-600 md:text-4xl">{stat.number}</p>
                <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">{copy.problemTitle}</h2>
            <p className="mt-4 text-lg text-slate-600">{copy.problemBody}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {copy.cards.map((item) => (
              <div key={item.problem} className="group rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-lg">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-red-100">
                  <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="mb-4 text-lg font-semibold text-slate-700">{item.problem}</p>
                <div className="mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-medium text-green-600">{copy.withEazitool}</span>
                </div>
                <p className="text-slate-600">{item.solution}</p>
                <Link href={item.href} className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
                  {item.cta} -&gt;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">{copy.simpleTitle}</h2>
            <p className="mt-4 text-lg text-slate-600">{copy.simpleBody}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {copy.steps.map((item, index) => (
              <div key={item.title} className="relative text-center">
                <div className="absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-500/30">
                  {index + 1}
                </div>
                <div className="rounded-2xl bg-slate-50 p-8 pt-10">
                  <h3 className="mb-3 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">{copy.featuredTitle}</h2>
            <p className="mt-4 text-lg text-slate-400">{copy.featuredBody}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {toolCategories.map((category) => (
              <div
                key={category.category}
                className="rounded-2xl border border-slate-700 bg-slate-800 p-6 transition-all hover:border-blue-500/50"
              >
                <h3 className="text-lg font-semibold text-white">{category.category}</h3>
                <div className="mt-4 space-y-3">
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group block rounded-xl bg-slate-700/50 p-4 transition-all hover:bg-slate-700"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-white group-hover:text-blue-400">{item.label}</p>
                          <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                        </div>
                        <svg className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-600 to-cyan-600 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">{copy.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">{copy.ctaBody}</p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/tools/image-converter"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
            >
              {copy.ctaButton}
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">{copy.faqTitle}</h2>
            <p className="mt-4 text-lg text-slate-600">{copy.faqBody}</p>
          </div>

          <div className="space-y-4">
            {copy.faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-2 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 px-6 py-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-slate-500">{copy.footer}</p>
        </div>
      </section>
    </div>
  );
}
