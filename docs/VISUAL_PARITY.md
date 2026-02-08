# Visual Parity Guide (Phase VP)

Status: Draft scaffold for VP0-VP4 execution

## 1) Purpose

This document is the working reference for SteelSeries v3 visual parity implementation.
It captures target look-and-feel criteria, measurement approach, fixture categories, and freeze rules.

## 2) Visual Targets

The parity pass focuses on matching legacy SteelSeries visual identity across radial, linear, and compass:

- Frame chrome depth and bevel contrast
- Background material richness (gradient ramps + edge darkening)
- Foreground glass/highlight overlays
- Tick hierarchy clarity (major/minor separation)
- Needle/pointer cap depth and readability
- Typography and label placement consistency

### Source-of-Truth Rule

Legacy SteelSeries JavaScript implementation is the primary source of truth for visual behavior.

- Derive painter logic, gradients, ring/bezel layering, tick spacing, and typography from legacy code paths first.
- Use screenshot parity as verification of implementation accuracy, not as the design source.
- When visual and code-reference expectations diverge, inspect legacy module logic and constants before adjusting thresholds.
- Document any intentional deviations from legacy behavior with rationale and fixture evidence.

### Legacy Code References (authoritative)

Use these legacy modules from `nicolas-van/steelseries` as the implementation source:

- `src/drawFrame.js` (radial frame chrome/material gradients)
- `src/drawBackground.js` (radial background textures/edge shadow)
- `src/drawForeground.js` (foreground highlight overlays and glass)
- `src/drawLinearFrameImage.js` (linear frame materials)
- `src/drawLinearBackgroundImage.js` (linear background textures and inner shadow stack)
- `src/drawRoseImage.js` (compass rose ring geometry and cardinal markers)
- `src/Compass.js` (compass defaults, pointer drawing, rose/tick behavior)
- `src/definitions.js` (`FrameDesign`, `ForegroundType`, `PointerType` enums)

### Extracted Legacy Constants (to implement directly)

Frame material presets (radial + linear) from `drawFrame.js` / `drawLinearFrameImage.js`:

- Frame designs: `metal`, `brass`, `steel`, `gold`, `anthracite`, `tiltedGray`, `tiltedBlack`, `glossyMetal`, `blackMetal`, `shinyMetal`, `chrome`.
- Chrome conical gradient fractions: `[0, 0.09, 0.12, 0.16, 0.25, 0.29, 0.33, 0.38, 0.48, 0.52, 0.63, 0.68, 0.8, 0.83, 0.87, 0.97, 1]`.
- Black metal fractions: `[0, 0.125, 0.347222, 0.5, 0.680555, 0.875, 1]`.
- Shiny metal fractions: `[0, 0.125, 0.25, 0.347222, 0.5, 0.652777, 0.75, 0.875, 1]`.
- Linear frame width formula: `frameWidth = ceil(min(0.04 * sqrt(w^2 + h^2), 0.1 * (vertical ? w : h)))`.

Background materials from `drawBackground.js` / `drawLinearBackgroundImage.js`:

- Named textures: `CARBON`, `PUNCHED_SHEET`, `BRUSHED_METAL`, `BRUSHED_STAINLESS`, `STAINLESS`, `TURNED`.
- Stainless/turned conical fractions: `[0, 0.03, 0.1, 0.14, 0.24, 0.33, 0.38, 0.5, 0.62, 0.67, 0.76, 0.81, 0.85, 0.97, 1]`.
- Radial vignette edge stops: alpha ramp near rim with stops at `0.86`, `0.92`, `0.97`, `1`.
- Linear inner shadow stack colors (7 strokes):
  `rgba(0,0,0,0.30)`, `0.20`, `0.13`, `0.09`, `0.06`, `0.04`, `0.03`.

Foreground overlay behavior from `drawForeground.js`:

- Foreground types: `type1`..`type5` with distinct bezier masks.
- Primary highlight opacity profile (type1/2/3/5): gradient from `rgba(255,255,255,0.275)` to `rgba(255,255,255,0.015)`.
- Type4 uses additional radial highlight with final alpha around `0.15` near edge.
- Center knob size reference: `ceil(0.084112 * imageHeight)`.

Compass rose and heading behavior from `drawRoseImage.js` / `Compass.js`:

- Rose wedge loop: every `15` degrees, alternating fill between radii `0.26 * imageWidth` and `0.23 * imageWidth`.
- Cardinal marker loop: every `90` degrees.
- Rose center ring radius: `0.1 * imageWidth`, line width `0.022 * imageWidth`.
- Compass `angleStep = RAD_FACTOR` and pointer rotation based on `value` heading.
- Default compass symbols: `['N','NE','E','SE','S','SW','W','NW']`.

## 3) Measurement Model

Parity assessment is fixture-based and metric-backed.

- Primary comparator: screenshot pixel diff per fixture
- Reported metrics:
  - pixel diff count
  - diff percentage
  - max local error cluster
- Threshold bands:
  - pass
  - warning
  - fail

Threshold values are defined and versioned in the parity CI workflow once VP0-03 is complete.

### Threshold Policy Table (VP0-03)

| Gauge   | Fixture Group          | Pass (<= diff %) | Warning (<= diff %) | Fail (> diff %) | Notes                                          |
| ------- | ---------------------- | ---------------- | ------------------- | --------------- | ---------------------------------------------- |
| Radial  | Nominal states         | 0.80%            | 1.40%               | 1.40%           | Chrome/bezel depth is primary risk area        |
| Radial  | Critical/alert states  | 1.00%            | 1.80%               | 1.80%           | Includes threshold-crossing and alert overlays |
| Linear  | Nominal states         | 0.90%            | 1.50%               | 1.50%           | Include narrow and tall aspect fixtures        |
| Linear  | Critical/alert states  | 1.10%            | 1.90%               | 1.90%           | Verify marker contrast and pointer readability |
| Compass | Cardinal headings      | 0.90%            | 1.60%               | 1.60%           | Validate N/E/S/W marker fidelity               |
| Compass | Intercardinal headings | 1.10%            | 2.00%               | 2.00%           | Validate rose detail and needle contrast       |

Policy notes:

- Evaluate against frozen reference snapshots per fixture.
- Warning threshold requires PR rationale if accepted.
- Fail threshold blocks merge unless fixture baseline update is explicitly approved.
- Add a secondary guardrail for local drift: max local error cluster should stay <= 0.35% for pass and <= 0.60% for warning.
- Recalibrate thresholds only when renderer behavior intentionally changes and all affected fixtures are reviewed side-by-side.

## 4) Fixture Matrix

Each gauge family should include at minimum:

- Base nominal state
- Low bound state
- High/critical state
- Threshold crossing state
- Theme override state

Additional directional fixtures:

- Radial: segment-heavy and alert-heavy variants
- Linear: narrow and tall variants
- Compass: cardinal and intercardinal heading variants

## 5) Implementation Checklist

### VP0 Baseline

- [ ] Lock baseline fixture set for all three gauges
- [ ] Add parity metric report output artifact
- [ ] Define and publish threshold policy

### VP1 Radial Fidelity

- [ ] Implement frame material painter(s)
- [ ] Implement glass/foreground overlays
- [ ] Tune tick/label typography hierarchy
- [ ] Freeze radial parity baselines

### VP2 Linear + Compass Fidelity

- [ ] Port material pipeline to linear
- [ ] Port material pipeline to compass
- [ ] Normalize pointer/needle styling
- [ ] Freeze linear/compass parity baselines

### VP3 Cross-Gauge Consistency

- [ ] Normalize tone mapping visual behavior
- [ ] Normalize tick contrast and anti-aliasing rules
- [ ] Normalize text style contract
- [ ] Add cross-gauge visual contract tests

### VP4 Freeze + RC2

- [ ] Publish before/after parity documentation
- [ ] Freeze parity baselines in CI
- [ ] Publish RC2 parity notes

## 6) Review Procedure

For each parity PR:

1. Run targeted gauge tests and visual suites.
2. Attach before/after screenshots for changed fixtures.
3. Include parity metric report deltas.
4. Note any accepted drift with rationale.
5. Confirm no unintended contract/API changes.

## 7) Risk Controls

- Keep renderer changes isolated per gauge pass to reduce regression scope.
- Preserve performance budgets while adding painter layers.
- Avoid hidden visual changes without fixture updates.
- Treat threshold/tone drift as contract-impacting unless explicitly approved.

## 8) Artifacts

- Plan: `docs/PLAN.md`
- Migration context: `docs/MIGRATION_V2_TO_V3.md`
- API conventions: `docs/API_CONVENTIONS.md`
- Token contract: `docs/CSS_TOKENS.md`
- Visual fixtures: `packages/test-assets/visual`
