/** Merge PDFs client-side. Everything stays in the browser. */
export async function mergePdfs(inputs: Uint8Array[]): Promise<Uint8Array> {
  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const output = await PDFDocument.create();

  for (const bytes of inputs) {
    const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await output.copyPages(source, source.getPageIndices());
    for (const page of pages) output.addPage(page);
  }

  return output.save({ useObjectStreams: true });
}

export async function getPdfPageCount(bytes: Uint8Array): Promise<number> {
  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}
