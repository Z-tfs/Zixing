import type { Contour, Point, StrokeType } from '../core';
import data from './reference/source-han-sans-regular.json';

/** Vertical stem of the reference font in font units, measured on 十. */
export const REFERENCE_STEM_V = 81;
export const REFERENCE_NAME = `${data.font} ${data.style}`;

/**
 * Where each stroke sits inside its reference glyph: key points in glyph units,
 * following the skeleton convention (free ends at the outer extent of the stroke).
 * Strokes without an entry have no reference yet.
 */
const ALIGN: Partial<Record<StrokeType, { char: keyof typeof data.glyphs; pts: Point[] }>> = {
  heng: { char: '十', pts: [[55, 427.5], [952, 427.5]] },
};

export interface StrokeReference {
  char: string;
  /** Whole reference glyph, moved and scaled so its stroke lies on the sample key points. */
  contours: Contour[];
  /** Reference vertical stem after scaling, comparable to the weight (V) of the sample. */
  stemV: number;
}

/** Reference glyph for a stroke, fitted to the first and last sample key points (uniform scale, no rotation). */
export function strokeReference(type: StrokeType, sample: readonly Point[]): StrokeReference | null {
  const a = ALIGN[type];
  if (!a) return null;
  const r0 = a.pts[0], r1 = a.pts[a.pts.length - 1];
  const s0 = sample[0], s1 = sample[sample.length - 1];
  const k = Math.hypot(s1[0] - s0[0], s1[1] - s0[1]) / Math.hypot(r1[0] - r0[0], r1[1] - r0[1]);
  const map = (p: Point): Point => [s0[0] + (p[0] - r0[0]) * k, s0[1] + (p[1] - r0[1]) * k];
  const source = data.glyphs[a.char].contours as unknown as Contour[];
  const contours = source.map((c) => c.map((n) => ({
    p: map(n.p),
    ...(n.in ? { in: map(n.in) } : {}),
    ...(n.out ? { out: map(n.out) } : {}),
  })));
  return { char: a.char, contours, stemV: REFERENCE_STEM_V * k };
}
