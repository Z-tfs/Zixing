import type { GlobalParams } from './params';
import type { Rect } from './types';

/** Metric frame shared by every glyph. Same convention as Source Han Sans. */
export const UPM = 1000;
export const EM_BOTTOM = -120;
export const EM_TOP = 880;
export const LATIN_BASELINE = 0;

export const EM_BOX: Rect = { x0: 0, y0: EM_BOTTOM, x1: UPM, y1: EM_TOP };
export const EM_CENTER = { x: UPM / 2, y: (EM_BOTTOM + EM_TOP) / 2 } as const;

function centeredBox(size: number): Rect {
  const h = size / 2;
  return { x0: EM_CENTER.x - h, y0: EM_CENTER.y - h, x1: EM_CENTER.x + h, y1: EM_CENTER.y + h };
}

/** Face box (字面框 / ideographic character face). */
export function faceBox(p: Pick<GlobalParams, 'face'>): Rect {
  return centeredBox(UPM * p.face);
}

/** Center box (中宫框), relative to the face box. */
export function centerBox(p: Pick<GlobalParams, 'face' | 'centerRatio'>): Rect {
  return centeredBox(UPM * p.face * p.centerRatio);
}

/** Gravity line (重心线): face center shifted by a fraction of the face height. */
export function gravityY(p: Pick<GlobalParams, 'face' | 'gravity'>): number {
  return EM_CENTER.y + p.gravity * UPM * p.face;
}

export interface MetricFrame {
  em: Rect;
  face: Rect;
  center: Rect;
  gravityY: number;
  baseline: number;
}

export function metricFrame(p: GlobalParams): MetricFrame {
  return { em: EM_BOX, face: faceBox(p), center: centerBox(p), gravityY: gravityY(p), baseline: LATIN_BASELINE };
}
