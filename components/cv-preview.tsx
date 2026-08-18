'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  getCVTemplateDesign,
  getCVTemplateTheme,
  parseResumeMarkdown,
  type CVPhotoPlacement,
  type CVTemplateDesign,
  type CVTemplateId,
  type CVTemplateTheme,
  type CVVariant,
  type ResumeDocument,
  type ResumeSection,
} from '@/lib/cv-document';
import { sanitizeHtml } from '@/lib/sanitize';

export {
  CV_TEMPLATE_CATALOG,
  CV_TEMPLATE_IDS,
  CV_TEMPLATE_META,
  getCVPhotoPlacementLabel,
  getCVTemplateDesign,
  getCVTemplateTheme,
  type CVPhotoPlacement,
  type CVTemplateCategory,
  type CVTemplateId,
  type CVVariant,
} from '@/lib/cv-document';
export { PROFESSIONAL_TEMPLATE_META, type ProfessionalTemplateId } from '@/lib/cv-templates';

const FONT_FAMILIES = {
  sans: 'Arial, Helvetica, sans-serif',
  serif: 'Georgia, Times New Roman, serif',
  mono: 'Consolas, Monaco, monospace',
} as const;

function hasContent(section: ResumeSection): boolean {
  return section.paragraphs.length > 0 || section.bullets.length > 0 || section.entries.some((entry) => entry.heading.trim() || entry.bullets.length > 0);
}

function photoPlacement(design: CVTemplateDesign): Exclude<CVPhotoPlacement, 'none'> {
  return design.photoPlacement === 'none' ? 'top-left' : design.photoPlacement;
}

function PassportPhoto({ src, design, compact, light = false }: { src?: string; design: CVTemplateDesign; compact: boolean; light?: boolean }) {
  if (!src) return null;
  const size = compact ? 52 : 88;
  const radius = design.photoShape === 'circle' ? '999px' : design.photoShape === 'rounded' ? '18px' : '4px';

  // User-provided data URLs cannot be optimized by next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Passport photo" className="shrink-0 object-cover shadow-sm" style={{ width: size, height: size, borderRadius: radius, border: `3px solid ${light ? 'rgba(255,255,255,0.8)' : '#FFFFFF'}` }} />;
}

function ContactList({ contacts, color, compact }: { contacts: string[]; color: string; compact: boolean }) {
  if (contacts.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1 ${compact ? 'text-[9px]' : 'text-[11px]'}`} style={{ color }}>
      {contacts.map((contact, index) => <span key={`${contact}-${index}`}>{contact}</span>)}
    </div>
  );
}

function SectionBlock({ section, index, theme, design, compact }: { section: ResumeSection; index: number; theme: CVTemplateTheme; design: CVTemplateDesign; compact: boolean }) {
  const isBox = design.sectionStyle === 'boxed';
  const isPill = design.sectionStyle === 'pill' || design.sectionStyle === 'capsule';
  const isTimeline = design.sectionStyle === 'timeline';
  const isBar = design.sectionStyle === 'accent-bar';
  const isMinimal = design.sectionStyle === 'minimal';
  const heading = design.sectionStyle === 'numbered' ? `${String(index + 1).padStart(2, '0')}  ${section.title}` : section.title;
  const titleStyle: CSSProperties = {
    color: isPill ? theme.panelBackground : theme.subheadingColor,
    backgroundColor: isPill ? theme.accentColor : undefined,
    borderRadius: isPill ? '999px' : undefined,
    padding: isPill ? '4px 10px' : undefined,
    letterSpacing: design.sectionStyle === 'label' ? '0.22em' : '0.12em',
  };
  const articleStyle: CSSProperties = {
    borderTop: isMinimal || isBox || isTimeline || isBar ? undefined : `1px solid ${theme.borderColor}`,
    border: isBox ? `1px solid ${theme.borderColor}` : undefined,
    borderLeft: isTimeline || isBar ? `4px solid ${theme.accentColor}` : undefined,
    backgroundColor: isBox ? theme.panelBackground : undefined,
    borderRadius: isBox ? '14px' : undefined,
    padding: isBox ? (compact ? '10px' : '14px') : undefined,
  };

  return (
    <section className={`${isMinimal ? '' : 'pt-4'} ${isTimeline || isBar ? 'pl-3' : ''}`} style={articleStyle}>
      <div className="flex items-center gap-2">
        {isBar && <span className="h-4 w-1 rounded-full" style={{ backgroundColor: theme.accentColor }} />}
        {isTimeline && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: theme.accentColor }} />}
        <h4 className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-bold uppercase`} style={titleStyle}>{heading}</h4>
      </div>
      <div className={`${compact ? 'mt-2 space-y-2' : 'mt-3 space-y-3'}`}>
        {section.paragraphs.map((paragraph, paragraphIndex) => <p key={`${section.title}-p-${paragraphIndex}`} className={`${compact ? 'text-[9px]' : 'text-xs'} leading-relaxed`}>{paragraph}</p>)}
        {section.bullets.length > 0 && <ul className={`space-y-1 ${compact ? 'pl-3 text-[9px]' : 'pl-4 text-xs'} leading-relaxed`}>{section.bullets.map((bullet, bulletIndex) => <li key={`${section.title}-b-${bulletIndex}`}>{bullet}</li>)}</ul>}
        {section.entries.map((entry, entryIndex) => (
          <article key={`${section.title}-${entry.heading}-${entryIndex}`} className="space-y-1">
            {entry.heading && <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"><h5 className={`${compact ? 'text-[10px]' : 'text-sm'} font-bold`} style={{ color: theme.headingColor }}>{entry.heading}</h5>{entry.meta && <p className={`${compact ? 'text-[8px]' : 'text-[10px]'}`} style={{ color: theme.mutedColor }}>{entry.meta}</p>}</div>}
            {entry.bullets.length > 0 && <ul className={`space-y-1 ${compact ? 'pl-3 text-[9px]' : 'pl-4 text-xs'} leading-relaxed`}>{entry.bullets.map((bullet, bulletIndex) => <li key={`${entry.heading}-${bulletIndex}`}>{bullet}</li>)}</ul>}
          </article>
        ))}
      </div>
    </section>
  );
}

function Header({ resume, theme, design, passportPhoto, compact }: { resume: ResumeDocument; theme: CVTemplateTheme; design: CVTemplateDesign; passportPhoto?: string; compact: boolean }) {
  const placement = photoPlacement(design);
  const hasPhoto = Boolean(passportPhoto);
  const darkHeader = ['banner', 'diagonal'].includes(design.headerStyle);
  const isCentered = design.headerStyle === 'centered';
  const isPanel = design.headerStyle === 'panel' || design.headerStyle === 'boxed';
  const isRail = design.headerStyle === 'rail';
  const photoAtStart = ['top-left', 'header-left', 'inline'].includes(placement);
  const photoAtEnd = ['top-right', 'header-right'].includes(placement);
  const headerStyle: CSSProperties = {
    background: design.headerStyle === 'diagonal' ? `linear-gradient(125deg, ${theme.accentColor} 0%, ${theme.headingColor} 58%, ${theme.accentColor} 100%)` : darkHeader ? theme.accentColor : isPanel ? theme.pageBackground : undefined,
    color: darkHeader ? '#FFFFFF' : theme.headingColor,
    borderLeft: isRail ? `8px solid ${theme.accentColor}` : undefined,
    borderBottom: design.headerStyle === 'minimal' || design.headerStyle === 'compact' ? `2px solid ${theme.borderColor}` : undefined,
    border: design.headerStyle === 'boxed' ? `1px solid ${theme.borderColor}` : undefined,
    borderRadius: design.headerStyle === 'boxed' || isPanel ? '16px' : undefined,
    textAlign: isCentered ? 'center' : undefined,
  };
  const contactColor = darkHeader ? '#F8FAFC' : theme.mutedColor;

  return (
    <header className={`${compact ? 'p-4' : 'p-6'} ${design.headerStyle === 'compact' ? 'py-4' : ''}`} style={headerStyle}>
      <div className={`flex gap-4 ${isCentered ? 'flex-col items-center' : 'items-start'} ${photoAtEnd ? 'justify-between' : ''}`}>
        {hasPhoto && photoAtStart && <PassportPhoto src={passportPhoto} design={design} compact={compact} light={darkHeader} />}
        <div className={isCentered ? 'text-center' : 'min-w-0 flex-1'}>
          {resume.header.name && <h3 className="font-bold leading-tight" style={{ fontSize: compact ? '20px' : design.headerStyle === 'editorial' ? '32px' : '28px', color: darkHeader ? '#FFFFFF' : theme.headingColor }}>{resume.header.name}</h3>}
          {resume.header.tagline && <p className={`${compact ? 'mt-1 text-[10px]' : 'mt-2 text-sm'} leading-relaxed`} style={{ color: darkHeader ? '#F8FAFC' : theme.bodyColor }}>{resume.header.tagline}</p>}
          {placement !== 'inline' && <div className="mt-3"><ContactList contacts={resume.header.contacts} color={contactColor} compact={compact} /></div>}
        </div>
        {hasPhoto && photoAtEnd && <PassportPhoto src={passportPhoto} design={design} compact={compact} light={darkHeader} />}
      </div>
      {hasPhoto && placement === 'inline' && <div className="mt-3 flex items-center gap-3"><PassportPhoto src={passportPhoto} design={design} compact={compact} light={darkHeader} /><ContactList contacts={resume.header.contacts} color={contactColor} compact={compact} /></div>}
    </header>
  );
}

function Sections({ sections, theme, design, compact }: { sections: ResumeSection[]; theme: CVTemplateTheme; design: CVTemplateDesign; compact: boolean }) {
  return <div className={`${compact ? 'space-y-3' : 'space-y-5'}`}>{sections.map((section, index) => <SectionBlock key={`${section.title}-${index}`} section={section} index={index} theme={theme} design={design} compact={compact} />)}</div>;
}

function TemplatePreview({ resume, templateId, passportPhoto, compact }: { resume: ResumeDocument; templateId: CVTemplateId; passportPhoto?: string; compact: boolean }) {
  const theme = getCVTemplateTheme(templateId);
  const design = getCVTemplateDesign(templateId);
  const sections = resume.sections.filter(hasContent).slice(0, compact ? 5 : undefined);
  const sideSections = sections.filter((section) => /skills|languages|certifications|contact/i.test(section.title));
  const mainSections = sections.filter((section) => !sideSections.includes(section));
  const effectiveBody = design.bodyStyle;
  const density = design.density === 'airy' ? 'p-7' : design.density === 'compact' ? 'p-4' : 'p-6';
  const photoInSidebar = Boolean(passportPhoto) && design.photoPlacement === 'sidebar-top';
  const asideContent = sideSections.length > 0 ? sideSections : sections.slice(0, Math.max(1, Math.floor(sections.length / 3)));
  const primaryContent = mainSections.length > 0 ? mainSections : sections;
  const frameStyle: CSSProperties = { backgroundColor: theme.panelBackground, color: theme.bodyColor, fontFamily: FONT_FAMILIES[design.fontFamily], borderColor: theme.borderColor };

  let content: ReactNode;
  if (effectiveBody === 'sidebar-left' || effectiveBody === 'sidebar-right') {
    const aside = <aside className={`${density} space-y-5`} style={{ backgroundColor: theme.sidebarBackground ?? theme.pageBackground, color: theme.sidebarText ?? theme.bodyColor }}>{photoInSidebar && <PassportPhoto src={passportPhoto} design={design} compact={compact} light={Boolean(theme.sidebarBackground)} />}<Sections sections={asideContent} theme={theme} design={design} compact={compact} /></aside>;
    const main = <main className={density}><Sections sections={primaryContent} theme={theme} design={design} compact={compact} /></main>;
    content = <div className="grid min-h-[24rem] md:grid-cols-[0.32fr_0.68fr]">{effectiveBody === 'sidebar-right' ? <>{main}{aside}</> : <>{aside}{main}</>}</div>;
  } else if (effectiveBody === 'two-column') {
    content = <div className={`${density} grid gap-6 md:grid-cols-2`}><Sections sections={sections.filter((_, index) => index % 2 === 0)} theme={theme} design={design} compact={compact} /><Sections sections={sections.filter((_, index) => index % 2 !== 0)} theme={theme} design={design} compact={compact} /></div>;
  } else if (effectiveBody === 'cards') {
    content = (
      <div className={`${density} grid gap-4 md:grid-cols-2`}>
        {sections.map((section, index) => (
          <SectionBlock
            key={`${section.title}-${index}`}
            section={section}
            index={index}
            theme={theme}
            design={{ ...design, sectionStyle: 'boxed' }}
            compact={compact}
          />
        ))}
      </div>
    );
  } else if (effectiveBody === 'timeline') {
    content = <div className={`${density} pl-3`} style={{ borderLeft: `2px solid ${theme.borderColor}` }}><Sections sections={sections} theme={theme} design={{ ...design, sectionStyle: 'timeline' }} compact={compact} /></div>;
  } else {
    content = <main className={density}><Sections sections={sections} theme={theme} design={design} compact={compact} /></main>;
  }

  return <div className="h-full overflow-hidden rounded-[1.75rem] border shadow-sm" style={{ ...frameStyle, backgroundColor: theme.pageBackground }}><div style={frameStyle}><Header resume={resume} theme={theme} design={design} passportPhoto={passportPhoto} compact={compact} />{content}</div></div>;
}

export function HtmlTemplatePreview({ htmlTemplate, compact = false }: { htmlTemplate: string; compact?: boolean }) {
  const sanitizedHtml = sanitizeHtml(htmlTemplate);
  return <div className={`h-full rounded-[1.75rem] border border-slate-200 bg-white shadow-sm ${compact ? 'scale-[0.62] origin-top' : ''}`} style={{ overflow: 'auto' }}><iframe srcDoc={sanitizedHtml} title="CV Template Preview" className="h-full w-full rounded-[1.75rem]" style={{ border: 'none', minHeight: compact ? '800px' : '1000px' }} /></div>;
}

export function CVPreviewCard({ variant, templateId = 'executive', compact = false, htmlTemplate, passportPhoto }: { variant: CVVariant; templateId?: CVTemplateId; compact?: boolean; htmlTemplate?: string; passportPhoto?: string }) {
  if (htmlTemplate) return <HtmlTemplatePreview htmlTemplate={htmlTemplate} compact={compact} />;
  return <TemplatePreview resume={parseResumeMarkdown(variant.content)} templateId={templateId} passportPhoto={passportPhoto} compact={compact} />;
}
