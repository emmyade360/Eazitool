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

export type ResumeEntry = {
  heading: string;
  meta?: string;
  bullets: string[];
};

export type ResumeSection = {
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

export type CVTemplateTheme = {
  name: string;
  pageBackground: string;
  panelBackground: string;
  headingColor: string;
  accentColor: string;
  subheadingColor: string;
  bodyColor: string;
  mutedColor: string;
  borderColor: string;
  sidebarBackground?: string;
  sidebarText?: string;
};

export const CV_TEMPLATE_THEMES: Record<CVTemplateId, CVTemplateTheme> = {
  executive: {
    name: 'Executive Slate',
    pageBackground: '#F8FAFC',
    panelBackground: '#FFFFFF',
    headingColor: '#0F172A',
    accentColor: '#0F172A',
    subheadingColor: '#475569',
    bodyColor: '#1E293B',
    mutedColor: '#64748B',
    borderColor: '#CBD5E1',
  },
  sidebar: {
    name: 'Sidebar Studio',
    pageBackground: '#EFF6FF',
    panelBackground: '#FFFFFF',
    headingColor: '#1D4ED8',
    accentColor: '#1D4ED8',
    subheadingColor: '#1E40AF',
    bodyColor: '#1F2937',
    mutedColor: '#64748B',
    borderColor: '#BFDBFE',
    sidebarBackground: '#1D4ED8',
    sidebarText: '#EFF6FF',
  },
  editorial: {
    name: 'Editorial Serif',
    pageBackground: '#FAFAF9',
    panelBackground: '#FFFBF5',
    headingColor: '#7C2D12',
    accentColor: '#BE123C',
    subheadingColor: '#9A3412',
    bodyColor: '#292524',
    mutedColor: '#78716C',
    borderColor: '#E7E5E4',
  },
  spotlight: {
    name: 'Spotlight Bold',
    pageBackground: '#FFF7ED',
    panelBackground: '#FFFFFF',
    headingColor: '#9A3412',
    accentColor: '#EA580C',
    subheadingColor: '#C2410C',
    bodyColor: '#1F2937',
    mutedColor: '#78716C',
    borderColor: '#FED7AA',
  },
  'minimal-grid': {
    name: 'Minimal Grid',
    pageBackground: '#ECFDF5',
    panelBackground: '#FFFFFF',
    headingColor: '#065F46',
    accentColor: '#047857',
    subheadingColor: '#047857',
    bodyColor: '#1F2937',
    mutedColor: '#6B7280',
    borderColor: '#A7F3D0',
  },
  contrast: {
    name: 'Contrast Mono',
    pageBackground: '#020617',
    panelBackground: '#0F172A',
    headingColor: '#E2E8F0',
    accentColor: '#67E8F9',
    subheadingColor: '#A5F3FC',
    bodyColor: '#CBD5E1',
    mutedColor: '#94A3B8',
    borderColor: '#334155',
    sidebarBackground: '#155E75',
    sidebarText: '#ECFEFF',
  },
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
