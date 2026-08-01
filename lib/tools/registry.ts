import type { Metadata } from 'next';
import { buildMetadata } from '@/app/seo';
import type {
  CategoryDef,
  ListingEntry,
  ToolDef,
  ToolVariant,
} from './types';

const ICON_AI =
  'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.309 48.309 0 01-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5';
const ICON_DOCUMENT =
  'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z';
const ICON_IMAGE =
  'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z';
const ICON_RESIZE =
  'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4';
const ICON_SHIELD =
  'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z';
const ICON_HOME =
  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6';
const ICON_WARNING = 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z';

const ICON_CALCULATOR =
  'M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm1.504-6.75h.008v.008h-.008V8.25zm-9 0h.008v.008H8.25V8.25zM6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z';

export const CATEGORIES: CategoryDef[] = [
  { id: 'job-safety', label: 'Job Safety', iconPath: ICON_SHIELD, color: 'rose', order: 1 },
  { id: 'cv', label: 'CV & Applications', iconPath: ICON_AI, color: 'blue', order: 2 },
  { id: 'documents', label: 'Documents & PDF', iconPath: ICON_DOCUMENT, color: 'violet', order: 3 },
  { id: 'images', label: 'Images & Photos', iconPath: ICON_IMAGE, color: 'emerald', order: 4 },
  { id: 'career', label: 'Career & Student Tools', iconPath: ICON_CALCULATOR, color: 'blue', order: 5 },
  { id: 'business', label: 'Business Documents', iconPath: ICON_DOCUMENT, color: 'amber', order: 6 },
  { id: 'packs', label: 'Guided Packs', iconPath: ICON_AI, color: 'blue', order: 7 },
];

export const TOOLS: ToolDef[] = [
  {
    id: 'cv-builder',
    href: '/tools/cv-builder',
    category: 'cv',
    title: 'ATS CV Builder',
    shortDescription: 'Build an ATS-compliant CV with AI assistance.',
    runtime: 'server',
    badges: ['AI'],
    iconPath: ICON_DOCUMENT,
    status: 'live',
    mobileNav: { order: 5, label: 'CV', iconPath: ICON_DOCUMENT },
    seo: {
      metaTitle: 'Free ATS Resume Builder Online | AI CV Maker | Eazitool',
      metaDescription:
        'Build ATS-friendly resumes that get past applicant tracking systems. AI-powered CV builder for job applications. 100% free, no signup required.',
      keywords: [
        'ATS resume builder',
        'free CV maker',
        'job application',
        'resume builder online',
        'ATS friendly CV',
        'AI resume builder',
        'create CV for job',
      ],
      overview:
        'Most employers screen applications with an applicant tracking system before a person ever reads them. This builder produces a clean, single-column CV with standard section headings and parseable text, so your experience survives that first automated pass. It is free, needs no signup, and exports to PDF or DOCX.',
      faqs: [
        {
          question: 'What does ATS-friendly actually mean?',
          answer:
            'An applicant tracking system reads your CV as plain text. Multi-column layouts, text inside images, tables and unusual fonts often come out scrambled or blank. An ATS-friendly CV uses a single column, standard headings like Experience and Education, and real selectable text.',
        },
        {
          question: 'Is the CV builder free?',
          answer:
            'Yes. Every tool on Eazitool is free with no signup and no watermark on your export.',
        },
        {
          question: 'Should I export as PDF or DOCX?',
          answer:
            'PDF is the safer default because it preserves layout everywhere. Use DOCX only when a job portal specifically asks for an editable Word document.',
        },
      ],
      relatedToolIds: ['roast-cv', 'document-converter'],
    },
  },
  {
    id: 'roast-cv',
    href: '/roast-cv',
    category: 'cv',
    title: 'Roast My CV',
    shortDescription: 'A blunt ATS review of your CV, with AI-suggested fixes.',
    runtime: 'server',
    badges: ['ROAST'],
    iconPath: ICON_WARNING,
    status: 'live',
    seo: {
      metaTitle: 'Roast My CV | Brutally Honest Free ATS Resume Review | Eazitool',
      metaDescription:
        'Upload your CV and get a blunt, specific ATS review with an score and AI-powered rewrites of your weakest bullet points. Free, no signup.',
      keywords: [
        'CV review',
        'resume roast',
        'free ATS check',
        'resume score',
        'CV feedback',
        'ATS resume checker',
      ],
      overview:
        'Upload a CV and get an ATS score plus a direct list of what is holding it back — missing keywords, vague bullet points, formatting an automated parser will choke on. Weak bullets are rewritten so you can see the difference rather than guess at it.',
      faqs: [
        {
          question: 'How is the score calculated?',
          answer:
            'It combines parseability (can an ATS read the file at all), structure (are standard sections present), and content quality (do bullet points show measurable results rather than list duties).',
        },
        {
          question: 'Do you keep my CV?',
          answer:
            'No. The file is processed to produce your review and is never written to disk or a database.',
        },
      ],
      relatedToolIds: ['cv-builder', 'document-converter'],
    },
  },
  {
    id: 'document-converter',
    href: '/tools/document-converter',
    category: 'documents',
    title: 'Document Converter',
    shortDescription: 'Convert between PDF, DOCX and TXT.',
    runtime: 'server',
    iconPath: ICON_DOCUMENT,
    status: 'live',
    mobileNav: { order: 4, label: 'Docs', iconPath: ICON_DOCUMENT },
    seo: {
      metaTitle: 'Free PDF to DOCX Converter Online | Document Converter | Eazitool',
      metaDescription:
        'Convert PDF to DOCX, DOCX to PDF, PDF to TXT instantly. 100% free, no signup required. Fast document conversion tool for job applications and workflows.',
      keywords: [
        'free PDF to DOCX converter',
        'PDF to Word',
        'DOCX to PDF',
        'convert PDF to editable document',
        'PDF to TXT converter',
        'document conversion online',
      ],
      overview:
        'Convert documents between PDF, Word and plain text. Useful when a job portal insists on one format and you only have the other. Files are converted and streamed straight back — nothing is stored.',
      faqs: [
        {
          question: 'Will my formatting survive the conversion?',
          answer:
            'Simple documents convert cleanly. Complex layouts with columns, text boxes or unusual fonts may shift, because PDF and DOCX describe pages in fundamentally different ways. Always check the result before sending it.',
        },
        {
          question: 'Is there a file size limit?',
          answer: 'Yes, uploads are capped at 10 MB per file.',
        },
      ],
      relatedToolIds: ['cv-builder', 'image-converter'],
    },
  },
  {
    id: 'image-converter',
    href: '/tools/image-converter',
    category: 'images',
    title: 'Image Converter',
    shortDescription: 'Convert between PNG, JPEG, WebP, AVIF, TIFF and HEIF.',
    runtime: 'server',
    iconPath: ICON_IMAGE,
    status: 'live',
    mobileNav: {
      order: 2,
      label: 'Images',
      iconPath: ICON_IMAGE,
      matchPrefixes: ['/tools/image-converter', '/tools/image-upscaler'],
    },
    seo: {
      metaTitle: 'Free Image Format Converter Online | PNG, JPEG, WebP | Eazitool',
      metaDescription:
        'Convert images between PNG, JPEG, WebP, AVIF, TIFF, and HEIF instantly. 100% free, no signup required. Batch convert images online.',
      keywords: [
        'image format converter',
        'PNG to JPEG',
        'JPEG to PNG',
        'WebP converter',
        'convert image to WebP',
        'image conversion online',
        'free image converter',
      ],
      overview:
        'Convert images between the formats sites and application portals actually accept. HEIF photos straight from an iPhone are a common blocker — converting to JPEG fixes most upload rejections.',
      faqs: [
        {
          question: 'Which format should I upload to a job portal?',
          answer:
            'JPEG for photographs and PNG for anything with text or sharp edges. Both are accepted essentially everywhere. WebP and AVIF are smaller but still rejected by some older portals.',
        },
        {
          question: 'Does converting lose quality?',
          answer:
            'Converting to PNG is lossless. Converting to JPEG, WebP or AVIF re-compresses the image, so quality drops slightly — raise the quality setting if it matters.',
        },
      ],
      relatedToolIds: ['image-resizer', 'image-upscaler'],
    },
  },
  {
    id: 'image-resizer',
    href: '/tools/image-resizer',
    category: 'images',
    title: 'Image Resizer',
    shortDescription: 'Resize images to exact dimensions with fit controls.',
    runtime: 'server',
    iconPath: ICON_RESIZE,
    status: 'live',
    mobileNav: { order: 3, label: 'Resize', iconPath: ICON_RESIZE },
    seo: {
      metaTitle: 'Free Image Resizer Online | Resize Images to Exact Dimensions | Eazitool',
      metaDescription:
        'Resize images to exact dimensions with fit controls. Supports PNG, JPEG, WebP, AVIF, TIFF. Preserve aspect ratio or stretch. No quality loss.',
      keywords: [
        'resize image online',
        'image resizer',
        'resize for social media',
        'resize image to exact size',
        'photo resizer online',
        'resize image without losing quality',
      ],
      overview:
        'Resize to an exact pixel size with control over how the image fits the box — preserve the aspect ratio, crop to fill, or pad the edges. Useful for portals that demand a precise photo size.',
      faqs: [
        {
          question: 'What is the difference between Cover and Contain?',
          answer:
            'Cover fills the whole box and crops whatever overflows. Contain fits the entire image inside the box and pads the leftover space. Use Cover for profile photos and Contain when nothing may be cut off.',
        },
        {
          question: 'Can I enlarge a small image here?',
          answer:
            'You can, but resizing up just stretches the existing pixels. Use the Image Upscaler instead — it resamples for a noticeably sharper result.',
        },
      ],
      relatedToolIds: ['image-upscaler', 'image-converter'],
    },
  },
  {
    id: 'image-upscaler',
    href: '/tools/image-upscaler',
    category: 'images',
    title: 'Image Enlarger',
    shortDescription: 'Enlarge images up to 4x with high-quality resampling.',
    runtime: 'server',
    iconPath: ICON_IMAGE,
    status: 'live',
    seo: {
      metaTitle:
        'Free Image Enlarger Online | Enlarge Images with High-Quality Resampling | Eazitool',
      metaDescription:
        'Enlarge images up to 4x with high-quality Lanczos resampling. The result has cleaner edges, but the tool does not invent missing detail. Supports PNG, JPEG, WebP and more. 100% free.',
      keywords: [
        'image enlarger',
        'enlarge image without pixelation',
        'upscale image online',
        'increase image resolution',
        'image enlarger',
        'free image upscaler',
      ],
      overview:
        'Enlarge an image up to 4x using Lanczos resampling, which keeps edges cleaner than a plain stretch. This is high-quality resampling, not generative AI enhancement, so it cannot recreate detail that the original never captured.',
      faqs: [
        {
          question: 'Can upscaling recover detail that is not there?',
          answer:
            'No. Upscaling reconstructs a larger image from the pixels you already have — it cannot invent detail the original never captured. It removes the blocky look, but a very low-resolution source stays soft.',
        },
        {
          question: 'How much can I enlarge an image?',
          answer: 'Up to 4x the original width and height.',
        },
      ],
      relatedToolIds: ['image-resizer', 'image-converter'],
    },
  },

  // ── Live: Nigerian portal & career essentials ──────────────────────────────
  {
    id: 'image-compressor',
    href: '/tools/image-compressor',
    category: 'images',
    title: 'Image Compressor (to exact KB)',
    shortDescription: 'Compress a photo to fit a portal limit like 50KB or 100KB.',
    runtime: 'client',
    badges: ['NEW'],
    iconPath: ICON_IMAGE,
    status: 'live',
    seo: {
      metaTitle: 'Compress Image to 20KB, 50KB or 100KB Online Free | Eazitool',
      metaDescription:
        'Compress a passport photo or picture to an exact size like 20KB, 50KB or 100KB for JAMB, NYSC and job portals. Works offline in your browser — nothing is uploaded.',
      keywords: [
        'compress image to 50kb',
        'compress image to 20kb',
        'reduce image size for jamb',
        'nysc passport photo size',
        'compress passport photograph online',
        'image size reducer kb',
      ],
      overview:
        'Registration portals such as JAMB, NYSC and government recruitment sites reject photos above a strict size limit — often 50KB or less. This tool compresses your image to fit the exact limit you choose, adjusting quality and dimensions automatically. Everything runs in your browser, so the photo never leaves your device and it works even without internet.',
      faqs: [
        {
          question: 'How do I compress a photo to 50KB for JAMB or NYSC?',
          answer:
            'Upload the photo, choose the 50KB target (or type a custom limit), and press Compress. The tool lowers JPEG quality first and only shrinks dimensions if the quality floor is not enough, then gives you a download that fits the limit.',
        },
        {
          question: 'Does compressing reduce my photo quality?',
          answer:
            'Some quality is always traded for a smaller file. The tool searches for the highest quality that still fits your target, which usually looks fine at the sizes portals ask for.',
        },
        {
          question: 'Is my photo uploaded to a server?',
          answer:
            'No. Compression happens entirely in your browser, so it works offline and your photo never leaves your device.',
        },
      ],
      relatedToolIds: ['image-resizer', 'signature-maker', 'passport-photo'],
    },
  },
  {
    id: 'signature-maker',
    href: '/tools/signature-maker',
    category: 'images',
    title: 'Signature Maker',
    shortDescription: 'Draw your signature and export it at the size portals accept.',
    runtime: 'client',
    badges: ['NEW'],
    iconPath: ICON_DOCUMENT,
    status: 'live',
    seo: {
      metaTitle: 'Free Online Signature Maker | Draw & Download for JAMB, NYSC | Eazitool',
      metaDescription:
        'Draw your signature, then download it as a clean JPEG or PNG under 20KB or 50KB for JAMB, NYSC, bank and job application portals. Runs offline in your browser.',
      keywords: [
        'signature maker online',
        'draw signature for jamb',
        'signature for nysc portal',
        'scan signature online free',
        'signature 20kb jpeg',
        'e-signature drawing tool',
      ],
      overview:
        'Many Nigerian portals ask for an image of your signature within a tight size range — commonly 10KB to 50KB. Instead of photographing paper and fighting shadows, draw your signature here with your finger or mouse, trim it automatically, and export a clean image that fits the required size. Nothing is uploaded.',
      faqs: [
        {
          question: 'What signature size do JAMB and NYSC accept?',
          answer:
            'Requirements vary by portal and year, but most ask for a JPEG between about 10KB and 50KB. Check the exact figure on the portal, pick that target here, and the export will fit it.',
        },
        {
          question: 'Can I get a transparent background?',
          answer:
            'Yes — choose PNG for a transparent background, or JPEG for a white background, which is what most registration portals expect.',
        },
      ],
      relatedToolIds: ['image-compressor', 'passport-photo'],
    },
  },
  {
    id: 'salary-calculator',
    href: '/tools/salary-calculator',
    category: 'career',
    title: 'Nigerian Salary Calculator',
    shortDescription: 'Work out take-home pay under the 2026 PAYE tax bands.',
    runtime: 'client',
    badges: ['NEW'],
    iconPath: ICON_CALCULATOR,
    status: 'live',
    seo: {
      metaTitle: 'Nigerian Salary & PAYE Tax Calculator 2026 | Take-Home Pay | Eazitool',
      metaDescription:
        'Calculate your Nigerian take-home salary under the new 2026 PAYE bands from the Nigeria Tax Act 2025, including pension, NHF and rent relief. Free and works offline.',
      keywords: [
        'salary calculator nigeria',
        'paye calculator 2026',
        'nigeria tax act 2025 calculator',
        'take home pay nigeria',
        'net salary calculator naira',
        'paye tax bands nigeria',
      ],
      overview:
        'The Nigeria Tax Act 2025 changed personal income tax from January 2026: the first ₦800,000 a year is now tax-free, the old consolidated relief allowance is gone, and a rent relief of 20% of your annual rent (capped at ₦500,000) applies instead. This calculator applies the new bands with your pension and NHF contributions to show your monthly take-home pay — useful for checking whether a salary offer is realistic before you accept it.',
      faqs: [
        {
          question: 'Which tax rules does this calculator use?',
          answer:
            'The personal income tax bands introduced by the Nigeria Tax Act 2025, effective January 2026: 0% on the first ₦800,000, then 15%, 18%, 21%, 23% and 25% on the bands above it, with rent relief of 20% of annual rent capped at ₦500,000.',
        },
        {
          question: 'Is this an official tax figure?',
          answer:
            'No — it is an estimate for planning and offer-checking. Your employer or a tax professional gives the authoritative figure, since allowance structure and other reliefs can shift the result.',
        },
      ],
      relatedToolIds: ['cgpa-calculator', 'cv-builder'],
    },
  },
  {
    id: 'cgpa-calculator',
    href: '/tools/cgpa-calculator',
    category: 'career',
    title: 'CGPA Calculator',
    shortDescription: 'Calculate GPA and cumulative CGPA on the 5.0 or 4.0 scale.',
    runtime: 'client',
    badges: ['NEW'],
    iconPath: ICON_CALCULATOR,
    status: 'live',
    seo: {
      metaTitle: 'CGPA Calculator 5.0 & 4.0 Scale | Nigerian University Grading | Eazitool',
      metaDescription:
        'Calculate your semester GPA and cumulative CGPA on the Nigerian 5.0 scale or the 4.0 scale, with your class of degree shown instantly. Free, no signup, works offline.',
      keywords: [
        'cgpa calculator',
        'gpa calculator 5.0 scale',
        'nigerian university cgpa',
        'how to calculate cgpa',
        'first class cgpa nigeria',
        'cumulative gpa calculator',
      ],
      overview:
        'Enter your courses, unit loads and grades to get your semester GPA, then combine it with your previous CGPA and units to see your updated cumulative result and class of degree. Uses the standard Nigerian 5-point scale (A=5 to F=0) with a 4-point option, and runs entirely on your device.',
      faqs: [
        {
          question: 'How is CGPA calculated in Nigerian universities?',
          answer:
            'Each grade carries points (A=5, B=4, C=3, D=2, E=1, F=0 on the 5-point scale). Multiply each course’s points by its units, add them up, and divide by the total units. CGPA combines every semester the same way.',
        },
        {
          question: 'What CGPA is First Class?',
          answer:
            'On the 5-point scale: First Class is 4.50 and above, Second Class Upper is 3.50–4.49, Second Class Lower is 2.40–3.49, Third Class is 1.50–2.39. Exact boundaries can vary slightly by institution.',
        },
      ],
      relatedToolIds: ['salary-calculator', 'cv-builder'],
    },
  },

  // ── Planned: job safety (Phase 1) ──────────────────────────────────────────
  {
    id: 'job-offer-checklist',
    href: '/tools/job-offer-checklist',
    category: 'job-safety',
    title: 'Job Offer Safety Checklist',
    shortDescription: 'Score a job offer against common scam warning signs.',
    runtime: 'client',
    iconPath: ICON_SHIELD,
    status: 'live',
    seo: {
      metaTitle: 'Is This Job Offer Legit? Free Job Scam Checklist | Eazitool',
      metaDescription:
        'Answer quick questions about a job offer — fees, interviews, contact channels — and get a risk score with clear advice. Free and works offline.',
      keywords: ['job scam checklist', 'is this job offer legit', 'fake job offer signs nigeria'],
      overview:
        'A guided checklist that scores a job offer against the warning signs used in real recruitment scams — upfront fees, WhatsApp-only contact, no interview — and tells you what to verify before responding.',
      faqs: [
        {
          question: 'What is the biggest sign a job offer is a scam?',
          answer:
            'Any request for money — registration, training, medical or courier fees. Legitimate employers do not charge you to be hired.',
        },
      ],
      relatedToolIds: ['scam-checker', 'verify-employer'],
    },
  },
  {
    id: 'scam-checker',
    href: '/tools/scam-checker',
    category: 'job-safety',
    title: 'Scam Message Checker',
    shortDescription: 'Paste a suspicious message and get an instant risk verdict.',
    runtime: 'hybrid',
    iconPath: ICON_WARNING,
    status: 'live',
    seo: {
      metaTitle: 'Job Scam Message Checker | Paste & Verify Suspicious Offers | Eazitool',
      metaDescription:
        'Paste a suspicious job message to see the scam signals it contains, with your personal information hidden on your device before any analysis. Free.',
      keywords: ['job scam checker', 'check scam message', 'fake recruitment message nigeria'],
      overview:
        'Paste any suspicious job or recruitment message. Your personal details are redacted on your device first, then the message is scored against known scam patterns with a plain-language explanation of what was found.',
      faqs: [
        {
          question: 'Is my message kept private?',
          answer:
            'Personal information like phone numbers, account numbers and names is hidden on your device before any analysis, and messages are never stored.',
        },
      ],
      relatedToolIds: ['job-offer-checklist', 'verify-employer'],
    },
  },
  {
    id: 'verify-employer',
    href: '/tools/verify-employer',
    category: 'job-safety',
    title: 'Employer Website Checker',
    shortDescription: 'Check whether a careers link looks like the official site.',
    runtime: 'client',
    iconPath: ICON_SHIELD,
    status: 'live',
    seo: {
      metaTitle: 'Employer Website Checker | Spot Fake Careers Portals | Eazitool',
      metaDescription:
        'Paste a job link to check for lookalike domains, misleading subdomains and other signs of a fake careers portal, with steps to verify the real site.',
      keywords: ['fake recruitment website check', 'verify company website', 'fake careers portal nigeria'],
      overview:
        'Scammers imitate well-known employers with lookalike web addresses. Paste a link to check for the patterns they use — brand names buried in subdomains, misspelt domains, suspicious endings — plus steps to find the official site yourself.',
      faqs: [
        {
          question: 'Can this tell me a site is definitely fake?',
          answer:
            'No tool can. It flags suspicious patterns and shows you how to verify the official domain independently before entering any details.',
        },
      ],
      relatedToolIds: ['scam-checker', 'job-offer-checklist'],
    },
  },

  // ── Planned: CV & applications ─────────────────────────────────────────────
  {
    id: 'cover-letter-generator',
    href: '/tools/cover-letter-generator',
    category: 'cv',
    title: 'Application Letter Generator',
    shortDescription: 'Create a formal Nigerian-format application letter.',
    runtime: 'client',
    iconPath: ICON_DOCUMENT,
    status: 'live',
    seo: {
      metaTitle: 'Application Letter Generator | Formal Nigerian Format | Eazitool',
      metaDescription:
        'Generate a properly formatted application letter — addresses, salutation, subject line and closing — ready to print or export as PDF. Free.',
      keywords: ['application letter format nigeria', 'cover letter generator', 'application for the post of'],
      overview:
        'Fill in the employer, role and your details to produce a formal application letter in the layout Nigerian employers expect, ready to export as PDF alongside your CV.',
      faqs: [
        {
          question: 'What format do Nigerian application letters use?',
          answer:
            'A formal letter with your address and date at the top right, the employer’s address on the left, a subject line naming the post, and a respectful closing — which is exactly the structure this tool produces.',
        },
      ],
      relatedToolIds: ['cv-builder', 'roast-cv'],
    },
  },

  // ── Planned: documents & PDF (Phase 2/3) ───────────────────────────────────
  {
    id: 'document-scanner',
    href: '/tools/document-scanner',
    category: 'documents',
    title: 'Document Scanner',
    shortDescription: 'Turn a phone photo of a document into a clean scanned PDF.',
    runtime: 'client',
    iconPath: ICON_DOCUMENT,
    status: 'live',
    seo: {
      metaTitle: 'Free Document Scanner Online | Photo to Scanned PDF | Eazitool',
      metaDescription:
        'Photograph a certificate or document and get a straightened, clean, scanned-look PDF — all in your browser with nothing uploaded.',
      keywords: ['scan document with phone', 'photo to pdf scanner', 'scan certificate online'],
      overview:
        'Photograph a certificate or form, straighten it by dragging the corners, and export a clean black-and-white scan as PDF — without a scanner or an app install.',
      faqs: [
        {
          question: 'Do I need to install an app?',
          answer: 'No. The scanner runs in your browser and works offline once loaded.',
        },
      ],
      relatedToolIds: ['pdf-compress', 'pdf-merge'],
    },
  },
  {
    id: 'pdf-merge',
    href: '/tools/pdf-merge',
    category: 'documents',
    title: 'PDF Merger',
    shortDescription: 'Combine several PDFs into one file, in the order you choose.',
    runtime: 'client',
    iconPath: ICON_DOCUMENT,
    status: 'live',
    seo: {
      metaTitle: 'Merge PDF Files Online Free | Combine PDFs | Eazitool',
      metaDescription:
        'Combine CVs, certificates and letters into a single PDF in the order you choose. Runs in your browser — files are never uploaded.',
      keywords: ['merge pdf online free', 'combine pdf files', 'join pdf documents'],
      overview:
        'Job applications often demand one combined PDF. Add your files, drag them into order, and download a single merged document — processed entirely on your device.',
      faqs: [
        {
          question: 'Are my PDFs uploaded to a server?',
          answer: 'No. Merging happens in your browser, so it works offline and files never leave your device.',
        },
      ],
      relatedToolIds: ['pdf-split', 'pdf-compress'],
    },
  },
  {
    id: 'pdf-split',
    href: '/tools/pdf-split',
    category: 'documents',
    title: 'PDF Splitter',
    shortDescription: 'Extract pages or split a PDF into separate files.',
    runtime: 'client',
    iconPath: ICON_DOCUMENT,
    status: 'live',
    seo: {
      metaTitle: 'Split PDF Online Free | Extract Pages from PDF | Eazitool',
      metaDescription:
        'Pull out the pages you need or split a PDF into separate files, entirely in your browser with nothing uploaded.',
      keywords: ['split pdf online', 'extract pages from pdf', 'separate pdf pages'],
      overview:
        'Choose page ranges to extract just the pages a portal asks for, or break a large PDF into parts — all processed on your device.',
      faqs: [
        {
          question: 'Can I extract a single page?',
          answer: 'Yes — select any single page or range and download it as its own PDF.',
        },
      ],
      relatedToolIds: ['pdf-merge', 'pdf-compress'],
    },
  },
  {
    id: 'pdf-compress',
    href: '/tools/pdf-compress',
    category: 'documents',
    title: 'PDF Compressor',
    shortDescription: 'Shrink a PDF to fit portal upload limits.',
    runtime: 'client',
    iconPath: ICON_DOCUMENT,
    status: 'live',
    seo: {
      metaTitle: 'Compress PDF Online Free | Reduce PDF Size for Uploads | Eazitool',
      metaDescription:
        'Reduce a PDF below portal limits like 500KB or 2MB, with a mode that keeps your CV text selectable for ATS systems. Runs in your browser.',
      keywords: ['compress pdf online', 'reduce pdf size', 'pdf under 500kb'],
      overview:
        'Shrink scanned documents aggressively, or use the lossless mode that keeps CV text selectable so applicant tracking systems can still read it. Pick a target size and the tool works toward it on your device.',
      faqs: [
        {
          question: 'Will compressing my CV break ATS parsing?',
          answer:
            'Not in lossless mode, which keeps text selectable. The stronger mode converts pages to images for bigger savings — good for scans, not for CVs — and the tool warns you before doing that.',
        },
      ],
      relatedToolIds: ['pdf-merge', 'document-scanner'],
    },
  },

  // ── Planned: images ────────────────────────────────────────────────────────
  {
    id: 'passport-photo',
    href: '/tools/passport-photo',
    category: 'images',
    title: 'Passport Photo Maker',
    shortDescription: 'Crop photos to NYSC, JAMB, ICAO and visa photo sizes.',
    runtime: 'client',
    iconPath: ICON_IMAGE,
    status: 'live',
    seo: {
      metaTitle: 'Passport Photo Maker Online | NYSC, JAMB & Visa Sizes | Eazitool',
      metaDescription:
        'Crop a photo to exact passport sizes — Nigerian, ICAO 35×45mm, US 2×2in and more — with a face guide and correct print resolution. Free, in your browser.',
      keywords: ['passport photo maker online', 'nysc passport photo', 'jamb passport photograph', '35x45 photo'],
      overview:
        'Crop any photo to the exact passport dimensions a portal or embassy demands, with a face-position guide and output at true print resolution — then compress it to the required file size.',
      faqs: [
        {
          question: 'Which photo sizes are supported?',
          answer:
            'Common presets including the ICAO 35×45mm standard, US 2×2 inches, and the square formats Nigerian portals like JAMB and NYSC accept, plus custom sizes.',
        },
      ],
      relatedToolIds: ['image-compressor', 'image-resizer'],
    },
  },

  // ── Planned: business (Phase 4) ────────────────────────────────────────────
  {
    id: 'invoice-generator',
    href: '/tools/invoice-generator',
    category: 'business',
    title: 'Invoice Generator',
    shortDescription: 'Create professional PDF invoices with your business details.',
    runtime: 'client',
    iconPath: ICON_DOCUMENT,
    status: 'live',
    seo: {
      metaTitle: 'Free Invoice Generator | Professional Naira Invoices | Eazitool',
      metaDescription:
        'Create clean PDF invoices in naira, cedi or any currency — logo, tax line and bank details included. Free, no signup, works offline.',
      keywords: ['invoice generator nigeria', 'free invoice maker', 'naira invoice template'],
      overview:
        'Build general-purpose business invoices with itemised lines, a tax line, your logo and bank details, exported as PDF from your browser — drafts stay on your device. This is not a FIRS-certified e-invoice or tax filing service.',
      faqs: [
        {
          question: 'Can I add Nigerian VAT?',
          answer: 'Yes — set the tax rate you need and totals update automatically. This tool does not validate tax registration or certify an invoice for FIRS filing; check the applicable requirements for your business.',
        },
      ],
      relatedToolIds: ['receipt-generator', 'quotation-generator'],
    },
  },
  {
    id: 'receipt-generator',
    href: '/tools/receipt-generator',
    category: 'business',
    title: 'Receipt Generator',
    shortDescription: 'Issue clean PDF receipts for payments received.',
    runtime: 'client',
    iconPath: ICON_DOCUMENT,
    status: 'live',
    seo: {
      metaTitle: 'Free Receipt Generator | PDF Receipts for Small Business | Eazitool',
      metaDescription:
        'Issue professional PDF receipts for payments received — numbered, itemised and branded with your business name. Free and works offline.',
      keywords: ['receipt generator', 'payment receipt maker', 'small business receipt nigeria'],
      overview:
        'Give customers a proper numbered receipt the moment they pay — itemised, dated and branded, exported as PDF from your phone or laptop.',
      faqs: [
        {
          question: 'Are receipts stored anywhere?',
          answer: 'Only on your device. Nothing is uploaded, and your business profile stays in your browser.',
        },
      ],
      relatedToolIds: ['invoice-generator', 'quotation-generator'],
    },
  },
  {
    id: 'quotation-generator',
    href: '/tools/quotation-generator',
    category: 'business',
    title: 'Quotation Generator',
    shortDescription: 'Send professional PDF quotations to win more work.',
    runtime: 'client',
    iconPath: ICON_DOCUMENT,
    status: 'live',
    seo: {
      metaTitle: 'Free Quotation Generator | Professional PDF Quotes | Eazitool',
      metaDescription:
        'Prepare professional PDF quotations with itemised pricing, validity dates and your branding. Free, no signup, works offline.',
      keywords: ['quotation generator', 'quote maker for business', 'quotation format nigeria'],
      overview:
        'Prepare itemised quotations with validity dates and terms, branded with your business details and exported as PDF — a professional first impression for informal businesses.',
      faqs: [
        {
          question: 'Can I reuse my business details?',
          answer: 'Yes — your business profile is saved on your device so every new quotation starts pre-filled.',
        },
      ],
      relatedToolIds: ['invoice-generator', 'receipt-generator'],
    },
  },

  // ── Planned: guided packs (Phase 5) ────────────────────────────────────────
  {
    id: 'application-pack',
    href: '/tools/application-pack',
    category: 'packs',
    title: 'Application Pack',
    shortDescription: 'CV, photo and certificates combined into one portal-ready PDF.',
    runtime: 'client',
    iconPath: ICON_AI,
    status: 'live',
    seo: {
      metaTitle: 'Job Application Pack Builder | One Portal-Ready PDF | Eazitool',
      metaDescription:
        'A guided flow that combines your CV, passport photo and scanned certificates into a single PDF under the portal size limit. Free, on your device.',
      keywords: ['job application documents pdf', 'combine cv and certificates', 'application pack nigeria'],
      overview:
        'A step-by-step flow: prepare your CV, passport photo and scanned certificates, then merge and compress them into one PDF that fits the portal limit — with everything staying on your device.',
      faqs: [
        {
          question: 'What size will the final PDF be?',
          answer:
            'You choose the target — commonly 2MB or 5MB, matching typical portal limits — and the pack compresses to fit it.',
        },
      ],
      relatedToolIds: ['pdf-merge', 'pdf-compress', 'document-scanner'],
    },
  },
];

export const TOOL_VARIANTS: ToolVariant[] = [
  { id: 'pdf-docx', toolId: 'document-converter', href: '/tools/document-converter?from=pdf&to=docx', title: 'PDF to DOCX', shortDescription: 'Convert PDF to an editable Word document.' },
  { id: 'docx-pdf', toolId: 'document-converter', href: '/tools/document-converter?from=docx&to=pdf', title: 'DOCX to PDF', shortDescription: 'Convert a Word document to PDF.' },
  { id: 'pdf-txt', toolId: 'document-converter', href: '/tools/document-converter?from=pdf&to=txt', title: 'PDF to TXT', shortDescription: 'Extract plain text from a PDF.' },
  { id: 'txt-pdf', toolId: 'document-converter', href: '/tools/document-converter?from=txt&to=pdf', title: 'TXT to PDF', shortDescription: 'Convert a plain text file to PDF.' },
  { id: 'docx-txt', toolId: 'document-converter', href: '/tools/document-converter?from=docx&to=txt', title: 'DOCX to TXT', shortDescription: 'Extract plain text from a Word document.' },
  { id: 'png-jpeg', toolId: 'image-converter', href: '/tools/image-converter?from=png&to=jpeg', title: 'PNG to JPEG', shortDescription: 'Compress PNG to JPEG format.' },
  { id: 'jpeg-png', toolId: 'image-converter', href: '/tools/image-converter?from=jpeg&to=png', title: 'JPEG to PNG', shortDescription: 'Convert JPEG to lossless PNG.' },
  { id: 'png-webp', toolId: 'image-converter', href: '/tools/image-converter?from=png&to=webp', title: 'PNG to WebP', shortDescription: 'Convert PNG to modern WebP.' },
  { id: 'jpeg-webp', toolId: 'image-converter', href: '/tools/image-converter?from=jpeg&to=webp', title: 'JPEG to WebP', shortDescription: 'Convert JPEG to modern WebP.' },
  { id: 'webp-png', toolId: 'image-converter', href: '/tools/image-converter?from=webp&to=png', title: 'WebP to PNG', shortDescription: 'Convert WebP to PNG.' },
  { id: 'webp-jpeg', toolId: 'image-converter', href: '/tools/image-converter?from=webp&to=jpeg', title: 'WebP to JPEG', shortDescription: 'Convert WebP to JPEG.' },
  { id: 'any-webp', toolId: 'image-converter', href: '/tools/image-converter?from=any&to=webp', title: 'Any to WebP', shortDescription: 'Convert any image to WebP.' },
];

const TOOLS_BY_ID = new Map(TOOLS.map((tool) => [tool.id, tool]));

export function getTool(id: string): ToolDef | undefined {
  return TOOLS_BY_ID.get(id);
}

export function requireTool(id: string): ToolDef {
  const tool = TOOLS_BY_ID.get(id);
  if (!tool) throw new Error(`Unknown tool id: ${id}`);
  return tool;
}

export function getToolByPath(path: string): ToolDef | undefined {
  return TOOLS.find((tool) => tool.href === path);
}

export function getLiveTools(): ToolDef[] {
  return TOOLS.filter((tool) => tool.status === 'live');
}

export function getOfflineTools(): ToolDef[] {
  return getLiveTools().filter((tool) => tool.runtime !== 'server');
}

export function getSitemapEntries() {
  return getLiveTools()
    .filter((tool) => tool.sitemap?.include !== false)
    .map((tool) => ({
      path: tool.href,
      priority: tool.sitemap?.priority ?? 0.8,
      changeFrequency: tool.sitemap?.changeFrequency ?? ('monthly' as const),
    }));
}

export function getListing(): { category: CategoryDef; entries: ListingEntry[] }[] {
  return [...CATEGORIES]
    .sort((a, b) => a.order - b.order)
    .map((category) => {
      const inCategory = TOOLS.filter((tool) => tool.category === category.id);
      const entries: ListingEntry[] = [];

      // Live tools (with their variants) first, planned tools after as
      // coming-soon cards, so every category's structure is visible.
      for (const tool of inCategory.filter((t) => t.status === 'live')) {
        entries.push({ kind: 'tool', tool });
        for (const variant of TOOL_VARIANTS) {
          if (variant.toolId === tool.id) entries.push({ kind: 'variant', variant });
        }
      }
      for (const tool of inCategory.filter((t) => t.status === 'planned')) {
        entries.push({ kind: 'tool', tool });
      }

      return { category, entries };
    })
    .filter((group) => group.entries.length > 0);
}

export function getMobileNavItems() {
  const items = getLiveTools()
    .filter((tool) => tool.mobileNav)
    .sort((a, b) => a.mobileNav!.order - b.mobileNav!.order)
    .map((tool) => {
      const prefixes = tool.mobileNav!.matchPrefixes ?? [tool.href];
      return {
        href: tool.href,
        label: tool.mobileNav!.label,
        iconPath: tool.mobileNav!.iconPath,
        isActive: (pathname: string) => prefixes.some((p) => pathname.startsWith(p)),
      };
    });

  return [
    {
      href: '/',
      label: 'Home',
      iconPath: ICON_HOME,
      isActive: (pathname: string) => pathname === '/',
    },
    ...items,
  ];
}

export function getRelatedTools(id: string) {
  const tool = getTool(id);
  if (!tool) return [];

  return tool.seo.relatedToolIds
    .map((relatedId) => getTool(relatedId))
    .filter((related): related is ToolDef => related?.status === 'live')
    .map((related) => ({
      href: related.href,
      title: related.title,
      description: related.shortDescription,
    }));
}

export function toolMetadata(id: string): Metadata {
  const tool = requireTool(id);
  return buildMetadata({
    title: tool.seo.metaTitle,
    description: tool.seo.metaDescription,
    path: tool.href,
    keywords: tool.seo.keywords,
  });
}
