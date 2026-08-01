import {
  computeTotals,
  formatMinor,
  lineTotalMinor,
  DOC_KIND_COPY,
  type BusinessDocument,
} from './business';

/**
 * Renders a business document to PDF with @cantoo/pdf-lib.
 *
 * Currency symbols like ₦ and GH₵ are outside WinAnsi, so DejaVu Sans is
 * embedded via fontkit (fetched lazily from /fonts/). If the font cannot be
 * loaded — offline first visit, for example — we fall back to Helvetica and
 * replace unencodable symbols with ISO codes rather than crashing.
 */

const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

export async function renderBusinessPdf(doc: BusinessDocument): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('@cantoo/pdf-lib');
  const pdf = await PDFDocument.create();

  let regular;
  let bold;
  let sanitize = (s: string) => s;
  try {
    const fontkit = (await import('@pdf-lib/fontkit')).default;
    pdf.registerFontkit(fontkit);
    const fontBytes = await fetch('/fonts/DejaVuSans.ttf').then((r) => {
      if (!r.ok) throw new Error('font fetch failed');
      return r.arrayBuffer();
    });
    regular = await pdf.embedFont(fontBytes, { subset: true });
    bold = regular; // DejaVu regular doubles for headers via size, keeping the download to one file.
  } catch {
    regular = await pdf.embedFont(StandardFonts.Helvetica);
    bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    // WinAnsi cannot encode ₦/₵ — swap for ISO codes instead of crashing.
    sanitize = (s: string) =>
      s.replace(/₦/g, 'NGN ').replace(/GH₵/g, 'GHS ').replace(/₵/g, 'GHS ').replace(/[^\x00-\xFF]/g, '');
  }

  const ink = rgb(0.07, 0.09, 0.15);
  const muted = rgb(0.45, 0.5, 0.59);
  const line = rgb(0.89, 0.91, 0.94);
  const accent = rgb(0.85, 0.6, 0.13);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const text = (
    value: string,
    x: number,
    size: number,
    options: { font?: typeof regular; color?: ReturnType<typeof rgb>; alignRight?: number } = {},
  ) => {
    const font = options.font ?? regular;
    const content = sanitize(value);
    const width = font.widthOfTextAtSize(content, size);
    const drawX = options.alignRight !== undefined ? options.alignRight - width : x;
    page.drawText(content, { x: drawX, y, size, font, color: options.color ?? ink });
  };

  const ensureRoom = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  const copy = DOC_KIND_COPY[doc.kind];

  // ── Header ──────────────────────────────────────────────────────────────
  text(copy.title, MARGIN, 26, { font: bold, color: accent });
  text(doc.from.name || 'Your Business', MARGIN, 13, { alignRight: PAGE_WIDTH - MARGIN, font: bold });
  y -= 18;
  for (const lineText of doc.from.addressLines.filter(Boolean)) {
    text(lineText, MARGIN, 9, { alignRight: PAGE_WIDTH - MARGIN, color: muted });
    y -= 12;
  }
  if (doc.from.phone) { text(doc.from.phone, MARGIN, 9, { alignRight: PAGE_WIDTH - MARGIN, color: muted }); y -= 12; }
  if (doc.from.email) { text(doc.from.email, MARGIN, 9, { alignRight: PAGE_WIDTH - MARGIN, color: muted }); y -= 12; }

  y -= 14;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: line });
  y -= 24;

  // ── Meta + recipient ─────────────────────────────────────────────────────
  const metaTop = y;
  text(copy.partyLabel.toUpperCase(), MARGIN, 8, { color: muted });
  y -= 14;
  text(doc.to.name || '—', MARGIN, 12, { font: bold });
  y -= 15;
  for (const lineText of doc.to.addressLines.filter(Boolean)) {
    text(lineText, MARGIN, 9, { color: muted });
    y -= 12;
  }
  if (doc.to.phone) { text(doc.to.phone, MARGIN, 9, { color: muted }); y -= 12; }

  const leftEnd = y;
  y = metaTop;
  const metaX = PAGE_WIDTH - MARGIN - 180;
  const metaRows: [string, string][] = [
    [copy.numberLabel, doc.number || '—'],
    ['Date', doc.date || '—'],
  ];
  if (doc.dueDate && doc.kind === 'invoice') metaRows.push(['Due Date', doc.dueDate]);
  if (doc.dueDate && doc.kind === 'quotation') metaRows.push(['Valid Until', doc.dueDate]);
  for (const [label, value] of metaRows) {
    text(label, metaX, 9, { color: muted });
    text(value, 0, 9, { alignRight: PAGE_WIDTH - MARGIN, font: bold });
    y -= 14;
  }

  y = Math.min(leftEnd, y) - 24;

  // ── Items table ──────────────────────────────────────────────────────────
  const colDesc = MARGIN;
  const colQty = PAGE_WIDTH - MARGIN - 200;
  const colPrice = PAGE_WIDTH - MARGIN - 110;
  const colTotal = PAGE_WIDTH - MARGIN;

  const drawTableHeader = () => {
    text('DESCRIPTION', colDesc, 8, { color: muted });
    text('QTY', colQty, 8, { color: muted });
    text('UNIT PRICE', 0, 8, { color: muted, alignRight: colPrice + 60 });
    text('AMOUNT', 0, 8, { color: muted, alignRight: colTotal });
    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: line });
    y -= 16;
  };
  drawTableHeader();

  for (const item of doc.items) {
    ensureRoom(60);
    if (y === PAGE_HEIGHT - MARGIN) drawTableHeader();
    const description = item.description || '—';
    // Wrap long descriptions at ~55 chars per line.
    const words = description.split(' ');
    const rows: string[] = [];
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > 55) {
        rows.push(current.trim());
        current = word;
      } else {
        current = `${current} ${word}`;
      }
    }
    if (current.trim()) rows.push(current.trim());

    text(rows[0] ?? '—', colDesc, 10);
    text(String(item.quantity), colQty, 10);
    text(formatMinor(item.unitPriceMinor, doc.currency), 0, 10, { alignRight: colPrice + 60 });
    text(formatMinor(lineTotalMinor(item), doc.currency), 0, 10, { alignRight: colTotal });
    y -= 14;
    for (const row of rows.slice(1)) {
      ensureRoom(14);
      text(row, colDesc, 10);
      y -= 14;
    }
    y -= 4;
  }

  // ── Totals ───────────────────────────────────────────────────────────────
  ensureRoom(110);
  y -= 6;
  page.drawLine({ start: { x: colQty, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: line });
  y -= 18;

  const totals = computeTotals(doc);
  text('Subtotal', colQty, 10, { color: muted });
  text(formatMinor(totals.subtotalMinor, doc.currency), 0, 10, { alignRight: colTotal });
  y -= 16;
  if (doc.taxRatePct > 0) {
    text(`Tax (${doc.taxRatePct}%)`, colQty, 10, { color: muted });
    text(formatMinor(totals.taxMinor, doc.currency), 0, 10, { alignRight: colTotal });
    y -= 16;
  }
  text(doc.kind === 'quotation' ? 'Estimated Total' : 'Total', colQty, 13, { font: bold });
  text(formatMinor(totals.totalMinor, doc.currency), 0, 13, { alignRight: colTotal, font: bold });
  y -= 30;

  // ── Bank details & notes ─────────────────────────────────────────────────
  if (doc.bankDetails?.trim()) {
    ensureRoom(50);
    text('PAYMENT DETAILS', MARGIN, 8, { color: muted });
    y -= 13;
    for (const row of doc.bankDetails.split('\n').filter(Boolean).slice(0, 5)) {
      text(row, MARGIN, 9);
      y -= 12;
    }
    y -= 8;
  }
  if (doc.notes?.trim()) {
    ensureRoom(50);
    text('NOTES', MARGIN, 8, { color: muted });
    y -= 13;
    for (const row of doc.notes.split('\n').filter(Boolean).slice(0, 6)) {
      text(row, MARGIN, 9, { color: muted });
      y -= 12;
    }
  }

  return pdf.save({ useObjectStreams: true });
}
