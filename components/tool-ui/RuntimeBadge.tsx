import type { ToolRuntime } from '@/lib/tools/types';

const VARIANTS: Record<ToolRuntime, { label: string; className: string }> = {
  client: {
    label: 'Works offline',
    className: 'bg-green-50 text-green-700 ring-green-200',
  },
  hybrid: {
    label: 'Works offline · better online',
    className: 'bg-green-50 text-green-700 ring-green-200',
  },
  server: {
    label: 'Needs internet',
    className: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
};

export function RuntimeBadge({ runtime }: { runtime: ToolRuntime }) {
  const variant = VARIANTS[runtime];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${variant.className}`}
    >
      {variant.label}
    </span>
  );
}
