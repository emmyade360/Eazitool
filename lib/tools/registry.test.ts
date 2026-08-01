import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  TOOLS,
  TOOL_VARIANTS,
  getListing,
  getMobileNavItems,
  getRelatedTools,
  getSitemapEntries,
  getTool,
  toolMetadata,
} from './registry';

describe('registry integrity', () => {
  it('has unique tool ids', () => {
    const ids = TOOLS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique tool hrefs', () => {
    const hrefs = TOOLS.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('points every tool at a declared category', () => {
    const categoryIds = new Set(CATEGORIES.map((c) => c.id));
    for (const tool of TOOLS) {
      expect(categoryIds, `${tool.id} category`).toContain(tool.category);
    }
  });

  it('resolves every relatedToolIds reference', () => {
    for (const tool of TOOLS) {
      for (const relatedId of tool.seo.relatedToolIds) {
        expect(getTool(relatedId), `${tool.id} -> ${relatedId}`).toBeDefined();
      }
    }
  });

  it('never lists a tool as related to itself', () => {
    for (const tool of TOOLS) {
      expect(tool.seo.relatedToolIds).not.toContain(tool.id);
    }
  });

  it('attaches every variant to a real tool', () => {
    for (const variant of TOOL_VARIANTS) {
      expect(getTool(variant.toolId), variant.id).toBeDefined();
    }
  });

  it('gives every tool SEO copy and at least one FAQ', () => {
    for (const tool of TOOLS) {
      expect(tool.seo.metaTitle.length, tool.id).toBeGreaterThan(0);
      expect(tool.seo.metaDescription.length, tool.id).toBeGreaterThan(0);
      expect(tool.seo.overview.length, tool.id).toBeGreaterThan(0);
      expect(tool.seo.faqs.length, tool.id).toBeGreaterThan(0);
    }
  });

  it('keeps meta descriptions within a sane length for search results', () => {
    for (const tool of TOOLS) {
      expect(tool.seo.metaDescription.length, tool.id).toBeLessThanOrEqual(200);
    }
  });
});

describe('derived views', () => {
  it('includes every live tool in the sitemap and excludes variants', () => {
    const paths = getSitemapEntries().map((e) => e.path);
    for (const tool of TOOLS.filter((t) => t.status === 'live')) {
      expect(paths).toContain(tool.href);
    }
    for (const variant of TOOL_VARIANTS) {
      expect(paths).not.toContain(variant.href);
    }
  });

  it('covers the previously missing /roast-cv route', () => {
    expect(getSitemapEntries().map((e) => e.path)).toContain('/roast-cv');
  });

  it('places every tool (live and planned) in the listing exactly once', () => {
    const listed = getListing()
      .flatMap((group) => group.entries)
      .filter((e) => e.kind === 'tool')
      .map((e) => (e.kind === 'tool' ? e.tool.id : ''));

    const all = TOOLS.map((t) => t.id);
    expect(listed.sort()).toEqual(all.sort());
  });

  it('lists live tools before planned tools within each category', () => {
    for (const group of getListing()) {
      const statuses = group.entries
        .filter((e) => e.kind === 'tool')
        .map((e) => (e.kind === 'tool' ? e.tool.status : 'live'));
      const firstPlanned = statuses.indexOf('planned');
      if (firstPlanned === -1) continue;
      expect(statuses.slice(firstPlanned).every((s) => s === 'planned'), group.category.id).toBe(
        true,
      );
    }
  });

  it('keeps planned tools out of the sitemap', () => {
    const paths = getSitemapEntries().map((e) => e.path);
    for (const tool of TOOLS.filter((t) => t.status === 'planned')) {
      expect(paths, tool.id).not.toContain(tool.href);
    }
  });

  it('starts mobile nav with Home and marks the active route', () => {
    const items = getMobileNavItems();
    expect(items[0].href).toBe('/');
    expect(items[0].isActive('/')).toBe(true);
    expect(items[0].isActive('/tools')).toBe(false);
  });

  it('treats image-upscaler as part of the Images nav slot', () => {
    const images = getMobileNavItems().find((i) => i.label === 'Images');
    expect(images?.isActive('/tools/image-upscaler')).toBe(true);
  });

  it('resolves related tools to real links', () => {
    const related = getRelatedTools('image-resizer');
    expect(related.length).toBeGreaterThan(0);
    for (const item of related) {
      expect(item.href.startsWith('/')).toBe(true);
      expect(item.title.length).toBeGreaterThan(0);
    }
  });
});

describe('toolMetadata', () => {
  it('builds an absolute title so the root template is not appended twice', () => {
    const meta = toolMetadata('image-resizer');
    expect(meta.title).toEqual({
      absolute: 'Free Image Resizer Online | Resize Images to Exact Dimensions | Eazitool',
    });
  });

  it('sets a canonical path matching the tool href', () => {
    expect(toolMetadata('roast-cv').alternates?.canonical).toBe('/roast-cv');
  });

  it('throws on an unknown tool id rather than rendering empty metadata', () => {
    expect(() => toolMetadata('does-not-exist')).toThrow(/Unknown tool id/);
  });
});
