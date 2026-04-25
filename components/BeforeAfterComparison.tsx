interface BeforeAfterComparisonProps {
  before: string;
  after: string;
  onClose: () => void;
}

export function BeforeAfterComparison({ before, after, onClose }: BeforeAfterComparisonProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Bullet Rewrite Comparison</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Before */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">BEFORE</span>
            </div>
            <span className="text-xs text-red-600">Original</span>
          </div>
          <p className="text-slate-600">{before}</p>
        </div>

        {/* After */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">AFTER</span>
            </div>
            <span className="text-xs text-green-600">AI-Improved</span>
          </div>
          <p className="text-slate-800 font-medium">{after}</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-2 text-sm font-bold text-slate-700">Why this improvement?</h4>
        <ul className="space-y-1 text-sm text-slate-600">
          <li>✓ Starts with a strong action verb</li>
          <li>✓ Quantifies impact where possible</li>
          <li>✓ Focuses on results, not just responsibilities</li>
          <li>✓ Uses ATS-friendly keywords</li>
          <li>✓ More concise and scannable</li>
        </ul>
      </div>
    </div>
  );
}
