import mammoth from 'mammoth';

export type ParsedCV = {
  text: string;
  content: string;
  pages: number;
  fileType: 'pdf' | 'docx' | 'doc';
};

/**
 * Extract text from DOCX files using mammoth
 */
export async function parseDocxFile(buffer: Buffer): Promise<ParsedCV> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    return {
      text,
      content: text,
      pages: Math.ceil(text.split('\n').filter(l => l.trim()).length / 45),
      fileType: 'docx',
    };
  } catch (error) {
    throw new Error('Failed to parse DOCX file: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Extract text from PDF files
 */
export async function parsePdfFile(buffer: Buffer): Promise<ParsedCV> {
  try {
    const { default: PDFParser } = await import('pdf2json');

    const parsed = await new Promise<{ text: string; pages: number }>((resolve, reject) => {
      const parser = new PDFParser(null, true);

      const cleanup = () => {
        parser.removeAllListeners();
        parser.destroy();
      };

      parser.on('pdfParser_dataError', (error) => {
        cleanup();
        const parserError = 'parserError' in error ? error.parserError : error;
        reject(parserError);
      });

      parser.on('pdfParser_dataReady', () => {
        const text = parser
          .getRawTextContent()
          .replace(/\r\n----------------Page \(\d+\) Break----------------\r\n/g, '\n\n')
          .replace(/\r\n/g, '\n')
          .trim();

        const data = parser.getRawTextContent();
        const pages = Math.max(1, (data.match(/----------------Page \(\d+\) Break----------------/g) ?? []).length + 1);

        cleanup();
        resolve({ text, pages });
      });

      parser.parseBuffer(buffer);
    });

    return {
      text: parsed.text,
      content: parsed.text,
      pages: parsed.pages,
      fileType: 'pdf',
    };
  } catch (error) {
    throw new Error('Failed to parse PDF file: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Generic CV parser - auto-detects file type
 */
export async function parseCVFile(buffer: Buffer, filename: string): Promise<ParsedCV> {
  const ext = filename.toLowerCase();
  if (ext.endsWith('.pdf')) {
    return parsePdfFile(buffer);
  } else if (ext.endsWith('.docx') || ext.endsWith('.docm')) {
    return parseDocxFile(buffer);
  } else if (ext.endsWith('.doc')) {
    throw new Error('Legacy .doc files not supported. Please save as .docx or .pdf.');
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
}

/**
 * Clean CV text for analysis
 */
export function cleanCVText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

/**
 * Estimate word count
 */
export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Detect sections in CV text
 */
export function detectCVSections(text: string): string[] {
  const sectionKeywords = [
    'summary', 'objective', 'profile',
    'experience', 'work history', 'employment',
    'education', 'qualifications',
    'skills', 'technical skills', 'core competencies',
    'certifications', 'awards',
    'projects', 'publications',
    'languages',
    'references',
    'volunteer',
    'interests'
  ];

  const found = new Set<string>();
  const lines = text.toLowerCase().split('\n');

  for (const line of lines) {
    for (const keyword of sectionKeywords) {
      if (line.includes(keyword)) {
        found.add(keyword);
      }
    }
  }

  return Array.from(found);
}

/**
 * Extract experience bullets from CV text
 */
export function extractExperienceBullets(text: string): string[] {
  const lines = text.split('\n');
  const bullets: string[] = [];
  const bulletPatterns = [
    /^-\s+(.+)/,
    /^•\s+(.+)/,
    /^✦\s+(.+)/,
    /^\*\s+(.+)/,
    /^–\s+(.+)/,
    /^[‒–—-]\s+(.+)/,
  ];

  for (const line of lines) {
    for (const pattern of bulletPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const bullet = match[1].trim();
        if (bullet.length > 20) {
          bullets.push(bullet);
        }
        break;
      }
    }
  }

  return bullets;
}
