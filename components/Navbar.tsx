'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from './language-context';
import { getToolCategories } from './tools-data';

const TOOL_ICONS = {
  cv: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  doc: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
} as const;

function LanguageSelector({
  mobile = false,
  closeMobileMenu,
}: {
  mobile?: boolean;
  closeMobileMenu?: () => void;
}) {
  const { language, setLanguage, languages, t } = useLanguage();

  if (mobile) {
    return (
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-blue-700">
          {t('nav.language')}
        </label>
        <select
          value={language}
          onChange={(event) => {
            setLanguage(event.target.value as typeof language);
            closeMobileMenu?.();
          }}
          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={t('nav.language')}
        >
          {languages.map((item) => (
            <option key={item.code} value={item.code}>
              {item.nativeLabel}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-blue-600">{t('nav.languageHelper')}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-blue-700">{t('nav.language')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as typeof language)}
        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label={t('nav.language')}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.nativeLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Navbar() {
  const { language, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileTools, setMobileTools] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toolCategories = useMemo(() => getToolCategories(language), [language]);
  const tools = useMemo(
    () =>
      toolCategories.flatMap((category) =>
        category.items.map((tool) => ({
          ...tool,
          icon: tool.icon ?? TOOL_ICONS.image,
          category: category.category,
        }))
      ),
    [toolCategories]
  );

  const openTools = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setToolsOpen(true);
  };

  const closeTools = () => {
    closeTimer.current = setTimeout(() => setToolsOpen(false), 150);
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setMobileTools(false);
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-blue-200 bg-white px-6 shadow-sm">
      <Link href="/" className="flex items-center gap-3">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-lg bg-blue-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">E</span>
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-blue-600">Eazitool</h1>
      </Link>

      <div className="hidden items-center gap-6 md:flex">
        <Link href="/" className="flex items-center gap-2 font-medium text-blue-800 transition-colors hover:text-blue-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {t('nav.home')}
        </Link>

        <div className="relative" onMouseEnter={openTools} onMouseLeave={closeTools}>
          <button
            onClick={() => setToolsOpen((value) => !value)}
            className="flex items-center gap-1.5 font-medium text-blue-800 transition-colors hover:text-blue-600"
          >
            {t('nav.tools')}
            <svg className={`h-4 w-4 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {toolsOpen && (
            <div
              onMouseEnter={openTools}
              onMouseLeave={closeTools}
              className="absolute left-1/2 top-full mt-2 w-72 -translate-x-1/2 rounded-xl border border-blue-100 bg-white p-2 shadow-lg"
            >
              {tools.map((tool, index) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setToolsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-blue-50 ${index !== tools.length - 1 ? 'mb-1' : ''}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">{tool.label}</p>
                    <p className="text-xs text-blue-500">{tool.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="#services" className="font-medium text-blue-800 transition-colors hover:text-blue-600">
          {t('nav.services')}
        </Link>
        <Link href="#contact" className="font-medium text-blue-800 transition-colors hover:text-blue-600">
          {t('nav.contact')}
        </Link>
        <LanguageSelector />
      </div>

      <button className="p-2 md:hidden" onClick={() => setMobileOpen((value) => !value)}>
        <svg className="h-6 w-6 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {mobileOpen && (
        <div className="absolute left-0 right-0 top-16 border-b border-blue-100 bg-white shadow-lg md:hidden">
          <div className="space-y-2 p-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 font-medium text-blue-800 hover:bg-blue-50"
              onClick={closeMobileMenu}
            >
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {t('nav.home')}
            </Link>

            <button
              onClick={() => setMobileTools((value) => !value)}
              className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 font-medium text-blue-800 hover:bg-blue-50"
            >
              {t('nav.tools')}
              <svg className={`h-4 w-4 ${mobileTools ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mobileTools && (
              <div className="ml-4 space-y-3 py-2">
                {toolCategories.map((category) => (
                  <div key={category.category}>
                    <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {category.category}
                    </p>
                    <div className="space-y-1">
                      {category.items.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          onClick={closeMobileMenu}
                          className="flex items-center gap-3 rounded-lg px-4 py-2.5 hover:bg-blue-50"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={tool.icon ?? TOOL_ICONS.image}
                              />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-blue-800">{tool.label}</p>
                            <p className="truncate text-xs text-blue-500">{tool.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link href="#services" className="block rounded-lg px-4 py-2.5 text-blue-800 hover:bg-blue-50" onClick={closeMobileMenu}>
              {t('nav.services')}
            </Link>
            <Link href="#contact" className="block rounded-lg px-4 py-2.5 text-blue-800 hover:bg-blue-50" onClick={closeMobileMenu}>
              {t('nav.contact')}
            </Link>
            <LanguageSelector mobile closeMobileMenu={closeMobileMenu} />
          </div>
        </div>
      )}
    </nav>
  );
}
