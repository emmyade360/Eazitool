'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getMobileNavItems } from '@/lib/tools/registry';

const NAV_ITEMS = getMobileNavItems();

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                  active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center transition-transform ${
                    active ? 'scale-110' : ''
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.iconPath}
                    />
                  </svg>
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
