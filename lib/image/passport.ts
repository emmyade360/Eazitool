/** Passport-photo presets and exact-pixel cropping via canvas. */

export interface PassportPreset {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  dpi: number;
  note: string;
}

export const PASSPORT_PRESETS: PassportPreset[] = [
  { id: 'icao-35x45', label: 'Standard 35×45mm', widthMm: 35, heightMm: 45, dpi: 300, note: 'ICAO standard — Nigerian & most international passports and visas.' },
  { id: 'us-2x2', label: 'US 2×2 inch', widthMm: 50.8, heightMm: 50.8, dpi: 300, note: 'US visa and passport, and other square-format applications.' },
  { id: 'square-portal', label: 'Portal square (600×600)', widthMm: 50.8, heightMm: 50.8, dpi: 300, note: 'Square white-background photo in the shape JAMB, NYSC and most portals accept.' },
  { id: 'schengen', label: 'Schengen 35×45mm', widthMm: 35, heightMm: 45, dpi: 600, note: 'Schengen visa at higher print resolution.' },
];

export function presetPixels(preset: PassportPreset): { width: number; height: number } {
  return {
    width: Math.round((preset.widthMm / 25.4) * preset.dpi),
    height: Math.round((preset.heightMm / 25.4) * preset.dpi),
  };
}

export interface CropState {
  /** Zoom ≥ cover-scale; offsets are the top-left of the visible crop in source pixels. */
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** The minimum scale at which the source fully covers the target frame. */
export function coverScale(srcW: number, srcH: number, frameAspect: number): number {
  const srcAspect = srcW / srcH;
  return srcAspect > frameAspect ? 1 : frameAspect / srcAspect;
}

export async function renderPassportPhoto(
  source: ImageBitmap,
  preset: PassportPreset,
  crop: { sx: number; sy: number; sw: number; sh: number },
): Promise<Blob> {
  const { width, height } = presetPixels(preset);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed.'))), 'image/jpeg', 0.92),
  );
}
