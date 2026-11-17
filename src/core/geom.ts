import type { Contour, Point, Rect } from './types';

export const DEG = Math.PI / 180;
export const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Point, k: number): Point => [a[0] * k, a[1] * k];
export const dot = (a: Point, b: Point): number => a[0] * b[0] + a[1] * b[1];
export const len = (a: Point): number => Math.hypot(a[0], a[1]);
export const norm = (a: Point): Point => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
/** Left normal (counter-clockwise quarter turn, y-up). */
export const left = (a: Point): Point => [-a[1], a[0]];
export const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const rotate = (a: Point, rad: number): Point => {
  const c = Math.cos(rad), s = Math.sin(rad);
  return [a[0] * c - a[1] * s, a[0] * s + a[1] * c];
};
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** True if the segment from node i to the next node is a curve. */
export function isCurve(c: Contour, i: number): boolean {
  const a = c[i], b = c[(i + 1) % c.length];
  return !!(a.out || b.in);
}

/** SVG path data for a closed contour (font units, y-up). */
export function contourToPath(c: Contour): string {
  const f = (p: Point) => `${+p[0].toFixed(2)} ${+p[1].toFixed(2)}`;
  let d = `M${f(c[0].p)}`;
  for (let i = 0; i < c.length; i++) {
    const a = c[i], b = c[(i + 1) % c.length];
    d += isCurve(c, i) ? `C${f(a.out ?? a.p)} ${f(b.in ?? b.p)} ${f(b.p)}` : `L${f(b.p)}`;
  }
  return d + 'Z';
}

/** Polyline approximation of a contour. */
export function flatten(c: Contour, steps = 16): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < c.length; i++) {
    const a = c[i], b = c[(i + 1) % c.length];
    if (!isCurve(c, i)) { out.push(a.p); continue; }
    const p1 = a.out ?? a.p, p2 = b.in ?? b.p;
    for (let s = 0; s < steps; s++) {
      const t = s / steps, u = 1 - t;
      out.push([
        u * u * u * a.p[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * b.p[0],
        u * u * u * a.p[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * b.p[1],
      ]);
    }
  }
  return out;
}

/** Signed area; positive means counter-clockwise in y-up coordinates. */
export function area(c: Contour): number {
  const pts = flatten(c);
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

export function bounds(c: Contour): Rect {
  const pts = flatten(c);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
