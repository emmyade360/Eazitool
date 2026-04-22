import { NextRequest, NextResponse } from 'next/server';

type RenderedPage = { data: Buffer; width: number; height: number };

type InlineStyle = {
  bold: boolean;
  italic: boolean;
  color?: string;
  fontSize: number;
};

type StyleFrame = {
  tag: string;
  style: Partial<InlineStyle>;
};

const DEFAULT_STYLE: InlineStyle = {
  bold: false,
  italic: false,
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

async function pdfPagesToImages(buffer: Buffer): Promise<RenderedPage[]> {
  const { pdf } = await import('pdf-to-img');
  const sharp = (await import('sharp')).default;

  const pageIterator = await pdf(buffer, { scale: 2.0 });
  const pages: RenderedPage[] = [];

  for await (const pageBuffer of pageIterator) {
    const fixedBuffer = await sharp(pageBuffer)
      .withIccProfile('srgb')
      .png()
      .toBuffer();
    const meta = await sharp(fixedBuffer).metadata();

    pages.push({
      data: fixedBuffer,
      width: meta.width ?? 1240,
      height: meta.height ?? 1754,
    });
  }

  return pages;
}

async function parsePDFText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return (result?.text ?? '').trim();
}

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

function normalizeWhitespace(text: string, lineOpen: boolean): string {
  const normalized = decodeHtmlEntities(text).replace(/\s+/g, ' ');
  return lineOpen ? normalized : normalized.trimStart();
}

function normalizeColor(value?: string): string | undefined {
  if (!value) return undefined;

  const color = value.trim().replace(/^['"]|['"]$/g, '');
  if (!color) return undefined;

  if (/^[0-9a-f]{6}$/i.test(color)) {
    return `#${color.toUpperCase()}`;
  }

  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color.toUpperCase();
  }

  if (/^#[0-9a-f]{3}$/i.test(color)) {
    const [, r, g, b] = color;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  const rgbMatch = color.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1).map((part) =>
      Math.max(0, Math.min(255, Number.parseInt(part, 10)))
    );

    return `#${[r, g, b]
      .map((part) => part.toString(16).padStart(2, '0'))
      .join('')}`.toUpperCase();
  }

  return color;
}

function extractInlineColor(attributes: string): string | undefined {
  const styleMatch = attributes.match(/style\s*=\s*["']([^"']+)["']/i);
  if (styleMatch) {
    const colorMatch = styleMatch[1].match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    const color = normalizeColor(colorMatch?.[1]);
    if (color) return color;
  }

  const attrMatch = attributes.match(/color\s*=\s*["']([^"']+)["']/i);
  return normalizeColor(attrMatch?.[1]);
}

function buildFontName(style: InlineStyle): string {
  if (style.bold && style.italic) return 'Helvetica-BoldOblique';
  if (style.bold) return 'Helvetica-Bold';
  if (style.italic) return 'Helvetica-Oblique';
  return 'Helvetica';
}

function mergeStyle(stack: StyleFrame[]): InlineStyle {
  return stack.reduce<InlineStyle>(
    (acc, frame) => ({ ...acc, ...frame.style }),
    { ...DEFAULT_STYLE }
  );
}

function closeTag(stack: StyleFrame[], tag: string): void {
  for (let idx = stack.length - 1; idx >= 0; idx -= 1) {
    if (stack[idx].tag === tag) {
      stack.splice(idx, 1);
      return;
    }
  }
}

async function renderHtmlToPdfKit(
  doc: PDFKit.PDFDocument,
  html: string
): Promise<void> {
  const stack: StyleFrame[] = [];
  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];
  let lineOpen = false;

  const resetTextState = () => {
    doc.fillColor(DEFAULT_STYLE.color ?? '#111827');
    doc.font(buildFontName(DEFAULT_STYLE)).fontSize(DEFAULT_STYLE.fontSize);
  };

  const flushLine = () => {
    if (lineOpen) {
      doc.text('', { continued: false });
      lineOpen = false;
    }
    resetTextState();
  };

  const addBlockSpacing = (amount = 0.5) => {
    flushLine();
    doc.moveDown(amount);
  };

  const writeText = (rawText: string) => {
    const text = normalizeWhitespace(rawText, lineOpen);
    if (!text.trim()) return;

    const style = mergeStyle(stack);
    doc
      .fillColor(style.color ?? DEFAULT_STYLE.color ?? '#111827')
      .font(buildFontName(style))
      .fontSize(style.fontSize)
      .text(text, { continued: true, lineGap: 3 });
    lineOpen = true;
  };

  for (const token of tokens) {
    if (!token.startsWith('<')) {
      writeText(token);
      continue;
    }

    const tagMatch = token.match(/^<\s*(\/?)([a-z0-9]+)([^>]*)\/?\s*>$/i);
    if (!tagMatch) continue;

    const [, slash, rawTag, attributes] = tagMatch;
    const tag = rawTag.toLowerCase();
    const isClosing = slash === '/';
    const isSelfClosing = /\/\s*>$/.test(token) || tag === 'br';

    if (isClosing) {
      if (tag === 'p' || tag === 'div') addBlockSpacing(0.55);
      if (tag === 'li') flushLine();
      if (tag === 'ul' || tag === 'ol') addBlockSpacing(0.2);
      if (tag in HEADING_SIZES) {
        closeTag(stack, tag);
        addBlockSpacing(0.65);
        continue;
      }
      if (tag === 'strong' || tag === 'b' || tag === 'em' || tag === 'i' || tag === 'span' || tag === 'font') {
        closeTag(stack, tag);
      }
      continue;
    }

    if (tag === 'br') {
      flushLine();
      continue;
    }

    if (tag === 'p' || tag === 'div') {
      if (lineOpen) addBlockSpacing(0.2);
      continue;
    }

    if (tag === 'li') {
      flushLine();
      writeText('\u2022 ');
      continue;
    }

    if (tag === 'strong' || tag === 'b') {
      stack.push({ tag, style: { bold: true } });
    } else if (tag === 'em' || tag === 'i') {
      stack.push({ tag, style: { italic: true } });
    } else if (tag === 'span' || tag === 'font') {
      const color = extractInlineColor(attributes);
      stack.push({ tag, style: color ? { color } : {} });
    } else if (tag in HEADING_SIZES) {
      if (lineOpen) addBlockSpacing(0.25);
      stack.push({
        tag,
        style: { bold: true, fontSize: HEADING_SIZES[tag] },
      });
    }

    if (isSelfClosing) {
      if (tag === 'span' || tag === 'font' || tag === 'strong' || tag === 'b' || tag === 'em' || tag === 'i' || tag in HEADING_SIZES) {
        closeTag(stack, tag);
      }
    }
  }

  flushLine();
}

export async function POST(req: NextRequest) {
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

    if (from === 'pdf' && to === 'docx') {
      const { AlignmentType, Document, ImageRun, Packer, Paragraph, TextRun } = await import('docx');

      let pages: RenderedPage[];
      try {
        pages = await pdfPagesToImages(buffer);
      } catch (pdfErr) {
        console.warn('PDF render failed, falling back to text extraction:', (pdfErr as Error).message);

        const text = await parsePDFText(buffer);
        const lines = text.split('\n').filter((line) => line.trim());

        const doc = new Document({
          sections: [{
            properties: {},
            children: lines.length
              ? lines.map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 24 })] }))
              : [new Paragraph({ children: [new TextRun('(empty document)')] })],
          }],
        });

        const docxBuffer = await Packer.toBuffer(doc);
        const filename = file.name.replace(/\.pdf$/i, '') + '.docx';

        return new NextResponse(new Uint8Array(docxBuffer), {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      const TARGET_WIDTH_PX = 794;

      const children = pages.map((page, idx) => {
        const scale = TARGET_WIDTH_PX / page.width;
        const imgW = Math.round(page.width * scale);
        const imgH = Math.round(page.height * scale);

        return new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: idx === 0 ? 0 : 400, after: 0 },
          children: [
            new ImageRun({
              data: page.data,
              transformation: { width: imgW, height: imgH },
              type: 'png',
            }),
          ],
        });
      });

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 360, bottom: 360, left: 360, right: 360 },
            },
          },
          children,
        }],
      });

      const docxBuffer = await Packer.toBuffer(doc);
      const filename = file.name.replace(/\.pdf$/i, '') + '.docx';

      return new NextResponse(new Uint8Array(docxBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (from === 'pdf' && to === 'txt') {
      const text = await parsePDFText(buffer);
      const filename = file.name.replace(/\.pdf$/i, '') + '.txt';

      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (from === 'docx' && to === 'pdf') {
      const mammoth = await import('mammoth');
      const PDFDocument = (await import('pdfkit')).default;
      const { value: html } = await mammoth.convertToHtml({ buffer });

      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 60, autoFirstPage: true });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      await new Promise<void>((resolve, reject) => {
        doc.on('end', resolve);
        doc.on('error', reject);
        renderHtmlToPdfKit(doc, html).then(() => doc.end()).catch(reject);
      });

      const pdfBuffer = Buffer.concat(chunks);
      const filename = file.name.replace(/\.docx?$/i, '') + '.pdf';

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (from === 'txt' && to === 'pdf') {
      const PDFDocument = (await import('pdfkit')).default;
      const text = buffer.toString('utf-8');

      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 60 });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      await new Promise<void>((resolve, reject) => {
        doc.on('end', resolve);
        doc.on('error', reject);
        doc.fontSize(11).font('Helvetica').text(text, { lineGap: 4 });
        doc.end();
      });

      const pdfBuffer = Buffer.concat(chunks);
      const filename = file.name.replace(/\.txt$/i, '') + '.pdf';

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (from === 'docx' && to === 'txt') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      const filename = file.name.replace(/\.docx?$/i, '') + '.txt';

      return new NextResponse(result.value || '', {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (from === 'txt' && to === 'docx') {
      const { Document, Packer, Paragraph, TextRun } = await import('docx');
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').filter((line) => line.trim());

      const doc = new Document({
        sections: [{
          properties: {},
          children: lines.length
            ? lines.map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 24 })] }))
            : [new Paragraph({ children: [new TextRun('(empty document)')] })],
        }],
      });

      const docxBuffer = await Packer.toBuffer(doc);
      const filename = file.name.replace(/\.txt$/i, '') + '.docx';

      return new NextResponse(new Uint8Array(docxBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
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
