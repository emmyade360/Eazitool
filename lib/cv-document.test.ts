import { describe, expect, it } from 'vitest';
import {
  CV_TEMPLATE_CATALOG,
  CV_TEMPLATE_IDS,
  getCVPhotoPlacementLabel,
  getCVTemplateDesign,
  getCVTemplateLayout,
  getCVTemplateTheme,
  parseResumeMarkdown,
} from './cv-document';

describe('CV document templates', () => {
  it('offers 100 distinct original template presets', () => {
    expect(CV_TEMPLATE_CATALOG).toHaveLength(100);
    expect(new Set(CV_TEMPLATE_IDS).size).toBe(100);
    expect(new Set(CV_TEMPLATE_CATALOG.map((template) => template.label)).size).toBe(100);
    expect(new Set(CV_TEMPLATE_CATALOG.map((template) => `${template.design.headerStyle}-${template.design.sectionStyle}`)).size).toBe(100);

    for (const template of CV_TEMPLATE_CATALOG) {
      expect(getCVTemplateLayout(template.id)).toBe(template.layout);
      expect(getCVTemplateTheme(template.id).name).toBe(template.label);
      expect(getCVTemplateDesign(template.id)).toEqual(template.design);
      expect(getCVPhotoPlacementLabel(template.id)).toBeTruthy();
      if (template.design.photoPlacement === 'sidebar-top') {
        expect(['sidebar-left', 'sidebar-right']).toContain(template.design.bodyStyle);
      }
    }
  });

  it('treats a level-one Markdown candidate name as header data', () => {
    const resume = parseResumeMarkdown(`
# Ada Lovelace
ada@example.com
+234 800 000 0000

## Professional Summary
Analytical engineer with a record of clear technical writing.
`);

    expect(resume.header.name).toBe('Ada Lovelace');
    expect(resume.header.contacts).toEqual(['+234 800 000 0000']);
    expect(resume.sections[0]?.title).toBe('Professional Summary');
  });

  it('uses the Contact-section name when a model omits a separate header', () => {
    const resume = parseResumeMarkdown(`
## Contact
Name: Emmanuel Adejoh
Email: emmanuel@example.com

## Professional Summary
Full-stack developer with five years of experience.
`);

    expect(resume.header.name).toBe('Emmanuel Adejoh');
  });
});
