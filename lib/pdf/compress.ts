/**
 * Client-side PDF compression.
 *
 * `lossless` re-saves with object streams and stripped metadata — text stays
 * selectable, so it is the only safe mode for CVs (rasterizing a CV destroys
 * the ATS parseability this site is built around).
 *
 * `rasterize` renders each page to JPEG via pdf.js and rebuilds the document —
 * large savings for scans, but text stops being selectable.
 */

export type CompressMode = 'lossless' | 'rasterize';

export interface CompressOptions {
  mode: CompressMode;
  /** Rasterize mode only: binary-search JPEG quality toward this budget. */
  targetBytes?: number;
  onProgress?: (page: number, total: number) => void;
}

export interface CompressResult {
  bytes: Uint8Array;
  inputBytes: number;
  outputBytes: number;
  textPreserved: boolean;
  warning?: string;
}

const WORKER_SRC = '/pdf/pdf.worker.min.mjs';
const MAX_PAGE_PIXELS = 4_000_000;

async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  return pdfjs;
}

/** True when any page carries real text content (so rasterizing would hurt). */
export async function pdfHasText(bytes: Uint8Array): Promise<boolean> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  try {
    const pagesToProbe = Math.min(doc.numPages, 10);
    for (let i = 1; i <= pagesToProbe; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      if (content.items.length > 3) return true;
    }
    return false;
  } finally {
    await doc.destroy();
  }
}

async function compressLossless(bytes: Uint8Array): Promise<Uint8Array> {
  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer('');
  doc.setCreator('');
  return doc.save({ useObjectStreams: true });
}

interface RenderedPage {
  blob: Blob;
  widthPt: number;
  heightPt: number;
}

async function renderPages(
  bytes: Uint8Array,
  dpi: number,
  quality: number,
  onProgress?: (page: number, total: number) => void,
): Promise<RenderedPage[]> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const pages: RenderedPage[] = [];

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      onProgress?.(i, doc.numPages);
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });

      let scale = dpi / 72;
      if (base.width * scale * base.height * scale > MAX_PAGE_PIXELS) {
        scale = Math.sqrt(MAX_PAGE_PIXELS / (base.width * base.height));
      }
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed.'))), 'image/jpeg', quality),
      );
      pages.push({ blob, widthPt: base.width, heightPt: base.height });
    }
  } finally {
    await doc.destroy();
  }

  return pages;
}

async function assemblePdf(pages: RenderedPage[]): Promise<Uint8Array> {
  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const doc = await PDFDocument.create();
  for (const page of pages) {
    const jpg = await doc.embedJpg(new Uint8Array(await page.blob.arrayBuffer()));
    const pdfPage = doc.addPage([page.widthPt, page.heightPt]);
    pdfPage.drawImage(jpg, { x: 0, y: 0, width: page.widthPt, height: page.heightPt });
  }
  return doc.save({ useObjectStreams: true });
}

export async function compressPdf(bytes: Uint8Array, options: CompressOptions): Promise<CompressResult> {
  const inputBytes = bytes.length;

  if (options.mode === 'lossless') {
    const out = await compressLossless(bytes);
    if (out.length >= inputBytes) {
      return {
        bytes,
        inputBytes,
        outputBytes: inputBytes,
        textPreserved: true,
        warning: 'This PDF is already well compressed — no lossless savings were possible.',
      };
    }
    return { bytes: out, inputBytes, outputBytes: out.length, textPreserved: true };
  }

  // Rasterize: try DPI/quality steps, keeping the first result under target
  // (or the smallest overall if no target given).
  const attempts: { dpi: number; quality: number }[] = options.targetBytes
    ? [
        { dpi: 150, quality: 0.72 },
        { dpi: 150, quality: 0.55 },
        { dpi: 120, quality: 0.55 },
        { dpi: 96, quality: 0.5 },
        { dpi: 72, quality: 0.45 },
      ]
    : [{ dpi: 150, quality: 0.72 }];

  let best: Uint8Array | null = null;
  for (const attempt of attempts) {
    const pages = await renderPages(bytes, attempt.dpi, attempt.quality, options.onProgress);
    const out = await assemblePdf(pages);
    if (!best || out.length < best.length) best = out;
    if (options.targetBytes && out.length <= options.targetBytes) {
      return { bytes: out, inputBytes, outputBytes: out.length, textPreserved: false };
    }
  }

  const out = best!;
  if (out.length >= inputBytes) {
    return {
      bytes,
      inputBytes,
      outputBytes: inputBytes,
      textPreserved: true,
      warning: 'Rasterizing would have made this file larger, so the original was kept.',
    };
  }

  return {
    bytes: out,
    inputBytes,
    outputBytes: out.length,
    textPreserved: false,
    warning: options.targetBytes && out.length > options.targetBytes
      ? 'Could not reach the target size — this is the smallest achievable version.'
      : undefined,
  };
}
