"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT = "ca-pub-6908793973331683";
const ADSENSE_SLOT = "3613679664";

type AdSenseUnitProps = {
  className?: string;
  label?: string;
};

export default function AdSenseUnit({ className = "", label = "Advertisement" }: AdSenseUnitProps) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense is best-effort during local development.
    }
  }, []);

  return (
    <section aria-label={label} className={className}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
          </div>
          <ins
            className="adsbygoogle block"
            style={{ display: "block", minHeight: "100px" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={ADSENSE_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </section>
  );
}
