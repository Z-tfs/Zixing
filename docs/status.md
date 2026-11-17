# Status

Updated 2026-11-17.

## Done

- **Phase 0** — scaffold, metric frame, editor shell (overview, edit view with metric lines, inspector).
- **Phase 1, first pass** — 8 stroke templates with fixed topology, Stroke Lab with node and skeleton layers, compatibility tests.
- **Stroke Lab reference overlay, 横 and 竖** — Source Han Sans SC Regular outlines of 十 人 小 打 口 in `src/editor/reference/` (OFL, outlines only). A Reference layer draws the reference glyph at original size behind the current-weight sample, aligned at the stroke start or end and clipped to the sample box, with the reference V and H in the caption.

## Known issues

- Stroke shapes have not been compared with Source Han Sans yet; all template defaults are estimates.
- Reference overlay covers 横 and 竖 only; 撇 捺 点 提 横折 竖钩 still need alignment points in `src/editor/reference.ts`.
- The reference is a single weight (Regular, V 81 / H 77) and is only shown behind the current-weight sample.
- Seen in the overlay, not acted on yet: the reference horizontal is H 77 where ours is H 68.6 at V 78 with 12% contrast.
- 竖钩: hook still too large and stiff at heavy weights.
- 捺: end face too long at heavy weights.
- `cornerRadius` is in the inspector but not used by any template.
- Glyphs in the overview and edit view are system-font placeholders.

## Next options

1. Extend the reference overlay to the remaining six strokes, one stroke per step (横折 with 口 first).
2. Tune the 8 strokes against the reference, one by one.
3. Phase 2: skeleton editor and the 10 skeletons.
