import Link from "next/link";
import { buildFaqSchema } from "@/app/seo";
import { getRelatedTools, requireTool } from "@/lib/tools/registry";

export function ToolSeoSections({ toolId }: { toolId: string }) {
  const tool = requireTool(toolId);
  const { overview, faqs } = tool.seo;
  const relatedTools = getRelatedTools(toolId);
  const faqSchema = buildFaqSchema(tool.href, faqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="mx-auto mt-10 max-w-4xl space-y-8 px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">About {tool.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{overview}</p>
        </div>

        {faqs.length > 0 && (
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
        )}

        {relatedTools.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Related tools</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {relatedTools.map((related) => (
                <Link
                  key={related.href}
                  href={related.href}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-slate-300 hover:bg-white"
                >
                  <p className="text-base font-semibold text-slate-900">{related.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{related.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
