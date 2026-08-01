/**
 * Formal application letter in the layout Nigerian employers expect:
 * applicant address top-right, employer address left, date, subject line
 * naming the post, salutation, body, respectful closing.
 */

export interface LetterData {
  applicantName: string;
  applicantAddressLines: string[];
  applicantPhone?: string;
  applicantEmail?: string;
  date: string;
  employerName: string;
  employerAddressLines: string[];
  role: string;
  body: string;
}

export function defaultLetterBody(role: string, source: string): string {
  const opening = source.trim()
    ? `I am writing to apply for the position of ${role || '[position]'} as advertised on ${source.trim()}.`
    : `I am writing to apply for the position of ${role || '[position]'} in your organisation.`;
  return [
    opening,
    'I believe my skills, training and work ethic make me a strong candidate for this role, and I am eager to contribute to the growth of your organisation. My CV is attached with further details of my qualifications and experience.',
    'I would welcome the opportunity to discuss my application at an interview, and I am available at your convenience.',
    'Thank you for considering my application. I look forward to hearing from you.',
  ].join('\n\n');
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 64;
const BODY_SIZE = 11;
const LEADING = 17;

export async function renderLetterPdf(data: LetterData): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('@cantoo/pdf-lib');
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const ink = rgb(0.1, 0.1, 0.12);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const sanitize = (s: string) => s.replace(/[^\x00-\xFF]/g, '');

  const ensureRoom = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  const draw = (text: string, options: { font?: typeof regular; right?: boolean; size?: number } = {}) => {
    const font = options.font ?? regular;
    const size = options.size ?? BODY_SIZE;
    const content = sanitize(text);
    const x = options.right
      ? PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(content, size)
      : MARGIN;
    page.drawText(content, { x, y, size, font, color: ink });
    y -= LEADING;
  };

  const wrap = (text: string, font: typeof regular, size: number): string[] => {
    const maxWidth = PAGE_WIDTH - MARGIN * 2;
    const lines: string[] = [];
    for (const paragraph of text.split('\n')) {
      if (!paragraph.trim()) {
        lines.push('');
        continue;
      }
      let current = '';
      for (const word of paragraph.split(/\s+/)) {
        const candidate = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(sanitize(candidate), size) > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  };

  // Applicant block — top right
  for (const line of [data.applicantName, ...data.applicantAddressLines, data.applicantPhone, data.applicantEmail].filter(
    (v): v is string => Boolean(v && v.trim()),
  )) {
    draw(line, { right: true });
  }
  draw(data.date, { right: true });
  y -= LEADING;

  // Employer block — left
  for (const line of [data.employerName, ...data.employerAddressLines].filter((v) => v.trim())) {
    draw(line);
  }
  y -= LEADING;

  draw('Dear Sir/Madam,');
  y -= 4;

  draw(`APPLICATION FOR THE POST OF ${data.role.toUpperCase() || '[POSITION]'}`, { font: bold });
  y -= 4;

  for (const line of wrap(data.body, regular, BODY_SIZE)) {
    ensureRoom(LEADING);
    if (line === '') {
      y -= LEADING / 2;
      continue;
    }
    draw(line);
  }

  y -= LEADING;
  ensureRoom(LEADING * 4);
  draw('Yours faithfully,');
  y -= LEADING * 1.5;
  draw(data.applicantName, { font: bold });

  return pdf.save({ useObjectStreams: true });
}
