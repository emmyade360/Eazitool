'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ReportIssueModal from './ReportIssueModal';

export default function Navbar() {
  const pathname = usePathname();
  const [reportOpen, setReportOpen] = useState(false);

  // Track which route the menu was opened on, so navigating anywhere closes it
  // without needing an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const mobileOpen = openedOn === pathname;
  const setMobileOpen = (next: boolean) => setOpenedOn(next ? pathname : null);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/tools', label: 'Tools' },
    { href: '/privacy', label: 'Privacy' },
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
          <button
            onClick={() => setReportOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Report an issue"
            title="Report an issue"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </button>
        </div>

        {/* Mobile right side: flag selector + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-blue-800 transition-colors hover:bg-blue-50"
            onClick={() => setMobileOpen(!mobileOpen)}
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
              <button
                onClick={() => { setMobileOpen(false); setReportOpen(true); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                Report an Issue
              </button>
            </div>
          </div>
        </>
      )}

      <ReportIssueModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}
