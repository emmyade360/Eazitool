export interface CVVariant {
  style: string;
  title: string;
  badge: string;
  description: string;
  color: string;
  content: string;
}

export type CVTemplateId = string;

export type CVTemplateLayout =
  | 'executive'
  | 'sidebar'
  | 'editorial'
  | 'spotlight'
  | 'minimal-grid'
  | 'contrast';

export type CVTemplateHeaderStyle =
  | 'minimal'
  | 'banner'
  | 'split'
  | 'centered'
  | 'rail'
  | 'panel'
  | 'editorial'
  | 'compact'
  | 'boxed'
  | 'diagonal';

export type CVTemplateBodyStyle =
  | 'single'
  | 'two-column'
  | 'cards'
  | 'timeline'
  | 'sidebar-left'
  | 'sidebar-right';

export type CVTemplateSectionStyle =
  | 'rule'
  | 'numbered'
  | 'pill'
  | 'boxed'
  | 'accent-bar'
  | 'underline'
  | 'label'
  | 'timeline'
  | 'capsule'
  | 'minimal';

export type CVPhotoPlacement =
  | 'top-left'
  | 'top-right'
  | 'header-left'
  | 'header-right'
  | 'sidebar-top'
  | 'inline'
  | 'none';

export type CVTemplateDesign = {
  index: number;
  headerStyle: CVTemplateHeaderStyle;
  bodyStyle: CVTemplateBodyStyle;
  sectionStyle: CVTemplateSectionStyle;
  fontFamily: 'sans' | 'serif' | 'mono';
  density: 'airy' | 'balanced' | 'compact';
  photoPlacement: CVPhotoPlacement;
  photoShape: 'square' | 'rounded' | 'circle';
};

export type CVTemplateCategory =
  | 'Minimal'
  | 'Corporate'
  | 'Executive'
  | 'Creative'
  | 'Technical'
  | 'Academic'
  | 'Graduate'
  | 'Healthcare'
  | 'Sales'
  | 'Bold';

export type CVTemplateDefinition = {
  id: CVTemplateId;
  label: string;
  blurb: string;
  bestFor: string;
  category: CVTemplateCategory;
  layout: CVTemplateLayout;
  paletteIndex: number;
  design: CVTemplateDesign;
};

type TemplateSeed = Pick<CVTemplateDefinition, 'id' | 'label' | 'blurb' | 'bestFor' | 'layout'>;

const TEMPLATE_CATEGORY_ORDER: CVTemplateCategory[] = [
  'Minimal',
  'Corporate',
  'Executive',
  'Creative',
  'Technical',
  'Academic',
  'Graduate',
  'Healthcare',
  'Sales',
  'Bold',
];

const HEADER_STYLES: CVTemplateHeaderStyle[] = [
  'minimal', 'banner', 'split', 'centered', 'rail', 'panel', 'editorial', 'compact', 'boxed', 'diagonal',
];
const BODY_STYLES: CVTemplateBodyStyle[] = [
  'single', 'two-column', 'cards', 'timeline', 'sidebar-left', 'sidebar-right',
];
const SECTION_STYLES: CVTemplateSectionStyle[] = [
  'rule', 'numbered', 'pill', 'boxed', 'accent-bar', 'underline', 'label', 'timeline', 'capsule', 'minimal',
];
const PHOTO_PLACEMENTS: CVPhotoPlacement[] = [
  'top-left', 'top-right', 'header-left', 'header-right', 'sidebar-top', 'inline', 'none', 'top-right', 'sidebar-top', 'none',
];

export const CV_PHOTO_PLACEMENT_LABELS: Record<CVPhotoPlacement, string> = {
  'top-left': 'top-left corner',
  'top-right': 'top-right corner',
  'header-left': 'left side of the header',
  'header-right': 'right side of the header',
  'sidebar-top': 'top of the side panel',
  inline: 'beside the contact details',
  none: 'top-left corner (fallback)',
};

function createTemplateDesign(category: CVTemplateCategory, paletteIndex: number): CVTemplateDesign {
  const categoryIndex = TEMPLATE_CATEGORY_ORDER.indexOf(category);
  const index = categoryIndex * 10 + paletteIndex;
  const bodyStyle = BODY_STYLES[(paletteIndex * 2 + categoryIndex) % BODY_STYLES.length]!;
  const requestedPhotoPlacement = PHOTO_PLACEMENTS[(paletteIndex + categoryIndex * 4) % PHOTO_PLACEMENTS.length]!;
  // A side-panel photo can only be honoured by a template that has a side panel.
  // Other presets explicitly fall back to their top-left position instead.
  const photoPlacement = requestedPhotoPlacement === 'sidebar-top'
    && !['sidebar-left', 'sidebar-right'].includes(bodyStyle)
      ? 'none'
      : requestedPhotoPlacement;

  return {
    index,
    headerStyle: HEADER_STYLES[(paletteIndex + categoryIndex * 3) % HEADER_STYLES.length]!,
    bodyStyle,
    sectionStyle: SECTION_STYLES[(paletteIndex + categoryIndex * 2) % SECTION_STYLES.length]!,
    fontFamily: (['sans', 'serif', 'mono'] as const)[(paletteIndex + categoryIndex) % 3]!,
    density: (['airy', 'balanced', 'compact'] as const)[(paletteIndex * 2 + categoryIndex) % 3]!,
    photoPlacement,
    photoShape: (['square', 'rounded', 'circle'] as const)[(paletteIndex + categoryIndex * 2) % 3]!,
  };
}

function templateGroup(category: CVTemplateCategory, templates: TemplateSeed[]): CVTemplateDefinition[] {
  return templates.map((template, paletteIndex) => ({
    ...template,
    category,
    paletteIndex,
    design: createTemplateDesign(category, paletteIndex),
  }));
}

// These are original Eazitool presets. The library deliberately spans ATS-safe,
// restrained formats through more visual layouts without copying third-party templates.
export const CV_TEMPLATE_CATALOG: CVTemplateDefinition[] = [
  ...templateGroup('Minimal', [
    { id: 'minimal-grid', label: 'Minimal Grid', blurb: 'Airy modular layout with clear reading order.', bestFor: 'ATS-first and modern roles', layout: 'minimal-grid' },
    { id: 'quiet-white', label: 'Quiet White', blurb: 'Single-column whitespace-led format.', bestFor: 'General applications', layout: 'executive' },
    { id: 'clean-line', label: 'Clean Line', blurb: 'Fine rules and a compact information hierarchy.', bestFor: 'Operations and administration', layout: 'executive' },
    { id: 'paper-light', label: 'Paper Light', blurb: 'Soft neutral canvas with measured spacing.', bestFor: 'Client services', layout: 'executive' },
    { id: 'mono-margin', label: 'Mono Margin', blurb: 'Precise margins and technical clarity.', bestFor: 'Engineering and IT', layout: 'contrast' },
    { id: 'nordic-space', label: 'Nordic Space', blurb: 'Calm, spacious hierarchy with a restrained accent.', bestFor: 'Product and design', layout: 'executive' },
    { id: 'simply-serif', label: 'Simply Serif', blurb: 'Editorial restraint with a text-led rhythm.', bestFor: 'Writing and communications', layout: 'editorial' },
    { id: 'airy-sans', label: 'Airy Sans', blurb: 'Modern sans-serif balance and generous breathing room.', bestFor: 'Early and mid-career roles', layout: 'executive' },
    { id: 'soft-rule', label: 'Soft Rule', blurb: 'Subtle dividers keep dense experience scannable.', bestFor: 'Project and programme roles', layout: 'executive' },
    { id: 'plain-focus', label: 'Plain Focus', blurb: 'No-frills profile made for quick review.', bestFor: 'High-volume applications', layout: 'executive' },
  ]),
  ...templateGroup('Corporate', [
    { id: 'sidebar', label: 'Sidebar Studio', blurb: 'Contemporary two-column CV with dedicated skill space.', bestFor: 'Business and operations', layout: 'sidebar' },
    { id: 'boardroom-blue', label: 'Boardroom Blue', blurb: 'Confident corporate header with familiar structure.', bestFor: 'Management roles', layout: 'executive' },
    { id: 'corporate-column', label: 'Corporate Column', blurb: 'Balanced sidebar for contacts, skills, and credentials.', bestFor: 'Consulting and HR', layout: 'sidebar' },
    { id: 'decision-maker', label: 'Decision Maker', blurb: 'Clear hierarchy that foregrounds leadership experience.', bestFor: 'Team leads and managers', layout: 'executive' },
    { id: 'office-ledger', label: 'Office Ledger', blurb: 'Structured sections with dependable visual rhythm.', bestFor: 'Finance and administration', layout: 'executive' },
    { id: 'structured-steel', label: 'Structured Steel', blurb: 'Cool professional palette with concise content blocks.', bestFor: 'Corporate services', layout: 'executive' },
    { id: 'formal-frame', label: 'Formal Frame', blurb: 'Traditional framing with a modern edge.', bestFor: 'Legal and government', layout: 'executive' },
    { id: 'blue-ledger', label: 'Blue Ledger', blurb: 'A practical left rail for structured credentials.', bestFor: 'Accounting and compliance', layout: 'sidebar' },
    { id: 'career-ledger', label: 'Career Ledger', blurb: 'Orderly, chronological presentation with strong signposts.', bestFor: 'Established professionals', layout: 'executive' },
    { id: 'clear-authority', label: 'Clear Authority', blurb: 'Crisp contrast for senior-facing applications.', bestFor: 'Corporate leadership', layout: 'executive' },
  ]),
  ...templateGroup('Executive', [
    { id: 'executive', label: 'Executive Slate', blurb: 'Sharp hierarchy and clean spacing for senior profiles.', bestFor: 'Executives and directors', layout: 'executive' },
    { id: 'summit', label: 'Summit', blurb: 'Calm, elevated profile with an accomplishment-led flow.', bestFor: 'Senior leadership', layout: 'executive' },
    { id: 'director', label: 'Director', blurb: 'Commanding header with a polished one-column body.', bestFor: 'Directors and heads of function', layout: 'executive' },
    { id: 'leadership-brief', label: 'Leadership Brief', blurb: 'Prioritises scope, impact, and strategic experience.', bestFor: 'C-suite pathways', layout: 'executive' },
    { id: 'capital', label: 'Capital', blurb: 'Premium editorial tone with understated confidence.', bestFor: 'Finance and investment', layout: 'editorial' },
    { id: 'strategy-line', label: 'Strategy Line', blurb: 'Direct visual hierarchy for strategy narratives.', bestFor: 'Consulting and strategy', layout: 'executive' },
    { id: 'command', label: 'Command', blurb: 'Bold, orderly sections for high-responsibility roles.', bestFor: 'Programme and operations leaders', layout: 'spotlight' },
    { id: 'heritage', label: 'Heritage', blurb: 'Classic serif-led detail for an established career story.', bestFor: 'Senior professional services', layout: 'editorial' },
    { id: 'c-suite', label: 'C-Suite', blurb: 'A concise executive canvas focused on outcomes.', bestFor: 'Executive applications', layout: 'executive' },
    { id: 'portfolio-lead', label: 'Portfolio Lead', blurb: 'Combines strategic storytelling and strong scan points.', bestFor: 'Portfolio and transformation leaders', layout: 'sidebar' },
  ]),
  ...templateGroup('Creative', [
    { id: 'editorial', label: 'Editorial Serif', blurb: 'Premium, editorial storytelling with a refined tone.', bestFor: 'Marketing and communications', layout: 'editorial' },
    { id: 'spotlight', label: 'Spotlight Bold', blurb: 'Energetic header with high-visibility section contrast.', bestFor: 'Creative and growth roles', layout: 'spotlight' },
    { id: 'studio-note', label: 'Studio Note', blurb: 'A refined creative profile with an expressive header.', bestFor: 'Design and content', layout: 'editorial' },
    { id: 'canvas', label: 'Canvas', blurb: 'Visual confidence balanced with readable content modules.', bestFor: 'Brand and marketing', layout: 'minimal-grid' },
    { id: 'magazine', label: 'Magazine', blurb: 'Editorial structure that gives achievements room to breathe.', bestFor: 'Editorial and media', layout: 'editorial' },
    { id: 'signal', label: 'Signal', blurb: 'Vivid accent system for memorable first impressions.', bestFor: 'Creative strategy', layout: 'spotlight' },
    { id: 'maker', label: 'Maker', blurb: 'Designed to put projects and craft at the centre.', bestFor: 'Designers and makers', layout: 'minimal-grid' },
    { id: 'storyboard', label: 'Storyboard', blurb: 'Narrative layout for careers with a strong creative arc.', bestFor: 'Content and communications', layout: 'editorial' },
    { id: 'color-block', label: 'Color Block', blurb: 'Confident divisions for a design-forward presentation.', bestFor: 'Marketing and creative roles', layout: 'spotlight' },
    { id: 'portfolio-page', label: 'Portfolio Page', blurb: 'A modern frame for achievements, links, and projects.', bestFor: 'Portfolio-led roles', layout: 'sidebar' },
  ]),
  ...templateGroup('Technical', [
    { id: 'contrast', label: 'Contrast Mono', blurb: 'High-contrast technical profile with a modern tone.', bestFor: 'Engineering and technology', layout: 'contrast' },
    { id: 'terminal', label: 'Terminal', blurb: 'Crisp dark presentation for technical depth.', bestFor: 'Software and data', layout: 'contrast' },
    { id: 'systems', label: 'Systems', blurb: 'Structured format for complex skills and delivery history.', bestFor: 'Infrastructure and IT', layout: 'sidebar' },
    { id: 'blueprint', label: 'Blueprint', blurb: 'Precise grid for technical projects and tools.', bestFor: 'Engineering and architecture', layout: 'minimal-grid' },
    { id: 'signal-stack', label: 'Signal Stack', blurb: 'Compact information stack with modern contrast.', bestFor: 'Product and data', layout: 'contrast' },
    { id: 'code-line', label: 'Code Line', blurb: 'Minimal technical layout that remains ATS-conscious.', bestFor: 'Developers and analysts', layout: 'executive' },
    { id: 'cloud', label: 'Cloud', blurb: 'Clean sidebar for tools, certifications, and platforms.', bestFor: 'Cloud and DevOps', layout: 'sidebar' },
    { id: 'circuit', label: 'Circuit', blurb: 'Strong visual rails for skills-led technical profiles.', bestFor: 'Engineering and hardware', layout: 'sidebar' },
    { id: 'data-grid', label: 'Data Grid', blurb: 'Modular blocks for data, research, and insight work.', bestFor: 'Analytics and research', layout: 'minimal-grid' },
    { id: 'debug', label: 'Debug', blurb: 'Focused dark layout designed for rapid scanning.', bestFor: 'Technical support and QA', layout: 'contrast' },
  ]),
  ...templateGroup('Academic', [
    { id: 'scholar', label: 'Scholar', blurb: 'Text-led format for credentials and publications.', bestFor: 'Academia and research', layout: 'editorial' },
    { id: 'citation', label: 'Citation', blurb: 'Ordered structure for publications, grants, and teaching.', bestFor: 'Researchers and lecturers', layout: 'executive' },
    { id: 'lectern', label: 'Lectern', blurb: 'Classical presentation with a calm scholarly voice.', bestFor: 'Education and academic roles', layout: 'editorial' },
    { id: 'research-note', label: 'Research Note', blurb: 'Clear space for research outcomes and methods.', bestFor: 'Research specialists', layout: 'minimal-grid' },
    { id: 'faculty', label: 'Faculty', blurb: 'Formal hierarchy that supports longer career histories.', bestFor: 'Faculty applications', layout: 'executive' },
    { id: 'thesis', label: 'Thesis', blurb: 'Clean typography for structured academic information.', bestFor: 'Postgraduates and researchers', layout: 'editorial' },
    { id: 'seminar', label: 'Seminar', blurb: 'Balanced layout for teaching, awards, and service.', bestFor: 'Teaching professionals', layout: 'sidebar' },
    { id: 'archive', label: 'Archive', blurb: 'Simple chronological layout for sustained work.', bestFor: 'Academic administration', layout: 'executive' },
    { id: 'fieldwork', label: 'Fieldwork', blurb: 'Flexible modules for research and project outcomes.', bestFor: 'Field researchers', layout: 'minimal-grid' },
    { id: 'journal', label: 'Journal', blurb: 'Polished editorial treatment for extensive credentials.', bestFor: 'Publishing and academia', layout: 'editorial' },
  ]),
  ...templateGroup('Graduate', [
    { id: 'graduate-start', label: 'Graduate Start', blurb: 'Friendly, simple entry point for first applications.', bestFor: 'Students and graduates', layout: 'executive' },
    { id: 'first-step', label: 'First Step', blurb: 'Skills-forward format with clear education visibility.', bestFor: 'Entry-level applicants', layout: 'sidebar' },
    { id: 'campus', label: 'Campus', blurb: 'Fresh modular layout for projects and activities.', bestFor: 'Internships and placements', layout: 'minimal-grid' },
    { id: 'launch', label: 'Launch', blurb: 'High-energy header without compromising readability.', bestFor: 'Graduate programmes', layout: 'spotlight' },
    { id: 'early-career', label: 'Early Career', blurb: 'Practical structure for transferable skills.', bestFor: 'Career starters', layout: 'executive' },
    { id: 'apprentice', label: 'Apprentice', blurb: 'Clear signposts for training and practical experience.', bestFor: 'Apprenticeships and trade roles', layout: 'sidebar' },
    { id: 'trainee', label: 'Trainee', blurb: 'A clean profile with room for learning milestones.', bestFor: 'Trainee roles', layout: 'executive' },
    { id: 'next-chapter', label: 'Next Chapter', blurb: 'Contemporary styling for a confident career beginning.', bestFor: 'Graduate and junior roles', layout: 'spotlight' },
    { id: 'foundation', label: 'Foundation', blurb: 'Minimal hierarchy built around education and potential.', bestFor: 'First professional CV', layout: 'minimal-grid' },
    { id: 'intern', label: 'Intern', blurb: 'Compact one-page design for focused applications.', bestFor: 'Internships', layout: 'executive' },
  ]),
  ...templateGroup('Healthcare', [
    { id: 'clinical', label: 'Clinical', blurb: 'Clean credentials-first format for care professionals.', bestFor: 'Healthcare and nursing', layout: 'executive' },
    { id: 'care-path', label: 'Care Path', blurb: 'Reliable sidebar for licences, skills, and training.', bestFor: 'Clinical support and care', layout: 'sidebar' },
    { id: 'ward-round', label: 'Ward Round', blurb: 'Ordered sections for a practical clinical timeline.', bestFor: 'Nursing and allied health', layout: 'executive' },
    { id: 'medic', label: 'Medic', blurb: 'Formal structure for qualifications and experience.', bestFor: 'Medical professionals', layout: 'editorial' },
    { id: 'health-brief', label: 'Health Brief', blurb: 'Simple, trustworthy hierarchy for quick review.', bestFor: 'Public health and administration', layout: 'executive' },
    { id: 'vital', label: 'Vital', blurb: 'Clear, modern layout with a compassionate accent.', bestFor: 'Wellness and care roles', layout: 'spotlight' },
    { id: 'pharmacy', label: 'Pharmacy', blurb: 'Precise content blocks for certifications and detail.', bestFor: 'Pharmacy and laboratory', layout: 'minimal-grid' },
    { id: 'patient-first', label: 'Patient First', blurb: 'Professional profile focused on care impact.', bestFor: 'Patient-facing professionals', layout: 'executive' },
    { id: 'public-health', label: 'Public Health', blurb: 'Structured narrative for programmes and outcomes.', bestFor: 'Public health and NGO roles', layout: 'sidebar' },
    { id: 'wellness', label: 'Wellness', blurb: 'Light, approachable design that remains professional.', bestFor: 'Health and wellness roles', layout: 'minimal-grid' },
  ]),
  ...templateGroup('Sales', [
    { id: 'revenue', label: 'Revenue', blurb: 'Achievement-led layout for commercial results.', bestFor: 'Sales and business development', layout: 'spotlight' },
    { id: 'pipeline', label: 'Pipeline', blurb: 'Focused structure for metrics and account growth.', bestFor: 'Account executives', layout: 'sidebar' },
    { id: 'growth', label: 'Growth', blurb: 'Confident modern format with strong visibility.', bestFor: 'Growth and partnerships', layout: 'spotlight' },
    { id: 'account', label: 'Account', blurb: 'Polished professional flow for client ownership.', bestFor: 'Account managers', layout: 'executive' },
    { id: 'close', label: 'Close', blurb: 'Bold header and fast-scanning achievements.', bestFor: 'Sales representatives', layout: 'spotlight' },
    { id: 'market-maker', label: 'Market Maker', blurb: 'Strategic format for commercial leadership.', bestFor: 'Commercial leaders', layout: 'executive' },
    { id: 'partner', label: 'Partner', blurb: 'Relationship-led profile with a precise sidebar.', bestFor: 'Partnerships and customer success', layout: 'sidebar' },
    { id: 'territory', label: 'Territory', blurb: 'Structured accomplishments for regional experience.', bestFor: 'Field and territory sales', layout: 'executive' },
    { id: 'conversion', label: 'Conversion', blurb: 'Modern grid for campaigns, results, and skills.', bestFor: 'Marketing and growth', layout: 'minimal-grid' },
    { id: 'client-win', label: 'Client Win', blurb: 'Direct, readable format for commercial impact.', bestFor: 'Client-facing roles', layout: 'executive' },
  ]),
  ...templateGroup('Bold', [
    { id: 'bold-stripe', label: 'Bold Stripe', blurb: 'Strong colour-led header with a clean content core.', bestFor: 'Confident modern applications', layout: 'spotlight' },
    { id: 'night-shift', label: 'Night Shift', blurb: 'Dark, high-contrast option for a striking profile.', bestFor: 'Technical and creative roles', layout: 'contrast' },
    { id: 'flare', label: 'Flare', blurb: 'Expressive accent treatment with readable sections.', bestFor: 'Marketing and creative roles', layout: 'spotlight' },
    { id: 'edge', label: 'Edge', blurb: 'Crisp contrast and decisive information hierarchy.', bestFor: 'Product and design leaders', layout: 'contrast' },
    { id: 'momentum', label: 'Momentum', blurb: 'Energetic framing for achievement-led stories.', bestFor: 'Sales and growth roles', layout: 'spotlight' },
    { id: 'electric', label: 'Electric', blurb: 'Vibrant, modern visual system with clear navigation.', bestFor: 'Creative technology roles', layout: 'contrast' },
    { id: 'frontier', label: 'Frontier', blurb: 'Bold modern layout that still favours scanability.', bestFor: 'Innovation and startup roles', layout: 'minimal-grid' },
    { id: 'impact-line', label: 'Impact Line', blurb: 'Graphic sectional rhythm for accomplishment-heavy CVs.', bestFor: 'Leadership and commercial roles', layout: 'spotlight' },
    { id: 'statement', label: 'Statement', blurb: 'A decisive editorial design for a memorable profile.', bestFor: 'Creative directors and strategists', layout: 'editorial' },
    { id: 'high-voltage', label: 'High Voltage', blurb: 'Maximum contrast for a confident design-led option.', bestFor: 'Creative and technical portfolios', layout: 'contrast' },
  ]),
];

export const CV_TEMPLATE_IDS: readonly CVTemplateId[] = CV_TEMPLATE_CATALOG.map((template) => template.id);

export const CV_TEMPLATE_META: Record<CVTemplateId, CVTemplateDefinition> = Object.fromEntries(
  CV_TEMPLATE_CATALOG.map((template) => [template.id, template])
);

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

const THEME_PALETTES: Array<Omit<CVTemplateTheme, 'name'>> = [
  { pageBackground: '#F8FAFC', panelBackground: '#FFFFFF', headingColor: '#0F172A', accentColor: '#0F172A', subheadingColor: '#475569', bodyColor: '#1E293B', mutedColor: '#64748B', borderColor: '#CBD5E1' },
  { pageBackground: '#EFF6FF', panelBackground: '#FFFFFF', headingColor: '#1D4ED8', accentColor: '#1D4ED8', subheadingColor: '#1E40AF', bodyColor: '#1F2937', mutedColor: '#64748B', borderColor: '#BFDBFE', sidebarBackground: '#1D4ED8', sidebarText: '#EFF6FF' },
  { pageBackground: '#FAFAF9', panelBackground: '#FFFBF5', headingColor: '#7C2D12', accentColor: '#BE123C', subheadingColor: '#9A3412', bodyColor: '#292524', mutedColor: '#78716C', borderColor: '#E7E5E4' },
  { pageBackground: '#FFF7ED', panelBackground: '#FFFFFF', headingColor: '#9A3412', accentColor: '#EA580C', subheadingColor: '#C2410C', bodyColor: '#1F2937', mutedColor: '#78716C', borderColor: '#FED7AA' },
  { pageBackground: '#ECFDF5', panelBackground: '#FFFFFF', headingColor: '#065F46', accentColor: '#047857', subheadingColor: '#047857', bodyColor: '#1F2937', mutedColor: '#6B7280', borderColor: '#A7F3D0' },
  { pageBackground: '#020617', panelBackground: '#0F172A', headingColor: '#E2E8F0', accentColor: '#67E8F9', subheadingColor: '#A5F3FC', bodyColor: '#CBD5E1', mutedColor: '#94A3B8', borderColor: '#334155', sidebarBackground: '#155E75', sidebarText: '#ECFEFF' },
  { pageBackground: '#FFF1F2', panelBackground: '#FFFFFF', headingColor: '#881337', accentColor: '#E11D48', subheadingColor: '#BE123C', bodyColor: '#334155', mutedColor: '#64748B', borderColor: '#FECDD3' },
  { pageBackground: '#F5F3FF', panelBackground: '#FFFFFF', headingColor: '#4C1D95', accentColor: '#7C3AED', subheadingColor: '#5B21B6', bodyColor: '#312E81', mutedColor: '#6B7280', borderColor: '#DDD6FE', sidebarBackground: '#5B21B6', sidebarText: '#F5F3FF' },
  { pageBackground: '#FFFBEB', panelBackground: '#FFFFFF', headingColor: '#92400E', accentColor: '#D97706', subheadingColor: '#B45309', bodyColor: '#3F3F46', mutedColor: '#78716C', borderColor: '#FDE68A' },
  { pageBackground: '#F0FDFA', panelBackground: '#FFFFFF', headingColor: '#115E59', accentColor: '#0F766E', subheadingColor: '#0F766E', bodyColor: '#134E4A', mutedColor: '#64748B', borderColor: '#99F6E4', sidebarBackground: '#0F766E', sidebarText: '#F0FDFA' },
];

export const CV_TEMPLATE_THEMES: Record<CVTemplateId, CVTemplateTheme> = Object.fromEntries(
  CV_TEMPLATE_CATALOG.map((template) => [
    template.id,
    {
      name: template.label,
      ...THEME_PALETTES[template.paletteIndex % THEME_PALETTES.length],
    },
  ])
);

const FALLBACK_TEMPLATE = CV_TEMPLATE_CATALOG.find((template) => template.id === 'executive')!;

export function getCVTemplateMeta(templateId: CVTemplateId): CVTemplateDefinition {
  return CV_TEMPLATE_META[templateId] ?? FALLBACK_TEMPLATE;
}

export function getCVTemplateTheme(templateId: CVTemplateId): CVTemplateTheme {
  return CV_TEMPLATE_THEMES[templateId] ?? CV_TEMPLATE_THEMES[FALLBACK_TEMPLATE.id];
}

export function getCVTemplateLayout(templateId: CVTemplateId): CVTemplateLayout {
  return getCVTemplateMeta(templateId).layout;
}

export function getCVTemplateDesign(templateId: CVTemplateId): CVTemplateDesign {
  return getCVTemplateMeta(templateId).design;
}

export function getCVPhotoPlacementLabel(templateId: CVTemplateId): string {
  return CV_PHOTO_PLACEMENT_LABELS[getCVTemplateDesign(templateId).photoPlacement];
}

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
      // Models occasionally make the candidate name a level-one Markdown heading.
      // Treat that as a name, never as document content or a template heading.
      headerLines.push(cleanText(line.replace(/^#\s+/, '')));
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

  const [firstHeaderLine = '', ...rest] = headerLines;
  const labelledHeaderName = firstHeaderLine.match(/^name\s*:\s*(.+)$/i)?.[1]?.trim();
  const contactSection = sections.find((section) => /^(contact|personal information|personal details)$/i.test(section.title));
  const contactName = contactSection
    ? [
        ...contactSection.paragraphs,
        ...contactSection.bullets,
        ...contactSection.entries.flatMap((entry) => [entry.heading, entry.meta ?? '']),
      ]
        .map((line) => line.match(/^name\s*:\s*(.+)$/i)?.[1]?.trim())
        .find((value): value is string => Boolean(value)) ?? ''
    : '';
  const name = labelledHeaderName || firstHeaderLine || contactName;

  // Once promoted to the header, do not repeat a labelled name inside Contact.
  if (contactSection && contactName) {
    contactSection.paragraphs = contactSection.paragraphs.filter((line) => !/^name\s*:/i.test(line));
    contactSection.bullets = contactSection.bullets.filter((line) => !/^name\s*:/i.test(line));
    contactSection.entries = contactSection.entries.filter(
      (entry) => !/^name\s*:/i.test(entry.heading) && !/^name\s*:/i.test(entry.meta ?? '')
    );
  }

  return {
    header: {
      name,
      tagline: rest[0] ?? '',
      contacts: rest.slice(1),
    },
    sections,
  };
}
