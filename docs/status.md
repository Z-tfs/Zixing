# Status

Updated 2026-11-17.

## Done

- **Phase 0** — scaffold, metric frame, editor shell (overview, edit view with metric lines, inspector).
- **Phase 1, first pass** — 8 stroke templates with fixed topology, Stroke Lab with node and skeleton layers, compatibility tests.
- **Stroke Lab reference overlay, 横 竖 横折** — Source Han Sans SC Regular outlines of 十 人 小 打 口 in `src/editor/reference/` (OFL, outlines only). A Reference layer draws the reference glyph at original size behind the current-weight sample, aligned at the stroke start, corner or end and clipped to the sample box, with the reference V and H in the caption. 横 and 竖 use 十, 横折 uses 口; strokes without a corner align at the start when Corner is chosen.

## Known issues

- Stroke shapes have not been compared with Source Han Sans yet; all template defaults are estimates.
- Reference overlay covers 横 竖 横折 only; 撇 捺 点 提 竖钩 still need alignment points in `src/editor/reference.ts`.
- The Corner button gives no visible hint that two-point strokes fall back to the start (tooltip only).
- The caption stems (V 81 / H 77) are measured on 十; 口 itself has H 75 and a right vertical of V 80.
- The reference is a single weight (Regular, V 81 / H 77) and is only shown behind the current-weight sample.
- Seen in the overlay, not acted on yet: the reference horizontal is H 77 where ours is H 68.6 at V 78 with 12% contrast.
- 竖钩: hook still too large and stiff at heavy weights.
- 捺: end face too long at heavy weights.
- `cornerRadius` is in the inspector but not used by any template.
- Glyphs in the overview and edit view are system-font placeholders.

## Next options

1. Extend the reference overlay to the remaining five strokes, one stroke per step (撇 捺 点 提 竖钩).
2. Tune the 8 strokes against the reference, one by one.
3. Phase 2: skeleton editor and the 10 skeletons.
