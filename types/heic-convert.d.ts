declare module 'heic-convert' {
  type HeicOutputFormat = 'JPEG' | 'PNG';

  type ConvertOptions = {
    buffer: Buffer;
    format: HeicOutputFormat;
    quality?: number;
  };

  export default function convert(options: ConvertOptions): Promise<Uint8Array>;
}
