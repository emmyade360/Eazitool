'use client';

import {
  parseResumeMarkdown,
  type CVTemplateId,
  type CVVariant,
  type ResumeDocument,
  type ResumeSection,
} from '@/lib/cv-document';
import { sanitizeHtml } from '@/lib/sanitize';

export { CV_TEMPLATE_IDS, CV_TEMPLATE_META, type CVTemplateId, type CVVariant } from '@/lib/cv-document';
export { PROFESSIONAL_TEMPLATE_META, type ProfessionalTemplateId } from '@/lib/cv-templates';

function hasContent(section: ResumeSection): boolean {
  return (
    section.paragraphs.length > 0 ||
    section.bullets.length > 0 ||
    section.entries.some((e) => e.heading.trim() || e.bullets.length > 0)
  );
}

function ResumeSectionBlock({
  section,
  compact = false,
  accentClass,
  titleClass,
  dividerClass,
}: {
  section: ResumeSection;
  compact?: boolean;
  accentClass: string;
  titleClass: string;
  dividerClass: string;
}) {
  const validEntries = section.entries.filter((e) => e.heading.trim() || e.bullets.length > 0);

  return (
    <section className={`border-t pt-4 ${dividerClass}`}>
      <h4 className={`text-[10px] font-bold uppercase tracking-[0.32em] ${titleClass}`}>
        {section.title}
      </h4>
      <div className="mt-3 space-y-3">
        {section.paragraphs.map((paragraph, index) => (
          <p key={`p-${index}`} className={`${compact ? 'text-[10px]' : 'text-xs'} leading-relaxed`}>
            {paragraph}
          </p>
        ))}

        {section.bullets.length > 0 && (
          <ul className="space-y-1.5 pl-4">
            {section.bullets.map((bullet, index) => (
              <li key={`bullet-${index}`} className={`${compact ? 'text-[10px]' : 'text-xs'} leading-relaxed`}>
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {validEntries.map((entry, index) => (
          <article key={`entry-${index}-${entry.heading}`} className="space-y-1.5">
            {entry.heading && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h5 className={`text-sm font-semibold ${accentClass}`}>{entry.heading}</h5>
                {entry.meta && (
                  <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-500`}>
                    {entry.meta}
                  </p>
                )}
              </div>
            )}
            {entry.bullets.length > 0 && (
              <ul className="space-y-1.5 pl-4">
                {entry.bullets.map((bullet, bulletIndex) => (
                  <li key={`entry-bullet-${bulletIndex}`} className={`${compact ? 'text-[10px]' : 'text-xs'} leading-relaxed`}>
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function ContactRow({
  contacts,
  className,
}: {
  contacts: string[];
  className: string;
}) {
  if (contacts.length === 0) return null;

  return (
    <div className={className}>
      {contacts.map((contact, index) => (
        <span key={`contact-${index}`}>{contact}</span>
      ))}
    </div>
  );
}

function renderExecutive(resume: ResumeDocument, compact: boolean) {
  const visibleSections = resume.sections.filter(hasContent).slice(0, compact ? 3 : undefined);
  return (
    <div className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      <div className="border-b border-slate-200 pb-5">
        {resume.header.name && <h3 className="text-2xl font-semibold tracking-tight">{resume.header.name}</h3>}
        {resume.header.tagline && <p className="mt-3 text-sm leading-relaxed text-slate-600">{resume.header.tagline}</p>}
        <ContactRow contacts={resume.header.contacts} className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-500" />
      </div>
      <div className="mt-5 space-y-4">
        {visibleSections.map((section) => (
          <ResumeSectionBlock
            key={section.title}
            section={section}
            compact={compact}
            accentClass="text-slate-900"
            titleClass="text-slate-500"
            dividerClass="border-slate-200"
          />
        ))}
      </div>
    </div>
  );
}

function renderSidebar(resume: ResumeDocument, compact: boolean) {
  const visibleSections = resume.sections
    .filter(hasContent)
    .slice(0, compact ? 4 : undefined);

  return (
    <div className="h-full overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-sm">
      {/* Header — full-width name block with left blue rail */}
      <div className="flex">
        <div className="w-2 shrink-0 bg-blue-600" />
        <div className="flex-1 bg-blue-50 px-5 py-5">
          {resume.header.name && (
            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
              {resume.header.name}
            </h3>
          )}
          {resume.header.tagline && (
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {resume.header.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Contact row — thin blue accent strip */}
      {resume.header.contacts.length > 0 && (
        <div className="flex">
          <div className="w-2 shrink-0 bg-blue-200" />
          <div className="flex-1 bg-blue-50/60 px-5 py-2.5">
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-500">
              {resume.header.contacts.map((contact) => (
                <span key={contact}>{contact}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Body — left rail continues as blue-100, sections with blue pill accents */}
      <div className="flex">
        <div className="w-2 shrink-0 bg-blue-100" />
        <div className="flex-1 space-y-5 p-5 text-slate-800">
          {visibleSections.map((section) => {
            const validEntries = section.entries.filter(
              (e) => e.heading.trim() || e.bullets.length > 0
            );
            return (
              <section key={section.title}>
                {/* Section heading with small blue horizontal pill on the left */}
                <div className="mb-2.5 flex items-center gap-2.5">
                  <span className="inline-block h-1.5 w-5 shrink-0 rounded-full bg-blue-600" />
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-700">
                    {section.title}
                  </h4>
                </div>

                <div className="space-y-2 pl-7">
                  {section.paragraphs.map((paragraph, i) => (
                    <p key={i} className={`${compact ? 'text-[10px]' : 'text-xs'} leading-relaxed`}>
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets.length > 0 && (
                    <ul className="space-y-1 pl-3">
                      {section.bullets.map((bullet, i) => (
                        <li key={i} className={`${compact ? 'text-[10px]' : 'text-xs'} leading-relaxed`}>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}

                  {validEntries.map((entry, i) => (
                    <article key={i} className="space-y-1 pt-1">
                      {entry.heading && (
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                          <h5 className={`${compact ? 'text-[11px]' : 'text-sm'} font-semibold text-blue-800`}>
                            {entry.heading}
                          </h5>
                          {entry.meta && (
                            <p className={`${compact ? 'text-[9px]' : 'text-[11px]'} text-slate-500`}>
                              {entry.meta}
                            </p>
                          )}
                        </div>
                      )}
                      {entry.bullets.length > 0 && (
                        <ul className="space-y-1 pl-3">
                          {entry.bullets.map((bullet, j) => (
                            <li key={j} className={`${compact ? 'text-[10px]' : 'text-xs'} leading-relaxed`}>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderEditorial(resume: ResumeDocument, compact: boolean) {
  const visibleSections = resume.sections.filter(hasContent).slice(0, compact ? 3 : undefined);
  return (
    <div className="h-full rounded-[1.75rem] border border-stone-200 bg-stone-50 p-6 text-stone-900 shadow-sm">
      <div>
        {resume.header.name && <h3 className="text-2xl font-semibold tracking-tight">{resume.header.name}</h3>}
        {resume.header.tagline && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">{resume.header.tagline}</p>}
      </div>
      {resume.header.contacts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {resume.header.contacts.map((contact) => (
            <span key={contact} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] text-stone-600">
              {contact}
            </span>
          ))}
        </div>
      )}
      <div className="mt-6 space-y-4">
        {visibleSections.map((section, index) => (
          <ResumeSectionBlock
            key={`editorial-${section.title}-${index}`}
            section={section}
            compact={compact}
            accentClass="text-rose-700"
            titleClass="text-rose-700"
            dividerClass="border-stone-200"
          />
        ))}
      </div>
    </div>
  );
}

function renderSpotlight(resume: ResumeDocument, compact: boolean) {
  const visibleSections = resume.sections.filter(hasContent).slice(0, compact ? 3 : undefined);
  return (
    <div className="h-full overflow-hidden rounded-[1.75rem] border border-amber-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-6 text-white">
        {resume.header.name && <h3 className="text-2xl font-semibold tracking-tight">{resume.header.name}</h3>}
        {resume.header.tagline && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-orange-50">{resume.header.tagline}</p>}
        <ContactRow contacts={resume.header.contacts} className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-orange-50" />
      </div>
      <div className="p-6 text-slate-900">
        <div className="space-y-4">
          {visibleSections.map((section, index) => (
            <ResumeSectionBlock
              key={`spotlight-${section.title}-${index}`}
              section={section}
              compact={compact}
              accentClass="text-slate-900"
              titleClass="text-orange-600"
              dividerClass="border-slate-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function renderMinimalGrid(resume: ResumeDocument, compact: boolean) {
  const visibleSections = resume.sections.filter(hasContent).slice(0, compact ? 4 : undefined);
  return (
    <div className="h-full rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="grid gap-4 border-b border-emerald-100 pb-5 md:grid-cols-[1.25fr_0.75fr]">
        <div>
          {resume.header.name && <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{resume.header.name}</h3>}
          {resume.header.tagline && <p className="mt-3 text-sm leading-relaxed text-slate-600">{resume.header.tagline}</p>}
        </div>
        {resume.header.contacts.length > 0 && (
          <div className="rounded-2xl bg-emerald-50 p-4 text-[11px] leading-relaxed text-emerald-900">
            {resume.header.contacts.map((contact) => (
              <p key={contact}>{contact}</p>
            ))}
          </div>
        )}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {visibleSections.map((section, index) => (
          <div key={`minimal-${section.title}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <ResumeSectionBlock
              section={section}
              compact={compact}
              accentClass="text-slate-900"
              titleClass="text-emerald-700"
              dividerClass="border-slate-200"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function renderContrast(resume: ResumeDocument, compact: boolean) {
  const visibleSections = resume.sections.filter(hasContent).slice(0, compact ? 3 : undefined);
  return (
    <div className="h-full rounded-[1.75rem] bg-slate-950 p-5 text-slate-50 shadow-inner">
      <div className="rounded-[1.4rem] border border-slate-700 bg-slate-900 p-5">
        <div className="border-b border-slate-700 pb-4">
          {resume.header.name && <h3 className="text-xl font-semibold">{resume.header.name}</h3>}
          {resume.header.tagline && <p className="mt-2 text-sm text-slate-300">{resume.header.tagline}</p>}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {visibleSections.map((section, index) => (
              <ResumeSectionBlock
                key={`contrast-${section.title}-${index}`}
                section={section}
                compact={compact}
                accentClass="text-cyan-300"
                titleClass="text-cyan-200"
                dividerClass="border-slate-700"
              />
            ))}
          </div>
          {resume.header.contacts.length > 0 && (
            <aside className="rounded-2xl bg-cyan-500/15 p-4 text-cyan-200">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Contact</p>
              <div className="mt-3 space-y-2 text-xs leading-relaxed">
                {resume.header.contacts.map((contact) => (
                  <p key={contact}>{contact}</p>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export function HtmlTemplatePreview({
  htmlTemplate,
  compact = false,
}: {
  htmlTemplate: string;
  compact?: boolean;
}) {
  const sanitizedHtml = sanitizeHtml(htmlTemplate);

  return (
    <div
      className={`h-full rounded-[1.75rem] border border-slate-200 bg-white shadow-sm ${compact ? 'scale-[0.62] origin-top' : ''}`}
      style={{ overflow: 'auto' }}
    >
      <iframe
        srcDoc={sanitizedHtml}
        title="CV Template Preview"
        className="w-full h-full rounded-[1.75rem]"
        style={{ border: 'none', minHeight: compact ? '800px' : '1000px' }}
      />
    </div>
  );
}

export function CVPreviewCard({
  variant,
  templateId = 'executive',
  compact = false,
  htmlTemplate,
}: {
  variant: CVVariant;
  templateId?: CVTemplateId;
  compact?: boolean;
  htmlTemplate?: string;
}) {
  // If HTML template is provided, render it
  if (htmlTemplate) {
    return <HtmlTemplatePreview htmlTemplate={htmlTemplate} compact={compact} />;
  }

  const resume = parseResumeMarkdown(variant.content);

  switch (templateId) {
    case 'sidebar':
      return renderSidebar(resume, compact);
    case 'editorial':
      return renderEditorial(resume, compact);
    case 'spotlight':
      return renderSpotlight(resume, compact);
    case 'minimal-grid':
      return renderMinimalGrid(resume, compact);
    case 'contrast':
      return renderContrast(resume, compact);
    case 'executive':
    default:
      return renderExecutive(resume, compact);
  }
}
