/**
 * Guided legal/official document templates rendered to PDF.
 *
 * These are structured templates for parties to review and sign — not legal
 * advice. Affidavits additionally only take effect once sworn before a
 * commissioner for oaths.
 */

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number';
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

export interface SignatureBlock {
  label: string;
  sublabels?: string[];
}

export interface RenderableDoc {
  /** Centered heading lines above the title (e.g. court heading). */
  headingLines?: string[];
  title: string;
  /** Plain paragraphs; entries starting with `n.` render as numbered clauses. */
  paragraphs: string[];
  signatures: SignatureBlock[];
  footNote?: string;
}

export interface LegalTemplate {
  id: string;
  label: string;
  description: string;
  fields: TemplateField[];
  build: (v: Record<string, string>) => RenderableDoc;
}

const get = (v: Record<string, string>, key: string, fallback = '____________________') =>
  v[key]?.trim() || fallback;

const today = () =>
  new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

// ── Tenancy agreement ─────────────────────────────────────────────────────────

export const TENANCY_TEMPLATE: LegalTemplate = {
  id: 'tenancy',
  label: 'Tenancy Agreement',
  description: 'Standard residential tenancy between a landlord and tenant.',
  fields: [
    { key: 'landlordName', label: 'Landlord full name', type: 'text', required: true },
    { key: 'landlordAddress', label: 'Landlord address', type: 'text', required: true },
    { key: 'tenantName', label: 'Tenant full name', type: 'text', required: true },
    { key: 'tenantAddress', label: 'Tenant current address', type: 'text', required: true },
    { key: 'property', label: 'Property being rented (full address & description)', type: 'textarea', required: true, placeholder: 'e.g. A 2-bedroom flat at 15 Adewale Street, Surulere, Lagos' },
    { key: 'termLength', label: 'Term (e.g. one year)', type: 'text', required: true, placeholder: 'one (1) year' },
    { key: 'startDate', label: 'Start date', type: 'date', required: true },
    { key: 'rent', label: 'Rent for the term (₦, words and figures)', type: 'text', required: true, placeholder: 'e.g. ₦800,000 (Eight Hundred Thousand Naira)' },
    { key: 'cautionFee', label: 'Caution/service deposit (optional)', type: 'text' },
    { key: 'noticePeriod', label: 'Notice period to quit', type: 'text', placeholder: 'e.g. three (3) months' },
    { key: 'extraTerms', label: 'Additional agreed terms (optional)', type: 'textarea', hint: 'Anything both parties agreed beyond the standard clauses.' },
  ],
  build: (v) => ({
    title: 'TENANCY AGREEMENT',
    paragraphs: [
      `THIS TENANCY AGREEMENT is made this ${today()} BETWEEN ${get(v, 'landlordName')} of ${get(v, 'landlordAddress')} (hereinafter called "the Landlord", which expression includes their heirs, assigns and legal representatives) of the one part, AND ${get(v, 'tenantName')} of ${get(v, 'tenantAddress')} (hereinafter called "the Tenant") of the other part.`,
      `WHEREBY the Landlord lets and the Tenant takes the property known and described as: ${get(v, 'property')} (hereinafter called "the Premises") for a term of ${get(v, 'termLength')} commencing on ${get(v, 'startDate')}, at a rent of ${get(v, 'rent')} for the term, the receipt of which the Landlord acknowledges${v.cautionFee?.trim() ? `, together with a refundable caution deposit of ${v.cautionFee.trim()}` : ''}.`,
      'THE TENANT AGREES with the Landlord as follows:',
      '1. To pay the rent as agreed without deduction, and to pay for electricity, water, waste and other utility charges arising from their occupation.',
      '2. To use the Premises for residential purposes only and not for any illegal or immoral purpose.',
      '3. To keep the interior of the Premises, including fittings and fixtures, in good and tenantable condition, fair wear and tear excepted.',
      '4. Not to make structural alterations, and not to assign or sublet the Premises or any part of it without the prior written consent of the Landlord.',
      '5. To permit the Landlord or their agent, on reasonable prior notice, to inspect the Premises at reasonable times.',
      '6. To deliver up the Premises at the end of the tenancy in the condition required by this agreement.',
      'THE LANDLORD AGREES with the Tenant as follows:',
      '1. That the Tenant, paying the rent and observing the terms of this agreement, shall peaceably hold and enjoy the Premises without interruption by the Landlord.',
      '2. To keep the roof, walls and other structural parts of the Premises in good repair.',
      '3. To pay all rates and charges imposed on the Premises by law upon owners.',
      `IT IS MUTUALLY AGREED that either party may determine this tenancy by giving the other ${get(v, 'noticePeriod', 'the statutorily required')} written notice, and that this agreement is governed by the laws of the Federal Republic of Nigeria.`,
      ...(v.extraTerms?.trim() ? ['ADDITIONAL TERMS:', ...v.extraTerms.trim().split('\n').filter(Boolean)] : []),
      'IN WITNESS WHEREOF the parties have set their hands the day and year first above written.',
    ],
    signatures: [
      { label: 'THE LANDLORD', sublabels: [get(v, 'landlordName'), 'Signature & Date'] },
      { label: 'THE TENANT', sublabels: [get(v, 'tenantName'), 'Signature & Date'] },
      { label: 'WITNESS (for Landlord)', sublabels: ['Name, Address, Signature & Date'] },
      { label: 'WITNESS (for Tenant)', sublabels: ['Name, Address, Signature & Date'] },
    ],
    footNote:
      'Template for the parties to review and sign — not legal advice. For long leases or high-value property, have a lawyer review it and register applicable stamp duty.',
  }),
};

// ── Affidavits ────────────────────────────────────────────────────────────────

const AFFIDAVIT_COMMON_FIELDS: TemplateField[] = [
  { key: 'state', label: 'State (for the court heading)', type: 'text', required: true, placeholder: 'e.g. Lagos' },
  { key: 'division', label: 'Judicial division / registry location', type: 'text', placeholder: 'e.g. Ikeja' },
  { key: 'deponentName', label: 'Your full name (deponent)', type: 'text', required: true },
  { key: 'sex', label: 'Sex', type: 'text', required: true, placeholder: 'Male / Female' },
  { key: 'occupation', label: 'Occupation', type: 'text', required: true },
  { key: 'address', label: 'Residential address', type: 'text', required: true },
];

function affidavitDoc(
  v: Record<string, string>,
  subject: string,
  depositions: string[],
): RenderableDoc {
  return {
    headingLines: [
      'IN THE HIGH COURT OF JUSTICE',
      `${get(v, 'state').toUpperCase()} STATE OF NIGERIA`,
      `IN THE ${get(v, 'division', '__________').toUpperCase()} JUDICIAL DIVISION`,
    ],
    title: `AFFIDAVIT OF ${subject.toUpperCase()}`,
    paragraphs: [
      `I, ${get(v, 'deponentName').toUpperCase()}, ${get(v, 'sex')}, Nigerian citizen, ${get(v, 'occupation')}, residing at ${get(v, 'address')}, do hereby make oath and state as follows:`,
      ...depositions.map((d, i) => `${i + 1}. ${d}`),
      `${depositions.length + 1}. That I depose to this affidavit conscientiously and in good faith, believing its contents to be true and correct, and in accordance with the Oaths Act.`,
    ],
    signatures: [
      { label: 'DEPONENT', sublabels: ['Signature'] },
      {
        label: `SWORN to at the High Court Registry, ${get(v, 'division', '__________')}`,
        sublabels: ['This ______ day of ______________ 20____', 'BEFORE ME:', 'COMMISSIONER FOR OATHS'],
      },
    ],
    footNote:
      'This document only becomes a valid affidavit once sworn before a Commissioner for Oaths at a court registry or a notary public.',
  };
}

export const AFFIDAVIT_TEMPLATES: LegalTemplate[] = [
  {
    id: 'name-change',
    label: 'Change of Name',
    description: 'For updating records after changing your name.',
    fields: [
      ...AFFIDAVIT_COMMON_FIELDS,
      { key: 'formerName', label: 'Former name', type: 'text', required: true },
      { key: 'newName', label: 'New name', type: 'text', required: true },
      { key: 'reason', label: 'Reason for the change', type: 'text', required: true, placeholder: 'e.g. marriage / personal preference / correction of spelling' },
    ],
    build: (v) =>
      affidavitDoc(v, 'change of name', [
        `That I was formerly known and called ${get(v, 'formerName').toUpperCase()}.`,
        `That I now wish to be known and called ${get(v, 'newName').toUpperCase()}, by reason of ${get(v, 'reason')}.`,
        `That henceforth I wish to be known, called and addressed as ${get(v, 'newName').toUpperCase()} in all records and documents, and that both names refer to one and the same person.`,
        'That all authorities, institutions and the general public should take note of the above change and effect it in their records accordingly.',
      ]),
  },
  {
    id: 'age-declaration',
    label: 'Age Declaration',
    description: 'For persons without a birth certificate.',
    fields: [
      ...AFFIDAVIT_COMMON_FIELDS,
      { key: 'dob', label: 'Date of birth being declared', type: 'date', required: true },
      { key: 'placeOfBirth', label: 'Place of birth', type: 'text', required: true },
      { key: 'parentName', label: 'Parent/informant name (basis of knowledge)', type: 'text', required: true, hint: 'Usually a parent or elder relative who knows the facts of birth.' },
      { key: 'relationship', label: 'Their relationship to you', type: 'text', required: true, placeholder: 'e.g. father / mother' },
    ],
    build: (v) =>
      affidavitDoc(v, 'declaration of age', [
        `That I was born on ${get(v, 'dob')} at ${get(v, 'placeOfBirth')}.`,
        `That the facts of my birth were made known to me by ${get(v, 'parentName')}, my ${get(v, 'relationship')}, who has personal knowledge of the facts.`,
        'That my birth was not registered at the time and no birth certificate was issued in respect of it.',
        'That this declaration is required for official and record purposes.',
      ]),
  },
  {
    id: 'loss-of-document',
    label: 'Loss of Document',
    description: 'For replacing a lost certificate, ID or other document.',
    fields: [
      ...AFFIDAVIT_COMMON_FIELDS,
      { key: 'documentType', label: 'Document lost', type: 'text', required: true, placeholder: "e.g. First School Leaving Certificate / driver's licence" },
      { key: 'documentDetail', label: 'Document number / issuing body (if known)', type: 'text' },
      { key: 'circumstances', label: 'How and roughly when it was lost', type: 'textarea', required: true },
      { key: 'policeReport', label: 'Police report details (optional)', type: 'text', placeholder: 'e.g. reported at Area F Police Station on 12/03/2026' },
    ],
    build: (v) =>
      affidavitDoc(v, 'loss of document', [
        `That I was the holder of ${get(v, 'documentType')}${v.documentDetail?.trim() ? ` (${v.documentDetail.trim()})` : ''}.`,
        `That the said document got lost under the following circumstances: ${get(v, 'circumstances')}.`,
        ...(v.policeReport?.trim() ? [`That the loss was reported to the police: ${v.policeReport.trim()}.`] : []),
        'That all efforts made to trace or recover the said document have proved abortive.',
        'That the document was neither seized by any government authority nor used as collateral, and that if found I shall surrender it to the issuing authority.',
        'That I require this affidavit for the purpose of obtaining a replacement.',
      ]),
  },
];

// ── Employment letters ────────────────────────────────────────────────────────

const EMPLOYER_COMMON_FIELDS: TemplateField[] = [
  { key: 'companyName', label: 'Business / company name', type: 'text', required: true },
  { key: 'companyAddress', label: 'Business address', type: 'text', required: true },
  { key: 'employeeName', label: 'Employee full name', type: 'text', required: true },
  { key: 'role', label: 'Job title / role', type: 'text', required: true },
  { key: 'signerName', label: 'Signer name', type: 'text', required: true },
  { key: 'signerTitle', label: 'Signer title', type: 'text', required: true, placeholder: 'e.g. Managing Director' },
];

export const EMPLOYMENT_TEMPLATES: LegalTemplate[] = [
  {
    id: 'offer-letter',
    label: 'Offer / Appointment Letter',
    description: 'Formal offer of employment with core terms.',
    fields: [
      ...EMPLOYER_COMMON_FIELDS,
      { key: 'employeeAddress', label: 'Employee address', type: 'text', required: true },
      { key: 'startDate', label: 'Start date', type: 'date', required: true },
      { key: 'salary', label: 'Salary (amount and frequency)', type: 'text', required: true, placeholder: 'e.g. ₦250,000 per month, less statutory deductions' },
      { key: 'probation', label: 'Probation period', type: 'text', placeholder: 'e.g. three (3) months' },
      { key: 'notice', label: 'Notice period', type: 'text', placeholder: 'e.g. one (1) month by either party' },
      { key: 'workLocation', label: 'Work location', type: 'text', required: true },
    ],
    build: (v) => ({
      headingLines: [get(v, 'companyName').toUpperCase(), get(v, 'companyAddress'), '', today()],
      title: `OFFER OF EMPLOYMENT — ${get(v, 'role').toUpperCase()}`,
      paragraphs: [
        `Dear ${get(v, 'employeeName')},`,
        `Following your application and interview, we are pleased to offer you employment as ${get(v, 'role')} at ${get(v, 'companyName')}, based at ${get(v, 'workLocation')}, commencing on ${get(v, 'startDate')}.`,
        `Your remuneration will be ${get(v, 'salary')}. ${v.probation?.trim() ? `Your appointment is subject to a probation period of ${v.probation.trim()}, during which performance will be reviewed.` : ''}`,
        `Either party may terminate this employment by giving ${get(v, 'notice', 'the agreed period of')} written notice, or payment in lieu of notice. You will be expected to observe the company's rules, maintain confidentiality of business information, and devote your working time to your duties.`,
        'Kindly confirm your acceptance of this offer by signing and returning the duplicate copy of this letter.',
        'We look forward to welcoming you to the team.',
      ],
      signatures: [
        { label: `For ${get(v, 'companyName')}`, sublabels: [get(v, 'signerName'), get(v, 'signerTitle'), 'Signature & Date'] },
        { label: 'ACCEPTANCE by Employee', sublabels: [get(v, 'employeeName'), 'Signature & Date'] },
      ],
      footNote: 'For employers documenting real employment. Adjust terms to your actual agreement.',
    }),
  },
  {
    id: 'employment-confirmation',
    label: 'Employment Confirmation Letter',
    description: 'Confirms current employment — often requested by banks and embassies.',
    fields: [
      ...EMPLOYER_COMMON_FIELDS,
      { key: 'startDate', label: 'Employment start date', type: 'date', required: true },
      { key: 'salary', label: 'Salary to confirm (optional)', type: 'text', placeholder: 'Leave blank to omit' },
      { key: 'addressee', label: 'Addressed to', type: 'text', placeholder: 'e.g. The Branch Manager, GTBank — or leave blank for "To Whom It May Concern"' },
    ],
    build: (v) => ({
      headingLines: [get(v, 'companyName').toUpperCase(), get(v, 'companyAddress'), '', today()],
      title: 'CONFIRMATION OF EMPLOYMENT',
      paragraphs: [
        `${get(v, 'addressee', 'TO WHOM IT MAY CONCERN')},`,
        `This is to confirm that ${get(v, 'employeeName')} is a staff of ${get(v, 'companyName')}, employed as ${get(v, 'role')} since ${get(v, 'startDate')}, and remains in our employment as at the date of this letter.`,
        v.salary?.trim() ? `Their current remuneration is ${v.salary.trim()}.` : '',
        'This letter is issued at the employee’s request for official purposes, and does not constitute a guarantee or undertaking by the company. Kindly contact the undersigned for any verification.',
      ].filter(Boolean),
      signatures: [
        { label: `For ${get(v, 'companyName')}`, sublabels: [get(v, 'signerName'), get(v, 'signerTitle'), 'Signature & Date'] },
      ],
      footNote:
        'To be issued and signed by the employer only — banks verify these letters directly with the business.',
    }),
  },
];

// ── Generic PDF renderer ──────────────────────────────────────────────────────

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 64;

export async function renderLegalPdf(doc: RenderableDoc): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('@cantoo/pdf-lib');
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const ink = rgb(0.08, 0.08, 0.1);
  const muted = rgb(0.45, 0.5, 0.59);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  const sanitize = (s: string) => s.replace(/₦/g, 'NGN ').replace(/[^\x00-\xFF]/g, '');

  const ensure = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const wrap = (text: string, font: typeof regular, size: number, width: number): string[] => {
    const lines: string[] = [];
    let current = '';
    for (const word of sanitize(text).split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > width && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const drawCentered = (text: string, font: typeof regular, size: number) => {
    const content = sanitize(text);
    const w = font.widthOfTextAtSize(content, size);
    page.drawText(content, { x: (PAGE_W - w) / 2, y, size, font, color: ink });
    y -= size + 6;
  };

  for (const line of doc.headingLines ?? []) {
    if (line === '') {
      y -= 8;
      continue;
    }
    drawCentered(line, bold, 11);
  }
  y -= 8;
  drawCentered(doc.title, bold, 13);
  page.drawLine({
    start: { x: PAGE_W / 2 - 110, y: y + 8 },
    end: { x: PAGE_W / 2 + 110, y: y + 8 },
    thickness: 0.8,
    color: ink,
  });
  y -= 14;

  for (const paragraph of doc.paragraphs) {
    const isClause = /^\d+\.\s/.test(paragraph);
    const isHeading = /^[A-Z][A-Z\s]+:$/.test(paragraph) || /^THE (TENANT|LANDLORD)/.test(paragraph);
    const indent = isClause ? 18 : 0;
    const font = isHeading ? bold : regular;
    const lines = wrap(paragraph, font, 11, PAGE_W - MARGIN * 2 - indent);
    ensure(lines.length * 16 + 10);
    for (const line of lines) {
      page.drawText(line, { x: MARGIN + indent, y, size: 11, font, color: ink });
      y -= 16;
    }
    y -= 6;
  }

  y -= 14;
  for (const block of doc.signatures) {
    ensure(70);
    page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + 200, y }, thickness: 0.8, color: ink });
    y -= 14;
    page.drawText(sanitize(block.label), { x: MARGIN, y, size: 10, font: bold, color: ink });
    y -= 13;
    for (const sub of block.sublabels ?? []) {
      page.drawText(sanitize(sub), { x: MARGIN, y, size: 9, font: regular, color: muted });
      y -= 12;
    }
    y -= 14;
  }

  if (doc.footNote) {
    ensure(40);
    for (const line of wrap(doc.footNote, regular, 8, PAGE_W - MARGIN * 2)) {
      page.drawText(line, { x: MARGIN, y, size: 8, font: regular, color: muted });
      y -= 11;
    }
  }

  return pdf.save({ useObjectStreams: true });
}
