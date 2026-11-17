# Zixing 字型

A parametric Chinese type engine for designers and brands: numeric control plus on-canvas visual anchors, with Latin/Chinese pairing in mind.

Status: **Milestone 1, Phase 1** — the 8 stroke templates and the Stroke Lab are in; glyphs are not assembled yet.

## Milestone 1

10 reference characters (口 回 国 人 木 林 小 江 打 量) · Hei style · 8 basic strokes (横 竖 撇 捺 点 提 横折 竖钩).

| Phase | Deliverable | State |
|---|---|---|
| 0 | Repo, core types, metric frame, editor shell | done |
| 1 | 8 parametric stroke templates + Stroke Lab | first pass, tuning against reference pending |
| 2 | Skeleton normalizer + skeleton editor; 10 skeletons locked | next |
| 3 | Assembly, join analysis, overlap removal, optical corrections | |
| 4 | Font overview, waterfall, gray check | |
| 5 | Export (SVG / UFO / OTF) + validation | |

## Principles

- Strokes are designed outline templates, not pen traces along a centerline.
- Skeletons only carry stroke position and type, and are authored in this editor.
- Stroke parameters are multiples of the vertical stem, so one template serves every weight.
- Node topology per glyph is fixed, so all weights stay point-compatible.
- Optical corrections are separate, named, toggleable rules.

## Metric frame

UPM 1000 · ideographic em box y −120…880 · Latin baseline y 0 · face box (字面), center box (中宫) and gravity line (重心) derived from parameters.

## Layout

```
src/core/     engine: types, parameters, metric frame, stroke templates (pure functions, tested)
src/editor/   editor UI (Vite + TypeScript, Canvas 2D)
skeletons/    hand-locked skeleton data, one JSON per character
```

## Develop

```
npm install
npm run dev      # editor at http://localhost:5173
npm test
npm run build
```

Keys: `1`–`5` switch views · drag to pan · ⌘/Ctrl + scroll to zoom · ⌘/Ctrl `+` `-` `0`.
