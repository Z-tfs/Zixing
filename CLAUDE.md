# Zixing — working rules for Claude

## How to work with Zhihan (most important)

- **One step at a time, then stop.** Do one small, reviewable step, then stop and ask for her opinion before doing anything else. Never chain several steps or start the next phase on your own.
- **Before starting a step:** say in 2–3 sentences what you are about to do and what she will be able to look at afterwards. If the step involves a design or scope choice, ask first.
- **After finishing a step:** show the result (screenshot of the editor, or exact steps to see it locally), say what changed, what is still rough, and list the next options. Then wait.
- **A step is small:** one stroke template tuned, one view added, one correction rule. If it touches more than ~3 files or takes more than one commit, split it.
- **Visual judgement is hers.** Shapes, proportions, defaults and UI look are design decisions: propose, show, and let her decide. Do not declare a shape "done".
- **One feature per session, one branch per feature.** Work on a feature branch, open a PR when she approves the step; do not push to `main` directly.
- Do not add dependencies, restructure folders or change parameter names without asking.

## Language

- Chat with Zhihan in Chinese (mixed is fine).
- Everything in the repo and on GitHub is English: code, comments, UI text, commit messages, branch names, PR titles and bodies.

## Project

A parametric Chinese type engine for designers and brands. Read `docs/plan.md` for the milestone plan and `docs/status.md` for where things stand and known issues. Update `docs/status.md` at the end of every approved step.

- `src/core/` — engine, pure functions, no DOM. Every change needs tests (`npm test`).
- `src/editor/` — editor UI (Vite + TypeScript, Canvas 2D, no framework).
- `skeletons/` — hand-locked skeleton JSON, one per character. Make Me a Hanzi data may be used as a tracing guide only and must never be committed.

## Engine rules

- Strokes are designed outline templates; skeletons only carry stroke position and type.
- Stroke parameters are multiples of the vertical stem V (or horizontal stem H).
- Node count and handle layout of a template never depend on parameter values (point compatibility across weights). Tests enforce this.
- Contours are closed and counter-clockwise (y-up, UPM 1000, em box y −120…880).
- Target style: neutral modern Hei in the direction of Source Han Sans.

## Commands

`npm run dev` · `npm test` · `npm run build` (typecheck + build must pass before every commit)
