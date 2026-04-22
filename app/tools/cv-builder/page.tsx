'use client';

import { useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Experience  = { company: string; role: string; duration: string; bullets: string };
type Education   = { institution: string; degree: string; year: string };
type SectionId   =
  | 'summary' | 'experience' | 'education' | 'skills'
  | 'certifications' | 'projects' | 'languages' | 'volunteer'
  | 'awards' | 'publications' | 'references';

interface Variant {
  style: string;
  title: string;
  badge: string;
  description: string;
  color: string;
  content: string;
}

// ─── Section catalogue ────────────────────────────────────────────────────────
const ALL_SECTIONS: { id: SectionId; label: string; icon: string; defaultOn: boolean }[] = [
  { id: 'summary',        label: 'Professional Summary',  icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',   defaultOn: true  },
  { id: 'experience',     label: 'Work Experience',        icon: 'M21 13.255A23.237 23.237 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', defaultOn: true  },
  { id: 'education',      label: 'Education',              icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',             defaultOn: true  },
  { id: 'skills',         label: 'Skills',                 icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', defaultOn: true  },
  { id: 'certifications', label: 'Certifications',         icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', defaultOn: false },
  { id: 'projects',       label: 'Projects',               icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',                                                                                                                                             defaultOn: false },
  { id: 'languages',      label: 'Languages',              icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',                                                           defaultOn: false },
  { id: 'volunteer',      label: 'Volunteer Work',         icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',                                                     defaultOn: false },
  { id: 'awards',         label: 'Awards & Achievements',  icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', defaultOn: false },
  { id: 'publications',   label: 'Publications',           icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', defaultOn: false },
  { id: 'references',     label: 'References',             icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', defaultOn: false },
];

const COLORS: Record<string, { badge: string; border: string; bg: string; text: string; btn: string; ring: string }> = {
  blue:    { badge: 'bg-blue-100 text-blue-700',    border: 'border-blue-300',    bg: 'bg-blue-50',    text: 'text-blue-700',    btn: 'bg-blue-600 hover:bg-blue-700',    ring: 'ring-blue-400'    },
  violet:  { badge: 'bg-violet-100 text-violet-700', border: 'border-violet-300',  bg: 'bg-violet-50',  text: 'text-violet-700',  btn: 'bg-violet-600 hover:bg-violet-700', ring: 'ring-violet-400'  },
  emerald: { badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'ring-emerald-400' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const emptyExp = (): Experience => ({ company: '', role: '', duration: '', bullets: '' });
const emptyEdu = (): Education  => ({ institution: '', degree: '', year: '' });

function preview(text: string, chars = 280) {
  return text.slice(0, chars) + (text.length > chars ? '…' : '');
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Fill in your details', 'Choose a CV style', 'Preview & download'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const n = i + 1;
        const done    = current > n;
        const active  = current === n;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                done   ? 'bg-blue-600 border-blue-600 text-white'
                : active ? 'bg-white border-blue-600 text-blue-600'
                : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : n}
              </div>
              <span className={`text-xs mt-1 hidden sm:block font-medium ${active ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-16 sm:w-28 mx-1 mb-4 transition-all ${done ? 'bg-blue-600' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${on ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${on ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

// ─── Section field renderers ──────────────────────────────────────────────────
function TextareaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CVBuilderPage() {
  // Step
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Enabled sections (ordered)
  const [enabledSections, setEnabledSections] = useState<SectionId[]>(
    ALL_SECTIONS.filter(s => s.defaultOn).map(s => s.id)
  );

  // Personal info
  const [personal, setPersonal] = useState({
    name: '', email: '', phone: '', location: '', linkedin: '', website: '',
  });
  function setP(k: string, v: string) { setPersonal(p => ({ ...p, [k]: v })); }

  // Section data
  const [summary,        setSummary]        = useState('');
  const [experience,     setExperience]     = useState<Experience[]>([emptyExp()]);
  const [education,      setEducation]      = useState<Education[]>([emptyEdu()]);
  const [skills,         setSkills]         = useState('');
  const [certifications, setCertifications] = useState('');
  const [projects,       setProjects]       = useState('');
  const [languages,      setLanguages]      = useState('');
  const [volunteer,      setVolunteer]      = useState('');
  const [awards,         setAwards]         = useState('');
  const [publications,   setPublications]   = useState('');
  const [references,     setReferences]     = useState('');

  // Generation
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [variants,  setVariants]  = useState<Variant[]>([]);
  const [selected,  setSelected]  = useState<Variant | null>(null);

  // Section toggle
  function toggleSection(id: SectionId) {
    setEnabledSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  // Move section up/down
  function moveSection(id: SectionId, dir: -1 | 1) {
    setEnabledSections(prev => {
      const idx  = prev.indexOf(id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr  = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  // Exp / Edu helpers
  function setExp(i: number, k: keyof Experience, v: string) {
    setExperience(ex => ex.map((e, idx) => idx === i ? { ...e, [k]: v } : e));
  }
  function setEdu(i: number, k: keyof Education, v: string) {
    setEducation(ed => ed.map((e, idx) => idx === i ? { ...e, [k]: v } : e));
  }

  // Generate
  async function generate() {
    setError(''); setLoading(true); setVariants([]); setSelected(null);
    try {
      const res = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...personal,
          sections: enabledSections,
          summary, experience, education, skills,
          certifications, projects, languages, volunteer,
          awards, publications, references,
          style: 'classic', // API generates all 3 internally
        }),
      });
      const data = await res.json() as { variants?: Variant[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? 'Generation failed');
      setVariants(data.variants ?? []);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // Download
  function download(variant: Variant) {
    const blob = new Blob([variant.content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${personal.name.replace(/\s+/g, '_') || 'CV'}_${variant.title}_ATS.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const canGenerate = personal.name.trim() && personal.email.trim() && enabledSections.length > 0;

  // ── Section form fields ──────────────────────────────────────────────────────
  function renderSectionFields(id: SectionId) {
    switch (id) {
      case 'summary':
        return (
          <TextareaField
            label="Professional Summary"
            value={summary} onChange={setSummary}
            placeholder="Results-driven software engineer with 5+ years delivering scalable web applications…"
            rows={4}
          />
        );

      case 'experience':
        return (
          <div className="space-y-4">
            {experience.map((exp, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Position {i + 1}</span>
                  {experience.length > 1 && (
                    <button onClick={() => setExperience(ex => ex.filter((_, idx) => idx !== i))}
                      className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Company"   value={exp.company}  onChange={v => setExp(i, 'company', v)}  placeholder="Acme Corp" />
                  <InputField label="Job Title"  value={exp.role}     onChange={v => setExp(i, 'role', v)}     placeholder="Senior Developer" />
                </div>
                <InputField label="Duration" value={exp.duration} onChange={v => setExp(i, 'duration', v)} placeholder="Jan 2022 – Present" />
                <TextareaField
                  label="Achievements & Responsibilities"
                  value={exp.bullets} onChange={v => setExp(i, 'bullets', v)}
                  placeholder="Led team of 6 engineers to deliver a microservices rewrite, cutting latency 40%…"
                  rows={3}
                />
              </div>
            ))}
            <button onClick={() => setExperience(ex => [...ex, emptyExp()])}
              className="w-full py-2 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 font-medium transition-colors">
              + Add position
            </button>
          </div>
        );

      case 'education':
        return (
          <div className="space-y-3">
            {education.map((edu, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Entry {i + 1}</span>
                  {education.length > 1 && (
                    <button onClick={() => setEducation(ed => ed.filter((_, idx) => idx !== i))}
                      className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
                  )}
                </div>
                <InputField label="Institution" value={edu.institution} onChange={v => setEdu(i, 'institution', v)} placeholder="University of Lagos" />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Degree" value={edu.degree} onChange={v => setEdu(i, 'degree', v)} placeholder="B.Sc. Computer Science" />
                  <InputField label="Year"   value={edu.year}   onChange={v => setEdu(i, 'year', v)}   placeholder="2021" />
                </div>
              </div>
            ))}
            <button onClick={() => setEducation(ed => [...ed, emptyEdu()])}
              className="w-full py-2 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 font-medium transition-colors">
              + Add education entry
            </button>
          </div>
        );

      case 'skills':
        return <InputField label="Skills (comma-separated)" value={skills} onChange={setSkills} placeholder="React, Node.js, TypeScript, PostgreSQL, AWS" />;

      case 'certifications':
        return <TextareaField label="Certifications" value={certifications} onChange={setCertifications} placeholder="AWS Certified Developer – Associate (2023)&#10;Google Cloud Professional (2024)" />;

      case 'projects':
        return <TextareaField label="Projects" value={projects} onChange={setProjects} placeholder="EaziTool — SaaS productivity platform, 2,000+ users&#10;Built with Next.js, TypeScript, PostgreSQL" rows={4} />;

      case 'languages':
        return <TextareaField label="Languages" value={languages} onChange={setLanguages} placeholder="English (Native), Yoruba (Fluent), French (Conversational)" />;

      case 'volunteer':
        return <TextareaField label="Volunteer Work" value={volunteer} onChange={setVolunteer} placeholder="Mentor — Google Developer Student Clubs (2022–Present)&#10;Coached 30 students on web development fundamentals" rows={4} />;

      case 'awards':
        return <TextareaField label="Awards & Achievements" value={awards} onChange={setAwards} placeholder="Best Tech Startup — Nigeria Tech Summit 2023&#10;Hackathon Winner — Interswitch Hack (2022)" />;

      case 'publications':
        return <TextareaField label="Publications" value={publications} onChange={setPublications} placeholder="Adejoh, E. (2024). Scaling Node.js applications. TechCabal.&#10;Conference talk — AfricaHacks 2023" />;

      case 'references':
        return <TextareaField label="References" value={references} onChange={setReferences} placeholder="Available on request&#10;— or list specific references here" />;

      default:
        return null;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">ATS CV Builder</h1>
              <p className="text-sm text-slate-500">Groq AI · LLaMA 3.3 70B · 3 professional variants generated simultaneously</p>
            </div>
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">AI</span>
          </div>
        </div>

        <Steps current={step} />

        {/* ════════════════════════════════ STEP 1 ═══════════════════════════════ */}
        {step === 1 && (
          <div className="grid xl:grid-cols-[280px_1fr] gap-6">

            {/* ── Sections panel ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-fit xl:sticky xl:top-6">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">CV Sections</h2>
              <p className="text-xs text-slate-400 mb-4">Toggle sections on/off and reorder them.</p>

              <div className="space-y-1">
                {ALL_SECTIONS.map(sec => {
                  const on  = enabledSections.includes(sec.id);
                  const idx = enabledSections.indexOf(sec.id);
                  return (
                    <div key={sec.id} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${on ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      <svg className={`w-4 h-4 flex-shrink-0 ${on ? 'text-blue-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={sec.icon} />
                      </svg>
                      <span className={`flex-1 text-xs font-medium ${on ? 'text-slate-700' : 'text-slate-400'}`}>{sec.label}</span>

                      {/* Reorder buttons — only when enabled */}
                      {on && (
                        <div className="flex gap-0.5">
                          <button onClick={() => moveSection(sec.id, -1)} disabled={idx === 0}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-slate-600 disabled:opacity-20">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button onClick={() => moveSection(sec.id, 1)} disabled={idx === enabledSections.length - 1}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-slate-600 disabled:opacity-20">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}

                      <Toggle on={on} onChange={() => toggleSection(sec.id)} />
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                {enabledSections.length} of {ALL_SECTIONS.length} sections active
              </div>
            </div>

            {/* ── Form ── */}
            <div className="space-y-5">

              {/* Personal info — always shown */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Personal Information</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <InputField label="Full Name *" value={personal.name} onChange={v => setP('name', v)} placeholder="Emmanuel Adejoh" />
                  </div>
                  <InputField label="Email *"    value={personal.email}    onChange={v => setP('email', v)}    placeholder="you@email.com"         type="email" />
                  <InputField label="Phone"      value={personal.phone}    onChange={v => setP('phone', v)}    placeholder="+234 800 000 0000" />
                  <InputField label="Location"   value={personal.location} onChange={v => setP('location', v)} placeholder="Abuja, Nigeria" />
                  <InputField label="LinkedIn"   value={personal.linkedin} onChange={v => setP('linkedin', v)} placeholder="linkedin.com/in/you" />
                  <div className="sm:col-span-2">
                    <InputField label="Website / Portfolio" value={personal.website} onChange={v => setP('website', v)} placeholder="yourportfolio.com" />
                  </div>
                </div>
              </div>

              {/* Enabled sections — rendered in order */}
              {enabledSections.map(id => {
                const sec = ALL_SECTIONS.find(s => s.id === id)!;
                return (
                  <div key={id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{sec.label}</h2>
                      <button onClick={() => toggleSection(id)}
                        className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors">
                        Remove section
                      </button>
                    </div>
                    {renderSectionFields(id)}
                  </div>
                );
              })}

              {enabledSections.length === 0 && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <p className="text-slate-400 text-sm">Enable sections from the panel on the left to get started.</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
              )}

              <button
                onClick={generate}
                disabled={!canGenerate || loading}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating 3 CV variants with AI…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate My 3 CVs →
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════ STEP 2 ═══════════════════════════════ */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Choose your CV style</h2>
                <p className="text-sm text-slate-500 mt-0.5">Three AI-generated versions — pick the one that fits you best.</p>
              </div>
              <button onClick={() => { setStep(1); setVariants([]); }}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Edit details
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
              {variants.map((v) => {
                const c = COLORS[v.color as keyof typeof COLORS] ?? COLORS.blue;
                return (
                  <div key={v.style}
                    className={`bg-white rounded-2xl border-2 shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-lg ${c.border}`}>

                    {/* Card header */}
                    <div className={`px-5 py-4 ${c.bg} border-b ${c.border}`}>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold text-base ${c.text}`}>{v.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{v.badge}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{v.description}</p>
                    </div>

                    {/* Preview */}
                    <div className="flex-1 p-5">
                      <pre className="text-xs text-slate-500 font-mono leading-relaxed whitespace-pre-wrap line-clamp-[12]">
                        {preview(v.content)}
                      </pre>
                      <div className="mt-3 h-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-5 pb-5 flex flex-col gap-2">
                      <button
                        onClick={() => { setSelected(v); setStep(3); }}
                        className={`w-full py-2.5 rounded-xl text-white text-sm font-bold transition-colors ${c.btn}`}
                      >
                        Select this CV →
                      </button>
                      <button
                        onClick={() => download(v)}
                        className="w-full py-2 rounded-xl text-slate-500 text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Quick download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-slate-400 mt-6">
              You can also download any version directly without selecting it.
            </p>
          </div>
        )}

        {/* ════════════════════════════════ STEP 3 ═══════════════════════════════ */}
        {step === 3 && selected && (() => {
          const c = COLORS[selected.color as keyof typeof COLORS] ?? COLORS.blue;
          return (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.badge}`}>{selected.badge}</span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selected.title} CV</h2>
                    <p className="text-xs text-slate-400">ATS-compliant · Ready to download</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => setStep(2)}
                    className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    See all 3 variants
                  </button>
                  <button
                    onClick={() => download(selected)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all hover:scale-105 ${c.btn}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download .txt
                  </button>
                </div>
              </div>

              {/* Full CV preview */}
              <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${c.border}`}>
                <div className={`px-6 py-3 border-b ${c.bg} ${c.border} flex items-center gap-2`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className={`ml-2 text-xs font-semibold ${c.text}`}>{personal.name} — {selected.title} CV · ATS-Optimised</span>
                </div>
                <div className="p-8 max-h-[70vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">{selected.content}</pre>
                </div>
              </div>

              {/* Also download others */}
              <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 mb-3">Also download the other variants:</p>
                <div className="flex flex-wrap gap-2">
                  {variants.filter(v => v.style !== selected.style).map(v => {
                    const vc = COLORS[v.color as keyof typeof COLORS] ?? COLORS.blue;
                    return (
                      <button key={v.style} onClick={() => download(v)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border ${vc.badge} ${vc.border} hover:opacity-80 transition-opacity`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {v.title} CV
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
