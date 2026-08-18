import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Eazitool, including file processing, browser storage and AI disclosures.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
        <div className="border-b border-blue-50 bg-gradient-to-br from-blue-50 to-white px-6 py-8 sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-500">Privacy</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-900 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            This page explains how Eazitool handles files, browser storage and third-party processing.
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
            <h2 className="text-lg font-bold text-slate-900">Browser storage</h2>
            <p className="text-sm leading-7 text-slate-600">
              Eazitool does not currently display advertising or use advertising cookies. Some tools save preferences or a business profile in your browser&apos;s local storage so you do not have to type the same details again. This information stays on your device unless you clear it. We also use a first-party, HTTP-only cookie containing a random visitor ID to recognise returning visits and associate feedback with visitor activity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Feedback and visitor activity</h2>
            <p className="text-sm leading-7 text-slate-600">
              Ratings, comments, optional email addresses, visitor IDs, pages visited and visit times are stored in Eazitool&apos;s protected feedback record so the site owner can review and improve Eazitool. We do not store a readable IP address: we store a secret-keyed hash of it solely to help identify repeat activity and protect the service from abuse. This data is not used for advertising or sold to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">File handling</h2>
            <p className="text-sm leading-7 text-slate-600">
              Uploaded files are used only to perform the requested tool action. We do not sell uploaded files. If a tool needs temporary processing, the file is handled only for that conversion or export workflow.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">AI processing</h2>
            <p className="text-sm leading-7 text-slate-600">
              Some tools (the CV builder, Roast My CV, and the optional plain-language explanation in
              the Scam Message Checker) send text to a third-party AI provider (Groq) to generate
              their output. For the Scam Message Checker, personal information such as phone numbers,
              account numbers and names is hidden in your browser before anything is sent, and you can
              review exactly what will be shared. We do not store these requests, and request contents
              are not written to our logs.
            </p>
            <p className="text-sm leading-7 text-slate-600">
              Tools marked &quot;Works offline&quot; process everything on your device — nothing is
              uploaded at all.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Third-party services</h2>
            <p className="text-sm leading-7 text-slate-600">
              Eazitool may rely on third-party services for AI processing or server-side conversion. Those providers operate under their own privacy policies and terms. Tools marked as browser-based or offline process files on your device.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Contact</h2>
            <p className="text-sm leading-7 text-slate-600">
              If you have questions about this policy or file processing, please contact the site owner through the support or issue-reporting channels on the site.
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
