'use client';

import { useState, type ChangeEvent } from 'react';
import {
  CVPreviewCard,
  CV_TEMPLATE_CATALOG,
  CV_TEMPLATE_META,
  getCVPhotoPlacementLabel,
  getCVTemplateTheme,
  PROFESSIONAL_TEMPLATE_META,
  type CVTemplateCategory,
  type CVTemplateId,
  type CVVariant,
  type ProfessionalTemplateId,
  HtmlTemplatePreview,
} from '@/components/cv-preview';
import dynamic from 'next/dynamic';
import { submitReview } from '@/lib/supabase';

const copy = {
  title: "ATS CV Builder",
  subtitle: "Build cleaner ATS-ready CVs with AI-generated content and flexible templates.",
  badge: "AI",
  steps: ["Fill in your details", "Choose a design", "Preview and export"],
  sectionsTitle: "CV Sections",
  sectionsHint: "Toggle sections on or off and reorder them.",
  personalInfo: "Personal Information",
  activeSections: "sections active",
  removeSection: "Remove section",
  emptyState: "Enable sections from the left panel to get started.",
  generating: "Generating your CV with AI...",
  generateButton: "Generate CV",
  chooseDesignTitle: "Choose your CV design",
  chooseDesignBody: "Your resume copy is ready. Pick the design direction you want to use.",
  editDetails: "Edit details",
  downloadSource: "Download source text",
  designHint: "Each selected template controls the exact visual format of the generated CV.",
  seeAllDesigns: "See all designs",
  browseTemplateLibrary: "Browse all 100 templates",
  previewSuffix: "preview",
} as const;

const TEMPLATE_CATEGORIES: Array<CVTemplateCategory | 'All'> = [
  'All',
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
const TEMPLATES_PER_PAGE = 12;

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

type Experience = { company: string; role: string; duration: string; bullets: string };
type Education = { institution: string; degree: string; year: string };
type ReviewState = {
  rating: number;
  comment: string;
  documentType: string;
};
type SectionId =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'
  | 'languages'
  | 'volunteer'
  | 'awards'
  | 'publications'
  | 'references';

const ALL_SECTIONS: { id: SectionId; label: string; icon: string; defaultOn: boolean }[] = [
  { id: 'summary', label: 'Professional Summary', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', defaultOn: true },
  { id: 'experience', label: 'Work Experience', icon: 'M21 13.255A23.237 23.237 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', defaultOn: true },
  { id: 'education', label: 'Education', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z', defaultOn: true },
  { id: 'skills', label: 'Skills', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', defaultOn: true },
  { id: 'certifications', label: 'Certifications', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', defaultOn: false },
  { id: 'projects', label: 'Projects', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', defaultOn: false },
  { id: 'languages', label: 'Languages', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129', defaultOn: false },
  { id: 'volunteer', label: 'Volunteer Work', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', defaultOn: false },
  { id: 'awards', label: 'Awards & Achievements', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', defaultOn: false },
  { id: 'publications', label: 'Publications', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', defaultOn: false },
  { id: 'references', label: 'References', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', defaultOn: false },
];

const COLORS: Record<string, { badge: string; border: string; bg: string; text: string; btn: string }> = {
  blue: { badge: 'bg-blue-100 text-blue-700', border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700' },
  violet: { badge: 'bg-violet-100 text-violet-700', border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-700', btn: 'bg-violet-600 hover:bg-violet-700' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700' },
};

const emptyExp = (): Experience => ({ company: '', role: '', duration: '', bullets: '' });
const emptyEdu = (): Education => ({ institution: '', degree: '', year: '' });

async function compressPassportPhoto(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error('The image could not be read.'));
      nextImage.src = imageUrl;
    });
    const maxSide = 600;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photo processing is not available in this browser.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.86);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function Steps({ current, labels }: { current: 1 | 2 | 3; labels: readonly string[] }) {
  const steps = labels;

  return (
    <div className="mb-8 flex items-center gap-0">
      {steps.map((label, index) => {
        const n = index + 1;
        const done = current > n;
        const active = current === n;

        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
                  done
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : active
                      ? 'border-blue-600 bg-white text-blue-600'
                      : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {done ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  n
                )}
              </div>
              <span className={`mt-1 hidden text-xs font-medium sm:block ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-1 mb-4 h-0.5 w-16 transition-all sm:w-28 ${done ? 'bg-blue-600' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
        on ? 'bg-blue-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          on ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function toFieldId(label: string) {
  return 'cv-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  id?: string;
}) {
  const fieldId = id ?? toFieldId(label);
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</label>
      <input
        id={fieldId}
        name={fieldId}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  id?: string;
}) {
  const fieldId = id ?? toFieldId(label);
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</label>
      <textarea
        id={fieldId}
        name={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default function CVBuilderPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [enabledSections, setEnabledSections] = useState<SectionId[]>(
    ALL_SECTIONS.filter((section) => section.defaultOn).map((section) => section.id)
  );
  const [personal, setPersonal] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
  });
  const [summary, setSummary] = useState('');
  const [experience, setExperience] = useState<Experience[]>([emptyExp()]);
  const [education, setEducation] = useState<Education[]>([emptyEdu()]);
  const [skills, setSkills] = useState('');
  const [certifications, setCertifications] = useState('');
  const [projects, setProjects] = useState('');
  const [languages, setLanguages] = useState('');
  const [volunteer, setVolunteer] = useState('');
  const [awards, setAwards] = useState('');
  const [publications, setPublications] = useState('');
  const [references, setReferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [variants, setVariants] = useState<CVVariant[]>([]);
  const [selected, setSelected] = useState<CVVariant | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<CVTemplateId>('executive');
  const [passportPhotoEnabled, setPassportPhotoEnabled] = useState(false);
  const [passportPhoto, setPassportPhoto] = useState('');
  const [templateCategory, setTemplateCategory] = useState<CVTemplateCategory | 'All'>('All');
  const [templatePage, setTemplatePage] = useState(0);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [exporting, setExporting] = useState(false);
  const [improvingSummary, setImprovingSummary] = useState(false);
  const [templateType, setTemplateType] = useState<'standard' | 'professional'>('standard');
  const [generatingProfessionalId, setGeneratingProfessionalId] = useState<ProfessionalTemplateId | null>(null);
  const [selectedProfessionalTemplate, setSelectedProfessionalTemplate] = useState<{
    id: ProfessionalTemplateId;
    label: string;
    html: string;
  } | null>(null);
  const [profExportFormat, setProfExportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewState>({
    rating: 0,
    comment: '',
    documentType: '',
  });
  const filteredTemplates = templateCategory === 'All'
    ? CV_TEMPLATE_CATALOG
    : CV_TEMPLATE_CATALOG.filter((template) => template.category === templateCategory);
  const templatePageCount = Math.max(1, Math.ceil(filteredTemplates.length / TEMPLATES_PER_PAGE));
  const visibleTemplates = filteredTemplates.slice(
    templatePage * TEMPLATES_PER_PAGE,
    (templatePage + 1) * TEMPLATES_PER_PAGE
  );

  function setPersonalField(key: keyof typeof personal, value: string) {
    setPersonal((current) => ({ ...current, [key]: value }));
  }

  async function handlePassportPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Use a JPG or PNG passport photo.');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError('Use a passport photo smaller than 6 MB.');
      return;
    }

    try {
      setError('');
      setPassportPhoto(await compressPassportPhoto(file));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The passport photo could not be processed.');
    }
  }

  function toggleSection(id: SectionId) {
    setEnabledSections((current) =>
      current.includes(id) ? current.filter((section) => section !== id) : [...current, id]
    );
  }

  function moveSection(id: SectionId, direction: -1 | 1) {
    setEnabledSections((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function setExperienceField(index: number, key: keyof Experience, value: string) {
    setExperience((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  function setEducationField(index: number, key: keyof Education, value: string) {
    setEducation((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  async function generate() {
    setError('');
    setLoading(true);
    setVariants([]);
    setSelected(null);
    setSelectedProfessionalTemplate(null);

    try {
      const has = (id: SectionId) => enabledSections.includes(id);
      const response = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...personal,
          sections: enabledSections,
          summary: has('summary') ? summary : undefined,
          experience: has('experience') ? experience : undefined,
          education: has('education') ? education : undefined,
          skills: has('skills') ? skills : undefined,
          certifications: has('certifications') ? certifications : undefined,
          projects: has('projects') ? projects : undefined,
          languages: has('languages') ? languages : undefined,
          volunteer: has('volunteer') ? volunteer : undefined,
          awards: has('awards') ? awards : undefined,
          publications: has('publications') ? publications : undefined,
          references: has('references') ? references : undefined,
          style: 'classic',
        }),
      });

      const data = (await response.json()) as { variants?: CVVariant[]; error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? 'Generation failed');
      }

      const nextVariants = data.variants ?? [];
      setVariants(nextVariants);
      setSelected(nextVariants[0] ?? null);
      setSelectedTemplateId('executive');
      setTemplateCategory('All');
      setTemplatePage(0);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function chooseVariant(variant: CVVariant, templateId: CVTemplateId) {
    setSelected(variant);
    setSelectedTemplateId(templateId);
    setStep(3);
  }

  function chooseTemplate(templateId: CVTemplateId) {
    const contentVariant = selected ?? variants[0];
    if (!contentVariant) return;
    chooseVariant(contentVariant, templateId);
  }

  async function exportVariant(variant: CVVariant, templateId: CVTemplateId) {
    setExporting(true);
    setError('');

    try {
      const response = await fetch('/api/cv/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: variant.content,
          templateId,
          format: exportFormat,
          passportPhoto: passportPhotoEnabled ? passportPhoto || undefined : undefined,
          fileBaseName: `${personal.name || 'CV'}_${variant.title}_${CV_TEMPLATE_META[templateId].label}`,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="((?:\\.|[^"\\])*)"/) || disposition.match(/filename=([^;\s]+)/);
      anchor.download = match ? match[1] : `cv.${exportFormat}`;
      anchor.href = url;
      anchor.click();
      URL.revokeObjectURL(url);

      // Trigger review modal
      setReviewData(prev => ({ ...prev, documentType: `cv-${exportFormat}` }));
      setShowReviewModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setExporting(false);
    }
  }

  async function improveSummary() {
    if (!summary.trim() && !experience.some((e) => e.role.trim() || e.company.trim())) {
      setError('Please add some work experience or a basic summary to improve.');
      return;
    }

    setImprovingSummary(true);
    setError('');

    try {
      const response = await fetch('/api/cv/improve-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          name: personal.name,
          experience,
          skills,
        }),
      });

      const data = (await response.json()) as { summary?: string; error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? 'Failed to improve summary');
      }

      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setImprovingSummary(false);
    }
  }

  async function generateProfessionalTemplate(templateId: ProfessionalTemplateId) {
    const content = selected?.content ?? variants[0]?.content;
    if (!content) {
      setError('Generate your CV content before choosing a professional template.');
      return;
    }

    setError('');
    setGeneratingProfessionalId(templateId);

    try {
      const response = await fetch('/api/cv/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, templateId }),
      });
      const data = (await response.json().catch(() => ({}))) as { htmlTemplate?: string; error?: string };

      if (!response.ok || !data.htmlTemplate?.trim()) {
        throw new Error(data.error ?? `Could not generate the ${PROFESSIONAL_TEMPLATE_META[templateId].label} template.`);
      }

      setSelectedProfessionalTemplate({
        id: templateId,
        label: PROFESSIONAL_TEMPLATE_META[templateId].label,
        html: data.htmlTemplate,
      });
      setTemplateType('professional');
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate the professional template.');
    } finally {
      setGeneratingProfessionalId(null);
    }
  }

  async function handleReviewSubmit(review: { rating: number; comment: string; documentType: string }) {
    await submitReview({
      document_type: review.documentType,
      rating: review.rating,
      comment: review.comment || undefined,
      user_email: personal.email || undefined,
    });
    setShowReviewModal(false);
    setReviewData({ rating: 0, comment: '', documentType: '' });
  }

  const canGenerate = personal.name.trim() && personal.email.trim() && enabledSections.length > 0;

  function renderSectionFields(id: SectionId) {
    switch (id) {
      case 'summary':
        return (
          <div className="relative">
            <TextareaField
              label="Professional Summary"
              value={summary}
              onChange={setSummary}
              placeholder="Results-driven software engineer with 5+ years delivering scalable web applications."
              rows={4}
            />
            <button
              type="button"
              onClick={improveSummary}
              disabled={improvingSummary}
              className="absolute top-8 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md transition-all hover:scale-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              title="Improve with AI"
            >
              {improvingSummary ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              )}
            </button>
          </div>
        );
      case 'experience':
        return (
          <div className="space-y-4">
            {experience.map((item, index) => (
              <div key={index} className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Position {index + 1}</span>
                  {experience.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setExperience((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      className="text-xs font-medium text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Company" value={item.company} onChange={(value) => setExperienceField(index, 'company', value)} placeholder="Acme Corp" />
                  <InputField label="Job Title" value={item.role} onChange={(value) => setExperienceField(index, 'role', value)} placeholder="Senior Developer" />
                </div>
                <InputField label="Duration" value={item.duration} onChange={(value) => setExperienceField(index, 'duration', value)} placeholder="Jan 2022 - Present" />
                <TextareaField
                  label="Achievements and Responsibilities"
                  value={item.bullets}
                  onChange={(value) => setExperienceField(index, 'bullets', value)}
                  placeholder="Led a team of 6 engineers to deliver a platform rewrite that cut latency by 40%."
                  rows={3}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setExperience((current) => [...current, emptyExp()])}
              className="w-full rounded-lg border-2 border-dashed border-slate-200 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-500"
            >
              + Add position
            </button>
          </div>
        );
      case 'education':
        return (
          <div className="space-y-3">
            {education.map((item, index) => (
              <div key={index} className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Entry {index + 1}</span>
                  {education.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEducation((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      className="text-xs font-medium text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <InputField label="Institution" value={item.institution} onChange={(value) => setEducationField(index, 'institution', value)} placeholder="University of Lagos" />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Degree" value={item.degree} onChange={(value) => setEducationField(index, 'degree', value)} placeholder="B.Sc. Computer Science" />
                  <InputField label="Year" value={item.year} onChange={(value) => setEducationField(index, 'year', value)} placeholder="2021" />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEducation((current) => [...current, emptyEdu()])}
              className="w-full rounded-lg border-2 border-dashed border-slate-200 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-500"
            >
              + Add education entry
            </button>
          </div>
        );
      case 'skills':
        return <InputField label="Skills (comma-separated)" value={skills} onChange={setSkills} placeholder="React, Node.js, TypeScript, PostgreSQL, AWS" />;
      case 'certifications':
        return <TextareaField label="Certifications" value={certifications} onChange={setCertifications} placeholder="AWS Certified Developer Associate (2023)" />;
      case 'projects':
        return <TextareaField label="Projects" value={projects} onChange={setProjects} placeholder="Eazitool - SaaS productivity platform built with Next.js and TypeScript." rows={4} />;
      case 'languages':
        return <TextareaField label="Languages" value={languages} onChange={setLanguages} placeholder="English (Native), Yoruba (Fluent), French (Conversational)" />;
      case 'volunteer':
        return <TextareaField label="Volunteer Work" value={volunteer} onChange={setVolunteer} placeholder="Mentor - Google Developer Student Clubs. Coached students on web development fundamentals." rows={4} />;
      case 'awards':
        return <TextareaField label="Awards and Achievements" value={awards} onChange={setAwards} placeholder="Best Tech Startup - Nigeria Tech Summit 2023" />;
      case 'publications':
        return <TextareaField label="Publications" value={publications} onChange={setPublications} placeholder="Conference talk or publication details" />;
      case 'references':
        return <TextareaField label="References" value={references} onChange={setReferences} placeholder="Available on request" />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{copy.title}</h1>
              <p className="text-sm text-slate-500">{copy.subtitle}</p>
            </div>
            <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">{copy.badge}</span>
          </div>
        </div>

        <Steps current={step} labels={copy.steps} />

        {step === 1 && (
          <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
            <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
              <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">{copy.sectionsTitle}</h2>
              <p className="mb-4 text-xs text-slate-400">{copy.sectionsHint}</p>
              <div className={`mb-3 rounded-xl border p-3 transition-colors ${passportPhotoEnabled ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <svg className={`h-4 w-4 shrink-0 ${passportPhotoEnabled ? 'text-blue-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-1.862A1 1 0 0121 9.064v5.872a1 1 0 01-1.447.926L15 14m-7 3h5a2 2 0 002-2V7a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold ${passportPhotoEnabled ? 'text-slate-700' : 'text-slate-500'}`}>Passport photo</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">Optional photo for the selected CV design.</p>
                  </div>
                  <Toggle
                    on={passportPhotoEnabled}
                    onChange={() => {
                      const nextEnabled = !passportPhotoEnabled;
                      setPassportPhotoEnabled(nextEnabled);
                      if (!nextEnabled) setPassportPhoto('');
                    }}
                  />
                </div>
                {passportPhotoEnabled && (
                  <div className="mt-3 border-t border-blue-100 pt-3">
                    <div className="flex items-center gap-3">
                      {passportPhoto ? (
                        // User-provided data URLs are compressed locally and cannot use next/image optimization.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={passportPhoto} alt="Selected passport photo" className="h-12 w-12 rounded-lg border-2 border-white object-cover shadow-sm" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-blue-200 bg-white text-[10px] font-semibold text-slate-400">Photo</div>
                      )}
                      <input
                        id="passport-photo"
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handlePassportPhotoChange}
                        className="block min-w-0 max-w-full text-[10px] text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-600 file:px-2 file:py-1.5 file:text-[10px] file:font-bold file:text-white hover:file:bg-blue-700"
                      />
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-slate-400">JPG or PNG, up to 6 MB. The selected template shows its photo position; no position falls back to top-left.</p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                {ALL_SECTIONS.map((section) => {
                  const isOn = enabledSections.includes(section.id);
                  const index = enabledSections.indexOf(section.id);

                  return (
                    <div key={section.id} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${isOn ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      <svg className={`h-4 w-4 flex-shrink-0 ${isOn ? 'text-blue-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={section.icon} />
                      </svg>
                      <span className={`flex-1 text-xs font-medium ${isOn ? 'text-slate-700' : 'text-slate-400'}`}>{section.label}</span>
                      {isOn && (
                        <div className="flex gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveSection(section.id, -1)}
                            disabled={index === 0}
                            className="flex h-5 w-5 items-center justify-center rounded text-slate-300 hover:text-slate-600 disabled:opacity-20"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(section.id, 1)}
                            disabled={index === enabledSections.length - 1}
                            className="flex h-5 w-5 items-center justify-center rounded text-slate-300 hover:text-slate-600 disabled:opacity-20"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <Toggle on={isOn} onChange={() => toggleSection(section.id)} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
                {enabledSections.length} / {ALL_SECTIONS.length} {copy.activeSections}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">{copy.personalInfo}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <InputField label="Full Name *" value={personal.name} onChange={(value) => setPersonalField('name', value)} placeholder="Emmanuel Adejoh" />
                  </div>
                  <InputField label="Email *" value={personal.email} onChange={(value) => setPersonalField('email', value)} placeholder="you@email.com" type="email" />
                  <InputField label="Phone" value={personal.phone} onChange={(value) => setPersonalField('phone', value)} placeholder="+234 800 000 0000" />
                  <InputField label="Address / Location" value={personal.location} onChange={(value) => setPersonalField('location', value)} placeholder="12 Marina Road, Lagos or leave blank" />
                  <InputField label="LinkedIn" value={personal.linkedin} onChange={(value) => setPersonalField('linkedin', value)} placeholder="linkedin.com/in/you" />
                  <div className="sm:col-span-2">
                    <InputField label="Website / Portfolio" value={personal.website} onChange={(value) => setPersonalField('website', value)} placeholder="yourportfolio.com" />
                  </div>
                </div>
              </div>

              {enabledSections.map((id) => {
                const section = ALL_SECTIONS.find((item) => item.id === id)!;
                return (
                  <div key={id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{section.label}</h2>
                      <button type="button" onClick={() => toggleSection(id)} className="text-xs font-medium text-slate-400 transition-colors hover:text-red-500">
                        {copy.removeSection}
                      </button>
                    </div>
                    {renderSectionFields(id)}
                  </div>
                );
              })}

              {enabledSections.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                  <p className="text-sm text-slate-400">{copy.emptyState}</p>
                </div>
              )}

              {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

              <button
                type="button"
                onClick={generate}
                disabled={!canGenerate || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {copy.generating}
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {copy.generateButton}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            {/* Header row */}
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{copy.chooseDesignTitle}</h2>
                <p className="mt-0.5 text-sm text-slate-500">{copy.chooseDesignBody}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setVariants([]);
                  }}
                  className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {copy.editDetails}
                </button>
              </div>
            </div>

            {/* Prominent Standard / Professional toggle */}
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
              {(['standard', 'professional'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTemplateType(type)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    templateType === type
                      ? type === 'professional'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {type === 'professional' && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  )}
                  {type === 'standard' ? 'Standard' : 'Professional (Harvard, Google…)'}
                </button>
              ))}
            </div>

            {templateType === 'standard' ? (
              <div className="space-y-8">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{copy.browseTemplateLibrary}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      100 original CV design presets: ATS-minimal, professional, creative, and high-impact.
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    {filteredTemplates.length} {templateCategory === 'All' ? 'templates' : `${templateCategory.toLowerCase()} templates`}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter CV templates by category">
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setTemplateCategory(category);
                        setTemplatePage(0);
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        templateCategory === category
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleTemplates.map((template) => {
                    const theme = getCVTemplateTheme(template.id);
                    const design = template.design;
                    const isDarkHeader = ['banner', 'diagonal'].includes(design.headerStyle);
                    const isSidebar = ['sidebar-left', 'sidebar-right'].includes(design.bodyStyle);
                    const isTwoColumn = design.bodyStyle === 'two-column' || design.bodyStyle === 'cards';
                    const isTimeline = design.bodyStyle === 'timeline';
                    const photoPosition = design.photoPlacement === 'none' ? 'top-left' : design.photoPlacement;
                    const photoAtEnd = ['top-right', 'header-right'].includes(photoPosition);
                    const photoInSidebar = photoPosition === 'sidebar-top';
                    const headerBackground = design.headerStyle === 'diagonal'
                      ? `linear-gradient(125deg, ${theme.accentColor}, ${theme.headingColor})`
                      : isDarkHeader
                        ? theme.accentColor
                        : design.headerStyle === 'panel' || design.headerStyle === 'boxed'
                          ? theme.pageBackground
                          : theme.panelBackground;

                    return (
                      <article key={template.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
                        <div className="p-3" style={{ backgroundColor: theme.pageBackground }}>
                          <div className="overflow-hidden rounded-lg border shadow-sm" style={{ backgroundColor: theme.panelBackground, borderColor: theme.borderColor }}>
                            <div
                              className={`relative flex min-h-11 items-center gap-2 px-3 ${design.headerStyle === 'centered' ? 'justify-center text-center' : ''}`}
                              style={{
                                background: headerBackground,
                                borderLeft: design.headerStyle === 'rail' ? `5px solid ${theme.accentColor}` : undefined,
                                borderBottom: ['minimal', 'compact'].includes(design.headerStyle) ? `2px solid ${theme.borderColor}` : undefined,
                                borderRadius: ['panel', 'boxed'].includes(design.headerStyle) ? '8px' : undefined,
                              }}
                            >
                              {!photoInSidebar && (
                                <span
                                  className={`h-5 w-5 shrink-0 border-2 ${design.photoShape === 'circle' ? 'rounded-full' : design.photoShape === 'rounded' ? 'rounded-md' : 'rounded-sm'} ${photoAtEnd ? 'order-2 ml-auto' : ''}`}
                                  style={{ borderColor: isDarkHeader ? '#FFFFFF' : theme.accentColor, opacity: photoPosition === 'inline' ? 0.55 : 1 }}
                                />
                              )}
                              <div className={`space-y-1 ${photoAtEnd ? 'order-1' : ''}`}>
                                <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: isDarkHeader ? '#FFFFFF' : theme.headingColor }} />
                                <div className="h-1 w-10 rounded-full" style={{ backgroundColor: isDarkHeader ? '#FFFFFF99' : theme.mutedColor }} />
                              </div>
                            </div>
                            <div className={`flex min-h-16 gap-2 p-2 ${design.bodyStyle === 'sidebar-right' ? 'flex-row-reverse' : ''}`}>
                              {isSidebar && (
                                <span className="w-1/4 rounded-sm" style={{ backgroundColor: theme.sidebarBackground ?? theme.accentColor }}>
                                  {photoInSidebar && <span className={`mx-auto mt-2 block h-4 w-4 border-2 ${design.photoShape === 'circle' ? 'rounded-full' : design.photoShape === 'rounded' ? 'rounded-md' : 'rounded-sm'}`} style={{ borderColor: theme.sidebarText ?? '#FFFFFF' }} />}
                                </span>
                              )}
                              <div className={`relative flex-1 ${isTwoColumn ? 'grid grid-cols-2 gap-1.5' : 'space-y-1.5'} ${isTimeline ? 'border-l-2 pl-2' : ''}`} style={isTimeline ? { borderColor: theme.accentColor } : undefined}>
                                {[0, 1, 2].map((line) => (
                                  <span
                                    key={line}
                                    className={`${isTwoColumn ? 'h-6' : 'block h-1.5'} ${design.sectionStyle === 'boxed' ? 'rounded border' : design.sectionStyle === 'pill' || design.sectionStyle === 'capsule' ? 'rounded-full' : 'rounded-sm'}`}
                                    style={{
                                      backgroundColor: design.sectionStyle === 'pill' || design.sectionStyle === 'capsule' ? theme.accentColor : theme.borderColor,
                                      borderColor: theme.borderColor,
                                      width: isTwoColumn ? undefined : line === 1 ? '78%' : '100%',
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">{template.label}</h4>
                              <p className="mt-0.5 text-[11px] font-medium text-slate-400">{template.category} · {template.bestFor}</p>
                            </div>
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: theme.accentColor }}>
                              {design.headerStyle.replace('-', ' ')} · {design.bodyStyle.replace('-', ' ')}
                            </span>
                          </div>
                          <p className="mt-2 min-h-8 text-xs leading-relaxed text-slate-500">{template.blurb}</p>
                          <p className="mt-2 text-[11px] font-medium text-slate-400">Passport photo: {getCVPhotoPlacementLabel(template.id)}</p>
                          <button
                            type="button"
                            onClick={() => chooseTemplate(template.id)}
                            className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700"
                          >
                            Use this template
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setTemplatePage((current) => Math.max(0, current - 1))}
                    disabled={templatePage === 0}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-slate-500">Page {templatePage + 1} of {templatePageCount}</span>
                  <button
                    type="button"
                    onClick={() => setTemplatePage((current) => Math.min(templatePageCount - 1, current + 1))}
                    disabled={templatePage >= templatePageCount - 1}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </section>
              </div>
            ) : (
              <div>
                <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-900">
                  Select one professional direction to generate. Templates are generated one at a time, preventing the concurrent AI requests that caused the MIT and Stanford errors.
                </div>
                <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                  {(Object.entries(PROFESSIONAL_TEMPLATE_META) as Array<[
                    ProfessionalTemplateId,
                    (typeof PROFESSIONAL_TEMPLATE_META)[ProfessionalTemplateId]
                  ]>).map(([templateId, template]) => {
                    const isGenerating = generatingProfessionalId === templateId;

                    return (
                      <article key={templateId} className="flex flex-col overflow-hidden rounded-2xl border-2 border-violet-200 bg-white shadow-sm transition-all hover:shadow-lg">
                        <div className="bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-500 p-5 text-white">
                          <div className="mb-8 h-1.5 w-16 rounded-full bg-white/80" />
                          <div className="h-3 w-3/4 rounded-full bg-white" />
                          <div className="mt-2 h-2 w-1/2 rounded-full bg-violet-200" />
                          <div className="mt-5 grid grid-cols-3 gap-2">
                            <span className="h-12 rounded bg-white/15" />
                            <span className="col-span-2 h-12 rounded bg-white/10" />
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="text-base font-bold text-violet-700">{template.label}</h3>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">{template.blurb}</p>
                          <p className="mt-3 text-[11px] font-medium text-slate-400">Best for: {template.bestFor}</p>
                          <button
                            type="button"
                            onClick={() => generateProfessionalTemplate(templateId)}
                            disabled={generatingProfessionalId !== null}
                            className="mt-5 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isGenerating ? 'Generating preview...' : 'Generate and preview'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-slate-400">
              {copy.designHint}
            </p>
          </div>
        )}

        {step === 3 && (templateType === 'standard' ? (
          selected && (() => {
            const color = COLORS[selected.color as keyof typeof COLORS] ?? COLORS.blue;
            const templateMeta = CV_TEMPLATE_META[selectedTemplateId];

            return (
              <div>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${color.badge}`}>{selected.title}</span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{templateMeta.label}</h2>
                      <p className="text-xs text-slate-400">{templateMeta.blurb}</p>
                      {passportPhotoEnabled && passportPhoto && <p className="mt-1 text-xs font-medium text-slate-500">Passport photo position: {getCVPhotoPlacementLabel(selectedTemplateId)}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      {copy.seeAllDesigns}
                    </button>
                  </div>
                </div>

                <div className={`overflow-hidden rounded-2xl border-2 shadow-sm ${color.border}`}>
                  <div className={`flex items-center gap-2 border-b px-6 py-3 ${color.bg} ${color.border}`}>
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <span className={`ml-2 text-xs font-semibold ${color.text}`}>{personal.name} - {templateMeta.label} {copy.previewSuffix}</span>
                  </div>
                  <div className="max-h-[75vh] overflow-y-auto bg-slate-100 p-4 sm:p-8">
                    <CVPreviewCard variant={selected} templateId={selectedTemplateId} passportPhoto={passportPhotoEnabled ? passportPhoto : undefined} />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Choose your download format</p>
                    <p className="text-xs text-slate-500">Export the selected CV as a professionally styled PDF or DOCX.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                      {(['pdf', 'docx'] as const).map((format) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => setExportFormat(format)}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                            exportFormat === format
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => exportVariant(selected, selectedTemplateId)}
                      disabled={exporting}
                      className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${color.btn}`}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {exporting ? `Exporting ${exportFormat.toUpperCase()}...` : `Download ${exportFormat.toUpperCase()}`}
                    </button>
                  </div>
                </div>

              </div>
            );
          })()
        ) : (
          selectedProfessionalTemplate && (() => {
            const profMeta = PROFESSIONAL_TEMPLATE_META[selectedProfessionalTemplate.id];

            return (
              <div>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                      Professional
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{profMeta?.label}</h2>
                      <p className="text-xs text-slate-400">{profMeta?.blurb}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Templates
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border-2 border-violet-200 shadow-sm">
                  <div className={`flex items-center gap-2 border-b border-violet-200 bg-violet-50 px-6 py-3`}>
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs font-semibold text-violet-700">
                      {personal.name} - {profMeta?.label} Preview
                    </span>
                  </div>
                  <div className="max-h-[75vh] overflow-y-auto bg-slate-100 p-4 sm:p-8">
                    <HtmlTemplatePreview htmlTemplate={selectedProfessionalTemplate.html} />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Choose your download format</p>
                    <p className="text-xs text-slate-500">
                      {profExportFormat === 'pdf'
                        ? 'Print the professional template as PDF.'
                        : 'Export the CV content as DOCX document.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                      {(['pdf', 'docx'] as const).map((format) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => setProfExportFormat(format)}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                            profExportFormat === format
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setExporting(true);
                        try {
                          if (profExportFormat === 'pdf') {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(selectedProfessionalTemplate.html);
                              printWindow.document.close();
                              setTimeout(() => {
                                printWindow.print();
                                setExporting(false);
                                setReviewData(prev => ({ ...prev, documentType: `cv-professional-pdf` }));
                                setShowReviewModal(true);
                              }, 500);
                            }
                          } else {
                            const response = await fetch('/api/cv/export', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                content: selected?.content ?? variants[0]?.content ?? '',
                                templateId: 'executive',
                                format: 'docx',
                                passportPhoto: passportPhotoEnabled ? passportPhoto || undefined : undefined,
                                fileBaseName: `${personal.name || 'CV'}_${selectedProfessionalTemplate.id}`,
                              }),
                            });

                            if (!response.ok) throw new Error('Export failed');

                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            const anchor = document.createElement('a');
                            anchor.download = `${personal.name || 'CV'}_${selectedProfessionalTemplate.id}.docx`;
                            anchor.href = url;
                            anchor.click();
                            URL.revokeObjectURL(url);
                            setReviewData(prev => ({ ...prev, documentType: `cv-professional-docx` }));
                            setShowReviewModal(true);
                          }
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Export failed');
                        } finally {
                          if (profExportFormat === 'docx') {
                            setExporting(false);
                          }
                        }
                      }}
                      disabled={exporting}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {exporting ? 'Exporting...' : `Download ${profExportFormat.toUpperCase()}`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        ))}

        {error && step !== 1 && <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      </div>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
        documentType={reviewData.documentType}
      />
    </div>
  );
}
