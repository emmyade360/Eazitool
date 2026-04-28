'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from './language-context';
import type { LanguageCode } from '@/lib/i18n';

const LANGUAGE_FLAGS: Record<LanguageCode, string> = {
  en: '🇺🇸',
  fr: '🇫🇷',
  es: '🇪🇸',
  pt: '🇵🇹',
  ar: '🇸🇦',
  sw: '🇰🇪',
};

function LanguageSelector({ onClose }: { onClose?: () => void }) {
  const { language, setLanguage, languages, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <label className="sr-only">{t('nav.language')}</label>
      <select
        value={language}
        onChange={(e) => {
          setLanguage(e.target.value as LanguageCode);
          onClose?.();
        }}
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

function MobileFlagSelector() {
  const { language, setLanguage, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-colors hover:bg-blue-50"
        aria-label="Select language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {LANGUAGE_FLAGS[language]}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Language"
          className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg"
        >
          {languages.map((item) => (
            <button
              key={item.code}
              role="option"
              aria-selected={language === item.code}
              onClick={() => {
                setLanguage(item.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                language === item.code
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-blue-800 hover:bg-blue-50'
              }`}
            >
              <span className="text-base">{LANGUAGE_FLAGS[item.code]}</span>
              <span>{item.nativeLabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the menu whenever the route changes (link was tapped)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/tools', label: t('nav.tools') },
  ];

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-blue-200 bg-white px-4 shadow-sm sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-base font-bold text-white">E</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-blue-600">Eazitool</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-medium transition-colors hover:text-blue-600 ${
                pathname === link.href ? 'text-blue-600' : 'text-blue-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSelector />
        </div>

        {/* Mobile right side: flag selector + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <MobileFlagSelector />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-blue-800 transition-colors hover:bg-blue-50"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          {/* Menu panel */}
          <div className="animate-slide-up fixed left-0 right-0 top-16 z-40 border-b border-blue-100 bg-white shadow-lg md:hidden">
            <div className="space-y-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    pathname === link.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-blue-800 hover:bg-blue-50'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
