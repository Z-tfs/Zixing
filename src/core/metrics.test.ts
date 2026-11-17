import { describe, expect, it } from 'vitest';
import { EM_BOX, EM_CENTER, HEI_DEFAULTS, centerBox, faceBox, gravityY, horizontalStem, metricFrame, unicodeOf, MILESTONE_CHARS } from './index';

describe('metric frame', () => {
  it('em box is 1000 units tall with the baseline 120 above its bottom', () => {
    expect(EM_BOX.y1 - EM_BOX.y0).toBe(1000);
    expect(EM_BOX.y0).toBe(-120);
    expect(EM_CENTER).toEqual({ x: 500, y: 380 });
  });
  it('face box is centered and scales with face', () => {
    const f = faceBox({ face: 0.92 });
    expect(f.x1 - f.x0).toBeCloseTo(920);
    expect((f.x0 + f.x1) / 2).toBeCloseTo(500);
    expect((f.y0 + f.y1) / 2).toBeCloseTo(380);
  });
  it('center box is relative to the face', () => {
    const c = centerBox({ face: 0.92, centerRatio: 0.5 });
    expect(c.x1 - c.x0).toBeCloseTo(460);
  });
  it('gravity shifts from the face center', () => {
    expect(gravityY({ face: 1, gravity: 0 })).toBe(380);
    expect(gravityY({ face: 1, gravity: 0.05 })).toBeCloseTo(430);
  });
  it('Hei defaults nest em > face > center', () => {
    const m = metricFrame(HEI_DEFAULTS);
    expect(m.face.x0).toBeGreaterThan(m.em.x0);
    expect(m.center.x0).toBeGreaterThan(m.face.x0);
  });
});

describe('params and charset', () => {
  it('horizontal stem follows contrast', () => {
    expect(horizontalStem({ weight: 100, contrast: 0.12 })).toBeCloseTo(88);
  });
  it('has 10 milestone characters with unicode labels', () => {
    expect(MILESTONE_CHARS).toHaveLength(10);
    expect(unicodeOf('口')).toBe('U+53E3');
  });
});
