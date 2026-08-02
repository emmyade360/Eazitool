'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

/**
 * Reusable signature drawing pad. Exposes a trimmed transparent-PNG export via
 * ref so tools (Sign PDF, forms) can consume the ink without owning the logic.
 */

const PAD_WIDTH = 900;
const PAD_HEIGHT = 300;

type Point = { x: number; y: number };
type Stroke = { color: string; width: number; points: Point[] };

export interface SignaturePadHandle {
  /** Trimmed transparent PNG of the ink, or null when empty. */
  exportPng(): Promise<{ blob: Blob; width: number; height: number } | null>;
  clear(): void;
}

interface SignaturePadProps {
  color?: string;
  penWidth?: number;
  onInkChange?: (hasInk: boolean) => void;
}

function drawStrokes(canvas: HTMLCanvasElement, strokes: Stroke[], background: string | null) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (const point of stroke.points.slice(1)) ctx.lineTo(point.x, point.y);
    if (stroke.points.length === 1) ctx.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y);
    ctx.stroke();
  }
}

function inkBounds(strokes: Stroke[]): { x: number; y: number; w: number; h: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const stroke of strokes) {
    for (const point of stroke.points) {
      const r = stroke.width / 2;
      minX = Math.min(minX, point.x - r);
      minY = Math.min(minY, point.y - r);
      maxX = Math.max(maxX, point.x + r);
      maxY = Math.max(maxY, point.y + r);
    }
  }
  if (!Number.isFinite(minX)) return null;
  const pad = 12;
  const x = Math.max(0, minX - pad);
  const y = Math.max(0, minY - pad);
  return { x, y, w: Math.min(PAD_WIDTH, maxX + pad) - x, h: Math.min(PAD_HEIGHT, maxY + pad) - y };
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ color = '#111111', penWidth = 4, onInkChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeStroke = useRef<Stroke | null>(null);
    const [strokes, setStrokes] = useState<Stroke[]>([]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) drawStrokes(canvas, strokes, '#ffffff');
      onInkChange?.(strokes.length > 0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [strokes]);

    useImperativeHandle(ref, () => ({
      async exportPng() {
        const bounds = inkBounds(strokes);
        if (!bounds) return null;
        const full = document.createElement('canvas');
        full.width = PAD_WIDTH;
        full.height = PAD_HEIGHT;
        drawStrokes(full, strokes, null);

        const trimmed = document.createElement('canvas');
        trimmed.width = Math.max(1, Math.round(bounds.w));
        trimmed.height = Math.max(1, Math.round(bounds.h));
        trimmed.getContext('2d')!.drawImage(full, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, trimmed.width, trimmed.height);

        const blob: Blob = await new Promise((resolve, reject) =>
          trimmed.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed.'))), 'image/png'),
        );
        return { blob, width: trimmed.width, height: trimmed.height };
      },
      clear() {
        activeStroke.current = null;
        setStrokes([]);
      },
    }));

    function padPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * PAD_WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * PAD_HEIGHT,
      };
    }

    return (
      <div>
        <canvas
          ref={canvasRef}
          width={PAD_WIDTH}
          height={PAD_HEIGHT}
          className="w-full touch-none rounded-xl border-2 border-dashed border-slate-200 bg-white"
          style={{ aspectRatio: `${PAD_WIDTH} / ${PAD_HEIGHT}` }}
          aria-label="Signature drawing pad"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            activeStroke.current = { color, width: penWidth, points: [padPoint(event)] };
            setStrokes((prev) => [...prev, activeStroke.current!]);
          }}
          onPointerMove={(event) => {
            const stroke = activeStroke.current;
            if (!stroke) return;
            stroke.points.push(padPoint(event));
            const canvas = canvasRef.current;
            if (canvas) drawStrokes(canvas, strokes, '#ffffff');
          }}
          onPointerUp={() => {
            activeStroke.current = null;
            setStrokes((prev) => [...prev]);
          }}
          onPointerCancel={() => {
            activeStroke.current = null;
            setStrokes((prev) => [...prev]);
          }}
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-400">Sign with your finger or mouse</p>
          <div className="flex gap-2">
            <button type="button" disabled={strokes.length === 0}
              onClick={() => setStrokes((prev) => prev.slice(0, -1))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">
              Undo
            </button>
            <button type="button" disabled={strokes.length === 0}
              onClick={() => { activeStroke.current = null; setStrokes([]); }}
              className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 disabled:opacity-40">
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  },
);
