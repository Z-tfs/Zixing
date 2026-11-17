# Status

Updated 2026-11-17.

## Done

- **Phase 0** — scaffold, metric frame, editor shell (overview, edit view with metric lines, inspector).
- **Phase 1, first pass** — 8 stroke templates with fixed topology, Stroke Lab with node and skeleton layers, compatibility tests.

## Known issues

- Stroke shapes have not been compared with Source Han Sans yet; all template defaults are estimates.
- No reference overlay in the Stroke Lab.
- 竖钩: hook still too large and stiff at heavy weights.
- 捺: end face too long at heavy weights.
- `cornerRadius` is in the inspector but not used by any template.
- Glyphs in the overview and edit view are system-font placeholders.

## Next options

1. Reference overlay in the Stroke Lab, then tune the 8 strokes one by one.
2. Phase 2: skeleton editor and the 10 skeletons.
