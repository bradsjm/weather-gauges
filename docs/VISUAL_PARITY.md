# Visual Parity Guide (Phase VP)

Status: Active source-driven fidelity guide for radial, linear, and compass

## 1) Purpose

This document is the implementation and review standard for v3 visual parity against legacy SteelSeries v2.

Use it to:

- Port rendering logic at source fidelity (not approximation)
- Prevent subtle lifecycle/integration regressions that produce visually incorrect output
- Validate parity with deterministic, reproducible evidence

## 2) Non-Negotiable Rules

### Source-of-Truth Rule

Legacy SteelSeries JavaScript code is the authoritative behavior reference.

- Port painter logic from legacy modules before tuning screenshots.
- Preserve stage order, geometry formulas, gradients, blend/compositing behavior, and defaults.
- Do not introduce modernized visual interpretation during parity work.
- Treat screenshots as verification of source port correctness, not the design source.
- Any intentional deviation must be documented with rationale and fixture evidence.

### Fidelity-First Rule

When in doubt, copy exact constants and paths from legacy code.

- Keep enum values and defaults identical.
- Keep per-mode behavior identical (including fallback branches).
- Keep text/font placement logic and cardinal/ordinal label behavior identical.
- Keep texture and material rendering logic identical where feasible.

## 3) Authoritative Legacy References

Use these modules from `nicolas-van/steelseries` as implementation sources:

- `src/drawFrame.js`
- `src/drawBackground.js`
- `src/drawForeground.js`
- `src/drawLinearFrameImage.js`
- `src/drawLinearBackgroundImage.js`
- `src/drawRoseImage.js`
- `src/Compass.js`
- `src/drawRadialCustomImage.js`
- `src/createKnobImage.js`
- `src/definitions.js`
- `src/carbonBuffer.js`
- `src/punchedSheetBuffer.js`
- `src/brushedMetalTexture.js`

## 4) Porting Checklist (Per Gauge)

Use this checklist in order for every gauge migration.

1. **Lock API Surface to Legacy Defaults**
   - Add legacy enum/property surface in schema and element API before renderer work.
   - Ensure defaults match legacy exactly (frame/background/pointer/foreground/knob/mode flags).

2. **Port Render Pipeline in Legacy Stage Order**
   - Frame -> background -> custom image -> static overlays -> dynamic pointer/value -> foreground.
   - Preserve all `save/restore`, rotation origin, and `globalCompositeOperation` transitions.

3. **Port Geometry/Gradient Constants Directly**
   - Copy ring radii, bezier points, stop offsets, line widths, and text radii.
   - Avoid "close enough" values.

4. **Port Mode and Feature Interactions**
   - Include interactions like `degreeScale`, `pointSymbolsVisible`, `rotateFace`, and visibility flags.
   - Keep behavior equivalent when combinations are enabled.

5. **Port Materials and Textures**
   - Include carbon/punched/brushed/stainless/turned logic where applicable.
   - Keep edge vignettes and inner shadows in the same order and alpha profile.

6. **Validate in Runtime and Visual Tests**
   - Verify rendered canvas is non-empty and deterministic.
   - Run scoped visual tests and inspect diffs before snapshot updates.

## 5) Compass Lessons Learned (Critical)

These issues occurred during the compass parity port and should be treated as guardrails for future gauges.

### A) Blank Snapshot Failure Mode

A gauge can produce "valid" screenshots that are blank if rendering never executes before capture.

- Symptom: fixture header renders, canvas appears empty/transparent.
- Detection: sample canvas pixels (`opaque alpha count`) in browser probe.
- Recommendation: do not update snapshots until runtime probe confirms non-transparent gauge pixels.

### B) Lit `@query` Lifecycle Pitfall

Do not manually assign fields decorated with `@query(...)`.

- Manual writes can interfere with Lit's query-backed accessor behavior and lifecycle expectations.
- Let Lit resolve queried nodes; if fallback lookup is needed, keep it local and avoid mutating the decorated property.

### C) Boolean Attribute Parsing Pitfall

`animate-value="false"` is still a present boolean attribute in HTML.

- Without converter handling, Lit boolean properties evaluate this as `true`.
- For deterministic visual harnesses, add explicit boolean converters when string values like `"false"` are used.
- Prefer explicit property assignment in code where possible.

### D) Build Artifact Staleness Pitfall

Docs-site and visual harness consume package `dist` outputs, not source files.

- After source edits in `core` or `elements`, rebuild relevant packages before visual validation.
- If results look unchanged, verify dist rebuild happened before deeper debugging.

### E) Silent Failure Pitfall

Element render methods that swallow errors (emit-only) can hide hard failures.

- Keep error event emission.
- Also add targeted runtime probes in debugging sessions to verify draw execution and pixel output.

## 6) Required Verification Workflow

Follow this sequence for parity work:

1. Implement source-accurate port.
2. Run package typechecks/tests for affected packages.
3. Rebuild packages consumed by docs-site/harness.
4. Run runtime probe against visual route:
   - Confirm component exists
   - Confirm canvas exists
   - Confirm non-zero opaque pixel count
5. Run scoped visual tests.
6. Only then update snapshots.
7. Re-run visual tests to confirm green.

## 7) Snapshot Update Policy

Snapshot updates are allowed only when all are true:

- Runtime probe confirms non-empty draw output.
- Render path is source-faithful to legacy modules.
- Diff rationale is understood (expected parity improvement, not unknown drift).
- Updated snapshots are reviewed at least once manually.

Never update snapshots to "fix" a blank or suspicious render.

## 8) Known High-Risk Areas

Review these first when parity drifts:

- Frame material gradients (especially conic/chrome variants)
- Background textures and edge vignettes
- Foreground mask type geometry and alpha gradients
- Pointer shape paths and gradient stops
- Tick/label placement fonts and radii
- Rotation math and `rotateFace` mode
- Custom layer clipping and draw order

## 9) Practical Advice for Best Results

- Work one gauge at a time; do not mix broad refactors with parity ports.
- Keep temporary debug probes local and remove them after diagnosis.
- Keep default demo examples aligned with legacy defaults and add one styled fixture for breadth.
- Prefer deterministic test inputs (fixed heading/value, disabled animation in visual fixtures unless animation itself is under test).

## 10) Completion Criteria

A parity task is complete only when:

- Legacy behavior is source-matched for defaults and supported options.
- Visual fixture output is stable and non-blank.
- Typecheck/tests/visual checks pass.
- Any remaining intentional deviations are documented in this file or package-specific notes.
