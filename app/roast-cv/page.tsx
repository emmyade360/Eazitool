'use client';

import { useState, useRef } from 'react';
import { BeforeAfterComparison } from '@/components/BeforeAfterComparison';
import { submitReview } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

type RoleKeywordMatch = {
  matched: string[];
  missing: string[];
  score: number;
};

type ATSIssue = {
  category: 'critical' | 'warning' | 'tip';
  severity: number;
  title: string;
  description: string;
  suggestion: string;
  line?: number;
  section?: string;
};

type ATSResult = {
  overallScore: number;
  categoryScores: {
    format: number;
    keywords: number;
    structure: number;
    content: number;
    readability: number;
  };
  issues: ATSIssue[];
  strengths: string[];
  estimatedPassRate: number;
};

type ImprovedBullet = {
  original: string;
  improved: string;
  reasoning: string;
};

type RoastResult = {
  text: string;
  wordCount: number;
  pages: number;
  sections: string[];
  atsScore: ATSResult;
  roleAnalysis: RoleKeywordMatch;
  roastSummary: string;
  improvedBullets: ImprovedBullet[];
  originalText: string;
} | null;

export default function RoastCVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RoastResult>(null);
  const [selectedBullet, setSelectedBullet] = useState<{ original: string; improved: string } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
        setError('Please upload a PDF or DOCX file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(droppedFile.type)) {
        setError('Please upload a PDF or DOCX file');
        return;
      }
      setFile(droppedFile);
      setError('');
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const roastMyCV = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (targetRole.trim()) {
        formData.append('targetRole', targetRole.trim());
      }

      const response = await fetch('/api/roast-cv/analyze', {
        method: 'POST',
        body: formData,
        cache: 'no-store',
      });

      const raw = await response.text();
      const payload = (raw ? JSON.parse(raw) : {}) as {
        error?: string;
        data?: Omit<NonNullable<RoastResult>, 'originalText'>;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to analyze CV');
      }

      setResult({
        ...payload.data,
        originalText: payload.data.text,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze CV';
      setError(
        message === 'Failed to fetch'
          ? 'Could not reach the roast service. Check that the app is running and the server route is healthy.'
          : message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCVReport = () => {
    if (!result) return;

    const report = [
      'EAZITOOL CV ROAST REPORT',
      '========================',
      '',
      `ATS score: ${result.atsScore.overallScore}/100`,
      `Estimated ATS pass rate: ${result.atsScore.estimatedPassRate}%`,
      `Pages reviewed: ${result.pages}`,
      `Words reviewed: ${result.wordCount}`,
      '',
      'ROAST SUMMARY',
      '-------------',
      result.roastSummary,
      '',
      'STRENGTHS',
      '---------',
      ...(result.atsScore.strengths.length > 0 ? result.atsScore.strengths.map((strength) => `- ${strength}`) : ['- No strengths were identified.']),
      '',
      'ISSUES AND RECOMMENDATIONS',
      '--------------------------',
      ...(result.atsScore.issues.length > 0
        ? result.atsScore.issues.map((issue) => `- [${issue.category.toUpperCase()}] ${issue.title}: ${issue.description}\n  Recommendation: ${issue.suggestion}`)
        : ['- No issues were identified.']),
      ...(result.improvedBullets.length > 0
        ? [
            '',
            'SUGGESTED BULLET REWRITES',
            '-------------------------',
            ...result.improvedBullets.map((bullet, index) => `${index + 1}. Original: ${bullet.original}\n   Suggested: ${bullet.improved}\n   Why: ${bullet.reasoning}`),
          ]
        : []),
      '',
      'NOTE: This report does not alter your uploaded CV. Apply any suggestions manually where appropriate.',
    ].join('\n');
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cv-roast-report.txt';
    a.click();
    URL.revokeObjectURL(url);
    setShowReviewModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-red-700 px-4 py-20 text-white sm:py-28">
        <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden>
          <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Devil Mascot */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-2 animate-ping rounded-full bg-white/20" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  <path d="M8 12h8M10 10v4" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Roast My CV
          </h1>
          
          <p className="mx-auto mb-6 max-w-2xl text-lg text-red-100 sm:text-xl">
            Upload your CV for a brutally honest ATS review. Get scores, fixes, and AI-powered improvements.
          </p>

          <p className="mb-8 text-sm text-red-200">
            No feelings will be hurt. Just honest feedback.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Upload Section */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg sm:p-8">
          <h2 className="mb-4 text-xl font-bold text-slate-800">Step 1: Upload Your CV</h2>
          <p className="mb-6 text-sm text-slate-500">
            Supports PDF and DOCX files up to 10MB
          </p>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all',
              file
                ? 'border-green-300 bg-green-50'
                : 'border-slate-300 bg-slate-50 hover:border-red-400 hover:bg-red-50'
            )}
          >
            <input
              ref={fileInputRef}
              id="cv-file-upload"
              name="cv-file-upload"
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload your CV"
            />
            
            {file ? (
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-green-700">{file.name}</p>
                <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="text-xs text-slate-400">Click to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="font-medium text-slate-600">Drop your CV here or click to upload</p>
                <p className="text-xs text-slate-400">PDF or DOCX • Max 10MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Target Role */}
          <div className="mt-6">
            <label htmlFor="target-role" className="mb-2 block text-sm font-medium text-slate-700">
              Target Role (optional)
            </label>
            <input
              id="target-role"
              name="target-role"
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Senior Software Engineer, Product Manager"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              Helps us tailor feedback to your target role
            </p>
          </div>

          {/* Roast Button */}
          <button
            type="button"
            onClick={roastMyCV}
            disabled={!file || isLoading}
            className={cn(
              'mt-6 w-full rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-all',
              file && !isLoading
                ? 'bg-red-600 hover:bg-red-700 hover:shadow-xl'
                : 'cursor-not-allowed bg-slate-300'
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing CV...
              </span>
            ) : (
              'Roast My CV'
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-6 shadow-lg">
              <h2 className="mb-3 text-xl font-bold text-slate-800">Groq Roast</h2>
              <div className="whitespace-pre-line text-sm leading-7 text-slate-700">
                {result.roastSummary}
              </div>
            </div>

            {/* Score Overview */}
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold text-slate-800">ATS Score</h2>
              
              <div className="mb-6 flex items-center justify-center">
                <div className="relative">
                  <svg className="h-32 w-32 -rotate-90 transform">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={result.atsScore.overallScore >= 80 ? '#10b981' : result.atsScore.overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="{351.86}"
                      strokeDashoffset={351.86 - (351.86 * result.atsScore.overallScore / 100)}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-slate-800">{result.atsScore.overallScore}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4 text-center">
                <span className={cn(
                  'inline-block rounded-full px-4 py-1 text-sm font-bold',
                  result.atsScore.overallScore >= 80 ? 'bg-green-100 text-green-700' :
                  result.atsScore.overallScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                )}>
                  {result.atsScore.overallScore >= 80 ? 'Strong' : result.atsScore.overallScore >= 60 ? 'Moderate' : 'Needs Work'} ATS Match
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div>
                  <div className="text-lg font-bold text-slate-800">{result.atsScore.categoryScores.format}</div>
                  <div className="text-slate-400">Format</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">{result.atsScore.categoryScores.keywords}</div>
                  <div className="text-slate-400">Keywords</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">{result.atsScore.categoryScores.structure}</div>
                  <div className="text-slate-400">Structure</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">{result.atsScore.categoryScores.content}</div>
                  <div className="text-slate-400">Content</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">{result.atsScore.categoryScores.readability}</div>
                  <div className="text-slate-400">Readability</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <span className="text-sm text-slate-500">Estimated ATS Pass Rate</span>
                <span className="font-bold text-slate-800">{result.atsScore.estimatedPassRate}%</span>
              </div>
            </div>

            {/* Key Issues */}
            {result.atsScore.issues.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-bold text-slate-800">Key Issues to Fix</h2>
                <div className="space-y-3">
                  {result.atsScore.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'rounded-xl border-l-4 p-4',
                        issue.category === 'critical' ? 'border-red-500 bg-red-50' :
                        issue.category === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={cn(
                            'inline-block rounded px-2 py-0.5 text-xs font-bold',
                            issue.category === 'critical' ? 'bg-red-100 text-red-700' :
                            issue.category === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          )}>
                            {issue.category.toUpperCase()}
                          </span>
                          <h3 className="mt-1 font-bold text-slate-800">{issue.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{issue.description}</p>
                          <p className="mt-2 text-sm font-medium text-slate-700">💡 Fix: {issue.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {result.atsScore.strengths.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-bold text-slate-800">Strengths</h2>
                <div className="flex flex-wrap gap-2">
                   {result.atsScore.strengths.map((strength, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
                    >
                      ✓ {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Role Keyword Match */}
            {targetRole && result.roleAnalysis && (
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-bold text-slate-800">
                  Role Keyword Match: {targetRole}
                </h2>
                <div className="mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Keyword coverage</span>
                    <span className="font-bold text-slate-800">{result.roleAnalysis.score}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all"
                      style={{ width: `${result.roleAnalysis.score}%` }}
                    />
                  </div>
                </div>
                {result.roleAnalysis.matched.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-bold text-green-700">✓ Found: </span>
                    <span className="text-sm text-slate-600">
                      {result.roleAnalysis.matched.slice(0, 5).join(', ')}
                    </span>
                  </div>
                )}
                {result.roleAnalysis.missing.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-red-700">✗ Missing: </span>
                    <span className="text-sm text-slate-600">
                      {result.roleAnalysis.missing.slice(0, 5).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Before/After Comparison */}
            {result.improvedBullets.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-bold text-slate-800">Suggested Bullet Rewrites</h2>
                <p className="mb-4 text-sm text-slate-500">
                  Review the suggested wording. Your uploaded CV is not changed.
                </p>
                
                <div className="space-y-4">
                  {result.improvedBullets.slice(0, 5).map((imp, idx) => (
                    <div
                      key={idx}
                      className="cursor-pointer rounded-xl border border-slate-200 p-4 transition-all hover:border-red-300 hover:bg-red-50"
                      onClick={() => setSelectedBullet(imp)}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                          Bullet {idx + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="mb-1 text-xs font-bold text-red-400">BEFORE</p>
                          <p className="text-sm text-slate-600">{imp.original}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-bold text-green-600">AFTER</p>
                          <p className="text-sm text-slate-800">{imp.improved}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={downloadCVReport}
                  className="mt-4 w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700"
                >
                  Download CV Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bullet Comparison Modal */}
      {selectedBullet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <BeforeAfterComparison
              before={selectedBullet.original}
              after={selectedBullet.improved}
              onClose={() => setSelectedBullet(null)}
            />
          </div>
        </div>
      )}

      {showReviewModal && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={async (review) => {
            await submitReview({
              document_type: review.documentType,
              rating: review.rating,
              comment: review.comment || undefined,
            });
            setShowReviewModal(false);
          }}
          documentType="roast-cv"
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-red-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">
              {file ? 'CV uploaded and ready' : 'Upload a CV to begin'}
            </p>
            <p className="truncate text-xs text-slate-500">
              {file ? file.name : 'PDF or DOCX, up to 10MB'}
            </p>
          </div>
          <button
            type="button"
            onClick={roastMyCV}
            disabled={!file || isLoading}
            className={cn(
              'shrink-0 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-all',
              file && !isLoading
                ? 'bg-red-600 hover:bg-red-700'
                : 'cursor-not-allowed bg-slate-300'
            )}
          >
            {isLoading ? 'Analyzing...' : 'Roast My CV'}
          </button>
        </div>
      </div>
    </div>
  );
}
