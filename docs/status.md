# Status

Updated 2026-11-17.

## Done

- **Phase 0** — scaffold, metric frame, editor shell (overview, edit view with metric lines, inspector).
- **Phase 1, first pass** — 8 stroke templates with fixed topology, Stroke Lab with node and skeleton layers, compatibility tests.
- **Stroke Lab reference overlay, 横 竖 横折 撇 捺 点 提** — Source Han Sans SC Regular outlines of 十 人 小 打 口 in `src/editor/reference/` (OFL, outlines only). A Reference layer draws the reference glyph at original size behind the current-weight sample, aligned at the stroke start, corner or end and clipped to the sample box, with the reference V and H in the caption. 横 and 竖 use 十, 横折 uses 口, 撇 uses 人 (centre of the top face to centre of the tail face), 捺 uses 人 (from the 撇 centerline to the centre of the foot face); 点 uses the right dot of 小 (centre of the top face to centre of the bottom face); 提 uses the 提 of 打 (centre of the bottom-left start face to centre of the top-right tip face); strokes without a corner align at the start when Corner is chosen.

## Known issues

- Stroke shapes have not been compared with Source Han Sans yet; all template defaults are estimates.
- Reference overlay covers 横 竖 横折 撇 捺 点 提 only; 竖钩 still needs alignment points in `src/editor/reference.ts`.
- 撇: the reference stroke in 人 is about 981 units long and 26° off vertical, the sample is about 380 long and 35° off vertical, so only one end of the reference fits the sample box at a time; Start also shows where the 捺 branches off.
- 捺: the reference stroke in 人 is about 812 units long and 56° below horizontal, the sample is about 391 long and 50° below horizontal, so only one end fits the sample box at a time; with Start the 撇 crosses the box unlabelled and the foot is clipped. The start point rests on an estimated 撇 centerline, because the right edge of the 撇 is hidden under the 捺.
- 点: the reference stroke (right dot of 小) is about 487 units long and 23.5° off vertical, the sample is about 164 long and 38° off vertical, so only one end fits the sample box at a time and the two diverge quickly away from the aligned end.
- Seen in the overlay, not acted on yet: the reference 点 is nearly even in width (77 → 87) where ours starts at 0.45 V and grows to 1.08 V; its end face is straight where ours bulges; it bows the same way as ours but is straighter (about 0.04 against our 0.12).
- 提: the reference stroke in 打 is about 382 units long and 16° above horizontal, the sample is about 273 long and 28° above horizontal (the template clamps to 20°…35°, so it cannot go as flat as the reference), so only one end fits at a time; the 竖钩 of 打 crosses the box unlabelled.
- Seen in the overlay, not acted on yet: the reference 提 is nearly even in width (78 → 71) where ours goes from 1.08 V to 0.32 V; its start face is square to the stroke where ours is half upright (heel 0.5); its edges are straight where ours has a slight belly.
- Seen in the overlay, not acted on yet: the reference 捺 is nearly even in width (71 → 82) where ours starts at 0.55 V and grows; the foot faces differ in angle.
- The Corner button gives no visible hint that two-point strokes fall back to the start (tooltip only).
- The caption stems (V 81 / H 77) are measured on 十; 口 itself has H 75 and a right vertical of V 80.
- The reference is a single weight (Regular, V 81 / H 77) and is only shown behind the current-weight sample.
- Seen in the overlay, not acted on yet: the reference horizontal is H 77 where ours is H 68.6 at V 78 with 12% contrast.
- 竖钩: hook still too large and stiff at heavy weights.
- 捺: end face too long at heavy weights.
- `cornerRadius` is in the inspector but not used by any template.
- Glyphs in the overview and edit view are system-font placeholders.

## Next options

1. Extend the reference overlay to the last stroke (竖钩).
2. Tune the 8 strokes against the reference, one by one.
3. Phase 2: skeleton editor and the 10 skeletons.
