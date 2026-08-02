import type { FaqItem } from '@/app/seo';

export type ToolCategoryId =
  | 'job-safety'
  | 'cv'
  | 'documents'
  | 'images'
  | 'career'
  | 'legal'
  | 'business'
  | 'packs';

/** `hybrid` works offline but produces a richer result when online. */
export type ToolRuntime = 'client' | 'server' | 'hybrid';

export type ToolBadge = 'AI' | 'NEW' | 'BETA' | 'ROAST';

export type CategoryColor = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';

export interface ToolSeo {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  overview: string;
  faqs: FaqItem[];
  relatedToolIds: string[];
}

export interface ToolSitemapConfig {
  include?: boolean;
  priority?: number;
  changeFrequency?: 'weekly' | 'monthly';
}

export interface ToolMobileNavConfig {
  order: number;
  label: string;
  iconPath: string;
  matchPrefixes?: string[];
}

export interface ToolDef {
  /** Stable key. Also the review-gate key, so it must never be reused. */
  id: string;
  href: `/${string}`;
  category: ToolCategoryId;
  title: string;
  shortDescription: string;
  runtime: ToolRuntime;
  badges?: ToolBadge[];
  iconPath?: string;
  status: 'live' | 'planned';
  seo: ToolSeo;
  sitemap?: ToolSitemapConfig;
  mobileNav?: ToolMobileNavConfig;
}

/**
 * A query-string preset of an existing tool (e.g. ?from=pdf&to=docx).
 * Listed on /tools but never given its own sitemap entry — the parent tool's
 * layout sets a canonical URL that variants would otherwise duplicate.
 */
export interface ToolVariant {
  id: string;
  toolId: string;
  href: string;
  title: string;
  shortDescription: string;
}

export interface CategoryDef {
  id: ToolCategoryId;
  label: string;
  iconPath: string;
  color: CategoryColor;
  order: number;
}

export type ListingEntry =
  | { kind: 'tool'; tool: ToolDef }
  | { kind: 'variant'; variant: ToolVariant };
