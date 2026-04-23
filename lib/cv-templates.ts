export type ProfessionalTemplateId =
  | 'harvard'
  | 'stanford'
  | 'mckinsey'
  | 'google'
  | 'mit'
  | 'forbes';

export const PROFESSIONAL_TEMPLATE_META: Record<
  ProfessionalTemplateId,
  { label: string; blurb: string; bestFor: string }
> = {
  harvard: {
    label: 'Harvard Classic',
    blurb: 'Clean, traditional layout inspired by Harvard career services.',
    bestFor: 'Academia, law, corporate, conservative industries',
  },
  stanford: {
    label: 'Stanford Modern',
    blurb: 'Modern, tech-forward design with strong visual hierarchy.',
    bestFor: 'Tech, startups, engineering, product management',
  },
  mckinsey: {
    label: 'McKinsey Executive',
    blurb: 'Sophisticated, results-driven layout for senior roles.',
    bestFor: 'Consulting, executive leadership, strategy roles',
  },
  google: {
    label: 'Google Minimal',
    blurb: 'Clean, minimalist design following Google\'s design principles.',
    bestFor: 'Tech, design, UX/UI, creative tech roles',
  },
  mit: {
    label: 'MIT Technical',
    blurb: 'Structured, technical-focused layout for engineering roles.',
    bestFor: 'Engineering, research, scientific, technical roles',
  },
  forbes: {
    label: 'Forbes Bold',
    blurb: 'Bold, attention-grabbing design for business leaders.',
    bestFor: 'Business development, sales, entrepreneurship, finance',
  },
};

export function buildTemplatePrompt(
  templateId: ProfessionalTemplateId,
  content: string
): string {
  const basePrompt = `You are an expert HTML/CSS developer specializing in ATS-friendly CV templates.

Generate a complete, professional CV in HTML with embedded CSS that matches the ${PROFESSIONAL_TEMPLATE_META[templateId].label} style.

CRITICAL REQUIREMENTS:
- Output ONLY valid HTML with embedded CSS in <style> tags
- ATS-friendly: no tables for layout, no images, standard HTML structure
- Use semantic HTML: <header>, <section>, <article>, <h1>-<h6>, <ul>, <li>
- CSS must be embedded in <style> tags (no external files)
- Use standard fonts: Arial, Helvetica, Times New Roman, or Georgia
- Print-friendly: use @media print styles
- Page size: A4 (210mm x 297mm) or standard US Letter
- Font sizes: 10-12pt for body, 14-18pt for headings
- Line height: 1.3-1.6 for readability

REQUIRED CSS CLASSES (map content to these):
- .cv-header (main header container)
- .cv-name (full name, largest text)
- .cv-tagline (professional tagline/title)
- .cv-contact (contact info container)
- .cv-contact-item (individual contact items)
- .cv-section (each major section)
- .cv-section-title (section headings)
- .cv-entry (each job/education entry)
- .cv-entry-title (job title, company, or degree)
- .cv-entry-meta (dates, location, GPA)
- .cv-bullets (unordered list of achievements)
- .cv-bullet (individual bullet point)

TEMPLATE-SPECIFIC STYLING:`;

  const templateStyles: Record<ProfessionalTemplateId, string> = {
    harvard: `
- Classic serif font (Times New Roman, Georgia)
- Traditional black and white color scheme
- Clear section headings in ALL CAPS
- Underlined section headers
- Left-aligned, single-column layout
- Generous margins (1 inch / 2.54cm)
- Conservative spacing, formal appearance
- Bold company/job titles`,

    stanford: `
- Modern sans-serif font (Arial, Helvetica)
- Two-column layout: narrow left sidebar for contact/skills
- Teal or blue accent color (#0D9488 or #2563EB)
- Rounded corners on sections
- Icon-like bullet points (small squares or circles)
- Clean, airy spacing
- Subtle shadows or borders
- Modern gradient header (optional)`,

    mckinsey: `
- Executive serif font (Georgia, Times)
- Dark navy accent (#1E3A8A) with gold highlights (#F59E0B)
- Strong horizontal rules between sections
- Right-aligned dates
- Bold metrics and numbers
- Ample white space
- Sophisticated, premium feel
- Understated elegance`,

    google: `
- Clean sans-serif (Arial, Roboto)
- Material Design inspired: cards with subtle shadows
- Blue accent (#4285F4) with complementary colors
- Border-radius on containers (8px)
- Minimalist, lots of white space
- Simple, clear hierarchy
- No unnecessary decoration
- Modern, friendly appearance`,

    mit: `
- Technical monospace/sans-serif mix (Consolas, Arial)
- Structured grid layout
- Dark gray (#374151) with bright accent (#10B981)
- Code-like formatting for technical skills
- Clear section numbering (1. 2. 3.)
- Technical schematic aesthetic
- Precise, engineering-focused design
- Monospace for technical details`,

    forbes: `
- Bold sans-serif (Arial Black, Impact for headers)
- Strong contrast: black text on white, red accents (#DC2626)
- Large, bold name header
- Horizontal accent bars
- Executive summary box with colored background
- Strong visual impact
- Business-appropriate but attention-grabbing
- Professional yet distinctive`,
  };

  return `${basePrompt}
${templateStyles[templateId]}

CONTENT TO RENDER:
---
${content}
---

Output the complete HTML document with embedded CSS now:`;
}
