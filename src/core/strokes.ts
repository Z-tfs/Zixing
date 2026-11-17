/**
 * Stroke-shape library: parametric outline templates for the 8 basic strokes.
 *
 * Conventions
 * - Key points come from the skeleton. A free stroke end is the outer extent of
 *   the stroke; across the stroke, key points sit on the centerline.
 * - Widths are multiples of the vertical stem V (or horizontal stem H).
 * - Every template returns one closed, counter-clockwise contour whose node
 *   count and handle layout never depend on parameter values.
 */
import { horizontalStem, type GlobalParams, type ParamSpec } from './params';
import { DEG, add, clamp, dot, left, len, lerp, mul, norm, rotate, sub } from './geom';
import type { Contour, Node, Point, StrokeType } from './types';

export interface StrokeSpec extends ParamSpec { def: number }
export type StrokeParamSet = Record<StrokeType, Record<string, number>>;

const sp = (key: string, en: string, zh: string, min: number, max: number, step: number, unit: string, def: number, tip: string): StrokeSpec =>
  ({ key, en, zh, group: 'Template', min, max, step, unit, def, tip });

export const STROKE_SPECS: Record<StrokeType, StrokeSpec[]> = {
  heng: [
    sp('startCut', 'Start cut', '起笔切角', -20, 20, 1, '°', 0, 'Tilt of the left end face, measured from vertical.'),
    sp('startHeight', 'Start height', '起笔高', 1, 1.15, 0.005, '×H', 1, 'Thickness at the start, relative to the horizontal stem.'),
    sp('endHeight', 'End height', '收笔高', 1, 1.25, 0.005, '×H', 1.02, 'Thickness at the end. Hei horizontals end slightly heavier.'),
    sp('rise', 'Rise', '上扬', 0, 4, 0.25, '°', 0, 'Upward tilt to the right. 0 for Hei; Kai and Song rise slightly.'),
  ],
  shu: [
    sp('startCut', 'Start cut', '起笔切角', -25, 25, 1, '°', 0, 'Tilt of the top end face, measured from horizontal.'),
    sp('startWidth', 'Start width', '起笔宽', 1, 1.15, 0.005, '×V', 1.02, 'Thickness at the top.'),
    sp('endWidth', 'End width', '收笔宽', 0.9, 1.15, 0.005, '×V', 1, 'Thickness at the bottom.'),
    sp('needle', 'Needle', '悬针', 0, 1, 0.01, '', 0, 'Tapers the bottom to a point (悬针). 0 keeps a flat end (垂露).'),
  ],
  pie: [
    sp('startCut', 'Start cut', '起笔切角', 0, 60, 1, '°', 10, 'Angle of the top end face, measured from horizontal.'),
    sp('startWidth', 'Start width', '起笔宽', 0.85, 1.1, 0.005, '×V', 0.98, 'Thickness at the top.'),
    sp('endWidth', 'End width', '收笔宽', 0.15, 0.7, 0.01, '×V', 0.42, 'Thickness at the tip. Hei keeps a blunt end rather than a point.'),
    sp('endCut', 'End cut', '收笔切角', -45, 45, 1, '°', 0, 'Angle of the tip face, measured from the stroke normal.'),
    sp('curvature', 'Curvature', '弧度', 0, 0.4, 0.005, '', 0.12, 'How far the stroke bows away from a straight line (sagitta / chord).'),
    sp('curvePeak', 'Curve position', '弯曲位置', 0.3, 0.8, 0.01, '', 0.6, 'Where the bend sits. Higher values run straight first and curve late.'),
    sp('taperStart', 'Taper start', '收细起点', 0, 0.8, 0.01, '', 0.3, 'Position along the stroke where thinning begins.'),
    sp('taperCurve', 'Taper curve', '收细曲线', 0.6, 2, 0.05, '', 1.2, 'Shape of the thinning: above 1 thins late, below 1 thins early.'),
  ],
  na: [
    sp('startWidth', 'Start width', '起笔宽', 0.25, 0.8, 0.01, '×V', 0.55, 'Thickness at the top; the stroke starts thin and grows.'),
    sp('footWidth', 'Foot width', '捺脚宽', 1, 1.4, 0.01, '×V', 1.15, 'Thickness at the foot, the heaviest part of the stroke.'),
    sp('footLength', 'Foot length', '捺脚长', 0, 1.5, 0.05, '×V', 0.7, 'How long before the end the stroke reaches full foot width.'),
    sp('footAngle', 'Foot angle', '捺脚底角', 0, 20, 1, '°', 6, 'Direction the foot settles toward, measured below horizontal.'),
    sp('endCut', 'End cut', '收笔切角', 50, 90, 1, '°', 75, 'Angle of the end face, measured from horizontal.'),
    sp('curvature', 'Curvature', '弧度', 0, 0.3, 0.005, '', 0.1, 'How far the stroke sags below a straight line (sagitta / chord).'),
    sp('curvePeak', 'Curve position', '弯曲位置', 0.4, 0.7, 0.01, '', 0.55, 'Where the bend sits along the stroke.'),
    sp('tailLift', 'Tail lift', '末端上挑', 0, 1, 0.01, '', 0.2, 'How strongly the end flattens toward the foot angle.'),
  ],
  dian: [
    sp('minLength', 'Minimum length', '最短长度', 1, 2, 0.05, '×V', 1.3, 'A dot is never shorter than this, however small the skeleton makes it.'),
    sp('startWidth', 'Start width', '起笔宽', 0.2, 0.6, 0.01, '×V', 0.45, 'Thickness at the top of the dot.'),
    sp('endWidth', 'End width', '收笔宽', 0.9, 1.3, 0.01, '×V', 1.08, 'Thickness at the heavy end.'),
    sp('endBulge', 'End bulge', '收笔圆鼓', 0, 1, 0.01, '', 0.35, 'Rounds the heavy end outward.'),
    sp('curvature', 'Curvature', '弧度', 0, 0.3, 0.005, '', 0.12, 'Bow of the dot; the outer side is convex.'),
    sp('endCut', 'End cut', '收笔切角', -30, 30, 1, '°', 10, 'Angle of the end face, measured from the stroke normal.'),
  ],
  ti: [
    sp('startWidth', 'Start width', '起笔宽', 1, 1.3, 0.01, '×V', 1.08, 'Thickness at the heavy bottom-left start.'),
    sp('endWidth', 'End width', '收笔宽', 0.15, 0.6, 0.01, '×V', 0.32, 'Thickness at the tip.'),
    sp('heel', 'Heel', '起笔方根', 0, 1, 0.01, '', 0.5, 'How upright the start face is: 0 is square to the stroke, 1 is vertical.'),
    sp('angleMin', 'Minimum angle', '最小角度', 15, 45, 1, '°', 20, 'The skeleton angle is never flatter than this.'),
    sp('angleMax', 'Maximum angle', '最大角度', 15, 45, 1, '°', 35, 'The skeleton angle is never steeper than this.'),
    sp('curvature', 'Curvature', '弧度', 0, 0.15, 0.005, '', 0.03, 'Slight belly on the underside.'),
    sp('taperStart', 'Taper start', '收细起点', 0, 0.5, 0.01, '', 0.1, 'Position along the stroke where thinning begins.'),
  ],
  hengzhe: [
    sp('shoulderSize', 'Shoulder size', '折角顿笔', 0, 0.5, 0.01, '×V', 0, 'Size of the cut on the outer corner. 0 gives the plain square corner of a neutral Hei.'),
    sp('shoulderAngle', 'Shoulder angle', '折角角度', 30, 60, 1, '°', 45, 'Angle of the outer-corner cut.'),
    sp('turnWidth', 'Turn width', '转折处粗细', 1, 1.2, 0.005, '×V', 1.05, 'Extra thickness of the vertical leg right below the corner.'),
    sp('innerCornerCut', 'Inner corner cut', '内角切', 0, 0.2, 0.005, '×V', 0.05, 'Small chamfer inside the corner so it does not clog.'),
    sp('legTilt', 'Leg tilt', '折后竖内收', 0, 3, 0.1, '°', 1, 'The vertical leg leans inward toward the bottom.'),
  ],
  shugou: [
    sp('hookLength', 'Hook length', '钩长', 0.6, 2.5, 0.05, '×V', 1.1, 'Length of the hook, measured from the stem.'),
    sp('hookAngle', 'Hook angle', '钩角', 20, 60, 1, '°', 40, 'Direction of the hook above horizontal, pointing left.'),
    sp('hookTipWidth', 'Hook tip width', '钩尖宽', 0.1, 0.6, 0.01, '×V', 0.3, 'Thickness of the hook tip.'),
    sp('hookBaseWidth', 'Hook base width', '钩根粗', 0.6, 1.3, 0.01, '×V', 0.85, 'Thickness of the hook where it leaves the stem.'),
    sp('footRadius', 'Foot radius', '外转弧', 0, 1.5, 0.05, '×V', 0.45, 'Roundness of the outer bottom-right corner.'),
    sp('innerRadius', 'Inner radius', '内角弧', 0, 0.6, 0.01, '×V', 0.15, 'Roundness where the hook meets the stem.'),
    sp('bottomBend', 'Bottom bend', '竖末左弯', 0, 0.5, 0.01, '×V', 0.1, 'The stem bottom drifts left into the hook.'),
  ],
};

export function defaultStrokeParams(): StrokeParamSet {
  const out = {} as StrokeParamSet;
  for (const k of Object.keys(STROKE_SPECS) as StrokeType[]) {
    out[k] = Object.fromEntries(STROKE_SPECS[k].map((s) => [s.key, s.def]));
  }
  return out;
}

// ---------- shared builders ----------

/** Straight stroke with terminal widths, a waist node and optional end-face shifts. 6 nodes. */
function straight(S: Point, E: Point, ws: number, wm: number, we: number, shiftS: number, shiftE: number): Contour {
  const d = sub(E, S), L = len(d), t = norm(d), n = left(t);
  const M = lerp(S, E, 0.5);
  const at = (c: Point, off: number, along: number): Point => add(add(c, mul(n, off)), mul(t, along));
  const hEnd = L * 0.08, hMid = L * 0.3;
  const side = (sgn: number): [Point, Point, Point] => [
    at(S, sgn * ws / 2, sgn * shiftS), at(M, sgn * wm / 2, 0), at(E, sgn * we / 2, sgn * shiftE),
  ];
  const [r0, rm, r1] = side(-1), [l0, lm, l1] = side(1);
  const fwd = (p: Point, k: number): Point => add(p, mul(t, k));
  return [
    { p: r0, out: fwd(r0, hEnd) },
    { p: rm, in: fwd(rm, -hMid), out: fwd(rm, hMid), smooth: true },
    { p: r1, in: fwd(r1, -hEnd) },
    { p: l1, out: fwd(l1, -hEnd) },
    { p: lm, in: fwd(lm, hMid), out: fwd(lm, -hMid), smooth: true },
    { p: l0, in: fwd(l0, hEnd) },
  ];
}

interface SweepOptions {
  center: (t: number) => Point;
  width: (t: number) => number;
  /** Fixed breakpoints along the stroke, from 0 to 1. */
  ts: number[];
  /** Direction of the start / end face. Omitted means square to the stroke. */
  startFace?: Point;
  endFace?: Point;
  /** Handle length for a rounded end face; when set, cap handles always exist. */
  endBulge?: number;
}

/** Variable-width stroke along a curved centerline. 2 × ts.length nodes. */
function sweep(o: SweepOptions): Contour {
  const E = 1e-3;
  const span = (t: number): [number, number] => [Math.max(0, t - E), Math.min(1, t + E)];
  const tan = (t: number): Point => { const [a, b] = span(t); return norm(sub(o.center(b), o.center(a))); };
  const side = (t: number, sgn: number): Point => add(o.center(t), mul(left(tan(t)), sgn * o.width(t) / 2));
  const dSide = (t: number, sgn: number): Point => { const [a, b] = span(t); return mul(sub(side(b, sgn), side(a, sgn)), 1 / (b - a)); };
  const shift = (t: number, face?: Point): number => {
    if (!face) return 0;
    const tau = tan(t), fn = dot(face, left(tau)), w = o.width(t);
    if (Math.abs(fn) < 1e-6) return 0;
    return clamp((w / 2) * dot(face, tau) / fn, -0.9 * w, 0.9 * w);
  };
  const n = o.ts.length, s0 = shift(0, o.startFace), s1 = shift(1, o.endFace);
  const R: Node[] = [], Lf: Node[] = [];
  for (let i = 0; i < n; i++) {
    const t = o.ts[i];
    const s = i === 0 ? s0 : i === n - 1 ? s1 : 0;
    const pr = add(side(t, -1), mul(tan(t), -s)), pl = add(side(t, 1), mul(tan(t), s));
    const dr = dSide(t, -1), dl = dSide(t, 1);
    const prev = i > 0 ? (t - o.ts[i - 1]) / 3 : 0, next = i < n - 1 ? (o.ts[i + 1] - t) / 3 : 0;
    const mid = i > 0 && i < n - 1;
    R.push({ p: pr, in: i > 0 ? sub(pr, mul(dr, prev)) : undefined, out: i < n - 1 ? add(pr, mul(dr, next)) : undefined, smooth: mid || undefined });
    Lf.push({ p: pl, in: i < n - 1 ? add(pl, mul(dl, next)) : undefined, out: i > 0 ? sub(pl, mul(dl, prev)) : undefined, smooth: mid || undefined });
  }
  if (o.endBulge !== undefined) {
    const k = mul(tan(1), o.endBulge);
    R[n - 1].out = add(R[n - 1].p, k);
    Lf[n - 1].in = add(Lf[n - 1].p, k);
  }
  return [...R, ...Lf.reverse()];
}

/** Cubic centerline through a quadratic-style control point Q, with an optional end direction. */
function centerline(S: Point, Q: Point, E: Point, endDir?: Point): (t: number) => Point {
  const p1 = lerp(S, Q, 2 / 3);
  let p2 = lerp(E, Q, 2 / 3);
  if (endDir) p2 = sub(E, mul(endDir, len(sub(E, p2))));
  return (t) => {
    const u = 1 - t;
    return [
      u * u * u * S[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * E[0],
      u * u * u * S[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * E[1],
    ];
  };
}

const HALF = [0, 0.5, 1];

// ---------- templates ----------

type Builder = (pts: Point[], g: GlobalParams, all: StrokeParamSet) => Contour;

const heng: Builder = ([S, E0], g, all) => {
  const p = all.heng, H = horizontalStem(g);
  const E = add(S, rotate(sub(E0, S), p.rise * DEG));
  const ws = H * p.startHeight * (1 + g.flare), we = H * p.endHeight * (1 + g.flare);
  return straight(S, E, ws, H * (1 - g.waist), we, Math.tan(p.startCut * DEG) * ws / 2, 0);
};

const shu: Builder = ([S, E], g, all) => {
  const p = all.shu, V = g.weight;
  const ws = V * p.startWidth * (1 + g.flare), we = V * p.endWidth * (1 + g.flare) * (1 - 0.85 * p.needle);
  return straight(S, E, ws, V * (1 - g.waist), we, Math.tan(p.startCut * DEG) * ws / 2, 0);
};

const pie: Builder = ([S, E], g, all) => {
  const p = all.pie, V = g.weight;
  const d = sub(E, S), L = len(d), t = norm(d), n = left(t);
  const Q = add(add(S, mul(t, p.curvePeak * L)), mul(n, 2 * p.curvature * L));
  const center = centerline(S, Q, E);
  const ws = V * p.startWidth, we = V * p.endWidth;
  const width = (u: number) => ws + (we - ws) * Math.pow(clamp((u - p.taperStart) / (1 - p.taperStart), 0, 1), p.taperCurve);
  const endTan = norm(sub(E, Q));
  return sweep({
    center, width, ts: HALF,
    startFace: [Math.cos(p.startCut * DEG), Math.sin(p.startCut * DEG)],
    endFace: rotate(left(endTan), p.endCut * DEG),
  });
};

const na: Builder = ([S, E], g, all) => {
  const p = all.na, V = g.weight;
  const d = sub(E, S), L = len(d), t = norm(d), n = left(t);
  const Q = add(add(S, mul(t, p.curvePeak * L)), mul(n, -2 * p.curvature * L));
  const foot: Point = [Math.cos(p.footAngle * DEG), -Math.sin(p.footAngle * DEG)];
  const endDir = norm(lerp(norm(sub(E, Q)), foot, p.tailLift));
  const ws = V * p.startWidth, wf = V * p.footWidth;
  const tf = clamp(1 - (p.footLength * V) / L, 0.5, 1);
  const width = (u: number) => ws + (wf - ws) * Math.pow(Math.min(1, u / tf), 1.2);
  return sweep({
    center: centerline(S, Q, E, endDir), width, ts: HALF,
    endFace: [Math.cos(p.endCut * DEG), Math.sin(p.endCut * DEG)],
  });
};

const dian: Builder = ([S, E0], g, all) => {
  const p = all.dian, V = g.weight;
  const d = sub(E0, S), t = norm(d), n = left(t);
  const L = Math.max(len(d), p.minLength * V);
  const E = add(S, mul(t, L));
  const sgn = d[0] >= 0 ? 1 : -1;
  const Q = add(lerp(S, E, 0.5), mul(n, sgn * 2 * p.curvature * L));
  const ws = V * p.startWidth, we = V * p.endWidth;
  const width = (u: number) => ws + (we - ws) * (1 - (1 - u) * (1 - u));
  return sweep({
    center: centerline(S, Q, E), width, ts: HALF,
    endFace: rotate(left(norm(sub(E, Q))), p.endCut * DEG),
    endBulge: p.endBulge * we * 0.5,
  });
};

const ti: Builder = ([S, E0], g, all) => {
  const p = all.ti, V = g.weight;
  let d = sub(E0, S);
  if (d[0] > 0) {
    const a = clamp(Math.atan2(d[1], d[0]) / DEG, Math.min(p.angleMin, p.angleMax), Math.max(p.angleMin, p.angleMax));
    d = mul([Math.cos(a * DEG), Math.sin(a * DEG)], len(d));
  }
  const E = add(S, d), L = len(d), t = norm(d), n = left(t);
  const Q = add(lerp(S, E, 0.5), mul(n, -2 * p.curvature * L));
  const ws = V * p.startWidth, we = V * p.endWidth;
  const width = (u: number) => ws + (we - ws) * clamp((u - p.taperStart) / (1 - p.taperStart), 0, 1);
  return sweep({
    center: centerline(S, Q, E), width, ts: HALF,
    startFace: norm(lerp(left(norm(sub(Q, S))), [0, 1], p.heel)),
  });
};

/** Horizontal leg S→C, then vertical leg C→E downward. 9 nodes. */
const hengzhe: Builder = ([S, C, E], g, all) => {
  const p = all.hengzhe, V = g.weight, H = horizontalStem(g);
  const hs = H * all.heng.startHeight * (1 + g.flare) / 2, hh = H / 2;
  const cut = Math.tan(all.heng.startCut * DEG) * hs;
  const we = V * all.shu.endWidth * (1 + g.flare), wt = V * p.turnWidth;
  const ic = p.innerCornerCut * V, s = p.shoulderSize * V;
  const tilt = Math.tan(p.legTilt * DEG);
  const dx = (y: number) => -tilt * (C[1] - y);
  const yb = C[1] - hh, y5 = yb - Math.min(1.5 * V, 0.5 * (C[1] - E[1]));
  return [
    { p: [S[0] - cut, C[1] - hs] },
    { p: [C[0] - V / 2 - ic, yb] },
    { p: [C[0] - V / 2 + dx(yb - ic), yb - ic] },
    { p: [E[0] - we / 2 + dx(E[1]), E[1]] },
    { p: [E[0] + we / 2 + dx(E[1]), E[1]] },
    { p: [C[0] + V / 2 + dx(y5), y5] },
    { p: [C[0] + wt / 2, C[1] + hh - s * Math.tan(p.shoulderAngle * DEG)] },
    { p: [C[0] + wt / 2 - s, C[1] + hh] },
    { p: [S[0] + cut, C[1] + hs] },
  ];
};

/** Vertical stem S→F (F is the lowest point), hook leaving up-left. 8 nodes. */
const shugou: Builder = ([S, F], g, all) => {
  const p = all.shugou, V = g.weight;
  const ws = V * all.shu.startWidth * (1 + g.flare);
  const a = p.hookAngle * DEG, h: Point = [-Math.cos(a), Math.sin(a)], u: Point = [Math.sin(a), Math.cos(a)];
  const xl = F[0] - V / 2, xr = F[0] + V / 2;
  const base = (p.hookBaseWidth * V) / Math.cos(a);
  const J: Point = [xl, F[1] + base];
  const T = add([xl, F[1] + base / 2], mul(h, p.hookLength * V));
  const tw = p.hookTipWidth * V;
  const tipU = add(T, mul(u, tw / 2)), tipL = sub(T, mul(u, tw / 2));
  const ir = p.innerRadius * V, e = norm(sub(tipU, J));
  const R = p.footRadius * V, bend = p.bottomBend * V;
  const n1a: Point = [xl, J[1] + ir], n1b = add(J, mul(e, ir));
  const n4: Point = [xr - R - bend, F[1]], n5: Point = [xr, F[1] + R];
  return [
    { p: [S[0] - ws / 2, S[1]] },
    { p: n1a, out: [xl, J[1] + ir * 0.45] },
    { p: n1b, in: add(J, mul(e, ir * 0.45)) },
    { p: tipU },
    { p: tipL },
    { p: n4, out: [n4[0] + (R + bend) * 0.55, n4[1]] },
    { p: n5, in: [n5[0], n5[1] - R * 0.55] },
    { p: [S[0] + ws / 2, S[1]] },
  ];
};

const BUILDERS: Record<StrokeType, Builder> = { heng, shu, pie, na, dian, ti, hengzhe, shugou };

/** Build the outline of one stroke from its skeleton key points. */
export function buildStroke(type: StrokeType, pts: Point[], g: GlobalParams, all: StrokeParamSet): Contour {
  return BUILDERS[type](pts, g, all);
}
