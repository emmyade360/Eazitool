'use client';

export interface CVVariant {
  style: string;
  title: string;
  badge: string;
  description: string;
  color: string;
  content: string;
}

export const CV_TEMPLATE_IDS = [
  'executive',
  'sidebar',
  'editorial',
  'spotlight',
  'minimal-grid',
  'contrast',
] as const;

export type CVTemplateId = (typeof CV_TEMPLATE_IDS)[number];

export const CV_TEMPLATE_META: Record<CVTemplateId, { label: string; blurb: string }> = {
  executive: {
    label: 'Executive Slate',
    blurb: 'A sharp executive layout with strong hierarchy and clean spacing.',
  },
  sidebar: {
    label: 'Sidebar Studio',
    blurb: 'A contemporary two-column CV with dedicated contact and skills space.',
  },
  editorial: {
    label: 'Editorial Serif',
    blurb: 'A more premium, editorial look for polished professional storytelling.',
  },
  spotlight: {
    label: 'Spotlight Bold',
    blurb: 'A bold, recruiter-friendly layout with strong section contrast.',
  },
  'minimal-grid': {
    label: 'Minimal Grid',
    blurb: 'A modern minimal template with structured modules and airy spacing.',
  },
  contrast: {
    label: 'Contrast Mono',
    blurb: 'A high-contrast, modern profile with a more technical visual tone.',
  },
};

type ResumeEntry = {
  heading: string;
  meta?: string;
  bullets: string[];
};

type ResumeSection = {
  title: string;
  paragraphs: string[];
  bullets: string[];
  entries: ResumeEntry[];
};

export type ResumeDocument = {
  header: {
    name: string;
    tagline: string;
    contacts: string[];
  };
  sections: ResumeSection[];
};

function cleanText(value: string) {
  return value
    .replace(/\*\*/g, '')
    .replace(/\u2013|\u2014/g, '-')
    .trim();
}

function splitBoldSegments(line: string) {
  const matches = [...line.matchAll(/\*\*(.+?)\*\*/g)];
  if (matches.length === 0) {
    return {
      heading: cleanText(line),
      meta: '',
    };
  }

  const heading = matches.map((match) => cleanText(match[1])).join(' - ');
  const remainder = cleanText(line.replace(/\*\*(.+?)\*\*/g, '').replace(/^[-:|\s]+/, ''));

  return {
    heading,
    meta: remainder,
  };
}

export function parseResumeMarkdown(content: string): ResumeDocument {
  const lines = content
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const headerLines: string[] = [];
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let currentEntry: ResumeEntry | null = null;

  const pushEntry = () => {
    if (currentSection && currentEntry) {
      currentSection.entries.push(currentEntry);
      currentEntry = null;
    }
  };

  const pushSection = () => {
    pushEntry();
    if (currentSection) {
      sections.push(currentSection);
      currentSection = null;
    }
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      pushSection();
      currentSection = {
        title: cleanText(line.replace(/^##\s+/, '')),
        paragraphs: [],
        bullets: [],
        entries: [],
      };
      continue;
    }

    if (!currentSection) {
      headerLines.push(cleanText(line));
      continue;
    }

    if (line.startsWith('- ')) {
      const bullet = cleanText(line.slice(2));
      if (currentEntry) {
        currentEntry.bullets.push(bullet);
      } else {
        currentSection.bullets.push(bullet);
      }
      continue;
    }

    if (line.includes('**')) {
      pushEntry();
      const { heading, meta } = splitBoldSegments(line);
      currentEntry = {
        heading,
        meta: meta || undefined,
        bullets: [],
      };
      continue;
    }

    if (currentEntry) {
      currentEntry.meta = currentEntry.meta
        ? `${currentEntry.meta} ${cleanText(line)}`
        : cleanText(line);
    } else {
      currentSection.paragraphs.push(cleanText(line));
    }
  }

  pushSection();

  const [name = '', ...rest] = headerLines;

  return {
    header: {
      name,
      tagline: rest[0] ?? '',
      contacts: rest.slice(1),
    },
    sections,
  };
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
  return (
    <section className={`border-t pt-4 ${dividerClass}`}>
      <h4 className={`text-[10px] font-bold uppercase tracking-[0.32em] ${titleClass}`}>
        {section.title}
      </h4>
      <div className="mt-3 space-y-3">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph} className={`${compact ? 'text-[10px]' : 'text-xs'} leading-relaxed`}>
            {paragraph}
          </p>
        ))}

        {section.bullets.length > 0 && (
          <ul className="space-y-1.5 pl-4">
            {section.bullets.map((bullet) => (
              <li key={bullet} className={`${compact ? 'text-[10px]' : 'text-xs'} leading-relaxed`}>
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {section.entries.map((entry) => (
          <article key={`${entry.heading}-${entry.meta ?? ''}`} className="space-y-1.5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h5 className={`text-sm font-semibold ${accentClass}`}>{entry.heading}</h5>
              {entry.meta && (
                <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-500`}>
                  {entry.meta}
                </p>
              )}
            </div>
            {entry.bullets.length > 0 && (
              <ul className="space-y-1.5 pl-4">
                {entry.bullets.map((bullet) => (
                  <li key={bullet} className={`${compact ? 'text-[10px]' : 'text-xs'} leading-relaxed`}>
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
      {contacts.map((contact) => (
        <span key={contact}>{contact}</span>
      ))}
    </div>
  );
}

function renderExecutive(resume: ResumeDocument, compact: boolean) {
  return (
    <div className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      <div className="border-b border-slate-200 pb-5">
        {resume.header.name && <h3 className="text-2xl font-semibold tracking-tight">{resume.header.name}</h3>}
        {resume.header.tagline && <p className="mt-3 text-sm leading-relaxed text-slate-600">{resume.header.tagline}</p>}
        <ContactRow contacts={resume.header.contacts} className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-500" />
      </div>
      <div className="mt-5 space-y-4">
        {resume.sections.slice(0, compact ? 3 : undefined).map((section) => (
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
  const sidebarSections = resume.sections.filter((section) =>
    ['Skills', 'Certifications', 'Languages'].includes(section.title)
  );
  const mainSections = resume.sections.filter((section) =>
    !['Skills', 'Certifications', 'Languages'].includes(section.title)
  );

  return (
    <div className="h-full rounded-[1.75rem] border border-blue-100 bg-white shadow-sm">
      <div className="grid h-full lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="rounded-l-[1.75rem] bg-blue-700 p-5 text-white">
          {resume.header.name && <h3 className="text-xl font-semibold tracking-tight">{resume.header.name}</h3>}
          {resume.header.tagline && <p className="mt-3 text-sm leading-relaxed text-blue-100">{resume.header.tagline}</p>}
          {resume.header.contacts.length > 0 && (
            <div className="mt-5 space-y-2 text-[11px] leading-relaxed text-blue-100">
              {resume.header.contacts.map((contact) => (
                <p key={contact}>{contact}</p>
              ))}
            </div>
          )}
          <div className="mt-6 space-y-4">
            {(compact ? sidebarSections.slice(0, 2) : sidebarSections).map((section) => (
              <ResumeSectionBlock
                key={section.title}
                section={section}
                compact={compact}
                accentClass="text-white"
                titleClass="text-blue-100"
                dividerClass="border-blue-500"
              />
            ))}
          </div>
        </aside>
        <main className="p-6 text-slate-900">
          <div className="space-y-4">
            {mainSections.slice(0, compact ? 3 : undefined).map((section) => (
              <ResumeSectionBlock
                key={section.title}
                section={section}
                compact={compact}
                accentClass="text-blue-800"
                titleClass="text-blue-700"
                dividerClass="border-slate-200"
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function renderEditorial(resume: ResumeDocument, compact: boolean) {
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
        {resume.sections.slice(0, compact ? 3 : undefined).map((section) => (
          <ResumeSectionBlock
            key={section.title}
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
  return (
    <div className="h-full overflow-hidden rounded-[1.75rem] border border-amber-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-6 text-white">
        {resume.header.name && <h3 className="text-2xl font-semibold tracking-tight">{resume.header.name}</h3>}
        {resume.header.tagline && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-orange-50">{resume.header.tagline}</p>}
        <ContactRow contacts={resume.header.contacts} className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-orange-50" />
      </div>
      <div className="p-6 text-slate-900">
        <div className="space-y-4">
          {resume.sections.slice(0, compact ? 3 : undefined).map((section) => (
            <ResumeSectionBlock
              key={section.title}
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
  return (
    <div className="h-full rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="grid gap-4 border-b border-emerald-100 pb-5 md:grid-cols-[1.25fr_0.75fr]">
        <div>
          {resume.header.name && <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{resume.header.name}</h3>}
          {resume.header.tagline && <p className="mt-3 text-sm leading-relaxed text-slate-600">{resume.header.tagline}</p>}
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4 text-[11px] leading-relaxed text-emerald-900">
          {resume.header.contacts.map((contact) => (
            <p key={contact}>{contact}</p>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {resume.sections.slice(0, compact ? 4 : undefined).map((section) => (
          <div key={section.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
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
  return (
    <div className="h-full rounded-[1.75rem] bg-slate-950 p-5 text-slate-50 shadow-inner">
      <div className="rounded-[1.4rem] border border-slate-700 bg-slate-900 p-5">
        <div className="border-b border-slate-700 pb-4">
          {resume.header.name && <h3 className="text-xl font-semibold">{resume.header.name}</h3>}
          {resume.header.tagline && <p className="mt-2 text-sm text-slate-300">{resume.header.tagline}</p>}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {resume.sections.slice(0, compact ? 3 : undefined).map((section) => (
              <ResumeSectionBlock
                key={section.title}
                section={section}
                compact={compact}
                accentClass="text-cyan-300"
                titleClass="text-cyan-200"
                dividerClass="border-slate-700"
              />
            ))}
          </div>
          <aside className="rounded-2xl bg-cyan-500/15 p-4 text-cyan-200">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Contact</p>
            <div className="mt-3 space-y-2 text-xs leading-relaxed">
              {resume.header.contacts.map((contact) => (
                <p key={contact}>{contact}</p>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function CVPreviewCard({
  variant,
  templateId = 'executive',
  compact = false,
}: {
  variant: CVVariant;
  templateId?: CVTemplateId;
  compact?: boolean;
}) {
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
