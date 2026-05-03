import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Eazitool, including ads, cookies, and file processing disclosures.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
        <div className="border-b border-blue-50 bg-gradient-to-br from-blue-50 to-white px-6 py-8 sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-500">Privacy</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-900 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            This page explains how Eazitool handles cookies, ads, and uploaded files. It is written to support ad platform review and user transparency.
          </p>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Information we process</h2>
            <p className="text-sm leading-7 text-slate-600">
              When you use our tools, we may process files you upload for the purpose of converting, resizing, improving, or exporting them. We also process basic technical data such as browser type, device information, and pages visited to keep the service working and to measure performance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Ads and cookies</h2>
            <p className="text-sm leading-7 text-slate-600">
              Eazitool may display ads through Google AdSense. Google and its partners may use cookies and similar technologies to serve ads based on your visits to this site and other sites on the internet.
            </p>
            <p className="text-sm leading-7 text-slate-600">
              You can manage ad personalization through your Google Ads Settings and other consent or privacy controls available in your region.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">File handling</h2>
            <p className="text-sm leading-7 text-slate-600">
              Uploaded files are used only to perform the requested tool action. We do not sell uploaded files. If a tool needs temporary processing, the file is handled only for that conversion or export workflow.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Third-party services</h2>
            <p className="text-sm leading-7 text-slate-600">
              Eazitool may rely on third-party services for analytics, storage, conversion, and advertising. Those providers operate under their own privacy policies and terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Contact</h2>
            <p className="text-sm leading-7 text-slate-600">
              If you have questions about this policy or our ad setup, please contact the site owner through the support or issue-reporting channels on the site.
            </p>
          </section>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
              Back Home
            </Link>
            <Link href="/tools" className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100">
              Browse Tools
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
