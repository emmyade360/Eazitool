/**
 * Document scanning without OpenCV: perspective correction from four
 * user-adjustable corners (homography solved directly), then enhancement —
 * including Sauvola local thresholding for the classic "scanned" look, which
 * handles shadowed phone photos far better than a global threshold.
 */

export interface Point {
  x: number;
  y: number;
}

export type EnhanceMode = 'color' | 'grayscale' | 'scan';

/** Order corners TL, TR, BR, BL by angle around the centroid. */
export function orderCorners(points: Point[]): Point[] {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  const sorted = [...points].sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
  );
  // Rotate so the first point is the top-left (smallest x+y).
  let tlIndex = 0;
  let best = Infinity;
  sorted.forEach((p, i) => {
    if (p.x + p.y < best) {
      best = p.x + p.y;
      tlIndex = i;
    }
  });
  return [0, 1, 2, 3].map((i) => sorted[(tlIndex + i) % 4]);
}

/** Output size implied by the quad, snapped to A4 portrait when close. */
export function outputSize(corners: Point[]): { width: number; height: number } {
  const [tl, tr, br, bl] = corners;
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  let width = Math.round(Math.max(dist(tl, tr), dist(bl, br)));
  let height = Math.round(Math.max(dist(tl, bl), dist(tr, br)));
  width = Math.max(200, Math.min(width, 2500));
  height = Math.max(200, Math.min(height, 3500));

  const a4 = 297 / 210;
  const ratio = height / width;
  if (Math.abs(ratio - a4) / a4 < 0.08) height = Math.round(width * a4);
  return { width, height };
}

/**
 * Solve the homography mapping destination rectangle corners to the source
 * quad, via Gaussian elimination on the standard 8×8 system.
 */
export function solveHomography(src: Point[], dstW: number, dstH: number): number[] {
  const dst = [
    { x: 0, y: 0 },
    { x: dstW, y: 0 },
    { x: dstW, y: dstH },
    { x: 0, y: dstH },
  ];

  // We want H such that H * dst_i ~ src_i (inverse mapping for the warp).
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x: X, y: Y } = dst[i];
    const { x, y } = src[i];
    A.push([X, Y, 1, 0, 0, 0, -X * x, -Y * x]);
    b.push(x);
    A.push([0, 0, 0, X, Y, 1, -X * y, -Y * y]);
    b.push(y);
  }

  // Gaussian elimination with partial pivoting.
  const n = 8;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[pivot][col])) pivot = row;
    }
    [A[col], A[pivot]] = [A[pivot], A[col]];
    [b[col], b[pivot]] = [b[pivot], b[col]];
    const div = A[col][col];
    if (Math.abs(div) < 1e-10) throw new Error('Degenerate corner arrangement.');
    for (let k = col; k < n; k++) A[col][k] /= div;
    b[col] /= div;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = A[row][col];
      for (let k = col; k < n; k++) A[row][k] -= factor * A[col][k];
      b[row] -= factor * b[col];
    }
  }

  return [...b, 1]; // h11..h32, h33=1
}

/** Inverse-map warp with bilinear sampling. */
export function warpPerspective(
  src: ImageData,
  corners: Point[],
  dstW: number,
  dstH: number,
): ImageData {
  const h = solveHomography(corners, dstW, dstH);
  const out = new ImageData(dstW, dstH);
  const sData = src.data;
  const dData = out.data;
  const sw = src.width;
  const sh = src.height;

  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const denom = h[6] * x + h[7] * y + h[8];
      const sx = (h[0] * x + h[1] * y + h[2]) / denom;
      const sy = (h[3] * x + h[4] * y + h[5]) / denom;

      const di = (y * dstW + x) * 4;
      if (sx < 0 || sy < 0 || sx >= sw - 1 || sy >= sh - 1) {
        dData[di] = dData[di + 1] = dData[di + 2] = 255;
        dData[di + 3] = 255;
        continue;
      }

      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      const i00 = (y0 * sw + x0) * 4;
      const i10 = i00 + 4;
      const i01 = i00 + sw * 4;
      const i11 = i01 + 4;

      for (let c = 0; c < 3; c++) {
        const top = sData[i00 + c] * (1 - fx) + sData[i10 + c] * fx;
        const bottom = sData[i01 + c] * (1 - fx) + sData[i11 + c] * fx;
        dData[di + c] = top * (1 - fy) + bottom * fy;
      }
      dData[di + 3] = 255;
    }
  }

  return out;
}

function toGrayscale(image: ImageData): Float32Array {
  const gray = new Float32Array(image.width * image.height);
  const data = image.data;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return gray;
}

/**
 * Sauvola local threshold over integral images (O(n)):
 * T = m · (1 + k · (s/R − 1)) with k=0.2, R=128.
 * ~15% of the grayscale is blended back so glyph edges stay smooth.
 */
export function enhance(image: ImageData, mode: EnhanceMode): ImageData {
  if (mode === 'color') return image;

  const { width, height } = image;
  const gray = toGrayscale(image);
  const out = new ImageData(width, height);

  if (mode === 'grayscale') {
    for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
      const v = gray[p];
      out.data[i] = out.data[i + 1] = out.data[i + 2] = v;
      out.data[i + 3] = 255;
    }
    return out;
  }

  // Integral images of values and squares.
  const integral = new Float64Array((width + 1) * (height + 1));
  const integralSq = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    let rowSumSq = 0;
    for (let x = 0; x < width; x++) {
      const v = gray[y * width + x];
      rowSum += v;
      rowSumSq += v * v;
      const idx = (y + 1) * (width + 1) + (x + 1);
      integral[idx] = integral[idx - (width + 1)] + rowSum;
      integralSq[idx] = integralSq[idx - (width + 1)] + rowSumSq;
    }
  }

  const window = Math.max(15, Math.floor(width / 16) | 1);
  const half = window >> 1;
  const k = 0.2;
  const R = 128;

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - half);
    const y1 = Math.min(height - 1, y + half);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - half);
      const x1 = Math.min(width - 1, x + half);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);

      const a = (y1 + 1) * (width + 1) + (x1 + 1);
      const b = y0 * (width + 1) + (x1 + 1);
      const c = (y1 + 1) * (width + 1) + x0;
      const d = y0 * (width + 1) + x0;

      const sum = integral[a] - integral[b] - integral[c] + integral[d];
      const sumSq = integralSq[a] - integralSq[b] - integralSq[c] + integralSq[d];
      const mean = sum / area;
      const variance = Math.max(0, sumSq / area - mean * mean);
      const stddev = Math.sqrt(variance);
      const threshold = mean * (1 + k * (stddev / R - 1));

      const p = y * width + x;
      const v = gray[p];
      const binary = v > threshold ? 255 : 0;
      const value = 0.85 * binary + 0.15 * v;

      const i = p * 4;
      out.data[i] = out.data[i + 1] = out.data[i + 2] = value;
      out.data[i + 3] = 255;
    }
  }

  return out;
}

/** Full pipeline: warp the quad flat, then enhance. */
export function scanPage(
  source: ImageData,
  corners: Point[],
  mode: EnhanceMode,
): ImageData {
  const ordered = orderCorners(corners);
  const { width, height } = outputSize(ordered);
  const flat = warpPerspective(source, ordered, width, height);
  return enhance(flat, mode);
}

export async function imagesToPdf(pages: Blob[]): Promise<Uint8Array> {
  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const pdf = await PDFDocument.create();
  for (const blob of pages) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const image = blob.type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    // Size the PDF page for 150 DPI printing.
    const wPt = (image.width / 150) * 72;
    const hPt = (image.height / 150) * 72;
    const page = pdf.addPage([wPt, hPt]);
    page.drawImage(image, { x: 0, y: 0, width: wPt, height: hPt });
  }
  return pdf.save({ useObjectStreams: true });
}
