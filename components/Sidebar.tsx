'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from './language-context';
import { getToolCategories } from './tools-data';

const COLOR = {
  blue:    { active: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-500',    hover: 'hover:bg-blue-50 hover:text-blue-700',    badge: 'bg-blue-100 text-blue-700' },
  violet:  { active: 'bg-violet-50 text-violet-600', dot: 'bg-violet-500',  hover: 'hover:bg-violet-50 hover:text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  emerald: { active: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', hover: 'hover:bg-emerald-50 hover:text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
};

const staticItems = [
  { label: 'Home', href: '/', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
];

function getOpenCategories(
  pathname: string,
  toolCategories: ReturnType<typeof getToolCategories>
): Record<string, boolean> {
  return Object.fromEntries(
    toolCategories.map((cat) => [
      cat.category,
      cat.items.some((item) => pathname === item.href.split('?')[0]),
    ])
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const toolCategories = useMemo(() => getToolCategories(language), [language]);
  const [toolsOpen, setToolsOpen] = useState(() => pathname.startsWith('/tools'));
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
    getOpenCategories(pathname, toolCategories)
  );

  useEffect(() => {
    const nextOpenCategories = getOpenCategories(pathname, toolCategories);
    const frame = window.requestAnimationFrame(() => {
      setOpenCategories((current) => {
        const currentKeys = Object.keys(current);
        const nextKeys = Object.keys(nextOpenCategories);

        const isSame =
          currentKeys.length === nextKeys.length &&
          nextKeys.every((key) => current[key] === nextOpenCategories[key]);

        return isSame ? current : nextOpenCategories;
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, toolCategories]);

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-blue-100 hidden md:flex md:flex-col overflow-y-auto">
      <div className="flex-1 p-4 space-y-1">

        {/* Static items above tools */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-blue-800 hover:bg-blue-50'}`}
        >
          <svg className={`w-5 h-5 ${pathname === '/' ? 'text-blue-600' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={staticItems[0].d} />
          </svg>
          {t('nav.home')}
        </Link>

        {/* Tools accordion */}
        <div>
          <button
            onClick={() => setToolsOpen(v => !v)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
              pathname.startsWith('/tools') ? 'bg-blue-50 text-blue-600' : 'text-blue-800 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className={`w-5 h-5 ${pathname.startsWith('/tools') ? 'text-blue-600' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
              {t('nav.tools')}
            </div>
            <svg className={`w-4 h-4 text-blue-400 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {toolsOpen && (
            <div className="mt-1 space-y-3">
              {toolCategories.map((cat) => {
                const c = COLOR[cat.color as keyof typeof COLOR];
                const isCategoryOpen = openCategories[cat.category] ?? false;
                return (
                  <div key={cat.category}>
                    <button
                      type="button"
                      onClick={() => setOpenCategories((prev) => ({
                        ...prev,
                        [cat.category]: !isCategoryOpen,
                      }))}
                      className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">{cat.category}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isCategoryOpen && (
                      <div className="space-y-0.5 pl-2 mt-1">
                        {cat.items.map((item) => {
                          const isActive = pathname === item.href.split('?')[0];
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                                isActive ? c.active : `text-slate-600 ${c.hover}`
                              }`}
                            >
                              <span className="font-medium">{item.label}</span>
                              {'badge' in item && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${c.badge}`}>{item.badge}</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </div>
    </aside>
  );
}
