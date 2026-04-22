import { NextRequest, NextResponse } from 'next/server';
import sharp, { FitEnum } from 'sharp';

const MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg:  'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  tiff: 'image/tiff',
};

const EXT: Record<string, string> = {
  jpeg: 'jpg',
  jpg:  'jpg',
  png:  'png',
  webp: 'webp',
  avif: 'avif',
  tiff: 'tiff',
};

const VALID_INPUT_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif',
  'image/gif', 'image/tiff', 'image/heif', 'image/heic', 'image/svg+xml',
]);

const VALID_FIT = new Set<string>(['contain', 'cover', 'fill', 'inside', 'outside']);

async function normalizeToExactSize(
  inputBuffer: Buffer,
  targetWidth: number,
  targetHeight: number
) {
  const source = sharp(inputBuffer, { animated: false }).ensureAlpha();
  const meta = await source.metadata();
  const sourceWidth = meta.width ?? targetWidth;
  const sourceHeight = meta.height ?? targetHeight;

  let prepared = source;

  if (sourceWidth > targetWidth || sourceHeight > targetHeight) {
    const extractWidth = Math.min(targetWidth, sourceWidth);
    const extractHeight = Math.min(targetHeight, sourceHeight);
    const left = Math.max(0, Math.floor((sourceWidth - extractWidth) / 2));
    const top = Math.max(0, Math.floor((sourceHeight - extractHeight) / 2));
    prepared = prepared.extract({ left, top, width: extractWidth, height: extractHeight });
  }

  const preparedBuffer = await prepared.png().toBuffer();
  const preparedMeta = await sharp(preparedBuffer).metadata();
  const preparedWidth = preparedMeta.width ?? targetWidth;
  const preparedHeight = preparedMeta.height ?? targetHeight;

  if (preparedWidth === targetWidth && preparedHeight === targetHeight) {
    return preparedBuffer;
  }

  const left = Math.max(0, Math.floor((targetWidth - preparedWidth) / 2));
  const top = Math.max(0, Math.floor((targetHeight - preparedHeight) / 2));

  return sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .composite([{ input: preparedBuffer, left, top }])
    .png()
    .toBuffer();
}

export async function POST(req: NextRequest) {
  try {
    const form    = await req.formData();
    const file    = form.get('file')    as File | null;
    const widthRaw  = form.get('width')  as string | null;
    const heightRaw = form.get('height') as string | null;
    const fit     = (form.get('fit')    as string | null) ?? 'contain';
    const format  = (form.get('format') as string | null)?.toLowerCase() ?? 'png';
    const quality = parseInt((form.get('quality') as string | null) ?? '90', 10);

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!VALID_INPUT_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported image type. Please upload a JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, or SVG.' },
        { status: 415 }
      );
    }

    const width  = widthRaw  ? parseInt(widthRaw,  10) : undefined;
    const height = heightRaw ? parseInt(heightRaw, 10) : undefined;

    if (width  !== undefined && (isNaN(width)  || width  < 1)) {
      return NextResponse.json({ error: 'Width must be a positive integer.' }, { status: 400 });
    }
    if (height !== undefined && (isNaN(height) || height < 1)) {
      return NextResponse.json({ error: 'Height must be a positive integer.' }, { status: 400 });
    }
    if (width === undefined && height === undefined) {
      return NextResponse.json({ error: 'Provide at least one of width or height.' }, { status: 400 });
    }
    if ((width ?? 0) > 16000 || (height ?? 0) > 16000) {
      return NextResponse.json({ error: 'Dimensions cannot exceed 16 000 px.' }, { status: 422 });
    }
    if (!VALID_FIT.has(fit)) {
      return NextResponse.json({ error: `Invalid fit mode: ${fit}` }, { status: 400 });
    }
    if (!MIME[format]) {
      return NextResponse.json({ error: `Unsupported output format: ${format}` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Lanczos3 for both up- and down-scaling; it minimises aliasing and
    // preserves edge sharpness better than bilinear or bicubic.
    let pipeline = sharp(buffer, { density: 150 }).resize(width, height, {
      kernel: sharp.kernel.lanczos3,
      fit:    fit as keyof FitEnum,
      withoutEnlargement: false,
      background: { r: 255, g: 255, b: 255, alpha: 0 }, // transparent padding for 'contain'
    });

    let workingBuffer = await pipeline.toBuffer();

    if (width !== undefined && height !== undefined) {
      const workingMeta = await sharp(workingBuffer).metadata();
      if (workingMeta.width !== width || workingMeta.height !== height) {
        workingBuffer = await normalizeToExactSize(workingBuffer, width, height);
      }
    }

    pipeline = sharp(workingBuffer, { animated: false });

    if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true }).flatten({ background: '#ffffff' });
    } else if (format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 7 });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({ quality, lossless: quality === 100 });
    } else if (format === 'avif') {
      pipeline = pipeline.avif({ quality });
    } else if (format === 'tiff') {
      pipeline = pipeline.tiff({ quality, compression: 'lzw' });
    }

    const outBuffer = await pipeline.toBuffer();
    const outMeta   = await sharp(outBuffer).metadata();
    const baseName  = file.name.replace(/\.[^.]+$/, '');
    const suffix    = [width, height].filter(Boolean).join('x');
    const filename  = `${baseName}_${suffix}.${EXT[format]}`;

    return new NextResponse(new Uint8Array(outBuffer), {
      headers: {
        'Content-Type': MIME[format],
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Output-Width':  String(outMeta.width  ?? ''),
        'X-Output-Height': String(outMeta.height ?? ''),
      },
    });
  } catch (err) {
    console.error('Resize error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Resize failed' },
      { status: 500 }
    );
  }
}
