import { NextRequest, NextResponse } from 'next/server';
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

type RenderedPage = { data: Buffer; width: number; height: number };

// ── Inline style model ───────────────────────────────────────────────────────

type InlineStyle = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  fontSize: number;
};

type StyleFrame = {
  tag: string;
  style: Partial<InlineStyle>;
};

const DEFAULT_STYLE: InlineStyle = {
  bold: false,
  italic: false,
  underline: false,
  color: '#111827',
  fontSize: 11,
};

const HEADING_SIZES: Record<string, number> = {
  h1: 22,
  h2: 18,
  h3: 16,
  h4: 14,
  h5: 13,
  h6: 12,
};

// ── PDF-to-image helpers (unchanged) ────────────────────────────────────────

async function pdfPagesToImages(buffer: Buffer, reverseOrder = true): Promise<RenderedPage[]> {
  const { pdf } = await import('pdf-to-img');
  const sharp = (await import('sharp')).default;

  const pageIterator = await pdf(buffer, { scale: 2.0 });
  const pages: RenderedPage[] = [];

  for await (const pageBuffer of pageIterator) {
    const fixedBuffer = await sharp(pageBuffer).withIccProfile('srgb').png().toBuffer();
    const meta = await sharp(fixedBuffer).metadata();
    pages.push({ data: fixedBuffer, width: meta.width ?? 1240, height: meta.height ?? 1754 });
  }

  return reverseOrder ? pages.reverse() : pages;
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

// ── HTML utility helpers ─────────────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function normalizeWhitespace(text: string, lineOpen: boolean): string {
  const n = decodeHtmlEntities(text).replace(/\s+/g, ' ');
  return lineOpen ? n : n.trimStart();
}

function normalizeColor(value?: string): string | undefined {
  if (!value) return undefined;
  const color = value.trim().replace(/^['"]|['"]$/g, '');
  if (!color) return undefined;
  if (/^[0-9a-f]{6}$/i.test(color)) return `#${color.toUpperCase()}`;
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    const [, r, g, b] = color;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const m = color.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (m) {
    return `#${m.slice(1).map((p) => Math.max(0, Math.min(255, parseInt(p, 10))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  }
  return color;
}

function extractInlineColor(attributes: string): string | undefined {
  const styleMatch = attributes.match(/style\s*=\s*["']([^"']+)["']/i);
  if (styleMatch) {
    const c = normalizeColor(styleMatch[1].match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)?.[1]);
    if (c) return c;
  }
  return normalizeColor(attributes.match(/color\s*=\s*["']([^"']+)["']/i)?.[1]);
}

function extractAlignment(attributes: string): string | undefined {
  const styleMatch = attributes.match(/style\s*=\s*["']([^"']+)["']/i);
  if (styleMatch) {
    const m = styleMatch[1].match(/text-align\s*:\s*(left|center|right|justify)/i);
    if (m) return m[1].toLowerCase();
  }
  const m = attributes.match(/align\s*=\s*["']?(left|center|right|justify)["']?/i);
  return m?.[1]?.toLowerCase();
}

function buildFontName(style: InlineStyle): string {
  if (style.bold && style.italic) return 'Times-BoldItalic';
  if (style.bold) return 'Times-Bold';
  if (style.italic) return 'Times-Italic';
  return 'Times-Roman';
}

function mergeStyle(stack: StyleFrame[]): InlineStyle {
  return stack.reduce<InlineStyle>((acc, frame) => ({ ...acc, ...frame.style }), { ...DEFAULT_STYLE });
}

function closeTag(stack: StyleFrame[], tag: string): void {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].tag === tag) { stack.splice(i, 1); return; }
  }
}

// ── Table pre-processing ─────────────────────────────────────────────────────

type ParsedTable = string[][];

function parseTables(html: string): { html: string; tables: ParsedTable[] } {
  const tables: ParsedTable[] = [];

  const processed = html.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    const rows: string[][] = [];
    const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];

    for (const rowHtml of rowMatches) {
      const cells: string[] = [];
      const cellMatches = rowHtml.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) ?? [];
      for (const cellHtml of cellMatches) {
        cells.push(stripTags(cellHtml));
      }
      if (cells.length > 0) rows.push(cells);
    }

    const idx = tables.length;
    tables.push(rows);
    return `##TABLE_${idx}##`;
  });

  return { html: processed, tables };
}

function renderTable(doc: PDFKit.PDFDocument, table: ParsedTable): void {
  if (table.length === 0) return;

  const margins = doc.page.margins as { left: number; right: number; bottom: number };
  const pageWidth = doc.page.width - margins.left - margins.right;
  const colCount = Math.max(...table.map((r) => r.length), 1);
  const colWidth = pageWidth / colCount;
  const cellPadding = 5;
  const fontSize = 10;
  const lineGap = 2;

  doc.fontSize(fontSize).font('Times-Roman');

  for (const row of table) {
    // Calculate required row height
    let rowHeight = 0;
    for (let c = 0; c < colCount; c++) {
      const cellText = row[c] ?? '';
      const h = doc.heightOfString(cellText, { width: colWidth - cellPadding * 2, lineGap });
      rowHeight = Math.max(rowHeight, h + cellPadding * 2);
    }
    rowHeight = Math.max(rowHeight, 22);

    // Page break if needed
    if (doc.y + rowHeight > doc.page.height - margins.bottom - 20) {
      doc.addPage();
    }

    const rowY = doc.y;

    for (let c = 0; c < colCount; c++) {
      const cellText = row[c] ?? '';
      const x = margins.left + c * colWidth;

      doc.rect(x, rowY, colWidth, rowHeight).strokeColor('#BBBBBB').lineWidth(0.5).stroke();
      doc
        .fillColor('#111827')
        .font(c === 0 && table.indexOf(row) === 0 ? 'Times-Bold' : 'Times-Roman')
        .fontSize(fontSize)
        .text(cellText, x + cellPadding, rowY + cellPadding, {
          width: colWidth - cellPadding * 2,
          lineGap,
          continued: false,
        });
    }

    // Advance past the row
    doc.y = rowY + rowHeight;
    doc.x = margins.left;
  }

  doc.moveDown(0.6);
}

// ── Core HTML → PDFKit renderer ──────────────────────────────────────────────

async function renderHtmlToPdfKit(
  doc: PDFKit.PDFDocument,
  html: string,
  tables: ParsedTable[],
): Promise<void> {
  const stack: StyleFrame[] = [];
  let lineOpen = false;
  let currentAlign: 'left' | 'center' | 'right' | 'justify' = 'left';
  let listDepth = 0;
  const olCounters: number[] = []; // stack of counters for nested <ol>
  let insideOl = false;
  let olItemIndex = 0;

  const margins = doc.page.margins as { left: number; right: number };

  const resetTextState = () => {
    doc.fillColor(DEFAULT_STYLE.color).font(buildFontName(DEFAULT_STYLE)).fontSize(DEFAULT_STYLE.fontSize);
  };

  const flushLine = (opts: Partial<PDFKit.Mixins.TextOptions> = {}) => {
    if (lineOpen) {
      doc.text('', { continued: false, align: currentAlign, ...opts });
      lineOpen = false;
    }
    resetTextState();
  };

  const addBlockSpacing = (amount = 0.5) => {
    flushLine();
    doc.moveDown(amount);
  };

  const writeText = (rawText: string, extraOpts: Partial<PDFKit.Mixins.TextOptions> = {}) => {
    const text = normalizeWhitespace(rawText, lineOpen);
    if (!text) return;

    const style = mergeStyle(stack);
    const opts: PDFKit.Mixins.TextOptions = {
      continued: true,
      lineGap: 2,
      align: currentAlign,
      underline: style.underline,
      ...extraOpts,
    };

    doc
      .fillColor(style.color ?? DEFAULT_STYLE.color)
      .font(buildFontName(style))
      .fontSize(style.fontSize)
      .text(text, opts);

    lineOpen = true;
  };

  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];

  for (const token of tokens) {
    // ── Plain text (may contain ##TABLE_N## markers) ──────────────────
    if (!token.startsWith('<')) {
      const tableMarkerRe = /##TABLE_(\d+)##/g;
      let lastIdx = 0;
      let m: RegExpExecArray | null;

      while ((m = tableMarkerRe.exec(token)) !== null) {
        // Render any text before the marker
        const before = token.slice(lastIdx, m.index);
        if (before.trim()) writeText(before);
        lastIdx = m.index + m[0].length;

        // Render the table
        flushLine();
        doc.moveDown(0.3);
        const tableIdx = parseInt(m[1], 10);
        if (tables[tableIdx]) renderTable(doc, tables[tableIdx]);
      }

      // Render any trailing text after the last marker
      const trailing = token.slice(lastIdx);
      if (trailing) writeText(trailing);
      continue;
    }

    // ── Tag token ──────────────────────────────────────────────────────
    const tagMatch = token.match(/^<\s*(\/?)([a-z0-9]+)([^>]*)\/?\s*>$/i);
    if (!tagMatch) continue;

    const [, slash, rawTag, attributes] = tagMatch;
    const tag = rawTag.toLowerCase();
    const isClosing = slash === '/';

    // ── Closing tags ───────────────────────────────────────────────────
    if (isClosing) {
      if (tag === 'p' || tag === 'div') {
        addBlockSpacing(0.45);
        currentAlign = 'left';
      } else if (tag === 'li') {
        flushLine();
      } else if (tag === 'ul') {
        listDepth = Math.max(0, listDepth - 1);
        if (listDepth === 0) addBlockSpacing(0.2);
      } else if (tag === 'ol') {
        listDepth = Math.max(0, listDepth - 1);
        olCounters.pop();
        insideOl = olCounters.length > 0;
        olItemIndex = olCounters[olCounters.length - 1] ?? 0;
        if (listDepth === 0) addBlockSpacing(0.2);
      } else if (tag === 'blockquote') {
        addBlockSpacing(0.4);
      } else if (tag in HEADING_SIZES) {
        closeTag(stack, tag);
        addBlockSpacing(0.5);
        currentAlign = 'left';
        continue;
      }

      if (['strong', 'b', 'em', 'i', 'u', 's', 'span', 'font', 'sub', 'sup'].includes(tag)) {
        closeTag(stack, tag);
      }
      continue;
    }

    // ── Self-closing / void tags ───────────────────────────────────────
    if (tag === 'br') { flushLine(); continue; }
    if (tag === 'hr') { addBlockSpacing(0.2); doc.moveTo(margins.left, doc.y).lineTo(doc.page.width - margins.right, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke(); doc.moveDown(0.4); continue; }

    if (tag === 'img') {
      const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);
      if (srcMatch) {
        const src = srcMatch[1];
        const dataUriMatch = src.match(/^data:([^;]+);base64,(.+)$/);
        if (dataUriMatch) {
          try {
            const imgBuffer = Buffer.from(dataUriMatch[2], 'base64');
            flushLine();
            const maxW = doc.page.width - margins.left - margins.right;
            doc.image(imgBuffer, { fit: [maxW, 400], align: 'center' });
            doc.moveDown(0.5);
          } catch {
            // skip unrenderable images
          }
        }
      }
      continue;
    }

    // ── Opening block tags ─────────────────────────────────────────────
    if (tag === 'p' || tag === 'div') {
      if (lineOpen) addBlockSpacing(0.2);
      currentAlign = (extractAlignment(attributes) ?? 'left') as typeof currentAlign;
      continue;
    }

    if (tag === 'blockquote') {
      if (lineOpen) addBlockSpacing(0.2);
      doc.moveDown(0.1);
      continue;
    }

    if (tag === 'ul') {
      flushLine();
      listDepth++;
      insideOl = false;
      continue;
    }

    if (tag === 'ol') {
      flushLine();
      listDepth++;
      olCounters.push(0);
      insideOl = true;
      continue;
    }

    if (tag === 'li') {
      flushLine();
      const indent = Math.max(listDepth, 1) * 16;

      if (insideOl && olCounters.length > 0) {
        olCounters[olCounters.length - 1]++;
        olItemIndex = olCounters[olCounters.length - 1];
        const bullet = `${olItemIndex}. `;
        doc
          .fillColor(DEFAULT_STYLE.color)
          .font('Times-Roman')
          .fontSize(DEFAULT_STYLE.fontSize)
          .text(bullet, margins.left + indent - 14, doc.y, { continued: true, lineGap: 2, indent: 0 });
      } else {
        doc
          .fillColor(DEFAULT_STYLE.color)
          .font('Times-Roman')
          .fontSize(DEFAULT_STYLE.fontSize)
          .text('• ', margins.left + indent - 14, doc.y, { continued: true, lineGap: 2 });
      }
      lineOpen = true;
      continue;
    }

    if (tag in HEADING_SIZES) {
      if (lineOpen) addBlockSpacing(0.3);
      else doc.moveDown(0.4);
      currentAlign = (extractAlignment(attributes) ?? 'left') as typeof currentAlign;
      stack.push({ tag, style: { bold: true, fontSize: HEADING_SIZES[tag], color: '#0F1F2E' } });
      continue;
    }

    // ── Opening inline tags ────────────────────────────────────────────
    if (tag === 'strong' || tag === 'b') {
      stack.push({ tag, style: { bold: true } });
    } else if (tag === 'em' || tag === 'i') {
      stack.push({ tag, style: { italic: true } });
    } else if (tag === 'u') {
      stack.push({ tag, style: { underline: true } });
    } else if (tag === 's' || tag === 'strike' || tag === 'del') {
      stack.push({ tag, style: {} }); // pdfkit doesn't support strikethrough natively
    } else if (tag === 'span' || tag === 'font') {
      const color = extractInlineColor(attributes);
      stack.push({ tag, style: color ? { color } : {} });
    } else if (tag === 'sub' || tag === 'sup') {
      stack.push({ tag, style: { fontSize: DEFAULT_STYLE.fontSize * 0.75 } });
    }
  }

  flushLine();
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
      const { AlignmentType, Document, ImageRun, Packer, Paragraph, TextRun } = await import('docx');

      let pages: RenderedPage[];
      try {
        pages = await pdfPagesToImages(buffer);
      } catch (pdfErr) {
        console.warn('PDF render failed, falling back to text extraction:', (pdfErr as Error).message);

        const text = await parsePDFText(buffer);
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
        const safeName = sanitizeFilename(file.name.replace(/\.pdf$/i, '') + '.docx');

        return new NextResponse(new Uint8Array(docxBuffer), {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${safeName}"`,
          },
        });
      }

      const TARGET_WIDTH_PX = 794;
      const children = pages.map((page, idx) => {
        const scale = TARGET_WIDTH_PX / page.width;
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: idx === 0 ? 0 : 400, after: 0 },
          children: [
            new ImageRun({
              data: page.data,
              transformation: { width: Math.round(page.width * scale), height: Math.round(page.height * scale) },
              type: 'png',
            }),
          ],
        });
      });

      const doc = new Document({
        sections: [{ properties: { page: { margin: { top: 360, bottom: 360, left: 360, right: 360 } } }, children }],
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
      const mammoth = await import('mammoth');
      const PDFDocument = (await import('pdfkit')).default;

      // Convert DOCX → HTML, embedding images as base64 data URIs
      const { value: rawHtml } = await mammoth.convertToHtml(
        { buffer },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
            const base64 = await image.readAsBase64String();
            return { src: `data:${image.contentType};base64,${base64}` };
          }),
          styleMap: [
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Subtitle'] => h2:fresh",
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Heading 5'] => h5:fresh",
            "p[style-name='Heading 6'] => h6:fresh",
            "u => u",
          ],
        }
      );

      // Pre-process tables into a structured format
      const { html, tables } = parseTables(rawHtml);

      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        margin: 72, // 1-inch margins — standard document margin
        autoFirstPage: true,
        size: 'A4',
        info: { Title: file.name.replace(/\.docx?$/i, '') },
      });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      await new Promise<void>((resolve, reject) => {
        doc.on('end', resolve);
        doc.on('error', reject);
        renderHtmlToPdfKit(doc, html, tables).then(() => doc.end()).catch(reject);
      });

      const pdfBuffer = Buffer.concat(chunks);
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
