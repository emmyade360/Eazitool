'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/** Records a page view after the visitor's first-party ID cookie is available. */
export default function VisitorTracker() {
  const pathname = usePathname();
  const trackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || trackedPath.current === pathname) return;
    trackedPath.current = pathname;

    void fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    });
  }, [pathname]);

  return null;
}
