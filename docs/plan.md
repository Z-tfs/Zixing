# Milestone 1 plan

Scope: 10 reference characters (口 回 国 人 木 林 小 江 打 量) · Hei style · 8 basic strokes (横 竖 撇 捺 点 提 横折 竖钩) · real outlines · pro-style editor UI.

## Pipeline

```
skeleton (key points + stroke types)
  → structural warp          face / center / gravity / slant (separable x/y, horizontals stay horizontal)
  → glyph-level corrections  enclosure shrink, visual size, overshoot
  → stroke weight solving    density compensation per axis → per-stroke H / V
  → join analysis            cross / T / L / contact
  → stroke templates         closed cubic contours, fixed topology
  → join corrections         cross thinning, T thinning, inner-corner traps
  → overlap removal          boolean union (Skia PathKit WASM)
  → cleanup                  direction, extrema, collinear nodes, integer coordinates
  → gray balance             measure coverage → nudge glyph weight → rebuild (max 3 passes)
```

Gray balance changes parameters, never outlines.

## Skeletons

- Key points only: 横 竖 撇 捺 点 提 and 竖钩 have 2 points, 横折 has 3.
- Free stroke ends are the outer extent of the stroke; ends that join another stroke sit on that stroke's centerline.
- Normalization: horizontals and verticals exactly axis-aligned, near-equal coordinates clustered, parallel strokes evenly spaced, touching ends snapped, symmetry axes mirrored, enclosures rectangular.
- Final skeletons are authored and locked by hand in the skeleton editor and stored in `skeletons/<char>.json`.

## Optical corrections (each one: toggle, strength, canvas overlay)

| Rule | Trigger | Effect | Hei default |
|---|---|---|---|
| crossThin | + crossing | both strokes thinner near the crossing | H −8%, V −4% |
| tJoinThin | T join | joining stroke thinner near the joint | −6% |
| innerCornerTrap | inner corners | small chamfer against clogging | 0.06 V |
| enclosureShrink | full enclosure | frame smaller than the face; less when the interior is dense | 0.82 → 0.94 |
| enclosureTaper | full enclosure | bottom slightly narrower than top | 1.5% |
| enclosureFoot | full enclosure | verticals extend below the bottom horizontal | 0.2 V |
| overshoot | pointed / diagonal ends on the face edge | pushed past the face box | 0.25 V |
| densityComp | stacked strokes per axis | thins H or V until an occupancy target is met | target 0.30, floor 0.72× |
| visualSize | sparse vs dense glyphs | small scale nudge | ±4% |
| grayBalance | whole set | per-glyph weight nudge from blurred coverage | ±10% |

## Editor views

- **Font overview** — glyph grid with character, code point, status.
- **Edit** — metric lines (em, face, center, gravity, baseline); layers: filled, outline + nodes, pre-union contours, skeleton, corrections, reference (Source Han Sans, OFL); skeleton edit and measure tools.
- **Stroke Lab** — the 8 templates at three weights with node view.
- **Waterfall** — editable text at 12 / 16 / 24 / 36 / 48 / 72 / 120 px.
- **Gray check** — small running text, blurred copy, coverage chart per glyph.
- **Inspector** — grouped numeric fields, scrub by dragging labels, hover highlights where a parameter acts.

## Phases

| Phase | Deliverable |
|---|---|
| 0 | Scaffold, core types, metric frame, editor shell |
| 1 | 8 stroke templates + Stroke Lab |
| 2 | Skeleton editor; 10 skeletons locked |
| 3 | Assembly, join analysis, union, optical corrections |
| 4 | Font overview with real glyphs, waterfall, gray check |
| 5 | Export (SVG / UFO / OTF) + validation |

## Acceptance

No dark spots at joins in the 16 px gray check · coverage spread within ±5% after balancing · clean outlines (no overlaps, extrema, correct direction) · point-compatible at V 24 / 78 / 170 · strokes read as Hei next to the Source Han Sans reference.
