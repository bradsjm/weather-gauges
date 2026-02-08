# Legacy SteelSeries Research Reference

## 1) Purpose

This document breaks down how the legacy `nicolas-van/steelseries` (https://github.com/nicolas-van/steelseries/) repository is structured and how it works internally.

Goal: provide a primary implementation reference for building SteelSeries v3 in this monorepo, while keeping a clean v3 API and modern architecture.

This is not a migration guide for end users. It is an engineering reference for contributors implementing v3.

## 2) Source and Version Context

- Legacy repository: `https://github.com/nicolas-van/steelseries`
- Default branch: `master`
- Observed package version: `2.0.9`
- Architecture style: JS modules + Lit custom elements + Canvas rendering + D3 timing/scales
- Packaging style: side-effect entrypoint (`src/steelseries.js`) that registers all custom elements globally

## 3) High-Level Legacy Architecture

The legacy codebase has a clear two-layer model:

1. **Rendering + math layer**
   - Pure-ish canvas draw functions and helper factories.
   - Heavy use of offscreen buffers and cached image layers.
   - Central option definitions/enums and color constants.

2. **Web component wrapper layer**
   - One custom element class per gauge.
   - Each element exposes a property schema (type/default/objectEnum).
   - Base class translates element properties into draw-function parameters.

This split is the right conceptual foundation for v3. We should preserve the separation, but modernize types/contracts and package boundaries.

## 4) Repository Layout Breakdown

Top-level significant files:

- `README.md`: project goals and usage
- `package.json`: dependencies/build/scripts/distribution fields
- `rollup.config.js`: one bundle from one side-effect entry
- `src/`: all gauge modules and draw helpers
- `srcdocs/`: docs/demo site

`src/` includes:

- Gauge/element modules: `Radial.js`, `Linear.js`, `Compass.js`, `WindDirection.js`, `Clock.js`, `StopWatch.js`, `Altimeter.js`, `Horizon.js`, `Level.js`, `Odometer.js`, `Battery.js`, `Led.js`, `TrafficLight.js`, `LightBulb.js`, `DisplaySingle.js`, `DisplayMulti.js`, `RadialBargraph.js`, `LinearBargraph.js`, `RadialVertical.js`
- Component base: `BaseElement.js`
- Entry side-effect registrar: `steelseries.js`
- Shared descriptors/config catalogs: `constants.js`, `definitions.js`
- Shared utility math/canvas/color: `tools.js`
- Render helpers: `drawBackground.js`, `drawFrame.js`, `drawForeground.js`, `drawPointerImage.js`, `drawTitleImage.js`, `drawRoseImage.js`, `drawLinear*`, `drawRadialCustomImage.js`
- Texture and image helpers: `brushedMetalTexture.js`, `carbonBuffer.js`, `punchedSheetBuffer.js`, `createLedImage.js`, `createKnobImage.js`, `createLcdBackgroundImage.js`, `createMeasuredValueImage.js`, `createTrendIndicator.js`

## 5) Build and Delivery Model (Legacy)

From legacy `package.json` and `rollup.config.js`:

- ESM package (`"type": "module"`)
- Rollup input: `src/steelseries.js`
- Rollup output: single ESM file `dist/steelseries.bundled.js`
- CDN fields (`jsdelivr`, `unpkg`) point to bundle in `dist`
- Runtime deps: `lit`, `d3-ease`, `d3-scale`, `d3-timer`

Implications:

- Importing the package triggers registration of all elements.
- Tree-shaking at element granularity is limited due to side-effect import pattern.
- v3 should prefer explicit exports plus optional convenience "register all" entry.

## 6) Component Registration and Public HTML API

Legacy custom element tags found in `src/*`:

- `steelseries-radial`
- `steelseries-radial-bargraph`
- `steelseries-radial-vertical`
- `steelseries-linear`
- `steelseries-linear-bargraph`
- `steelseries-compass`
- `steelseries-wind-direction`
- `steelseries-clock`
- `steelseries-stopwatch`
- `steelseries-altimeter`
- `steelseries-horizon`
- `steelseries-level`
- `steelseries-odometer`
- `steelseries-battery`
- `steelseries-led`
- `steelseries-lightbulb`
- `steelseries-trafficlight`
- `steelseries-display-single`
- `steelseries-display-multi`

Legacy docs-only tags in `srcdocs/index.js`:

- `steelseries-doc-clock`
- `steelseries-doc-level`

## 7) The BaseElement Contract (Critical)

`src/BaseElement.js` is the most important reference for legacy wiring.

Key behavior:

- Extends `LitElement`.
- Reads each subclass `static get properties()`.
- Asserts every non-state property has `defaultValue`.
- Initializes instance properties to those defaults in constructor.
- On `updated()`, locates `<canvas>` and invokes subclass draw function with normalized params.

Normalization logic (`buildPair`) includes:

1. `real_<key>` override support
   - If schema has `real_value` etc., render can use smoothed/internal value instead of public prop.

2. Legacy negative-boolean inversion
   - If prop is boolean and starts with `no`, value is inverted and key renamed to positive equivalent.
   - Example: `noFrameVisible: true` becomes `frameVisible: false` in draw params.

3. Enum mapping via `objectEnum`
   - Many properties are user-facing strings (`'TYPE1'`, `'METAL'`, `'DARK_GRAY'`), mapped to descriptor objects from `definitions.js`.

Takeaway for v3:

- Keep a dedicated normalization phase, but remove implicit `no*` inversion from public API.
- Keep enum conversion as typed parsing (zod + narrow unions).

## 8) Property Schema Pattern in Gauge Modules

Each gauge module follows this pattern:

- Export `drawX(canvas, parameters)`
- Export `XElement extends BaseElement`
- `static get drawFunction() { return drawX }`
- `static get properties() { ... }`
- `customElements.define('steelseries-x', XElement)`

Common property categories across gauges:

- Dimensions: `size` or `width`/`height`
- Core value(s): `value`, `valueLatest`, `valueAverage`, `seconds`, etc.
- Smoothed internal state: `real_value*` (state props)
- Animation control: `transitionTime`
- Visual frame/background/foreground toggles
- Enumerated styles: frame, pointer, knob, colors, foreground type
- LCD/display options for numeric readouts

## 9) Concrete Legacy API Snapshots (Key Gauges)

### 9.1 Radial (`src/Radial.js`)

Notable props:

- Numeric: `size`, `value`, `transitionTime`, `minValue`, `maxValue`, `threshold`, `lcdDecimals`, `fractionalScaleDecimals`
- Booleans: `noNiceScale`, `noFrameVisible`, `noBackgroundVisible`, `noLcdVisible`, `digitalFont`, `thresholdVisible`, `minMeasuredValueVisible`, `maxMeasuredValueVisible`, `noForegroundVisible`, `trendVisible`, `useOdometer`
- Enums: `gaugeType`, `frameDesign`, `backgroundColor`, `pointerType`, `pointerColor`, `knobType`, `knobStyle`, `lcdColor`, `labelNumberFormat`, `foregroundType`, `tickLabelOrientation`
- Text: `titleString`, `unitString`
- Internal state: `real_value`

### 9.2 Linear (`src/Linear.js`)

Notable differences from radial:

- Dimensions split into `width` + `height`
- Uses `valueColor` instead of pointer styling
- Similar scale, LCD, and min/max measured indicators
- Similar use of `real_value` + `transitionTime`

### 9.3 Compass (`src/Compass.js`)

Notable props:

- `value` heading + `real_value`
- `rotateFace` toggle (rotate dial vs rotate pointer mode)
- `pointSymbols` array and visibility toggle
- `degreeScale` and `noRoseVisible`

### 9.4 Wind Direction (`src/WindDirection.js`)

Notable model:

- Dual values: `valueLatest` + `valueAverage` and `real_` state versions
- Two pointer types/colors (`pointerTypeLatest`, `pointerTypeAverage`, `pointerColor`, `pointerColorAverage`)
- LCD support with `lcdTitleStrings` default `['Latest', 'Average']`
- Optional color labels (`useColorLabels`)

### 9.5 Clock (`src/Clock.js`)

Notable model:

- Mode switch: `isCurrentTime`
- Manual props: `hour`, `minute`, `second`
- Timezone offsets: `timeZoneOffsetHour`, `timeZoneOffsetMinute`
- Optional second hand via negative toggle `noSecondPointerVisible`
- Uses timer updates when current-time mode is enabled

### 9.6 Stopwatch (`src/StopWatch.js`)

Notable model:

- Stateful timing via `seconds` + `running`
- Timer increments elapsed seconds and updates element attribute
- Similar frame/background/foreground style options as other gauges

## 10) Shared Config and Enum System

### `definitions.js`

Contains large catalogs of named options used in element property schemas.

Examples:

- `BackgroundColor`
- `LcdColor`
- `ColorDef`
- `LedColor`
- `GaugeType`
- `Orientation`
- `KnobType`
- `KnobStyle`
- `FrameDesign`
- `PointerType`
- `ForegroundType`
- `LabelNumberFormat`
- `TickLabelOrientation`
- `TrendState`

Pattern:

- element props expose simple string keys
- BaseElement maps keys to descriptor objects
- draw functions consume descriptors

### `constants.js`

Defines constructor functions for descriptor types backing the catalogs above.

This creates a strongly-shaped data model in plain JS form (without TypeScript types).

## 11) Rendering Stack and Pipeline

Legacy rendering is heavily optimized and visually layered.

Common per-gauge pipeline:

1. Parse incoming params + defaults
2. Compute geometry/scales/ticks
3. Build static buffers once (frame/background/static marks/foreground)
4. Repaint dynamic layers (pointer/value markers/LCD text/alerts)
5. Composite buffers onto main canvas

Common function pattern:

- `init(...)` builds cached assets and static buffers
- `repaint()` handles clear + compositing
- both nested inside each draw function closure

This pattern is central to preserving performance in v3.

## 12) Buffering and Caching Strategy

### Offscreen buffers

`tools.createBuffer(width, height)` is used extensively in gauge modules and helper modules.

Typical buffers:

- frame buffer
- background buffer
- foreground buffer
- pointer buffer(s)
- indicator/LCD/marker buffers

### Module-level caches

Many helper modules keep static caches keyed by style/size.

Examples:

- `drawBackground.cache[cacheKey]`
- `drawFrame.cache[cacheKey]`
- `drawForeground.cache[cacheKey]`
- image factory caches (`createLedImage`, `createKnobImage`, etc.)

Net effect:

- expensive raster operations are amortized
- frame-to-frame work focuses on dynamic compositing

## 13) Material/Look Implementation (Visual Signature)

### `drawBackground.js`

Responsible for gauge-face material simulation.

Includes specialized pipelines for:

- `CARBON`
- `PUNCHED_SHEET`
- `BRUSHED_METAL`
- `BRUSHED_STAINLESS`
- `STAINLESS`
- `TURNED`

Also applies depth/shadow overlays.

### `drawFrame.js`

Responsible for bezel/ring visuals.

Supports many frame designs including:

- `metal`, `brass`, `steel`, `gold`, `anthracite`
- `tiltedGray`, `tiltedBlack`
- `glossyMetal`, `blackMetal`, `shinyMetal`, `chrome`

Uses gradients and center masking (`destination-out`) to cut ring openings.

### `drawForeground.js`

Responsible for glass/reflection overlays and optional center knob.

- Multiple foreground styles (`type1..type5`)
- Knob placement varies by gauge type/orientation combinations
- Uses cached highlight layers for realism

## 14) Math, Color, and Utility Core (`tools.js`)

`tools.js` is the shared utility backbone.

Major responsibilities:

- geometry constants (`PI`, `HALF_PI`, conversion factors)
- numeric helpers (`calcNiceNumber`, `range`, `wrap`, `getShortestAngle`)
- color model + conversion (`rgbaColor`, HSL/HSB/RGB helpers)
- gradient interpolation (`gradientWrapper`, conical gradient helper)
- offscreen canvas creation and draw wrappers
- assertions (`assert`, `AssertionError`)

This should be split into typed modules in v3 (`math`, `color`, `canvas`, `assertion`, `scale`).

## 15) Animation Model

Legacy gauges use D3 timing primitives:

- `timer` and `now` from `d3-timer`
- `scaleLinear` from `d3-scale`
- easing functions from `d3-ease` (commonly `easeCubicInOut`)

Typical interpolation pattern:

- `timeScale` maps elapsed ms to progress [0..1]
- easing transforms progress
- value scale maps eased progress to [origin..target]
- timer runs until completion, then stops

This model is mature and should be retained conceptually in v3 (with typed abstraction and testable scheduler).

## 16) Legacy Design Tradeoffs (What to Keep vs Replace)

Keep (conceptually):

- Layered offscreen rendering and caching
- Rich option catalogs and visual fidelity focus
- Gauge-specific draw modules with shared helper stack
- Deterministic draw pipeline style

Replace in v3:

- Public negative booleans (`noXVisible`)
- Side-effect-only entrypoint as the only API
- Untyped option catalogs and implicit coercion behavior
- Tight coupling between component schema and draw internals

## 17) Direct Guidance for v3 Implementation

### 17.1 Core architecture mapping

Legacy `tools.js` + draw helpers -> v3 `core` typed modules:

- `core/math/*`
- `core/color/*`
- `core/geometry/*`
- `core/render/layers/*`
- `core/render/cache/*`
- `core/animation/*`

### 17.2 API mapping strategy

- Convert legacy `noXVisible` flags to positive v3 names (`showX`)
- Preserve behavior, not naming
- Keep enum spaces but expose typed unions and documented defaults

### 17.3 Component mapping strategy

- Keep element wrappers thin in `elements`
- Move draw and normalization logic to `core`
- Avoid direct side-effect registration for entire library by default

### 17.4 Visual fidelity strategy (source-driven)

- Treat legacy JavaScript painter modules as the visual source of truth.
- Execute in fixed order: radial -> linear -> compass.
- Require algorithm-fidelity ports per gauge: preserve render pipeline order, geometry formulas, defaults/mode behavior, and compositing semantics.
- Start with radial as the reference implementation, then propagate shared painter utilities.
- Port frame/background/foreground helpers early because they drive identity.
- Use screenshot fixtures to validate composition and positioning after source-driven implementation.

## 18) Priority Legacy Files for Ongoing Reference

Read first during implementation:

1. `src/BaseElement.js`
2. `src/tools.js`
3. `src/definitions.js`
4. `src/constants.js`
5. `src/drawBackground.js`
6. `src/drawFrame.js`
7. `src/drawForeground.js`
8. `src/Radial.js`
9. `src/Linear.js`
10. `src/Compass.js`

Read next for behavior edge cases:

- `src/WindDirection.js`
- `src/Clock.js`
- `src/StopWatch.js`
- `src/RadialVertical.js`
- `src/LinearBargraph.js`
- `src/RadialBargraph.js`

## 19) Known Legacy Quirks to Watch

- Negative visibility flags are semantically inverted in BaseElement.
- Enum values are often string keys transformed into object descriptors at runtime.
- Many gauges rely on side effects in `updated()` and timer restart patterns.
- Some modules include mixed responsibilities (geometry, assets, animation in one file).
- Visual realism relies on non-trivial gradient math and compositing modes; parity can break with small numeric changes.

## 20) Practical v3 Usage of This Research

When implementing a v3 gauge:

1. Identify matching legacy module + helper dependencies.
2. Document expected visual layers (frame/background/foreground/pointer/LCD).
3. Port geometry and scale rules directly from legacy code paths and constants.
4. Port static-layer rendering and cache key strategy.
5. Port dynamic rendering and animation interpolation.
6. Verify pipeline parity against legacy draw order and mode/default behavior.
7. Validate against fixture screenshots before exposing public API.
8. Expose a clean typed v3 config that preserves behavior, not legacy naming.

This approach lets v3 remain modern and maintainable while preserving the excellent visual and functional legacy behavior.

For the current visual fidelity pass, implement gauges in strict sequence: radial -> linear -> compass.

## 21) Visual Analysis

### 21.1 Composition and layout cues

- Uniform circular gauge footprints with consistent bezel thickness.
- Strong use of concentric layering: frame ring -> dial face -> foreground glass/reflection -> center hardware.
- Most gauges use neutral metal/charcoal palettes, with red as primary accent and cyan/blue as secondary accent.
- Numeric LCD areas have muted green-gray backgrounds with dark text.
- Overall visual density is high but balanced through clear contrast hierarchy.

### 21.3 Material and lighting characteristics

- Frame/bezel appears metallic with soft radial shading and subtle outer stroke.
- Foreground glass highlights are visible as curved translucent overlays, not flat alpha layers.
- Center hub/knob has metallic radial gradient with dark rim, giving depth.
- Tick marks are anti-aliased and vary in major/minor lengths.
- Pointer shadows and slight glow/contrast around needles improve legibility on dark dials.

These cues align with the legacy helper modules (`drawFrame`, `drawBackground`, `drawForeground`) and reinforce their importance in early v3 porting.

### 21.4 Typography and labeling cues

- Cardinal directions and scale labels use compact high-contrast serif/sans combinations depending on gauge.
- LCD labels (`Latest`, `Average`) use small uppercase/compact text; values are larger and centered.
- Numeric scale labels are rotated/oriented to follow arc geometry and avoid clutter.
- The visual language prioritizes readability over decorative type effects.

### 21.5 Motion cues observed

From frame-to-frame context in the GIF snapshot:

- Needle movement appears eased rather than linear/stepwise.
- Dual-pointer gauges indicate independent animated values.
- Clock/stopwatch hands imply continuous timer-driven updates.
- Horizon indicator implies coupled transformations (roll + pitch translation).

These observations support preserving the D3-style interpolation approach in v3 animation architecture.
