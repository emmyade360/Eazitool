/** Square WhatsApp-ready flyer rendering on canvas. */

export type FlyerLayout = 'promo' | 'price-list' | 'service';

export interface PriceRow {
  item: string;
  price: string;
}

export interface FlyerData {
  layout: FlyerLayout;
  businessName: string;
  headline: string;
  subhead: string;
  items: PriceRow[];
  footer: string;
  primary: string;
  accent: string;
  logoImage?: CanvasImageSource | null;
}

export const FLYER_SIZE = 1080;

export const LAYOUTS: { id: FlyerLayout; label: string; description: string }[] = [
  { id: 'promo', label: 'Promo', description: 'Big offer announcement' },
  { id: 'price-list', label: 'Price List', description: 'Items with prices' },
  { id: 'service', label: 'Service Ad', description: 'What you offer' },
];

export const PALETTES: { name: string; primary: string; accent: string }[] = [
  { name: 'Deep Green', primary: '#065f46', accent: '#fbbf24' },
  { name: 'Royal Blue', primary: '#1e3a8a', accent: '#38bdf8' },
  { name: 'Burgundy', primary: '#7f1d1d', accent: '#fca5a5' },
  { name: 'Charcoal', primary: '#111827', accent: '#f59e0b' },
  { name: 'Purple', primary: '#4c1d95', accent: '#c4b5fd' },
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawFlyer(canvas: HTMLCanvasElement, data: FlyerData): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const S = FLYER_SIZE;
  canvas.width = S;
  canvas.height = S;

  // Background with a subtle diagonal accent wedge.
  ctx.fillStyle = data.primary;
  ctx.fillRect(0, 0, S, S);
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = data.accent;
  ctx.beginPath();
  ctx.moveTo(S, 0);
  ctx.lineTo(S, S * 0.55);
  ctx.lineTo(S * 0.35, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const pad = 80;
  ctx.textBaseline = 'top';

  // Business name + logo
  let headerY = pad;
  if (data.logoImage) {
    const logoSize = 110;
    ctx.save();
    roundRect(ctx, pad, headerY, logoSize, logoSize, 20);
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pad, headerY, logoSize, logoSize);
    ctx.drawImage(data.logoImage, pad, headerY, logoSize, logoSize);
    ctx.restore();
    headerY += logoSize + 24;
  }

  ctx.fillStyle = data.accent;
  ctx.font = 'bold 34px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText((data.businessName || 'YOUR BUSINESS').toUpperCase().slice(0, 40), pad, headerY);
  headerY += 60;

  if (data.layout === 'price-list') {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 76px system-ui, -apple-system, Segoe UI, sans-serif';
    const titleLines = wrapText(ctx, data.headline || 'PRICE LIST', S - pad * 2).slice(0, 2);
    for (const line of titleLines) {
      ctx.fillText(line, pad, headerY);
      headerY += 84;
    }
    headerY += 16;

    const rows = data.items.filter((r) => r.item.trim()).slice(0, 8);
    const rowHeight = Math.min(88, (S - headerY - 150) / Math.max(rows.length, 1));
    for (const row of rows) {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, pad, headerY, S - pad * 2, rowHeight - 10, 16);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = `500 ${Math.min(38, rowHeight * 0.42)}px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.fillText(row.item.slice(0, 32), pad + 26, headerY + (rowHeight - 10) / 2 - 20);

      ctx.fillStyle = data.accent;
      ctx.font = `bold ${Math.min(40, rowHeight * 0.45)}px system-ui, -apple-system, Segoe UI, sans-serif`;
      const priceWidth = ctx.measureText(row.price).width;
      ctx.fillText(row.price, S - pad - 26 - priceWidth, headerY + (rowHeight - 10) / 2 - 21);

      headerY += rowHeight;
    }
  } else {
    // Promo / service: large headline block, centred vertically.
    ctx.fillStyle = '#ffffff';
    const headlineSize = data.layout === 'promo' ? 118 : 92;
    ctx.font = `bold ${headlineSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    const lines = wrapText(ctx, data.headline || 'YOUR OFFER HERE', S - pad * 2).slice(0, 4);

    let blockY = Math.max(headerY + 40, (S - lines.length * (headlineSize + 12)) / 2 - 40);
    for (const line of lines) {
      ctx.fillText(line, pad, blockY);
      blockY += headlineSize + 12;
    }

    if (data.subhead.trim()) {
      ctx.fillStyle = data.accent;
      ctx.font = '44px system-ui, -apple-system, Segoe UI, sans-serif';
      blockY += 20;
      for (const line of wrapText(ctx, data.subhead, S - pad * 2).slice(0, 3)) {
        ctx.fillText(line, pad, blockY);
        blockY += 56;
      }
    }

    if (data.layout === 'service') {
      const bullets = data.items.filter((r) => r.item.trim()).slice(0, 5);
      blockY += 24;
      ctx.font = '38px system-ui, -apple-system, Segoe UI, sans-serif';
      for (const bullet of bullets) {
        ctx.fillStyle = data.accent;
        ctx.fillText('•', pad, blockY);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(bullet.item.slice(0, 34), pad + 40, blockY);
        blockY += 56;
      }
    }
  }

  // Footer bar
  const footerHeight = 118;
  ctx.fillStyle = data.accent;
  ctx.fillRect(0, S - footerHeight, S, footerHeight);
  ctx.fillStyle = data.primary;
  ctx.font = 'bold 40px system-ui, -apple-system, Segoe UI, sans-serif';
  const footer = data.footer || 'Call / WhatsApp: 080…';
  const footerWidth = ctx.measureText(footer).width;
  ctx.fillText(footer.slice(0, 40), Math.max(pad, (S - footerWidth) / 2), S - footerHeight + 38);
}

export function flyerToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed.'))), 'image/jpeg', 0.92),
  );
}
