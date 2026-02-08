# Visual Parity Guide (Phase VP)

Status: Active source-driven visual fidelity guide for radial -> linear -> compass execution

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
- Port gauge behavior at algorithm fidelity (render stages, geometry math, layer order, mode/default interactions), not visual approximation.
- Performance optimizations in rendering and animation are encouraged, provided they preserve legacy-equivalent visuals and runtime behavior.
- Use screenshot parity as verification of implementation accuracy, not as the design source.
- When visual and code-reference expectations diverge, inspect legacy module logic and constants before adjusting screenshots.
- Document any intentional deviations from legacy behavior with rationale and fixture evidence.

### Algorithm Fidelity Checklist

- Match legacy defaults and mode behavior before adding optional modern UX layers.
- Preserve legacy render stage order and compositing semantics for each gauge.
- Port geometry formulas, gradient stops, and key constants directly from source modules.
- Keep color/tone relationships descriptor-equivalent to legacy behavior.
- Validate with before/after screenshots only after source behavior is implemented.
- Allow performance optimizations only when visual and functional output remain equivalent.

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
