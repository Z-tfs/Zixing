/** Core data types. Coordinates are font units, y-up, UPM 1000. */

export type Point = readonly [x: number, y: number];

export const STROKE_TYPES = [
  'heng', 'shu', 'pie', 'na', 'dian', 'ti', 'hengzhe', 'shugou',
] as const;
export type StrokeType = (typeof STROKE_TYPES)[number];

export const STROKE_LABELS: Record<StrokeType, { zh: string; en: string }> = {
  heng: { zh: '横', en: 'Horizontal' },
  shu: { zh: '竖', en: 'Vertical' },
  pie: { zh: '撇', en: 'Left-falling' },
  na: { zh: '捺', en: 'Right-falling' },
  dian: { zh: '点', en: 'Dot' },
  ti: { zh: '提', en: 'Rising' },
  hengzhe: { zh: '横折', en: 'Horizontal fold' },
  shugou: { zh: '竖钩', en: 'Vertical hook' },
};

/** Number of key points each stroke type carries in a skeleton. */
export const KEYPOINT_COUNT: Record<StrokeType, number> = {
  heng: 2, shu: 2, pie: 2, na: 2, dian: 2, ti: 2, hengzhe: 3, shugou: 2,
};

export interface SkeletonStroke {
  type: StrokeType;
  /** Key points only (start, optional corner, end). Never a traced polyline. */
  pts: Point[];
}

export interface Skeleton {
  char: string;
  /** e.g. "U+53E3" */
  unicode: string;
  strokes: SkeletonStroke[];
  /** Structural tags, e.g. "enclosure:full". */
  tags?: string[];
  /** True once the skeleton has been reviewed and locked by hand. */
  locked?: boolean;
}

/** One node of a closed cubic contour. `in`/`out` are absolute handle positions. */
export interface Node {
  p: Point;
  in?: Point;
  out?: Point;
  smooth?: boolean;
}

export type Contour = Node[];

export interface Rect { x0: number; y0: number; x1: number; y1: number }

export function unicodeOf(char: string): string {
  return 'U+' + char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
}
