import type { Point, StrokeType } from './types';

/** Canonical key points for each stroke in a 400-unit box, used by the Stroke Lab and tests. */
export const SAMPLE_BOX = 400;
export const STROKE_SAMPLES: Record<StrokeType, Point[]> = {
  heng: [[40, 200], [360, 200]],
  shu: [[200, 360], [200, 40]],
  pie: [[300, 360], [80, 50]],
  na: [[90, 350], [340, 50]],
  dian: [[150, 280], [250, 150]],
  ti: [[80, 120], [320, 250]],
  hengzhe: [[50, 320], [320, 320], [320, 50]],
  shugou: [[220, 370], [220, 40]],
};
