import Link from "next/link";
import { getListing } from "@/lib/tools/registry";
import { RuntimeBadge } from "@/components/tool-ui/RuntimeBadge";

export default function ToolsPage() {
  const listing = getListing();

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">All Tools</h1>
          <p className="mt-4 text-lg text-slate-600">
            Browse our collection of AI-powered and conversion tools.
          </p>
        </div>

        <div className="space-y-8">
          {listing.map(({ category, entries }) => (
            <div
              key={category.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <h2 className="mb-6 text-xl font-bold text-slate-800">{category.label}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry) => {
                  const isTool = entry.kind === "tool";
                  const href = isTool ? entry.tool.href : entry.variant.href;
                  const title = isTool ? entry.tool.title : entry.variant.title;
                  const description = isTool
                    ? entry.tool.shortDescription
                    : entry.variant.shortDescription;

                  if (isTool && entry.tool.status === "planned") {
                    return (
                      <div
                        key={href}
                        className="block rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-500">{title}</h3>
                            <p className="mt-2 text-sm text-slate-400">{description}</p>
                          </div>
                          <span className="flex-shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            SOON
                          </span>
                        </div>
                        <div className="mt-3">
                          <RuntimeBadge runtime={entry.tool.runtime} />
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-400">Coming soon</p>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={href}
                      href={href}
                      prefetch={false}
                      className="group block rounded-xl border border-slate-100 bg-slate-50 p-5 transition-all hover:border-blue-200 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-800 group-hover:text-blue-600">
                            {title}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">{description}</p>
                        </div>
                        {isTool && entry.tool.badges?.[0] && (
                          <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            {entry.tool.badges[0]}
                          </span>
                        )}
                      </div>

                      {isTool && (
                        <div className="mt-3">
                          <RuntimeBadge runtime={entry.tool.runtime} />
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600">
                        Use Tool
                        <svg
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
