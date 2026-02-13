## Executive Summary

The Weather Gauges architecture (Lit custom elements -> Zod-validated renderer configs -> Canvas renderer)
is solid: strict schemas, good separation between `elements` and `core`, and predictable rendering pipelines.

The public API is designed for:

- **HTML-first contracts** for common use cases (5-10 attributes per gauge)
- **Measurement presets** for instant configuration of temperature, humidity, pressure, wind, rainfall, solar, UV, and cloud base gauges
- **CSS custom properties** as the primary theming mechanism
- **Progressive enhancement** for complex configuration via properties and optional declarative child elements
- **Consistent event/error contracts** with rich validation details
- **Safe-by-default validation** (clamp/coerce) to prevent "value out of range" crashes in normal use
- **Accessibility built-in** with ARIA support and screen reader content

---

## 1. Architecture Overview

```
┌───────────────────────────────────────────┐
│ Elements Package (Web Components / Lit)    │
│ - Minimal top-level element properties     │
│ - Attribute -> config mapping              │
│ - Emits wx-state-change, wx-error          │
├───────────────────────────────────────────┤
│ Core Package (Rendering Engine)            │
│ - Zod schemas define config contracts      │
│ - Canvas rendering + animation scheduler   │
│ - Returns render results w/ tone + alerts  │
└───────────────────────────────────────────┘
```

The element API is intentionally **flat** (few top-level attributes), while the core config is **nested** internally.
Consumers interact with a simple, predictable surface while the core handles complexity.

---

## 2. Guiding Principles

1. **Small surface**: make the common path simple and memorable.
2. **Consistency**: same attribute names across gauges wherever possible.
3. **CSS-first theming**: move appearance to CSS variables; presets provide starting points.
4. **Progressive enhancement**: attributes -> properties -> advanced config.
5. **Safe defaults**: avoid throwing for common "slightly invalid" inputs; clamp by default.
6. **Explicit contracts**: events and error payloads are versioned and documented.
7. **Accessible by default**: include ARIA support and screen reader content.

---

## 3. Element Naming

### Short Tags (Standard)

All elements use the `wx-` prefix for brevity:

- `wx-gauge` - Circular radial gauge
- `wx-bargraph` - Radial bar graph
- `wx-compass` - Directional compass
- `wx-wind-direction` - Wind direction (latest + average)
- `wx-wind-rose` - Wind rose visualization

### Child Configuration Elements

- `wx-section` - Value bands/sections
- `wx-alert` - Alert thresholds
- `wx-petal` - Wind rose data points

---

## 4. Shared Base Attributes (All Scalar Gauges)

Target: ~8-10 attributes total.

| Attribute    | Type    | Default | Description                                      |
| ------------ | ------- | ------- | ------------------------------------------------ |
| `value`      | number  | 0       | Current gauge reading                            |
| `gauge-min`  | number  | 0       | Minimum value of the scale                       |
| `gauge-max`  | number  | 100     | Maximum value of the scale                       |
| `label`      | string  | -       | Primary label for the gauge                      |
| `unit`       | string  | -       | Unit of measurement                              |
| `size`       | number  | 200     | Canvas size in pixels (square)                   |
| `animated`   | boolean | true    | Enable value change animations                   |
| `duration`   | number  | 500     | Animation duration in milliseconds               |
| `preset`     | string  | -       | Measurement preset (see Section 8.3)             |
| `theme`      | string  | classic | Visual theme: `classic`, `flat`, `high-contrast` |
| `validation` | string  | clamp   | Validation mode: `clamp`, `coerce`, `strict`     |

**Notes:**

- `gauge-min`/`gauge-max` use the `gauge-` prefix to avoid collision with HTML input attributes
- Fixed-domain gauges (compass, wind-direction) omit `gauge-min`/`gauge-max`

---

## 5. Gauge-Specific Attributes

### Radial and Bargraph Gauges

| Attribute         | Type   | Description                    |
| ----------------- | ------ | ------------------------------ |
| `threshold`       | number | Alert threshold value          |
| `threshold-label` | string | Text label for threshold       |
| `decimals`        | number | Decimal places for LCD display |

### Compass

| Attribute      | Type    | Description                       |
| -------------- | ------- | --------------------------------- |
| `show-labels`  | boolean | Show cardinal/ordinal labels      |
| `show-degrees` | boolean | Show degree tick labels           |
| `face-rotates` | boolean | Rotate the compass face vs needle |

### Wind Direction

| Attribute       | Type   | Description               |
| --------------- | ------ | ------------------------- |
| `average`       | number | Secondary average value   |
| `average-label` | string | Label for average reading |

### Wind Rose

| Attribute   | Type   | Description                                              |
| ----------- | ------ | -------------------------------------------------------- |
| `gauge-max` | number | Optional max scale (auto-derived from petals if omitted) |

---

## 6. Properties for Complex Inputs (JS-Only)

These are JavaScript properties, not HTML attributes:

```typescript
interface GaugeSection {
  start: number
  end: number
  color: string
  label?: string
}

type GaugeAlertSeverity = 'info' | 'warning' | 'critical'

interface GaugeAlert {
  threshold: number
  severity: GaugeAlertSeverity
  message?: string
}

interface WindRosePetal {
  direction: number
  value: number
  color?: string
}

// Visual styling (see Section 6.5 for detailed options)
interface VisualStyle {
  frameDesign: FrameDesign
  backgroundColor: BackgroundColor
  foregroundType: ForegroundType
  pointerType: PointerType
  pointerColor: PointerColor
  gaugeType: GaugeType
  orientation: Orientation
}

// Visibility flags
interface VisibilityConfig {
  showFrame: boolean
  showBackground: boolean
  showForeground: boolean
  showLcd: boolean
  showLed: boolean
  showTrend: boolean
  showMinMeasured: boolean
  showMaxMeasured: boolean
}

// LED/Indicator configuration
interface IndicatorConfig {
  ledVisible: boolean
  userLedVisible: boolean
  trendVisible: boolean
  trendState: 'up' | 'steady' | 'down'
  minMeasuredValueVisible: boolean
  maxMeasuredValueVisible: boolean
  minMeasuredValue?: number
  maxMeasuredValue?: number
}

element.sections: GaugeSection[]
element.alerts: GaugeAlert[]
element.overlay: { image: CanvasImageSource; visible?: boolean } | null
element.petals: WindRosePetal[]  // Wind rose only
element.style: VisualStyle       // Advanced visual customization
element.visibility: VisibilityConfig
element.indicators: IndicatorConfig

// Background overlay for logos/watermarks
element.overlay: {
  image: CanvasImageSource  // Logo or watermark image
  visible?: boolean         // Default: true
  opacity?: number          // 0.0-1.0, default: 0.3
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  scale?: number            // Scale factor, default: 0.5
}

// Trend calculation helper
TrendCalculator: {
  // Calculate trend from time-series data
  calculate(values: { timestamp: number; value: number }[]): TrendState

  // Trend states
  type TrendState = 'up' | 'down' | 'steady' | null

  // Configuration
  threshold?: number        // Minimum change to trigger trend, default: 0.5
  windowMs?: number         // Time window for calculation, default: 600000 (10 min)
}
```

## 6. Benefits

### For Web Developers

- Simple, predictable API (5-10 attributes for common cases)
- **Measurement presets** eliminate manual configuration for temperature, humidity, pressure, rainfall, wind, solar, UV, and cloud base
- Rich visual customization when needed (11 frame designs, 18 backgrounds, 16 pointers, etc.)
- CSS variables integrate with existing design systems
- Safe defaults prevent runtime crashes from noisy data
- Accessible gauges work with screen readers out of the box
- Rich error events for debugging

### For Maintainers

- Small public surface reduces API churn risk
- Clear separation: data inputs vs theming vs advanced config
- Better diagnostics reduce support burden
- Accessibility compliance without external wrappers

---

## 7. Implementation Plan (Align PLAN -> Current Code)

This section is a gap-aware implementation plan based on the current repository state.

### 7.1 What Already Exists

- `@bradsjm/weather-gauges-core` already uses Zod schemas per gauge and exposes consistent event/error contracts (`wx-state-change`, `wx-error`).
- `@bradsjm/weather-gauges-elements` already implements the five `wx-*` tags and supports `validation` modes (`clamp` default, plus `coerce` and `strict`).
- Measurement presets are already implemented for: temperature, humidity, pressure, wind-speed, rainfall, rain-rate, solar, uv-index, cloud-base (plus a `wind-direction` preset for text defaults).
- CSS custom property theming already exists via `--wx-*` tokens (core resolves paint from computed styles).
- Declarative child tags are already supported in elements: `wx-section`, `wx-alert`, `wx-petal` (parsed as configuration children; they do not need to be registered custom elements).

### 7.2 Gaps / Changes Needed To Fully Match This PLAN

- `theme` attribute is not currently implemented as a discrete theme selector; theming is CSS-token driven today.
- The public element API has been reduced to a small stable HTML-first attribute surface; advanced options now route through JS properties.
- `threshold-label` and `average-label` attribute alignment has been implemented; migration notes should be kept visible in docs/release notes.
- Wind rose scale auto-derivation is already present in `wx-wind-rose`; this item is now verification/docs alignment instead of net-new behavior.
- `TrendCalculator` helper has been implemented in `core`; docs/examples should reference the exported helper API.
- `overlay` (logo/watermark) contract has been implemented for compass, wind-direction, and wind-rose; radial-family integration remains for future enhancement if needed.

### 7.3 Phased Work Plan

Progress tracker:

- [x] 1. Contract + Docs Hardening (no behavior change)
- [x] 2. Implement `theme` Selector
- [x] 3. Rename Attributes To Match PLAN (breaking)
- [x] 4. Wind Rose Auto-Scale (PLAN behavior)
- [x] 5. Add `TrendCalculator` to `core`
- [x] 6. Add `overlay` Support End-to-End
- [x] 7. Reduce Public Surface To 8-10 Attributes (breaking)

1. Contract + Docs Hardening (no behavior change)
   - Update README/docs-site to reflect the intended stable HTML-first subset.
   - Define/confirm the canonical attribute names (especially for child tags).
   - Status: Completed. Root/elements/docs-site READMEs now document the stable subset and canonical child-tag attribute names.

2. Implement `theme` Selector
   - Add a `theme` attribute on base element(s) and map it to token sets (e.g. applying predefined `--wx-*` overrides).
   - Provide built-in themes: `classic`, `flat`, `high-contrast` (as token presets).
   - Status: Completed. Added a reflected `theme` attribute to the base element and CSS-token presets for `classic`, `flat`, and `high-contrast`.

3. Rename Attributes To Match PLAN (breaking)
   - Replace existing attribute names that differ from this document:
     - Add `threshold-label` and remove/replace existing threshold/LCD title attributes.
     - Add `average-label` and remove/replace existing wind-direction LCD title attributes.
   - Update docs-site examples and any consumer code accordingly.
   - Status: Completed. Added `threshold-label` on radial and bargraph elements, replaced wind-direction `lcd-title-*` attributes with `average-label`, and updated docs-site examples/controls and preset tests.

4. Wind Rose Auto-Scale (PLAN behavior)
   - Change `wx-wind-rose` to derive max scale from petals when `gauge-max` is not explicitly set.
   - Status: Completed in current codebase; kept as a tracked item for verification and docs alignment.

5. Add `TrendCalculator` to `core`
   - Implement a small, pure helper (`calculate(values, { threshold, windowMs })`) returning `up|down|steady|null`.
   - Document recommended usage from elements/consumers; add unit tests.
   - Status: Completed. Added `calculateTrend` and `TrendCalculator.calculate` in core with configurable `threshold` and `windowMs`, plus a dedicated unit test file.

6. Add `overlay` Support End-to-End
   - Core: extend relevant gauge configs + renderers to optionally draw an overlay image (opacity/position/scale).
   - Elements: add `overlay` JS property (and optionally declarative child form) that feeds the core renderer.
   - Status: Completed for compass/wind-direction/wind-rose. Added shared overlay schema defaults (`visible`, `opacity`, `position`, `scale`), renderer support with placement/opacity handling, and new `overlay` JS properties in elements with backward-compatible `customLayer` fallback.

7. Reduce Public Surface To 8-10 Attributes (breaking)
   - Define the supported attribute surface as the set in Section 4 (+ gauge-specific attributes in Section 5).
   - Remove advanced attributes from elements and move advanced configuration behind JS properties (`style`, `visibility`, `indicators`, etc.).
   - Update docs-site covering the new public API.
   - Status: Completed. Elements now expose stable HTML-first attributes only (shared + gauge-specific), while advanced visual and behavior settings are JS property-only. Docs contract references were updated in package READMEs.
