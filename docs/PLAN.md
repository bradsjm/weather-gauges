# SteelSeries v3 Visual Fidelity Plan (Source-Driven Pass)

Namespace: `@bradsjm`  
Monorepo: `pnpm` workspaces + `turbo`  
Focus: source-accurate visual fidelity hardening against legacy SteelSeries renderers

## 1) Context

- Phases 0-3 are complete; this plan tracks the visual parity follow-up work.
- Current v3 gauges are functionally complete but stylistically simplified.
- This plan targets parity of chrome, glass, shadows, typography, and material depth.

## 2) Milestone Overview

- **VP0 - Legacy Source Mapping & Baseline Screenshots:** lock fixture coverage and source map the legacy painter logic/constants.
- **VP1 - Radial Source-Accurate Port:** implement radial visuals from legacy source as the reference implementation.
- **VP2 - Linear Source-Accurate Port:** port shared material and depth pipeline to linear from legacy source.
- **VP3 - Compass Source-Accurate Port:** port rose/ring/pointer/foreground behavior to compass from legacy source.
- **VP4 - Cross-Gauge Consistency & Optional Tightening:** normalize shared style behavior and decide whether stricter parity gates are needed.

## 3) Source-of-Truth Execution Policy

- Legacy JavaScript renderer modules are authoritative for visual behavior and constants.
- Implementation order is fixed: **radial -> linear -> compass**.
- Port behavior at algorithm fidelity for every implemented gauge (geometry, gradients, compositing order, mode logic, and defaults).
- Do not treat screenshot matching alone as completion criteria when source code behavior is not yet faithfully ported.
- Screenshots are validation artifacts to verify composition, layering, and positioning; they do not replace legacy code references.
- If screenshots and source expectations diverge, inspect legacy code path and constants first.
- Keep v3 best practices while porting visuals: strict TypeScript, typed config boundaries, no public API regressions, deterministic rendering.
- Keep modernization under the hood only: typed modules, explicit contracts, safe boundaries, and testability without changing visual/function outcomes.
- Optimize rendering and animation code where beneficial for modern performance, but never at the cost of visual or behavioral fidelity to legacy.

## 4) Backlog

### Progress Tracker

| ID     | Status  | Notes                                                                                                                                  |
| ------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| VP0-01 | Pending | Expand source-driven fixture set for radial/linear/compass in `packages/test-assets` for screenshot validation.                        |
| VP0-02 | Pending | Document legacy source mapping matrix (legacy module -> v3 module) for frame/background/foreground/pointer/ticks.                      |
| VP0-03 | Pending | Capture baseline screenshots for source-accurate implementation review (non-blocking, decision support).                               |
| VP1-01 | Pending | Implement radial frame material presets from legacy `src/drawFrame.js` gradients (metal/chrome/brass/steel/etc.).                      |
| VP1-02 | Pending | Implement radial glass/foreground highlight and bezel shadow passes using masks from legacy `src/drawForeground.js`.                   |
| VP1-03 | Pending | Implement radial label/tick typography fidelity (weight, spacing, scale) from legacy source behavior.                                  |
| VP1-04 | Pending | Capture radial screenshots and freeze review set for team sign-off.                                                                    |
| VP2-01 | Pending | Port frame/bezel/glass painter pipeline to linear renderer using `src/drawLinearFrameImage.js` and `src/drawLinearBackgroundImage.js`. |
| VP2-02 | Pending | Prepare compass source map and shared painter interfaces from `src/drawRoseImage.js` and `src/Compass.js`.                             |
| VP2-03 | Pending | Align pointer/needle thickness and cap styling across gauges.                                                                          |
| VP2-04 | Pending | Capture linear screenshots and freeze review set for team sign-off.                                                                    |
| VP3-01 | Pending | Port compass ring/rose/pointer/foreground material behavior from legacy source into v3 compass renderer.                               |
| VP3-02 | Pending | Verify compass heading/cardinal/intercardinal screenshot states and fix composition drift.                                             |
| VP3-03 | Pending | Align pointer/needle cap depth and contrast treatment across all gauges after compass port.                                            |
| VP3-04 | Pending | Freeze compass screenshots for team review and sign-off.                                                                               |
| VP4-01 | Pending | Normalize cross-gauge text/tick/tone behavior using shared typed painter utilities.                                                    |
| VP4-02 | Pending | Publish before/after documentation with source references and known gaps.                                                              |
| VP4-03 | Pending | Decide if/when to enable stricter parity thresholds and CI blocking gates.                                                             |

### VP0 - Legacy Source Mapping & Baseline Screenshots

| ID     | Task                            | Deliverable                                                              | Acceptance Criteria                                                          | Dependencies |
| ------ | ------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------ |
| VP0-01 | Build screenshot fixture matrix | Expanded fixtures by gauge + theme + state                               | At least 5 canonical screenshot fixtures per gauge                           | None         |
| VP0-02 | Build legacy source map         | Mapping doc from legacy modules/constants to v3 painter responsibilities | Every visual layer has named legacy source and target v3 module              | VP0-01       |
| VP0-03 | Capture baseline screenshots    | Before/after screenshot packs per gauge for review                       | Team can verify layering/positioning changes without relying on metric gates | VP0-02       |

### VP1 - Radial Material Fidelity

| ID     | Task                       | Deliverable                              | Acceptance Criteria                                               | Dependencies |
| ------ | -------------------------- | ---------------------------------------- | ----------------------------------------------------------------- | ------------ |
| VP1-01 | Frame material painter     | Reusable radial frame painter module     | Chrome ring depth and edge contrast visibly match target fixtures | VP0-03       |
| VP1-02 | Foreground/glass painter   | Highlight + reflection + shadow passes   | Foreground pass improves depth without clipping text/ticks        | VP1-01       |
| VP1-03 | Typography/tick fidelity   | Updated tick and label renderer          | Visual hierarchy matches legacy reference in screenshot fixtures  | VP1-02       |
| VP1-04 | Screenshot freeze (radial) | New radial screenshot pack + review lock | Radial screenshot fixtures approved by team                       | VP1-03       |

### VP2 - Linear Source-Accurate Port

| ID     | Task                         | Deliverable                                        | Acceptance Criteria                                                 | Dependencies |
| ------ | ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- | ------------ |
| VP2-01 | Linear chrome pipeline       | Linear frame/background/foreground material passes | Linear fixtures match expected depth/composition from legacy source | VP1-04       |
| VP2-02 | Linear inner shadow pipeline | Legacy-accurate inner shadow stack and bevel cues  | Narrow/tall linear states preserve readability and material depth   | VP2-01       |
| VP2-03 | Linear pointer/value styling | Pointer/value treatment aligned with legacy intent | Pointer and value markers remain legible across low/high states     | VP2-02       |
| VP2-04 | Linear screenshot freeze     | Updated linear screenshot pack for review          | Linear reference screenshots approved by team                       | VP2-03       |

### VP3 - Compass Source-Accurate Port

| ID     | Task                           | Deliverable                                     | Acceptance Criteria                                                    | Dependencies |
| ------ | ------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------- | ------------ |
| VP3-01 | Compass rose/ring pipeline     | Compass ring/rose/foreground material passes    | Rose wedges/cardinal markers/foreground overlays match legacy behavior | VP2-04       |
| VP3-02 | Compass pointer/heading render | Heading and pointer rendering aligned to source | Cardinal and intercardinal fixtures show correct pointer behavior      | VP3-01       |
| VP3-03 | Compass typography/ticks       | Compass tick and symbol rendering update        | Label hierarchy and density align with legacy code path                | VP3-02       |
| VP3-04 | Compass screenshot freeze      | Updated compass screenshot pack for review      | Compass reference screenshots approved by team                         | VP3-03       |

### VP4 - Cross-Gauge Consistency & Optional Tightening

| ID     | Task                      | Deliverable                                           | Acceptance Criteria                                                | Dependencies   |
| ------ | ------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ | -------------- |
| VP4-01 | Tone mapping consistency  | Shared paint mapping utilities                        | Same alert semantics produce equivalent visual severity            | VP3-04         |
| VP4-02 | Tick/text consistency     | Shared tick/text style contract                       | Major/minor hierarchy and text roles are consistent across gauges  | VP3-04         |
| VP4-03 | Tightening decision point | Recommendation doc for optional parity gate hardening | Decision captured with screenshots, risks, and implementation cost | VP4-01, VP4-02 |

## 5) Sequencing Notes

- Start with radial as the visual reference implementation, then propagate to linear/compass.
- Follow strict implementation order: radial -> linear -> compass.
- Derive renderer behavior from legacy source modules/constants first; use screenshots only for validation.
- Do not modify public API shape unless unavoidable; this pass is visual-first.
- Every painter change must include source reference notes and updated screenshot evidence.
- Keep performance budgets enforced while increasing visual fidelity.

## 6) Done Criteria (Visual Fidelity Pass)

- Radial, linear, and compass implementations are completed in order with source-backed painter ports.
- Radial, linear, and compass implementations are algorithm-fidelity ports for visual and functional behavior.
- Material/chrome/foreground depth is present and consistent across gauges.
- Typography and tick hierarchy match documented visual contract.
- Screenshot packs are reviewed and accepted for each gauge pass.
- CI continues to enforce unit + visual regression + API contract checks.

## 7) Deferred Beyond This Pass

- Full legacy gauge catalog parity (altimeter, horizon, wind-direction, etc.).
- Advanced editor UX and Home Assistant productization enhancements.
- Optional plugin-driven custom painter ecosystem.
- Strict parity metric thresholds as merge-blocking gates (can be enabled later if needed).
