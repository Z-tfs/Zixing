import './style.css';
import {
  CHARSET, GLOBAL_SPECS, HEI_DEFAULTS, STROKE_LABELS, STROKE_SPECS, UPM, clampParam, defaultStrokeParams,
  horizontalStem, metricFrame,
  type GlobalParams, type ParamSpec, type Rect, type StrokeType,
} from '../core';
import { renderLab, type LabMode } from './lab';

// ---------- state ----------
type ViewId = 'overview' | 'edit' | 'strokes' | 'waterfall' | 'gray';
type Layer = 'em' | 'face' | 'center' | 'gravity' | 'baseline' | 'grid';

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'overview', label: 'Font overview' },
  { id: 'edit', label: 'Edit' },
  { id: 'strokes', label: 'Stroke Lab' },
  { id: 'waterfall', label: 'Waterfall' },
  { id: 'gray', label: 'Gray check' },
];
const LAYERS: { id: Layer; label: string }[] = [
  { id: 'em', label: 'Em box' },
  { id: 'face', label: 'Face 字面' },
  { id: 'center', label: 'Center 中宫' },
  { id: 'gravity', label: 'Gravity 重心' },
  { id: 'baseline', label: 'Baseline' },
  { id: 'grid', label: 'Grid' },
];

const state = {
  view: 'overview' as ViewId,
  params: { ...HEI_DEFAULTS } as GlobalParams,
  strokeParams: defaultStrokeParams(),
  labStroke: 'heng' as StrokeType,
  labModes: new Set<LabMode>(['fill', 'nodes']),
  labReference: { anchor: 'start' as 'start' | 'end' },
  char: CHARSET[0].char as string,
  hot: null as string | null,
  layers: new Set<Layer>(['em', 'face', 'center', 'gravity', 'baseline']),
  cell: 112,
  zoom: 1,
  pan: { x: 0, y: 0 },
};

const app = document.getElementById('app')!;
app.innerHTML = `
<div class="shell">
  <div class="topbar">
    <div class="brand">Zixing 字型<span>Hei · Regular</span></div>
    <div class="tabs" id="tabs"></div>
    <div class="spacer"></div>
    <div class="meta">Milestone 1 · Phase 1</div>
  </div>
  <div class="view" id="view"></div>
  <div class="inspector" id="inspector"></div>
  <div class="statusbar" id="status"></div>
</div>`;
const $view = document.getElementById('view')!;
const $tabs = document.getElementById('tabs')!;
const $insp = document.getElementById('inspector')!;
const $status = document.getElementById('status')!;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

// ---------- formatting ----------
function fmt(spec: ParamSpec, v: number): string {
  if (spec.unit === '%') return (v * 100).toFixed(1);
  if (spec.step >= 1) return String(Math.round(v));
  return v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}
function parse(spec: ParamSpec, s: string, current: number): number {
  const n = parseFloat(s);
  if (Number.isNaN(n)) return current;
  return clampParam(spec, spec.unit === '%' ? n / 100 : n);
}
const globals = () => state.params as unknown as Record<string, number>;
function changed() {
  syncInspector();
  redraw();
}

// ---------- tabs ----------
function renderTabs() {
  $tabs.innerHTML = '';
  VIEWS.forEach((v, i) => {
    const b = el('button', 'tab' + (state.view === v.id ? ' on' : ''));
    b.append(v.label, el('kbd', '', String(i + 1)));
    b.onclick = () => setView(v.id);
    $tabs.append(b);
  });
}
function setView(v: ViewId) {
  state.view = v;
  history.replaceState(null, '', '#' + v);
  renderTabs();
  renderInspector();
  renderView();
}

// ---------- inspector ----------
interface Row { range: HTMLInputElement; num: HTMLInputElement; row: HTMLElement; spec: ParamSpec; get: () => number }
const inputs = new Map<string, Row>();
let $tip: HTMLElement, $derived: HTMLElement;

function makeRow(id: string, spec: ParamSpec, get: () => number, set: (v: number) => void): HTMLElement {
  const row = el('div', 'row');
  const label = el('label');
  label.append(spec.en, el('small', '', spec.zh + (spec.unit ? ' · ' + spec.unit : '')));
  const range = el('input');
  range.type = 'range'; range.min = String(spec.min); range.max = String(spec.max); range.step = String(spec.step);
  const num = el('input');
  num.type = 'number'; num.step = String(spec.unit === '%' ? spec.step * 100 : spec.step);
  const apply = (v: number) => { set(v); changed(); };
  range.oninput = () => apply(+range.value);
  num.onchange = () => apply(parse(spec, num.value, get()));
  // drag the label to scrub
  label.onpointerdown = (ev) => {
    const x0 = ev.clientX, v0 = get();
    label.setPointerCapture(ev.pointerId);
    label.onpointermove = (e) => apply(clampParam(spec, v0 + Math.round((e.clientX - x0) / 2) * spec.step * (e.shiftKey ? 10 : 1)));
    label.onpointerup = () => { label.onpointermove = null; };
  };
  row.onmouseenter = () => setHot(id);
  row.onmouseleave = () => setHot(null);
  row.append(label, range, num);
  inputs.set(id, { range, num, row, spec, get });
  return row;
}

function renderInspector() {
  $insp.innerHTML = '';
  inputs.clear();
  for (const group of ['Structure', 'Stroke'] as const) {
    const g = el('div', 'group');
    g.append(el('h3', '', group));
    for (const spec of GLOBAL_SPECS.filter((x) => x.group === group)) {
      g.append(makeRow(spec.key, spec, () => globals()[spec.key], (v) => { globals()[spec.key] = v; }));
    }
    $insp.append(g);
  }
  if (state.view === 'strokes') {
    const type = state.labStroke, set = state.strokeParams[type];
    const g = el('div', 'group');
    g.append(el('h3', '', `Template · ${STROKE_LABELS[type].zh} ${type}`));
    for (const spec of STROKE_SPECS[type]) g.append(makeRow('t:' + spec.key, spec, () => set[spec.key], (v) => { set[spec.key] = v; }));
    $insp.append(g);
  }
  const d = el('div', 'group');
  d.append(el('h3', '', 'Derived'));
  $derived = el('div');
  d.append($derived);
  $insp.append(d);

  const l = el('div', 'group');
  l.append(el('h3', '', 'Guides'));
  const toggles = el('div', 'toggles');
  for (const layer of LAYERS) {
    const c = el('button', 'chip' + (state.layers.has(layer.id) ? ' on' : ''), layer.label);
    c.onclick = () => {
      state.layers.has(layer.id) ? state.layers.delete(layer.id) : state.layers.add(layer.id);
      c.classList.toggle('on');
      redraw();
    };
    toggles.append(c);
  }
  l.append(toggles);
  $insp.append(l);

  $tip = el('div', 'tip');
  $insp.append($tip);
  const reset = el('button', 'reset', 'Reset to Hei defaults');
  reset.onclick = () => { state.params = { ...HEI_DEFAULTS }; state.strokeParams = defaultStrokeParams(); renderInspector(); renderView(); };
  $insp.append(reset);
  syncInspector();
  setHot(null);
}

function syncInspector() {
  for (const o of inputs.values()) {
    o.range.value = String(o.get());
    if (document.activeElement !== o.num) o.num.value = fmt(o.spec, o.get());
  }
  const m = metricFrame(state.params);
  const kv = (a: string, b: string) => `<div class="kv"><span>${a}</span><b>${b}</b></div>`;
  $derived.innerHTML =
    kv('Horizontal stem (H)', horizontalStem(state.params).toFixed(1) + ' u') +
    kv('Face box', Math.round(m.face.x1 - m.face.x0) + ' u') +
    kv('Center box', Math.round(m.center.x1 - m.center.x0) + ' u') +
    kv('Gravity line', 'y ' + Math.round(m.gravityY));
}

function setHot(k: string | null) {
  state.hot = k;
  for (const [key, o] of inputs) o.row.classList.toggle('hot', key === k);
  const spec = k ? inputs.get(k)?.spec : undefined;
  $tip.innerHTML = spec
    ? `<b>${spec.en} · ${spec.zh}</b>${spec.tip}`
    : `<b>Every glyph comes from the same numbers.</b>Hover a parameter to see where it acts; drag a label to scrub its value.`;
  redraw();
}

// ---------- views ----------
let redraw: () => void = () => {};

function renderView() {
  $view.innerHTML = '';
  redraw = () => {};
  if (state.view === 'overview') renderOverview();
  else if (state.view === 'edit') renderEdit();
  else if (state.view === 'strokes') renderStrokeLab();
  else renderEmpty(state.view);
  renderStatus();
}

function renderStatus() {
  const c = CHARSET.find((x) => x.char === state.char)!;
  $status.innerHTML = `<span>${c.char} · ${c.unicode}</span><span>${c.note}</span><span>UPM ${UPM}</span><span>${CHARSET.length} glyphs · 0 outlines</span>`;
}

function renderOverview() {
  const wrap = el('div', 'overview');
  const bar = el('div', 'ov-bar');
  bar.append('Cell size');
  const size = el('input');
  size.type = 'range'; size.min = '64'; size.max = '200'; size.value = String(state.cell);
  bar.append(size, el('span', '', 'Skeletons not locked yet — placeholders show the system font.'));
  const grid = el('div', 'grid');
  const layout = () => {
    grid.style.gridTemplateColumns = `repeat(auto-fill, ${state.cell}px)`;
    grid.style.width = '100%';
    grid.querySelectorAll<HTMLElement>('.cell').forEach((c) => {
      c.style.height = state.cell + 22 + 'px';
      (c.firstElementChild as HTMLElement).style.fontSize = state.cell * 0.66 + 'px';
    });
  };
  size.oninput = () => { state.cell = +size.value; layout(); };
  for (const c of CHARSET) {
    const cell = el('div', 'cell' + (c.char === state.char ? ' sel' : ''));
    cell.title = c.note;
    cell.append(el('div', 'glyph', c.char));
    const cap = el('div', 'cap');
    const left = el('span');
    left.append(el('b', '', c.char), ' ' + c.unicode);
    cap.append(left, el('span', 'dot'));
    cell.append(cap);
    cell.onclick = () => {
      state.char = c.char;
      grid.querySelectorAll('.cell').forEach((x) => x.classList.remove('sel'));
      cell.classList.add('sel');
      renderStatus();
    };
    cell.ondblclick = () => { state.char = c.char; setView('edit'); };
    grid.append(cell);
  }
  wrap.append(bar, grid);
  $view.append(wrap);
  layout();
}

function renderStrokeLab() {
  redraw = renderLab($view, {
    params: state.params,
    strokeParams: state.strokeParams,
    selected: state.labStroke,
    modes: state.labModes,
    reference: state.labReference,
    onSelect: (type) => { state.labStroke = type; renderInspector(); renderView(); },
  });
}

function renderEmpty(v: ViewId) {
  const info: Record<string, [string, string, string]> = {
    waterfall: ['Phase 4', 'Waterfall', 'Editable text at 12 / 16 / 24 / 36 / 48 / 72 / 120 px, with optional Latin pairing.'],
    gray: ['Phase 4', 'Gray check', 'Running text at small size next to a blurred copy, plus a coverage chart per glyph.'],
  };
  const [phase, title, text] = info[v];
  const e = el('div', 'empty');
  e.append(el('span', 'phase', phase), el('h2', '', title), el('p', '', text));
  $view.append(e);
}

// ---------- edit view ----------
function renderEdit() {
  const wrap = el('div', 'edit');
  const canvas = el('canvas');
  const hud = el('div', 'hud');
  const zoom = el('div', 'zoom');
  const strip = el('div', 'strip');
  wrap.append(canvas, hud, zoom, strip);
  $view.append(wrap);

  for (const [label, fn] of [
    ['−', () => { state.zoom = Math.max(0.25, state.zoom / 1.25); }],
    ['Fit', () => { state.zoom = 1; state.pan = { x: 0, y: 0 }; }],
    ['+', () => { state.zoom = Math.min(16, state.zoom * 1.25); }],
  ] as [string, () => void][]) {
    const b = el('button', '', label);
    b.onclick = () => { fn(); draw(); };
    zoom.append(b);
  }
  for (const c of CHARSET) {
    const b = el('button', c.char === state.char ? 'on' : '', c.char);
    b.onclick = () => {
      state.char = c.char;
      strip.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      renderStatus(); draw();
    };
    strip.append(b);
  }

  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, scale = 1, ox = 0, oy = 0;
  // font units (y-up) → css px
  const X = (x: number) => ox + x * scale;
  const Y = (y: number) => oy - y * scale;

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const r = wrap.getBoundingClientRect();
    W = r.width; H = r.height - 56;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    scale = (Math.min(W, H) * 0.78 / UPM) * state.zoom;
    ox = W / 2 - 500 * scale + state.pan.x;
    oy = H / 2 + 380 * scale + state.pan.y;

    const m = metricFrame(state.params);
    const css = getComputedStyle(document.documentElement);
    const guide = css.getPropertyValue('--guide'), soft = css.getPropertyValue('--guide-soft'), accent = css.getPropertyValue('--accent');
    const hot = state.hot;
    ctx.font = '10px Inter, sans-serif';

    const rect = (b: Rect, color: string, dash: number[], width = 1) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
      ctx.strokeRect(Math.round(X(b.x0)) + .5, Math.round(Y(b.y1)) + .5, Math.round((b.x1 - b.x0) * scale), Math.round((b.y1 - b.y0) * scale));
      ctx.restore();
    };
    const hline = (y: number, color: string, label: string, dash: number[] = [], width = 1) => {
      ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
      const py = Math.round(Y(y)) + .5;
      ctx.beginPath(); ctx.moveTo(X(-140), py); ctx.lineTo(X(UPM + 140), py); ctx.stroke();
      ctx.fillText(label, X(UPM + 140) + 6, py + 3);
      ctx.restore();
    };
    const label = (b: Rect, text: string, color: string) => {
      ctx.save(); ctx.fillStyle = color; ctx.fillText(text, X(b.x0) + 4, Y(b.y1) - 5); ctx.restore();
    };

    if (state.layers.has('grid')) {
      ctx.save(); ctx.strokeStyle = soft; ctx.lineWidth = 1; ctx.globalAlpha = .6;
      for (let i = 1; i < 10; i++) {
        const px = Math.round(X(i * 100)) + .5, py = Math.round(Y(m.em.y0 + i * 100)) + .5;
        ctx.beginPath(); ctx.moveTo(px, Y(m.em.y1)); ctx.lineTo(px, Y(m.em.y0)); ctx.moveTo(X(0), py); ctx.lineTo(X(UPM), py); ctx.stroke();
      }
      ctx.restore();
    }
    // placeholder glyph: system font, to judge the frame until outlines exist
    ctx.save();
    ctx.fillStyle = '#dedcd5';
    ctx.textAlign = 'center';
    const face = m.face;
    const px = (face.x1 - face.x0) * scale;
    ctx.font = `${px}px "PingFang SC","Noto Sans CJK SC","Source Han Sans SC","Microsoft YaHei",sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(state.char, X(500), Y(face.y0) - px * 0.12);
    ctx.restore();
    ctx.font = '10px Inter, sans-serif';

    if (state.layers.has('em')) { rect(m.em, guide, []); label(m.em, 'em 1000', guide); }
    if (state.layers.has('baseline')) hline(m.baseline, guide, 'baseline 0', [1, 3]);
    if (state.layers.has('face')) {
      const on = hot === 'face';
      rect(m.face, on ? accent : guide, [6, 4], on ? 2 : 1);
      label(m.face, `face ${Math.round(m.face.x1 - m.face.x0)}`, on ? accent : guide);
    }
    if (state.layers.has('center')) {
      const on = hot === 'centerRatio';
      rect(m.center, on ? accent : guide, [2, 3], on ? 2 : 1);
      label(m.center, `center ${Math.round(m.center.x1 - m.center.x0)}`, on ? accent : guide);
    }
    if (state.layers.has('gravity')) {
      const on = hot === 'gravity';
      hline(m.gravityY, on ? accent : guide, `gravity ${Math.round(m.gravityY)}`, [], on ? 2 : 1);
    }
    // center cross
    ctx.save(); ctx.strokeStyle = guide; ctx.beginPath();
    ctx.moveTo(X(500) - 6, Y(380) + .5); ctx.lineTo(X(500) + 6, Y(380) + .5);
    ctx.moveTo(X(500) + .5, Y(380) - 6); ctx.lineTo(X(500) + .5, Y(380) + 6); ctx.stroke(); ctx.restore();

    // stem gauge
    if (hot === 'weight' || hot === 'contrast') {
      const V = state.params.weight * scale, Hh = horizontalStem(state.params) * scale;
      ctx.save(); ctx.fillStyle = accent;
      ctx.fillRect(X(m.em.x0), Y(m.em.y0) + 14, V, 60);
      ctx.fillRect(X(m.em.x0) + V + 10, Y(m.em.y0) + 14, 60, Hh);
      ctx.fillText(`V ${Math.round(state.params.weight)} · H ${horizontalStem(state.params).toFixed(1)}`, X(m.em.x0) + V + 80, Y(m.em.y0) + 24);
      ctx.restore();
    }
    hud.textContent = `${state.char} · ${Math.round(state.zoom * 100)}% · placeholder glyph (system font) — outlines arrive in Phase 3`;
  }

  // pan (drag) and zoom (wheel / pinch)
  canvas.onpointerdown = (ev) => {
    const s = { x: ev.clientX - state.pan.x, y: ev.clientY - state.pan.y };
    canvas.setPointerCapture(ev.pointerId);
    canvas.style.cursor = 'grabbing';
    canvas.onpointermove = (e) => { state.pan = { x: e.clientX - s.x, y: e.clientY - s.y }; draw(); };
    canvas.onpointerup = () => { canvas.onpointermove = null; canvas.style.cursor = 'grab'; };
  };
  canvas.style.cursor = 'grab';
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    if (ev.ctrlKey || ev.metaKey) {
      const r = canvas.getBoundingClientRect();
      const mx = ev.clientX - r.left, my = ev.clientY - r.top;
      const ux = (mx - ox) / scale, uy = (oy - my) / scale;
      const z = Math.min(16, Math.max(0.25, state.zoom * Math.exp(-ev.deltaY * 0.01)));
      const s2 = scale / state.zoom * z;
      state.pan.x += mx - (W / 2 - 500 * s2 + state.pan.x) - ux * s2;
      state.pan.y += my - (H / 2 + 380 * s2 + state.pan.y) + uy * s2;
      state.zoom = z;
    } else { state.pan.x -= ev.deltaX; state.pan.y -= ev.deltaY; }
    draw();
  }, { passive: false });

  redraw = draw;
  draw();
}

// ---------- keyboard ----------
window.addEventListener('keydown', (ev) => {
  if ((ev.target as HTMLElement).tagName === 'INPUT') return;
  const i = '12345'.indexOf(ev.key);
  if (i >= 0) { setView(VIEWS[i].id); return; }
  if (state.view === 'edit' && (ev.metaKey || ev.ctrlKey)) {
    if (ev.key === '=' || ev.key === '+') { state.zoom = Math.min(16, state.zoom * 1.25); ev.preventDefault(); redraw(); }
    if (ev.key === '-') { state.zoom = Math.max(0.25, state.zoom / 1.25); ev.preventDefault(); redraw(); }
    if (ev.key === '0') { state.zoom = 1; state.pan = { x: 0, y: 0 }; ev.preventDefault(); redraw(); }
  }
});
window.addEventListener('resize', () => redraw());

const initial = VIEWS.find((v) => v.id === location.hash.slice(1));
if (initial) state.view = initial.id;
renderTabs();
renderInspector();
renderView();
