import type { Contour, Point, StrokeType } from '../core';
import data from './reference/source-han-sans-regular.json';

/** Vertical stem of the reference font in font units, measured on 十. */
export const REFERENCE_STEM_V = 81;
/** Horizontal stem of the reference font in font units, measured on 十. */
export const REFERENCE_STEM_H = 77;
/** Short name for captions; the full name is Source Han Sans SC. */
export const REFERENCE_NAME = `SHS ${data.style}`;

/**
 * Where each stroke sits inside its reference glyph: key points in glyph units,
 * following the skeleton convention (free ends at the outer extent of the stroke).
 * Strokes without an entry have no reference yet.
 */
const ALIGN: Partial<Record<StrokeType, { char: keyof typeof data.glyphs; pts: Point[] }>> = {
  heng: { char: '十', pts: [[55, 427.5], [952, 427.5]] },
  shu: { char: '十', pts: [[501.5, 839], [501.5, -80]] },
  // Start on the centerline of the left vertical, corner on both centerlines, end at the foot of the right vertical.
  hengzhe: { char: '口', pts: [[166, 697.5], [836, 697.5], [836, -51]] },
};

/** Which end of the reference stroke is placed on the matching sample key point. */
export type ReferenceAnchor = 'start' | 'end';

export interface StrokeReference {
  char: string;
  /** Whole reference glyph at its original size, moved so the anchored stroke end lies on its sample key point. */
  contours: Contour[];
  /** Reference vertical stem, directly comparable to the weight (V) of the sample. */
  stemV: number;
  /** Reference horizontal stem. */
  stemH: number;
}

/** Reference glyph for a stroke, translated so the anchored stroke end lies on its sample key point (no scaling). */
export function strokeReference(type: StrokeType, sample: readonly Point[], anchor: ReferenceAnchor = 'start'): StrokeReference | null {
  const a = ALIGN[type];
  if (!a) return null;
  const from = anchor === 'start' ? a.pts[0] : a.pts[a.pts.length - 1];
  const to = anchor === 'start' ? sample[0] : sample[sample.length - 1];
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const map = (p: Point): Point => [p[0] + dx, p[1] + dy];
  const source = data.glyphs[a.char].contours as unknown as Contour[];
  const contours = source.map((c) => c.map((n) => ({
    p: map(n.p),
    ...(n.in ? { in: map(n.in) } : {}),
    ...(n.out ? { out: map(n.out) } : {}),
  })));
  return { char: a.char, contours, stemV: REFERENCE_STEM_V, stemH: REFERENCE_STEM_H };
}
