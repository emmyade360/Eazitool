/**
 * Compress an image to fit a byte budget — the "compress to 50KB for the
 * portal" problem. Browser-only: uses canvas encoding, never uploads anything.
 *
 * Strategy: binary-search JPEG/WebP quality first; if the quality floor still
 * misses the target, scale dimensions down and search again.
 */

export interface CompressToSizeOptions {
  targetBytes: number;
  mimeType?: 'image/jpeg' | 'image/webp';
  /** Long-edge cap applied before compression (keeps huge camera photos sane). */
  maxDimension?: number;
}

export interface CompressToSizeResult {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  /** False when even the smallest attempt could not fit the target. */
  hitTarget: boolean;
}

const QUALITY_MIN = 0.3;
const QUALITY_MAX = 0.95;
const QUALITY_ITERATIONS = 7;
const MAX_DOWNSCALE_STEPS = 5;
const MIN_EDGE_PX = 100;

function encodeCanvas(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image encoding failed.'))),
      type,
      quality,
    );
  });
}

function drawToCanvas(source: ImageBitmap, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  // Flatten transparency onto white — JPEG has no alpha, and portals expect
  // white-background photos anyway.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function bestQualityUnderTarget(
  canvas: HTMLCanvasElement,
  type: string,
  targetBytes: number,
): Promise<{ blob: Blob; quality: number } | null> {
  let lo = QUALITY_MIN;
  let hi = QUALITY_MAX;
  let best: { blob: Blob; quality: number } | null = null;

  for (let i = 0; i < QUALITY_ITERATIONS; i++) {
    const quality = (lo + hi) / 2;
    const blob = await encodeCanvas(canvas, type, quality);
    if (blob.size <= targetBytes) {
      best = { blob, quality };
      lo = quality;
    } else {
      hi = quality;
    }
  }

  return best;
}

export async function compressImageToSize(
  file: Blob,
  options: CompressToSizeOptions,
): Promise<CompressToSizeResult> {
  const { targetBytes, mimeType = 'image/jpeg', maxDimension = 4000 } = options;
  if (!Number.isFinite(targetBytes) || targetBytes < 1024) {
    throw new Error('Target size must be at least 1KB.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    const initialScale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    let width = bitmap.width * initialScale;
    let height = bitmap.height * initialScale;

    let smallest: CompressToSizeResult | null = null;

    for (let step = 0; step <= MAX_DOWNSCALE_STEPS; step++) {
      const canvas = drawToCanvas(bitmap, width, height);
      const fit = await bestQualityUnderTarget(canvas, mimeType, targetBytes);

      if (fit) {
        return {
          blob: fit.blob,
          width: canvas.width,
          height: canvas.height,
          quality: fit.quality,
          hitTarget: true,
        };
      }

      const floor = await encodeCanvas(canvas, mimeType, QUALITY_MIN);
      if (!smallest || floor.size < smallest.blob.size) {
        smallest = {
          blob: floor,
          width: canvas.width,
          height: canvas.height,
          quality: QUALITY_MIN,
          hitTarget: false,
        };
      }

      if (Math.max(width, height) <= MIN_EDGE_PX) break;

      // Estimate the shrink needed from the byte overshoot; keep a margin so
      // the next pass lands under rather than hovering just above the target.
      const shrink = Math.sqrt(targetBytes / floor.size) * 0.9;
      width = Math.max(MIN_EDGE_PX, width * Math.min(shrink, 0.85));
      height = Math.max(MIN_EDGE_PX, height * Math.min(shrink, 0.85));
    }

    if (!smallest) throw new Error('Could not encode the image.');
    return smallest;
  } finally {
    bitmap.close();
  }
}
