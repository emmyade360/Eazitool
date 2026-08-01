import { getTool } from '@/lib/tools/registry';

const STORAGE_KEY = 'eazitool_reviews_seen';

/**
 * documentType is a per-action string like `image-resize-webp`. Resolve it to a
 * registry tool id so each tool gets its own once-per-day gate.
 */
function toolKey(documentType: string): string {
  if (getTool(documentType)) return documentType;

  const match = documentType.match(/^(.*)-[^-]+$/);
  if (match && getTool(match[1])) return match[1];

  // Legacy action prefixes that predate the registry.
  if (documentType.startsWith('image-upscale')) return 'image-upscaler';
  if (documentType.startsWith('image-resize')) return 'image-resizer';
  if (documentType.startsWith('image-')) return 'image-converter';
  if (documentType.startsWith('document-')) return 'document-converter';
  if (documentType.startsWith('cv-')) return 'cv-builder';

  return documentType;
}

export function hasReviewedToday(documentType: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const records: Record<string, string> = JSON.parse(raw);
    const last = records[toolKey(documentType)];
    if (!last) return false;
    return new Date(last).toDateString() === new Date().toDateString();
  } catch {
    return false;
  }
}

export function markReviewed(documentType: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const records: Record<string, string> = raw ? JSON.parse(raw) : {};
    records[toolKey(documentType)] = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}
