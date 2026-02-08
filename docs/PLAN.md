# SteelSeries v3 Visual Parity Plan (Next Pass)

Namespace: `@bradsjm`  
Monorepo: `pnpm` workspaces + `turbo`  
Focus: visual fidelity hardening to match legacy SteelSeries identity

## 1) Context

- Phases 0-3 are complete; this plan tracks the visual parity follow-up work.
- Current v3 gauges are functionally complete but stylistically simplified.
- This plan targets parity of chrome, glass, shadows, typography, and material depth.

## 2) Milestone Overview

- **VP0 - Baseline & Instrumentation:** lock current visuals, add parity measurement fixtures and metrics.
- **VP1 - Radial Material Fidelity:** implement legacy-style frame/background/foreground passes for radial.
- **VP2 - Linear & Compass Material Fidelity:** port same chrome system into linear and compass renderers.
- **VP3 - Cross-Gauge Visual Consistency:** normalize typography, color ramps, tick hierarchy, and alert presentation.
- **VP4 - Parity Freeze & RC2 Prep:** freeze parity baselines, publish parity docs, and cut RC2 contract.

## 3) Backlog

### Progress Tracker

| ID     | Status  | Notes                                                                                                                                  |
| ------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| VP0-01 | Pending | Add dedicated parity fixture set for radial/linear/compass in `packages/test-assets`.                                                  |
| VP0-02 | Pending | Add visual metric script (pixel diff + threshold report) for parity gates.                                                             |
| VP0-03 | Pending | Establish target tolerances per gauge family and theme mode; populate threshold table in `docs/VISUAL_PARITY.md`.                      |
| VP1-01 | Pending | Implement radial frame material presets from legacy `src/drawFrame.js` gradients (metal/chrome/brass/steel/etc.).                      |
| VP1-02 | Pending | Implement radial glass/foreground highlight and bezel shadow passes using masks from legacy `src/drawForeground.js`.                   |
| VP1-03 | Pending | Implement radial label/tick typography parity (weight, spacing, scale).                                                                |
| VP1-04 | Pending | Capture radial parity goldens and lock in CI.                                                                                          |
| VP2-01 | Pending | Port frame/bezel/glass painter pipeline to linear renderer using `src/drawLinearFrameImage.js` and `src/drawLinearBackgroundImage.js`. |
| VP2-02 | Pending | Port rose/ring/chrome painter pipeline to compass renderer using `src/drawRoseImage.js` and `src/Compass.js`.                          |
| VP2-03 | Pending | Align pointer/needle thickness and cap styling across gauges.                                                                          |
| VP2-04 | Pending | Capture linear/compass parity goldens and lock in CI.                                                                                  |
| VP3-01 | Pending | Normalize tone mapping (accent/warning/danger) visual behavior across gauges.                                                          |
| VP3-02 | Pending | Normalize tick major/minor contrast and anti-aliasing strategy.                                                                        |
| VP3-03 | Pending | Normalize text rendering contract (family, fallback, letter spacing, LCD style) against legacy tick/title layout behavior.             |
| VP3-04 | Pending | Add cross-gauge visual contract tests for shared styling rules.                                                                        |
| VP4-01 | Pending | Publish visual parity documentation with before/after references.                                                                      |
| VP4-02 | Pending | Freeze parity baseline artifacts and add API+visual freeze checks.                                                                     |
| VP4-03 | Pending | Prepare RC2 notes with parity deltas and known non-parity gaps.                                                                        |

### VP0 - Baseline & Instrumentation

| ID     | Task                        | Deliverable                                                             | Acceptance Criteria                              | Dependencies |
| ------ | --------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ | ------------ |
| VP0-01 | Build parity fixture matrix | Expanded fixtures by gauge + theme + state                              | At least 5 canonical parity fixtures per gauge   | None         |
| VP0-02 | Add parity metric reporter  | Script outputting diff summary per fixture                              | CI artifact includes fixture-level metric report | VP0-01       |
| VP0-03 | Define parity thresholds    | Documented tolerances (`warning` and `fail`) in `docs/VISUAL_PARITY.md` | Thresholds approved and referenced by visual CI  | VP0-02       |

### VP1 - Radial Material Fidelity

| ID     | Task                            | Deliverable                            | Acceptance Criteria                                               | Dependencies |
| ------ | ------------------------------- | -------------------------------------- | ----------------------------------------------------------------- | ------------ |
| VP1-01 | Frame material painter          | Reusable radial frame painter module   | Chrome ring depth and edge contrast visibly match target fixtures | VP0-03       |
| VP1-02 | Foreground/glass painter        | Highlight + reflection + shadow passes | Foreground pass improves depth without clipping text/ticks        | VP1-01       |
| VP1-03 | Typography/tick parity          | Updated tick and label renderer        | Visual hierarchy matches legacy reference in parity fixtures      | VP1-02       |
| VP1-04 | Parity baseline freeze (radial) | New radial goldens + CI lock           | Radial parity suite passes all fixtures at approved tolerance     | VP1-03       |

### VP2 - Linear & Compass Material Fidelity

| ID     | Task                             | Deliverable                                        | Acceptance Criteria                                          | Dependencies   |
| ------ | -------------------------------- | -------------------------------------------------- | ------------------------------------------------------------ | -------------- |
| VP2-01 | Linear chrome pipeline           | Linear frame/background/foreground material passes | Linear fixtures show equivalent depth to radial parity pass  | VP1-04         |
| VP2-02 | Compass chrome pipeline          | Compass ring/rose/foreground material passes       | Compass fixtures show equivalent depth + rose readability    | VP1-04         |
| VP2-03 | Pointer/needle parity            | Shared pointer style profile and geometry tuning   | Pointer and cap treatment consistent across all three gauges | VP2-01, VP2-02 |
| VP2-04 | Baseline freeze (linear/compass) | Updated visual goldens and CI checks               | Linear/compass parity suites pass at approved tolerance      | VP2-03         |

### VP3 - Cross-Gauge Visual Consistency

| ID     | Task                         | Deliverable                       | Acceptance Criteria                                       | Dependencies           |
| ------ | ---------------------------- | --------------------------------- | --------------------------------------------------------- | ---------------------- |
| VP3-01 | Tone mapping consistency     | Shared paint mapping utilities    | Same alert tone semantics produce same visual severity    | VP2-04                 |
| VP3-02 | Tick contrast normalization  | Shared tick style contract        | Major/minor tick hierarchy is consistent and legible      | VP2-04                 |
| VP3-03 | Text rendering normalization | Shared text style resolver        | Equivalent text roles render with consistent style family | VP2-04                 |
| VP3-04 | Visual contract tests        | Cross-gauge visual contract suite | Contract tests fail on drift and pass on intended changes | VP3-01, VP3-02, VP3-03 |

### VP4 - Parity Freeze & RC2 Prep

| ID     | Task                   | Deliverable                                                             | Acceptance Criteria                              | Dependencies |
| ------ | ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ | ------------ |
| VP4-01 | Publish parity docs    | `docs/VISUAL_PARITY.md` with before/after examples and threshold policy | Docs include known gaps and tuning guidance      | VP3-04       |
| VP4-02 | Freeze parity baseline | RC2 parity freeze artifact + tests                                      | API + visual freeze checks pass in CI            | VP4-01       |
| VP4-03 | RC2 release notes      | `docs/PHASE4_RC2.md` parity summary                                     | Includes fixture diffs, risks, and rollout notes | VP4-02       |

## 4) Sequencing Notes

- Start with radial as the visual reference implementation, then propagate to linear/compass.
- Do not modify public API shape unless unavoidable; this pass is visual-first.
- Every painter change must include updated fixture evidence and parity metric output.
- Keep performance budgets enforced while increasing visual fidelity.

## 5) Done Criteria (Visual Parity Pass)

- All three gauges pass parity fixture suites within approved thresholds.
- Material/chrome/foreground depth is present and consistent across gauges.
- Typography and tick hierarchy match documented visual contract.
- CI enforces unit + visual + parity metrics + API contract freeze checks.
- Parity and RC2 docs are published for adopters.

## 6) Deferred Beyond This Pass

- Full legacy gauge catalog parity (altimeter, horizon, wind-direction, etc.).
- Advanced editor UX and Home Assistant productization enhancements.
- Optional plugin-driven custom painter ecosystem.
