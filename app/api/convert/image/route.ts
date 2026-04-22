import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg:  'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif:  'image/gif',
  tiff: 'image/tiff',
  tif:  'image/tiff',
  heif: 'image/heif',
};

const EXT: Record<string, string> = {
  jpeg: 'jpg',
  jpg:  'jpg',
  png:  'png',
  webp: 'webp',
  avif: 'avif',
  gif:  'gif',
  tiff: 'tiff',
  tif:  'tiff',
  heif: 'heif',
};

export async function POST(req: NextRequest) {
  try {
    const form    = await req.formData();
    const file    = form.get('file')    as File | null;
    const to      = (form.get('to')     as string | null)?.toLowerCase();
    const quality = parseInt((form.get('quality') as string | null) ?? '85', 10);

    if (!file || !to) {
      return NextResponse.json({ error: 'Missing file or target format' }, { status: 400 });
    }

    const VALID_IMAGE_TYPES = new Set([
      'image/jpeg', 'image/png', 'image/webp', 'image/avif',
      'image/gif',  'image/tiff', 'image/heif', 'image/heic',
      'image/svg+xml',
    ]);
    if (!VALID_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only image files are accepted (JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG).' }, { status: 415 });
    }

    if (!MIME[to]) {
      return NextResponse.json({ error: `Unsupported output format: ${to}` }, { status: 400 });
    }

    const buffer   = Buffer.from(await file.arrayBuffer());
    let pipeline   = sharp(buffer, { density: 150 }); // density matters for SVG rasterisation

    if (to === 'jpeg' || to === 'jpg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (to === 'png') {
      pipeline = pipeline.png({ compressionLevel: 8 });
    } else if (to === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (to === 'avif') {
      pipeline = pipeline.avif({ quality });
    } else if (to === 'gif') {
      pipeline = pipeline.gif();
    } else if (to === 'tiff' || to === 'tif') {
      pipeline = pipeline.tiff({ quality, compression: 'lzw' });
    } else if (to === 'heif') {
      pipeline = pipeline.heif({ quality, compression: 'av1' });
    }

    const outBuffer = await pipeline.toBuffer();
    const baseName  = file.name.replace(/\.[^.]+$/, '');
    const filename  = `${baseName}.${EXT[to]}`;

    return new NextResponse(new Uint8Array(outBuffer), {
      headers: {
        'Content-Type': MIME[to],
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Conversion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
