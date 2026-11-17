/** Global parameter schema. Stroke-template parameters are added in Phase 1. */

export interface ParamSpec {
  key: string;
  en: string;
  zh: string;
  group: 'Metrics' | 'Structure' | 'Stroke' | 'Template';
  min: number;
  max: number;
  step: number;
  /** Display unit, e.g. "u" (font units), "×V", "°", "%". */
  unit: string;
  tip: string;
}

export interface GlobalParams {
  face: number;
  centerRatio: number;
  gravity: number;
  slant: number;
  weight: number;
  contrast: number;
  cornerRadius: number;
  flare: number;
  waist: number;
}

/** Neutral modern Hei, in the direction of Source Han Sans Regular. */
export const HEI_DEFAULTS: GlobalParams = {
  face: 0.92,
  centerRatio: 0.48,
  gravity: 0.01,
  slant: 0,
  weight: 78,
  contrast: 0.12,
  cornerRadius: 0,
  flare: 0.02,
  waist: 0.01,
};

export const GLOBAL_SPECS: ParamSpec[] = [
  { key: 'face', en: 'Face size', zh: '字面率', group: 'Structure', min: 0.8, max: 1, step: 0.005, unit: '%',
    tip: 'How much of the em box the glyph fills. The visual-size lever, like x-height in Latin.' },
  { key: 'centerRatio', en: 'Center', zh: '中宫', group: 'Structure', min: 0.35, max: 0.6, step: 0.005, unit: '%',
    tip: 'Size of the inner box relative to the face. Smaller is tighter and more alert; larger is open and relaxed.' },
  { key: 'gravity', en: 'Gravity', zh: '重心', group: 'Structure', min: -0.1, max: 0.1, step: 0.005, unit: '',
    tip: 'Vertical position of the visual mass, as a fraction of the face height.' },
  { key: 'slant', en: 'Slant', zh: '倾斜', group: 'Structure', min: 0, max: 12, step: 0.5, unit: '°',
    tip: 'Mechanical oblique for pairing with Latin italics.' },
  { key: 'weight', en: 'Weight (V)', zh: '竖画粗细', group: 'Stroke', min: 20, max: 180, step: 1, unit: 'u',
    tip: 'Vertical stem width in font units. Every stroke parameter is a multiple of this.' },
  { key: 'contrast', en: 'Contrast', zh: '横竖对比', group: 'Stroke', min: 0, max: 0.6, step: 0.01, unit: '%',
    tip: 'How much thinner horizontals are than verticals: H = V × (1 − contrast).' },
  { key: 'cornerRadius', en: 'Corner radius', zh: '微圆角', group: 'Stroke', min: 0, max: 0.15, step: 0.005, unit: '×V',
    tip: 'Softens outer corners. 0 is a sharp Hei.' },
  { key: 'flare', en: 'Flare', zh: '喇叭口', group: 'Stroke', min: 0, max: 0.12, step: 0.005, unit: '%',
    tip: 'Stroke ends slightly wider than the middle.' },
  { key: 'waist', en: 'Waist', zh: '腰身收细', group: 'Stroke', min: 0, max: 0.08, step: 0.005, unit: '%',
    tip: 'Mid-stroke thinning on long strokes.' },
];

/** Horizontal stem derived from weight and contrast. */
export function horizontalStem(p: Pick<GlobalParams, 'weight' | 'contrast'>): number {
  return p.weight * (1 - p.contrast);
}

export function clampParam(spec: ParamSpec, v: number): number {
  return Math.min(spec.max, Math.max(spec.min, v));
}
