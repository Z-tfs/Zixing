import { describe, expect, it } from 'vitest';
import { HEI_DEFAULTS, STROKE_SAMPLES, STROKE_SPECS, STROKE_TYPES, area, bounds, buildStroke, contourToPath, defaultStrokeParams, type Contour } from './index';

const WEIGHTS = [24, 78, 170];
const sp = defaultStrokeParams();
const build = (type: (typeof STROKE_TYPES)[number], weight: number, params = sp) =>
  buildStroke(type, STROKE_SAMPLES[type], { ...HEI_DEFAULTS, weight }, params);
const signature = (c: Contour) => c.map((n) => `${n.in ? 'i' : '-'}${n.out ? 'o' : '-'}`).join(' ');

describe.each(STROKE_TYPES)('stroke template: %s', (type) => {
  it('is point-compatible across weights', () => {
    const sigs = WEIGHTS.map((w) => signature(build(type, w)));
    expect(new Set(sigs).size).toBe(1);
  });
  it('is a finite, counter-clockwise contour', () => {
    for (const w of WEIGHTS) {
      const c = build(type, w);
      expect(c.every((n) => [n.p, n.in, n.out].every((p) => !p || p.every(Number.isFinite)))).toBe(true);
      expect(area(c)).toBeGreaterThan(0);
      expect(contourToPath(c)).toMatch(/^M.*Z$/);
    }
  });
  it('gets heavier with weight and stays near its key points', () => {
    expect(area(build(type, 170))).toBeGreaterThan(area(build(type, 24)));
    const b = bounds(build(type, 78));
    expect(b.x0).toBeGreaterThan(-60); expect(b.x1).toBeLessThan(460);
    expect(b.y0).toBeGreaterThan(-60); expect(b.y1).toBeLessThan(460);
  });
  it('keeps its topology at every parameter extreme', () => {
    const ref = signature(build(type, 78));
    for (const spec of STROKE_SPECS[type]) for (const v of [spec.min, spec.max]) {
      const p = defaultStrokeParams(); p[type][spec.key] = v;
      const c = build(type, 78, p);
      expect(signature(c)).toBe(ref);
      expect(area(c)).toBeGreaterThan(0);
    }
  });
});

describe('stem widths', () => {
  it('a vertical stroke measures V at its waist', () => {
    const b = bounds(buildStroke('shu', [[200, 360], [200, 40]], { ...HEI_DEFAULTS, weight: 100, flare: 0, waist: 0 }, { ...sp, shu: { ...sp.shu, startWidth: 1, endWidth: 1 } }));
    expect(b.x1 - b.x0).toBeCloseTo(100);
    expect(b.y1 - b.y0).toBeCloseTo(320);
  });
});
