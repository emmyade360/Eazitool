/** Extract chosen pages from a PDF, client-side. */

/**
 * Parse a range expression like "1-3, 5, 8-10" into zero-based page indices,
 * clamped to the document and deduplicated in the order given.
 */
export function parsePageRanges(expression: string, pageCount: number): number[] {
  const indices: number[] = [];
  const seen = new Set<number>();

  for (const part of expression.split(',')) {
    const piece = part.trim();
    if (!piece) continue;

    const range = piece.match(/^(\d+)\s*-\s*(\d+)$/);
    const single = piece.match(/^(\d+)$/);

    let from: number;
    let to: number;
    if (range) {
      from = Number.parseInt(range[1], 10);
      to = Number.parseInt(range[2], 10);
    } else if (single) {
      from = to = Number.parseInt(single[1], 10);
    } else {
      throw new Error(`"${piece}" is not a page number or range like 2-5.`);
    }

    if (from > to) [from, to] = [to, from];
    for (let page = from; page <= to; page++) {
      if (page < 1 || page > pageCount) {
        throw new Error(`Page ${page} does not exist — this document has ${pageCount} pages.`);
      }
      if (!seen.has(page - 1)) {
        seen.add(page - 1);
        indices.push(page - 1);
      }
    }
  }

  if (indices.length === 0) throw new Error('Enter at least one page number.');
  return indices;
}

export async function extractPages(bytes: Uint8Array, indices: number[]): Promise<Uint8Array> {
  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, indices);
  for (const page of pages) output.addPage(page);
  return output.save({ useObjectStreams: true });
}
