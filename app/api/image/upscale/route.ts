import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import {
  BODY_LIMITS,
  RATE_LIMITS,
  checkRateLimit,
  exceedsBodyLimit,
  payloadTooLarge,
  tooManyRequests,
} from '@/lib/rate-limit';

const MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg:  'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

const EXT: Record<string, string> = {
  jpeg: 'jpg',
  jpg:  'jpg',
  png:  'png',
  webp: 'webp',
  avif: 'avif',
};

const VALID_INPUT_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif',
  'image/tiff', 'image/heif', 'image/heic',
]);

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/"/g, '\\"')
    .replace(/\n/g, '')
    .replace(/\r/g, '');
}

export async function POST(req: NextRequest) {

  if (exceedsBodyLimit(req, BODY_LIMITS.media)) {
    return payloadTooLarge('Upload is too large.');
  }

  const rateLimit = checkRateLimit(req, RATE_LIMITS.media);
  if (!rateLimit.ok) {
    return tooManyRequests(rateLimit.retryAfterSec, 'Too many images processed. Try again shortly.');
  }
  try {
    const form    = await req.formData();
    const file    = form.get('file')    as File | null;
    const scale   = parseInt((form.get('scale')   as string | null) ?? '2', 10);
    const format  = (form.get('format') as string | null)?.toLowerCase() ?? 'png';
    const quality = parseInt((form.get('quality') as string | null) ?? '90', 10);

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!VALID_INPUT_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, AVIF, TIFF, or HEIF images are accepted.' },
        { status: 415 }
      );
    }
    if (![2, 3, 4].includes(scale)) {
      return NextResponse.json({ error: 'Scale must be 2, 3, or 4.' }, { status: 400 });
    }
    if (!MIME[format]) {
      return NextResponse.json({ error: `Unsupported output format: ${format}` }, { status: 400 });
    }

    const buffer   = Buffer.from(await file.arrayBuffer());
    const meta     = await sharp(buffer).metadata();
    const origW    = meta.width  ?? 0;
    const origH    = meta.height ?? 0;

    if (origW === 0 || origH === 0) {
      return NextResponse.json({ error: 'Could not read image dimensions.' }, { status: 422 });
    }

    // Guard against absurdly large outputs (>16000px on either axis)
    const newW = origW * scale;
    const newH = origH * scale;
    if (newW > 16000 || newH > 16000) {
      return NextResponse.json(
        { error: `Upscaled dimensions (${newW}×${newH}) exceed the 16 000 px limit. Use a smaller scale factor.` },
        { status: 422 }
      );
    }

    // Lanczos3 is the gold-standard resampling kernel for upscaling:
    // it preserves fine detail and sharpness better than bilinear or bicubic.
    let pipeline = sharp(buffer).resize(newW, newH, {
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    });

    if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 7 });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({ quality, lossless: quality === 100 });
    } else if (format === 'avif') {
      pipeline = pipeline.avif({ quality });
    }

    const outBuffer = await pipeline.toBuffer();
    const baseName  = file.name.replace(/\.[^.]+$/, '');
    const filename  = `${baseName}_${scale}x.${EXT[format]}`;
    const safeName = sanitizeFilename(filename);

    return new NextResponse(new Uint8Array(outBuffer), {
      headers: {
        'Content-Type': MIME[format],
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'X-Original-Width':  String(origW),
        'X-Original-Height': String(origH),
        'X-Output-Width':    String(newW),
        'X-Output-Height':   String(newH),
      },
    });
  } catch (err) {
    console.error('Upscale error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upscale failed' },
      { status: 500 }
    );
  }
}
