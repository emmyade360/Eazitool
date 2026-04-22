'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOOL_CATEGORIES } from './tools-data';

const COLOR = {
  blue:    { active: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-500',    hover: 'hover:bg-blue-50 hover:text-blue-700',    badge: 'bg-blue-100 text-blue-700' },
  violet:  { active: 'bg-violet-50 text-violet-600', dot: 'bg-violet-500',  hover: 'hover:bg-violet-50 hover:text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  emerald: { active: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', hover: 'hover:bg-emerald-50 hover:text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
};

const staticItems = [
  { label: 'Home', href: '/',                d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Analytics', href: '#analytics',  d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14' },
  { label: 'Settings',  href: '#settings',   d: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(() => pathname.startsWith('/tools'));
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      TOOL_CATEGORIES.map((cat) => [
        cat.category,
        cat.items.some((item) => pathname === item.href.split('?')[0]),
      ])
    )
  );

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
          Home
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
              Tools
            </div>
            <svg className={`w-4 h-4 text-blue-400 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {toolsOpen && (
            <div className="mt-1 space-y-3">
              {TOOL_CATEGORIES.map((cat) => {
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

        {/* Analytics & Settings */}
        {staticItems.slice(1).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-blue-800 hover:bg-blue-50 font-medium transition-all"
          >
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.d} />
            </svg>
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
