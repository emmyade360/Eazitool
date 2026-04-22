import Link from "next/link";
import { buildFaqSchema, type FaqItem } from "@/app/seo";

interface RelatedTool {
  href: string;
  title: string;
  description: string;
}

interface ToolSeoSectionsProps {
  path: string;
  title: string;
  description: string;
  faqs: FaqItem[];
  relatedTools: RelatedTool[];
}

export function ToolSeoSections({
  path,
  title,
  description,
  faqs,
  relatedTools,
}: ToolSeoSectionsProps) {
  const faqSchema = buildFaqSchema(path, faqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="mt-10 space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            SEO Overview
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
              >
                <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Related tools</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {relatedTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-slate-300 hover:bg-white"
              >
                <p className="text-base font-semibold text-slate-900">{tool.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
