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
  /** Whole reference glyph at its original size, moved so its stroke starts at the first sample key point. */
  contours: Contour[];
  /** Reference vertical stem, directly comparable to the weight (V) of the sample. */
  stemV: number;
}

/** Reference glyph for a stroke, translated so the stroke starts at the first sample key point (no scaling). */
export function strokeReference(type: StrokeType, sample: readonly Point[]): StrokeReference | null {
  const a = ALIGN[type];
  if (!a) return null;
  const dx = sample[0][0] - a.pts[0][0], dy = sample[0][1] - a.pts[0][1];
  const map = (p: Point): Point => [p[0] + dx, p[1] + dy];
  const source = data.glyphs[a.char].contours as unknown as Contour[];
  const contours = source.map((c) => c.map((n) => ({
    p: map(n.p),
    ...(n.in ? { in: map(n.in) } : {}),
    ...(n.out ? { out: map(n.out) } : {}),
  })));
  return { char: a.char, contours, stemV: REFERENCE_STEM_V };
}
