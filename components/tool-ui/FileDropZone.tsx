'use client';

import { useId, useRef, type DragEvent } from 'react';

export type FileRejection = 'type' | 'size' | 'count';

interface FileDropZoneProps {
  accept: string;
  title: string;
  hint: string;
  onFiles: (files: File[]) => void;
  files?: File[];
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  /** MIME allow-list. Omit to accept anything matching `accept`. */
  allowedTypes?: ReadonlySet<string>;
  /** Opens the rear camera directly on mobile — used by the document scanner. */
  capture?: 'environment' | 'user';
  disabled?: boolean;
  iconPath?: string;
  accent?: 'indigo' | 'violet' | 'emerald' | 'blue';
  onReject?: (reason: FileRejection, file: File) => void;
}

const ACCENTS = {
  indigo: 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
  violet: 'border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700',
  emerald: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
  blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700',
} as const;

const DEFAULT_ICON =
  'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';

export function FileDropZone({
  accept,
  title,
  hint,
  onFiles,
  files = [],
  multiple = false,
  maxFiles,
  maxSizeMB,
  allowedTypes,
  capture,
  disabled = false,
  iconPath = DEFAULT_ICON,
  accent = 'indigo',
  onReject,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  function accepts(incoming: File[]): File[] {
    const limit = maxFiles ?? (multiple ? Infinity : 1);
    const kept: File[] = [];

    for (const file of incoming) {
      if (allowedTypes && !allowedTypes.has(file.type)) {
        onReject?.('type', file);
        continue;
      }
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        onReject?.('size', file);
        continue;
      }
      if (kept.length >= limit) {
        onReject?.('count', file);
        continue;
      }
      kept.push(file);
    }

    return kept;
  }

  function handle(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) return;
    const kept = accepts(Array.from(incoming));
    if (kept.length > 0) onFiles(kept);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) return;
    handle(event.dataTransfer.files);
  }

  const summary =
    files.length === 1
      ? `${files[0].name} — ${(files[0].size / 1024).toFixed(1)} KB`
      : files.length > 1
        ? `${files.length} files selected`
        : null;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${ACCENTS[accent]} ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        id={inputId}
        name={inputId}
        type="file"
        className="hidden"
        aria-label={title}
        accept={accept}
        multiple={multiple}
        capture={capture}
        disabled={disabled}
        onChange={(event) => {
          handle(event.target.files);
          // Allow re-selecting the same file after a reset.
          event.target.value = '';
        }}
      />

      <svg
        className="mx-auto mb-3 h-10 w-10 opacity-60"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
      </svg>

      {summary ? (
        <div>
          <p className="text-sm font-bold">{summary}</p>
          <p className="mt-1 text-xs text-slate-400">Click to change</p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        </div>
      )}
    </div>
  );
}
