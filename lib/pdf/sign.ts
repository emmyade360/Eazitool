/** Stamp signature images onto PDF pages, client-side. */

export interface Placement {
  /** 0-based page index. */
  pageIndex: number;
  /** Position/size as fractions of the page, origin top-left. */
  xPct: number;
  yPct: number;
  widthPct: number;
}

export async function signPdf(
  pdfBytes: Uint8Array,
  signaturePng: Uint8Array,
  placements: Placement[],
): Promise<Uint8Array> {
  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const image = await doc.embedPng(signaturePng);
  const pages = doc.getPages();

  for (const placement of placements) {
    const page = pages[placement.pageIndex];
    if (!page) continue;
    const { width: pw, height: ph } = page.getSize();
    const width = pw * placement.widthPct;
    const height = width * (image.height / image.width);
    page.drawImage(image, {
      x: pw * placement.xPct,
      // Placement is top-left based; pdf-lib's origin is bottom-left.
      y: ph - ph * placement.yPct - height,
      width,
      height,
    });
  }

  return doc.save({ useObjectStreams: true });
}
