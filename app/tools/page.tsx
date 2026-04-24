'use client';

import Link from "next/link";
import { useLanguage } from "@/components/language-context";
import { getToolCategories } from "@/components/tools-data";

export default function ToolsPage() {
  const { language } = useLanguage();
  const toolCategories = getToolCategories(language);

  const title = language === 'fr' ? 'Tous les outils' :
    language === 'es' ? 'Todas las herramientas' :
    language === 'pt' ? 'Todas as ferramentas' :
    language === 'ar' ? 'All Tools' :
    language === 'sw' ? 'Zana Zote' :
    'All Tools';

  const subtitle = language === 'fr' ? 'Parcourez notre collection d\'outils IA et de conversion.' :
    language === 'es' ? 'Explora nuestra colección de herramientas con IA y conversión.' :
    language === 'pt' ? 'Navegue pela nossa coleção de ferramentas com IA e conversão.' :
    language === 'ar' ? 'Browse our collection of AI-powered and conversion tools.' :
    language === 'sw' ? 'Vinjari mkusanyiko wetu wa zana za AI na ubadilishaji.' :
    'Browse our collection of AI-powered and conversion tools.';

  const useToolText = language === 'fr' ? 'Utiliser' :
    language === 'es' ? 'Usar herramienta' :
    language === 'pt' ? 'Usar ferramenta' :
    language === 'ar' ? 'Use Tool' :
    language === 'sw' ? 'Tumia Zana' :
    'Use Tool';

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{title}</h1>
          <p className="mt-4 text-lg text-slate-600">{subtitle}</p>
        </div>

        <div className="space-y-8">
          {toolCategories.map((category) => (
            <div
              key={category.category}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <h2 className="mb-6 text-xl font-bold text-slate-800">{category.category}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group block rounded-xl border border-slate-100 bg-slate-50 p-5 transition-all hover:border-blue-200 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-800 group-hover:text-blue-600">{item.label}</h3>
                        <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                      </div>
                      {item.badge && (
                        <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600">
                      {useToolText}
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
