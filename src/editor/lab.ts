import {
  SAMPLE_BOX, STROKE_LABELS, STROKE_SAMPLES, STROKE_TYPES, buildStroke, isCurve,
  type Contour, type GlobalParams, type StrokeParamSet, type StrokeType,
} from '../core';
import { REFERENCE_NAME, strokeReference, type ReferenceAnchor } from './reference';

export type LabMode = 'fill' | 'nodes' | 'skeleton' | 'reference';
export interface LabContext {
  params: GlobalParams;
  strokeParams: StrokeParamSet;
  selected: StrokeType;
  modes: Set<LabMode>;
  /** Reference overlay options; mutated by the toolbar. */
  reference: { anchor: ReferenceAnchor };
  onSelect(type: StrokeType): void;
}

const LIGHT = 24, HEAVY = 170;
const REFERENCE_COLOR = '#0e9aa7';
const MODES: { id: LabMode; label: string }[] = [
  { id: 'fill', label: 'Filled' },
  { id: 'nodes', label: 'Outline + nodes' },
  { id: 'skeleton', label: 'Skeleton' },
  { id: 'reference', label: 'Reference' },
];

export function tracePath(ctx: CanvasRenderingContext2D, c: Contour, X: (x: number) => number, Y: (y: number) => number) {
  ctx.moveTo(X(c[0].p[0]), Y(c[0].p[1]));
  for (let i = 0; i < c.length; i++) {
    const a = c[i], b = c[(i + 1) % c.length];
    if (isCurve(c, i)) {
      const p1 = a.out ?? a.p, p2 = b.in ?? b.p;
      ctx.bezierCurveTo(X(p1[0]), Y(p1[1]), X(p2[0]), Y(p2[1]), X(b.p[0]), Y(b.p[1]));
    } else ctx.lineTo(X(b.p[0]), Y(b.p[1]));
  }
  ctx.closePath();
}

export function drawNodes(ctx: CanvasRenderingContext2D, c: Contour, X: (x: number) => number, Y: (y: number) => number, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1;
  for (const n of c) {
    for (const h of [n.in, n.out]) {
      if (!h || (h[0] === n.p[0] && h[1] === n.p[1])) continue;
      ctx.globalAlpha = .55;
      ctx.beginPath(); ctx.moveTo(X(n.p[0]), Y(n.p[1])); ctx.lineTo(X(h[0]), Y(h[1])); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(X(h[0]), Y(h[1]), 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const n of c) {
    const x = X(n.p[0]), y = Y(n.p[1]);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    if (n.smooth) ctx.arc(x, y, 3, 0, Math.PI * 2); else ctx.rect(x - 2.5, y - 2.5, 5, 5);
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/** Stroke Lab: the 8 templates, each at light / current / heavy weight. Returns a redraw function. */
export function renderLab(host: HTMLElement, lab: LabContext): () => void {
  const wrap = document.createElement('div');
  wrap.className = 'lab';
  const bar = document.createElement('div');
  bar.className = 'lab-bar';
  for (const m of MODES) {
    const b = document.createElement('button');
    b.className = 'chip' + (lab.modes.has(m.id) ? ' on' : '');
    b.textContent = m.label;
    b.onclick = () => { lab.modes.has(m.id) ? lab.modes.delete(m.id) : lab.modes.add(m.id); b.classList.toggle('on'); syncAnchor(); draw(); };
    bar.append(b);
  }
  const anchors = (['start', 'end'] as const).map((id) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = id === 'start' ? 'Start' : 'End';
    b.title = `Align the ${id} of the reference stroke with the sample`;
    b.onclick = () => { lab.reference.anchor = id; syncAnchor(); draw(); };
    return { id, b };
  });
  const syncAnchor = () => {
    const off = !lab.modes.has('reference');
    for (const { id, b } of anchors) { b.disabled = off; b.classList.toggle('on', !off && lab.reference.anchor === id); }
  };
  const align = document.createElement('div');
  align.className = 'lab-align';
  align.append('Align', ...anchors.map((a) => a.b));
  syncAnchor();
  bar.append(align);
  const note = document.createElement('span');
  note.textContent = 'Each stroke at three weights. Click a stroke to edit its template.';
  bar.append(note);
  const grid = document.createElement('div');
  grid.className = 'lab-grid';
  wrap.append(bar, grid);
  host.append(wrap);

  const cells = STROKE_TYPES.map((type) => {
    const cell = document.createElement('div');
    cell.className = 'lab-cell' + (type === lab.selected ? ' sel' : '');
    const head = document.createElement('div');
    head.className = 'lab-head';
    const canvas = document.createElement('canvas');
    cell.append(head, canvas);
    cell.onclick = () => lab.onSelect(type);
    grid.append(cell);
    return { type, cell, head, canvas };
  });

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue('--accent'), guide = css.getPropertyValue('--guide'), ink = css.getPropertyValue('--ink');
    const weights = [LIGHT, lab.params.weight, HEAVY];
    for (const { type, head, canvas } of cells) {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      const pad = 40, slot = SAMPLE_BOX + pad * 2;
      const scale = Math.min(r.width / (slot * 3), (r.height - 18) / slot);
      const left = (r.width - slot * 3 * scale) / 2;
      let nodes = 0;
      weights.forEach((w, i) => {
        const ox = left + (i * slot + pad) * scale, oy = (pad + SAMPLE_BOX) * scale;
        const X = (x: number) => ox + x * scale, Y = (y: number) => oy - y * scale;
        const c = buildStroke(type, STROKE_SAMPLES[type], { ...lab.params, weight: w }, lab.strokeParams);
        nodes = c.length;
        const showNodes = lab.modes.has('nodes');
        // Reference sits behind the current-weight sample only, clipped to the sample box; its outline is repeated on top below.
        const ref = lab.modes.has('reference') && i === 1 ? strokeReference(type, STROKE_SAMPLES[type], lab.reference.anchor) : null;
        const traceRef = () => {
          ctx.beginPath();
          ctx.rect(X(0), Y(SAMPLE_BOX), SAMPLE_BOX * scale, SAMPLE_BOX * scale);
          ctx.clip();
          ctx.beginPath();
          for (const rc of ref!.contours) tracePath(ctx, rc, X, Y);
        };
        if (ref) {
          ctx.save(); traceRef();
          ctx.globalAlpha = .28; ctx.fillStyle = REFERENCE_COLOR; ctx.fill();
          ctx.restore();
        }
        if (lab.modes.has('fill')) {
          ctx.beginPath(); tracePath(ctx, c, X, Y);
          ctx.fillStyle = showNodes ? '#d9d7d0' : ink; ctx.fill();
        }
        if (showNodes) {
          ctx.beginPath(); tracePath(ctx, c, X, Y);
          ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.stroke();
          drawNodes(ctx, c, X, Y, accent);
        }
        if (lab.modes.has('skeleton')) {
          const pts = STROKE_SAMPLES[type];
          ctx.save(); ctx.strokeStyle = '#2f7de1'; ctx.fillStyle = '#2f7de1'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.stroke();
          ctx.setLineDash([]);
          for (const p of pts) { ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 2.5, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
        }
        if (ref) {
          ctx.save(); traceRef();
          ctx.strokeStyle = REFERENCE_COLOR; ctx.lineWidth = 1; ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = guide; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center';
        const cx = ox + (SAMPLE_BOX / 2) * scale;
        if (ref) {
          const own = `V ${Math.round(w)}  `, refText = `${ref.char} ${REFERENCE_NAME} · V ${ref.stemV} · H ${ref.stemH}`;
          const wOwn = ctx.measureText(own).width, x0 = cx - (wOwn + ctx.measureText(refText).width) / 2;
          ctx.textAlign = 'left';
          ctx.fillText(own, x0, r.height - 5);
          ctx.fillStyle = REFERENCE_COLOR; ctx.fillText(refText, x0 + wOwn, r.height - 5);
        } else ctx.fillText(`V ${Math.round(w)}`, cx, r.height - 5);
      });
      const l = STROKE_LABELS[type];
      head.innerHTML = `<b>${l.zh}</b> ${type} · ${l.en}<span>${nodes} nodes</span>`;
    }
  }
  draw();
  return draw;
}
