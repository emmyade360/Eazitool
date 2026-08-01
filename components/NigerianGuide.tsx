interface NigerianGuideProps {
  title: string;
  english: string;
  pidgin: string;
}

/** Short, practical guidance for the Nigerian workflows these tools serve. */
export function NigerianGuide({ title, english, pidgin }: NigerianGuideProps) {
  return (
    <aside className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-slate-700" aria-label={`${title} guide`}>
      <h2 className="font-bold text-blue-900">{title}</h2>
      <p className="mt-2 leading-6">{english}</p>
      <p className="mt-2 border-t border-blue-100 pt-2 leading-6 text-slate-600">
        <span className="font-semibold text-blue-800">Pidgin:</span> {pidgin}
      </p>
    </aside>
  );
}
