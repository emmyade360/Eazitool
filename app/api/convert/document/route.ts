import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import 'docx-preview';
import 'jszip';
import {
  BODY_LIMITS,
  RATE_LIMITS,
  checkRateLimit,
  exceedsBodyLimit,
  payloadTooLarge,
  tooManyRequests,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

const DEFAULT_MAX_UPLOAD_MB = 4;
const MAX_UPLOAD_MB = Number.parseFloat(process.env.DOCUMENT_CONVERTER_MAX_MB ?? '') || DEFAULT_MAX_UPLOAD_MB;
const MAX_UPLOAD_BYTES = Math.floor(MAX_UPLOAD_MB * 1024 * 1024);

type RenderedPage = { data: Buffer; width: number; height: number; scale: number };

const PDF_RENDER_SCALE = 2;
const DOCX_RENDER_TIMEOUT_MS = 45_000;
const DOCX_PREVIEW_SCRIPT = join(process.cwd(), 'node_modules/docx-preview/dist/docx-preview.min.js');
const JSZIP_SCRIPT = join(process.cwd(), 'node_modules/jszip/dist/jszip.min.js');
const CHROMIUM_PATHS = [
  process.env.DOCUMENT_CONVERTER_CHROMIUM_PATH,
  process.env.CHROMIUM_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter((path): path is string => Boolean(path));
const LIBREOFFICE_PATHS = [
  process.env.DOCUMENT_CONVERTER_LIBREOFFICE_PATH,
  '/usr/bin/libreoffice',
  '/usr/bin/soffice',
].filter((path): path is string => Boolean(path));

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function pdfPagesToImages(buffer: Buffer): Promise<RenderedPage[]> {
  const { pdf } = await import('pdf-to-img');
  const sharp = (await import('sharp')).default;

  const pageIterator = await pdf(buffer, { scale: PDF_RENDER_SCALE });
  const pages: RenderedPage[] = [];

  for await (const pageBuffer of pageIterator) {
    const fixedBuffer = await sharp(pageBuffer).withIccProfile('srgb').png().toBuffer();
    const meta = await sharp(fixedBuffer).metadata();
    pages.push({
      data: fixedBuffer,
      width: meta.width ?? 1240,
      height: meta.height ?? 1754,
      scale: PDF_RENDER_SCALE,
    });
  }

  return pages;
}

async function parsePDFText(buffer: Buffer): Promise<string> {
  const { default: PDFParser } = await import('pdf2json');

  return new Promise<string>((resolve, reject) => {
    const parser = new PDFParser(null, true);
    const cleanup = () => { parser.removeAllListeners(); parser.destroy(); };

    parser.on('pdfParser_dataError', (error) => {
      cleanup();
      reject('parserError' in error ? error.parserError : error);
    });

    parser.on('pdfParser_dataReady', () => {
      const rawText = parser
        .getRawTextContent()
        .replace(/\r\n----------------Page \(\d+\) Break----------------\r\n/g, '\n\n')
        .replace(/\r\n/g, '\n')
        .trim();
      cleanup();
      resolve(rawText);
    });

    parser.parseBuffer(buffer);
  });
}

function createDocxPreviewHtml(documentBuffer: Buffer, jsZip: string, docxPreview: string): string {
  const documentBase64 = documentBuffer.toString('base64');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; font-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'" />
  </head>
  <body>
    <main id="document"></main>
    <script>${jsZip}</script>
    <script>${docxPreview}</script>
    <script>
      const source = Uint8Array.from(atob('${documentBase64}'), (character) => character.charCodeAt(0));
      const container = document.getElementById('document');

      docx.renderAsync(source.buffer, container, document.head, {
        inWrapper: true,
        breakPages: true,
        ignoreLastRenderedPageBreak: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
        renderChanges: true,
        experimental: true,
        useBase64URL: true,
      }).then(() => {
        const page = container.querySelector('section.docx');
        const pageWidth = page?.style.width || '595.3pt';
        const pageHeight = page?.style.minHeight || '841.9pt';
        const printStyles = document.createElement('style');
        printStyles.textContent = [
          '@page { size: ' + pageWidth + ' ' + pageHeight + '; margin: 0; }',
          'html, body { margin: 0; background: #fff; }',
          '.docx-wrapper { padding: 0; background: #fff; }',
          '.docx-wrapper > section.docx { margin: 0; box-shadow: none; }',
          '.docx-wrapper > section.docx:not(:last-child) { break-after: page; page-break-after: always; }',
        ].join('');
        document.head.appendChild(printStyles);
      }).catch((error) => {
        document.body.innerHTML = '<pre id="conversion-error">' + String(error) + '</pre>';
      });
    </script>
  </body>
</html>`;
}

async function findExecutable(candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }
  return undefined;
}

async function runProcess(executable: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    let finished = false;

    const finish = (callback: () => void) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      callback();
    };

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      finish(() => reject(new Error('Document rendering timed out.')));
    }, DOCX_RENDER_TIMEOUT_MS);

    child.stderr.on('data', (chunk: Buffer) => {
      stderr = `${stderr}${chunk.toString()}`.slice(-1_500);
    });
    child.on('error', (error) => finish(() => reject(error)));
    child.on('close', (code) => {
      if (code === 0) {
        finish(resolve);
      } else {
        finish(() => reject(new Error(`Document renderer exited with code ${code}: ${stderr.trim()}`)));
      }
    });
  });
}

async function renderDocxToPdf(buffer: Buffer): Promise<Buffer> {
  const libreOffice = await findExecutable(LIBREOFFICE_PATHS);
  if (libreOffice) {
    const directory = await mkdtemp(join(tmpdir(), 'eazitool-libreoffice-'));
    const sourcePath = join(directory, 'source.docx');
    const pdfPath = join(directory, 'source.pdf');

    try {
      await writeFile(sourcePath, buffer);
      await runProcess(libreOffice, [
        '--headless',
        '--nologo',
        '--nodefault',
        '--nofirststartwizard',
        '--convert-to',
        'pdf:writer_pdf_Export',
        '--outdir',
        directory,
        sourcePath,
      ]);

      if (await fileExists(pdfPath)) {
        const pdf = await readFile(pdfPath);
        if (pdf.byteLength > 0) return pdf;
      }
    } catch (error) {
      // Chromium below is a useful fallback when an office installation cannot
      // open a particular document.
      console.warn('LibreOffice document rendering failed:', error);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  const chromium = await findExecutable(CHROMIUM_PATHS);
  if (!chromium) {
    throw new Error('No supported document renderer is configured for document conversion.');
  }

  if (!(await fileExists(DOCX_PREVIEW_SCRIPT)) || !(await fileExists(JSZIP_SCRIPT))) {
    throw new Error('The document preview renderer is not installed.');
  }

  const directory = await mkdtemp(join(tmpdir(), 'eazitool-docx-'));
  const htmlPath = join(directory, 'source.html');
  const pdfPath = join(directory, 'converted.pdf');

  try {
    const [jsZip, docxPreview] = await Promise.all([
      readFile(JSZIP_SCRIPT, 'utf8'),
      readFile(DOCX_PREVIEW_SCRIPT, 'utf8'),
    ]);

    await writeFile(htmlPath, createDocxPreviewHtml(buffer, jsZip, docxPreview));
    await runProcess(chromium, [
      '--headless',
      '--disable-gpu',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--no-pdf-header-footer',
      '--run-all-compositor-stages-before-draw',
      `--virtual-time-budget=${DOCX_RENDER_TIMEOUT_MS - 5_000}`,
      `--print-to-pdf=${pdfPath}`,
      `file://${htmlPath}`,
    ]);

    const pdf = await readFile(pdfPath);
    if (pdf.byteLength === 0) throw new Error('Document renderer produced an empty PDF.');
    return pdf;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

// ── Misc helpers ─────────────────────────────────────────────────────────────

function sanitizeFilename(filename: string): string {
  return filename.replace(/"/g, '\\"').replace(/[\n\r]/g, '');
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {

  if (exceedsBodyLimit(req, BODY_LIMITS.media)) {
    return payloadTooLarge('Upload is too large.');
  }

  const rateLimit = checkRateLimit(req, RATE_LIMITS.media);
  if (!rateLimit.ok) {
    return tooManyRequests(rateLimit.retryAfterSec, 'Too many conversions. Try again shortly.');
  }
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const from = (form.get('from') as string | null)?.toLowerCase();
    const to = (form.get('to') as string | null)?.toLowerCase();

    if (!file || !from || !to) {
      return NextResponse.json({ error: 'Missing file, from, or to parameter' }, { status: 400 });
    }

    const VALID_MIME: Record<string, Set<string>> = {
      pdf: new Set(['application/pdf']),
      docx: new Set([
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ]),
      txt: new Set(['text/plain']),
    };

    const allowed = VALID_MIME[from];
    if (allowed && !allowed.has(file.type)) {
      return NextResponse.json(
        { error: `Expected a ${from.toUpperCase()} file but received "${file.type || 'unknown type'}".` },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File too large. Please upload a file smaller than ${MAX_UPLOAD_MB} MB.` },
        { status: 413 }
      );
    }

    // ── PDF → DOCX ──────────────────────────────────────────────────────────

    if (from === 'pdf' && to === 'docx') {
      const { Document, ImageRun, Packer, Paragraph, SectionType } = await import('docx');

      let pages: RenderedPage[];
      try {
        pages = await pdfPagesToImages(buffer);
      } catch (pdfErr) {
        console.error('PDF visual rendering failed:', pdfErr);
        return NextResponse.json(
          { error: 'This PDF could not be rendered without losing its layout. No converted file was created.' },
          { status: 422 },
        );
      }

      if (pages.length === 0) {
        return NextResponse.json({ error: 'The PDF does not contain any renderable pages.' }, { status: 422 });
      }

      const doc = new Document({
        sections: pages.map((page) => {
          // PDF pages use 72 points per inch. DOCX page dimensions use twips
          // (1/20 point) and image dimensions use CSS pixels (96 per inch).
          const pageWidthPoints = page.width / page.scale;
          const pageHeightPoints = page.height / page.scale;

          return {
            properties: {
              type: SectionType.NEXT_PAGE,
              page: {
                size: {
                  width: Math.round(pageWidthPoints * 20),
                  height: Math.round(pageHeightPoints * 20),
                },
                margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 },
              },
            },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0, line: 0 },
                children: [
                  new ImageRun({
                    data: page.data,
                    transformation: {
                      width: Math.round(pageWidthPoints * (96 / 72)),
                      height: Math.round(pageHeightPoints * (96 / 72)),
                    },
                    type: 'png',
                  }),
                ],
              }),
            ],
          };
        }),
      });

      const docxBuffer = await Packer.toBuffer(doc);
      const safeName = sanitizeFilename(file.name.replace(/\.pdf$/i, '') + '.docx');

      return new NextResponse(new Uint8Array(docxBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeName}"`,
        },
      });
    }

    // ── PDF → TXT ───────────────────────────────────────────────────────────

    if (from === 'pdf' && to === 'txt') {
      const text = await parsePDFText(buffer);
      const safeName = sanitizeFilename(file.name.replace(/\.pdf$/i, '') + '.txt');

      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeName}"`,
        },
      });
    }

    // ── DOCX → PDF ──────────────────────────────────────────────────────────

    if (from === 'docx' && to === 'pdf') {
      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await renderDocxToPdf(buffer);
      } catch (renderError) {
        console.error('DOCX visual rendering failed:', renderError);
        return NextResponse.json(
          { error: 'This DOCX could not be rendered without losing its layout. No converted file was created.' },
          { status: 422 },
        );
      }
      const safeName = sanitizeFilename(file.name.replace(/\.docx?$/i, '') + '.pdf');

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}"`,
        },
      });
    }

    // ── TXT → PDF ───────────────────────────────────────────────────────────

    if (from === 'txt' && to === 'pdf') {
      const PDFDocument = (await import('pdfkit')).default;
      const text = buffer.toString('utf-8');

      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 72, size: 'A4' });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      await new Promise<void>((resolve, reject) => {
        doc.on('end', resolve);
        doc.on('error', reject);
        doc.fontSize(11).font('Times-Roman').text(text, { lineGap: 4 });
        doc.end();
      });

      const pdfBuffer = Buffer.concat(chunks);
      const safeName = sanitizeFilename(file.name.replace(/\.txt$/i, '') + '.pdf');

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}"`,
        },
      });
    }

    // ── DOCX → TXT ─────────────────────────────────────────────────────────

    if (from === 'docx' && to === 'txt') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      const safeName = sanitizeFilename(file.name.replace(/\.docx?$/i, '') + '.txt');

      return new NextResponse(result.value || '', {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeName}"`,
        },
      });
    }

    // ── TXT → DOCX ─────────────────────────────────────────────────────────

    if (from === 'txt' && to === 'docx') {
      const { Document, Packer, Paragraph, TextRun } = await import('docx');
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').filter((l) => l.trim());

      const doc = new Document({
        sections: [{
          properties: {},
          children: lines.length
            ? lines.map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 24 })] }))
            : [new Paragraph({ children: [new TextRun('(empty document)')] })],
        }],
      });

      const docxBuffer = await Packer.toBuffer(doc);
      const safeName = sanitizeFilename(file.name.replace(/\.txt$/i, '') + '.docx');

      return new NextResponse(new Uint8Array(docxBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeName}"`,
        },
      });
    }

    return NextResponse.json(
      { error: `Conversion from ${from} to ${to} is not supported` },
      { status: 400 }
    );

  } catch (error) {
    console.error('Document conversion error:', error);
    return NextResponse.json(
      { error: 'Conversion failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
