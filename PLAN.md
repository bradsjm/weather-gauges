# Weather Gauges Component Contracts - API Design (v4.0)

**Date:** 2026-02-13
**Scope:** Gauge component API contracts for `@bradsjm/weather-gauges-core` and `@bradsjm/weather-gauges-elements`
**Target Audience:** API designers, web developers consuming the library

---

## Executive Summary

The Weather Gauges v4.0 architecture (Lit custom elements -> Zod-validated renderer configs -> Canvas renderer)
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

---

## 6.5 Advanced Visual Customization

For detailed visual customization beyond presets and CSS variables, use the `style` property:

### Frame Designs

**Property:** `style.frameDesign`

Available frame materials and finishes:

- `metal` - Standard metallic finish
- `brass` - Warm brass finish
- `steel` - Brushed steel appearance
- `chrome` - Polished chrome reflectivity
- `gold` - Gold metallic finish
- `blackMetal` - Dark metallic with highlights
- `shinyMetal` - Highly reflective metal
- `anthracite` - Dark gray matte finish
- `tiltedGray` - Angled gray gradient
- `tiltedBlack` - Angled black gradient
- `glossyMetal` - Glossy metallic with depth

### Background Colors

**Property:** `style.backgroundColor`

Available background finishes:

**Solid Colors:**

- `darkGray`, `satinGray`, `lightGray`, `white`, `black`
- `beige`, `brown`, `red`, `green`, `blue`
- `anthracite`, `mud`

**Textured/Material Finishes:**

- `punchedSheet` - Perforated metal pattern
- `carbon` - Carbon fiber weave pattern
- `stainless` - Stainless steel brushed finish
- `brushedMetal` - Generic brushed metal
- `brushedStainless` - Brushed stainless steel
- `turned` - Lathe-turned metal pattern

### Foreground Types

**Property:** `style.foregroundType`

Gauge face overlay styles:

- `flat` - Standard flat overlay with minimal depth
- `subtle` - Subtle gradient overlay with light depth
- `pronounced` - Pronounced depth with stronger shadows
- `glossy` - Glossy highlight overlay with shine effect
- `maximum` - Maximum depth/gloss effect for high contrast

### Pointer Types

**Property:** `style.pointerType`

Available pointer/needle designs:

**Classic Needles:**

- `compass` - Classic compass needle with diamond tip
- `slimAngular` - Slim angular needle with sharp point
- `thinBar` - Thin bar needle for minimal obstruction
- `diamondSpear` - Diamond spear needle with central ridge
- `triangularSplit` - Triangular split needle with center cutout
- `forkedCenter` - Forked center needle with dual tips
- `simpleTriangle` - Simple triangular needle
- `curvedClassic` - Curved classic needle (most common)

**Styled Needles:**

- `heavyMetallic` - Heavy metallic needle with weight
- `teardropBulb` - Teardrop bulb needle with rounded tip
- `curvedTail` - Curved tail needle with swept back design
- `narrowSpike` - Narrow spike needle for precision
- `labelTip` - Label-tip marker needle with indicator
- `metallicMarker` - Metallic marker needle with sheen
- `ornateRingBase` - Ornate ring-base needle with decorative element
- `ringBarTail` - Ring-base bar-tail needle with stabilizer

### Pointer Colors

**Property:** `style.pointerColor`

Available pointer colors:

- `red`, `green`, `blue`, `orange`, `yellow`
- `cyan`, `magenta`, `white`, `gray`, `black`
- `raith` - Red-orange
- `greenLcd` - LCD-style green
- `jugGreen` - Dark instrument green

### Gauge Types

**Property:** `style.gaugeType` (Radial/Bargraph only)

Overall gauge visual style:

- `minimal` - Minimal tick marks only
- `standard` - Standard tick density with labels
- `detailed` - Dense tick marks with minor ticks
- `full` - Full featured with all elements (default)
- `maximum` - Maximum detail including all decorative elements

### Orientation

**Property:** `style.orientation` (Radial only)

Gauge orientation:

- `north` - Standard upward orientation
- `east` - Rotated 90° clockwise
- `west` - Rotated 90° counter-clockwise

### Visibility Configuration

Control which visual elements are rendered:

```typescript
element.visibility = {
  showFrame: true, // Outer bezel/frame
  showBackground: true, // Background color/pattern
  showForeground: true, // Foreground overlay
  showLcd: true, // LCD value display
  showLed: false, // Status LED indicator
  showTrend: false, // Trend arrow indicator
  showMinMeasured: false, // Minimum value marker
  showMaxMeasured: false // Maximum value marker
}
```

### LED and Indicators

Configure status indicators:

```typescript
element.indicators = {
  ledVisible: false, // Show status LED
  userLedVisible: false, // Show user-controllable LED
  trendVisible: false, // Show trend indicator
  trendState: 'down', // 'up' | 'steady' | 'down'
  minMeasuredValueVisible: false,
  maxMeasuredValueVisible: false,
  minMeasuredValue: 0, // Required if visible
  maxMeasuredValue: 100 // Required if visible
}
```

### Usage Example

```typescript
const gauge = document.querySelector('wx-gauge')

gauge.style = {
  frameDesign: 'brass',
  backgroundColor: 'darkGray',
  foregroundType: 'pronounced',
  pointerType: 'curvedClassic',
  pointerColor: 'orange',
  gaugeType: 'full',
  orientation: 'north'
}

gauge.visibility = {
  showFrame: true,
  showLcd: true,
  showLed: true,
  showTrend: true,
  showMinMeasured: true,
  showMaxMeasured: true
}

gauge.indicators = {
  ledVisible: true,
  trendVisible: true,
  trendState: 'up',
  minMeasuredValueVisible: true,
  maxMeasuredValueVisible: true,
  minMeasuredValue: 10,
  maxMeasuredValue: 95
}
```

---

## 7. Declarative Child Elements (HTML)

Complex configuration via child elements:

```html
<wx-gauge value="75" gauge-min="0" gauge-max="100" label="Temperature" unit="°C">
  <wx-section start="0" end="60" color="var(--wx-accent-color)" label="Normal"></wx-section>
  <wx-section start="60" end="80" color="var(--wx-warning-color)" label="Warm"></wx-section>
  <wx-section start="80" end="100" color="var(--wx-danger-color)" label="Hot"></wx-section>

  <wx-alert threshold="80" severity="warning" message="High temperature"></wx-alert>
  <wx-alert threshold="95" severity="critical" message="Critical temperature"></wx-alert>
</wx-gauge>
```

### Wind Rose Example

```html
<wx-wind-rose gauge-max="50">
  <wx-petal direction="0" value="10"></wx-petal>
  <wx-petal direction="45" value="15"></wx-petal>
  <wx-petal direction="90" value="8"></wx-petal>
</wx-wind-rose>
```

### Precedence Rules

Configuration sources are merged with this priority (highest to lowest):

1. **Explicit properties** (JavaScript assignment)
2. **Child elements** (declarative HTML)
3. **Preset defaults**
4. **Hardcoded defaults**

Child elements are parsed as configuration inputs only; they do not render as visible DOM children.

---

## 8. CSS Custom Properties (Theming)

### Layout

| Variable    | Description       |
| ----------- | ----------------- |
| `--wx-size` | Gauge canvas size |

### Typography

| Variable           | Description         |
| ------------------ | ------------------- |
| `--wx-label-color` | Primary label color |
| `--wx-label-font`  | Label font family   |

### Palette

| Variable             | Description                 |
| -------------------- | --------------------------- |
| `--wx-accent-color`  | Primary accent color        |
| `--wx-warning-color` | Warning state color         |
| `--wx-danger-color`  | Danger/critical state color |

### Gauge Paint

| Variable             | Description                                     |
| -------------------- | ----------------------------------------------- |
| `--wx-frame-color`   | Outer frame color                               |
| `--wx-bg-color`      | Background color                                |
| `--wx-tick-color`    | Tick mark color                                 |
| `--wx-pointer-color` | Needle/pointer color                            |
| `--wx-lcd-bg`        | LCD display background                          |
| `--wx-lcd-color`     | LCD display text color                          |
| `--wx-lcd-font`      | LCD digital font family (e.g., 'LCDMono2Ultra') |

### Visual Themes

Themes control the visual appearance using CSS custom properties:

```
User CSS variables > Theme defaults > Hardcoded defaults
```

Available themes via `theme` attribute:

- `theme="classic"` (default) - Traditional gauge appearance
- `theme="flat"` - Modern minimal design
- `theme="high-contrast"` - Accessibility-focused high contrast

Themes set CSS custom properties only when not already defined by user stylesheets.

### Measurement Presets

Measurement presets provide complete configurations for common sensor types, eliminating the need to manually configure ranges, sections, and display options.

Use via `preset` attribute:

```html
<!-- Temperature gauge with appropriate scale and sections -->
<wx-gauge preset="temperature" value="22.5" label="Outdoor" unit="°C"></wx-gauge>

<!-- Humidity gauge with comfort zones -->
<wx-gauge preset="humidity" value="65" label="Humidity" unit="%"></wx-gauge>
```

#### Available Measurement Presets

| Preset           | Gauge Type | Scale                                             | Features                                                      |
| ---------------- | ---------- | ------------------------------------------------- | ------------------------------------------------------------- |
| `temperature`    | radial     | -20°C to 40°C (metric)<br>0°F to 100°F (imperial) | Sections: freezing/normal/warm/hot<br>Trend indicator enabled |
| `humidity`       | radial     | 0% to 100%                                        | Sections: dry/comfortable/wet<br>Fixed scale                  |
| `pressure`       | radial     | 990-1030 hPa / 99-103 kPa / 29.2-30.4 inHg        | Sections: low/normal/high                                     |
| `rainfall`       | bargraph   | 0-10mm / 0-0.5in                                  | Blue color, optional gradient/sections                        |
| `rain-rate`      | bargraph   | 0-10mm/hr / 0-0.5in/hr                            | Intensity-based sections                                      |
| `wind-speed`     | radial     | 0-30 km/h / 0-20 mph / 0-20 kts                   | Trend indicator, auto-scaling                                 |
| `wind-direction` | compass    | 0° to 360°                                        | Latest + average pointers<br>Variation display                |
| `solar`          | radial     | 0-1000 W/m²                                       | Intensity sections<br>Sunshine LED                            |
| `uv-index`       | radial     | 0-10 (or 0-16)                                    | Risk-level sections<br>Decimal precision                      |
| `cloud-base`     | radial     | 0-1000m / 0-3000ft                                | Altitude sections                                             |

#### Preset Configuration Details

**Temperature Preset:**

- Metric: -20°C to 40°C
- Imperial: 0°F to 100°F
- Sections: Freezing (< 0°C/32°F), Normal, Warm (> 25°C/77°F), Hot (> 35°C/95°F)
- Trend indicator enabled
- Auto-scaling when values exceed default range

**Humidity Preset:**

- Fixed 0-100% scale
- Sections: Dry (0-20%), Comfortable (20-80%), Wet (80-100%)
- No trend indicator (use temperature trend instead)

**Pressure Preset:**

- Auto-detects unit from value magnitude or explicit unit attribute
- Sections: Low, Normal, High based on meteorological norms
- Trend indicator enabled

**Rainfall/Rain-Rate Presets:**

- Bargraph gauge type
- Blue color scheme
- Optional gradient or section colors via CSS
- Rain-rate includes intensity sections

**Wind Presets:**

- Wind-speed: Latest value with trend
- Wind-direction: Compass with latest + average pointers (red + blue)
- **Wind variation**: 10-minute directional spread displayed as colored sectors (rgba(120,200,120,0.7))
- Variation shows min/max direction over configured window

**Wind-Direction Variation Details:**

The wind-direction preset includes variation tracking to show directional spread:

```typescript
// Variation configuration (via element.variation property)
interface WindVariation {
  enabled: boolean // Default: true
  windowMinutes: number // Default: 10 (matches standard meteorological practice)
  minDirection: number // Minimum direction in window (degrees)
  maxDirection: number // Maximum direction in window (degrees)
  color: string // Default: 'rgba(120,200,120,0.7)'
}
```

**Variation Display:**

- Renders as a colored sector between min and max directions
- Updates continuously as new readings arrive
- Helps visualize wind turbulence and shifting patterns
- Independent of the average pointer

**Usage:**

```html
<wx-wind-direction preset="wind-direction" value="245" average="238"> </wx-wind-direction>
```

**Programmatic access to variation data:**

```typescript
const windDir = document.querySelector('wx-wind-direction')
windDir.variation = {
  enabled: true,
  windowMinutes: 10,
  minDirection: 220,
  maxDirection: 260
}
```

**Solar/UV Presets:**

- Intensity-based color sections
- Solar includes theoretical max calculation for sunshine detection
- UV includes risk levels (low/moderate/high/very high/extreme)

### Combining Presets and Themes

Presets and themes work independently and can be combined:

```html
<!-- Temperature gauge with flat theme -->
<wx-gauge preset="temperature" theme="flat" value="22.5"></wx-gauge>

<!-- High-contrast humidity gauge for accessibility -->
<wx-gauge preset="humidity" theme="high-contrast" value="65"></wx-gauge>
```

### Customizing Preset Defaults

Presets set reasonable defaults, but all attributes can be overridden:

```html
<!-- Temperature preset with custom range -->
<wx-gauge preset="temperature" gauge-min="-30" gauge-max="50" value="-15"></wx-gauge>
```

Override precedence:

```
Explicit attributes > Measurement preset defaults > Hardcoded defaults
```

---

## 9. Events

### State Change Event

**Event:** `wx-state-change`

Emitted whenever the gauge value or state changes.

```typescript
interface GaugeState {
  kind: 'radial' | 'bargraph' | 'compass' | 'wind-direction' | 'wind-rose'
  reading: number
  tone: 'accent' | 'warning' | 'danger'
  alerts: Array<{
    id: string
    message: string
    severity: 'info' | 'warning' | 'critical'
  }>
  timestampMs: number
}
```

**Gauge-Specific Notes:**

- **Wind Direction**: `reading` is `average` if present, otherwise `latest`
  - Extension interface available: `{ latest: number; average?: number }`
- **Wind Rose**: `reading` is the maximum petal value

### Error Event

**Event:** `wx-error`

Emitted when validation or rendering fails.

```typescript
interface GaugeErrorDetail {
  kind: 'radial' | 'bargraph' | 'compass' | 'wind-direction' | 'wind-rose'
  code: 'invalid_config' | 'invalid_value' | 'render_error'
  message: string
  issues?: Array<{
    path: string
    message: string
  }>
}
```

Schema validation errors include the full issue array. Do not discard Zod validation details.

---

## 10. Validation Modes

| Mode              | Behavior                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `clamp` (default) | Clamp values to valid range before validation. Coerce NaN/Infinity to 0 or last-known-good. Emit errors only for unrecoverable config errors. |
| `coerce`          | Like clamp, but also coerce numeric strings, empty attributes, etc.                                                                           |
| `strict`          | Any invalid input yields `wx-error` and no render update. For debugging and testing.                                                          |

**Implementation:** Elements clamp incoming scalar values to valid domains before calling Zod parsers when `validation !== 'strict'`.

---

## 11. Accessibility

Canvas-based gauges include built-in accessibility:

### Required Attributes

- `role="img"` on the canvas element
- `aria-label` derived from gauge label and current value
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for data-bearing gauges

### Screen Reader Content

Default accessible text format: `{label}: {value} {unit}`

Custom screen reader text via slot:

```html
<wx-gauge value="75" label="Temperature" unit="°C">
  <span slot="sr-content">Current temperature is 75 degrees Celsius</span>
</wx-gauge>
```

### Programmatic Access

```typescript
gauge.readingText: string  // Current accessible text representation
```

---

## 12. Implementation Checklist

### Core Package

- [x] Compass schema: remove `value`/`heading` duplication
- [ ] Consistent range validation across all gauges _(partially complete: compass and wind-direction tightened)_
- [ ] Normalized "reading" interface for render results _(partially complete via `toGaugeContractState` mapping)_

### Elements Package

- [x] Clamp values before Zod parsing (when not strict mode)
- [x] Map Zod issues to `{path, message}` in error events
- [x] Parse `wx-section`/`wx-alert`/`wx-petal` child elements
- [x] Implement precedence: properties > children > presets > defaults
- [x] CSS variable resolution via `getComputedStyle`
- [ ] ARIA attributes on canvas elements
- [ ] Screen reader slot support
- [x] Measurement presets implementation:
  - [x] `temperature` preset with auto unit detection
  - [x] `humidity` preset with comfort zones
  - [x] `pressure` preset with unit-specific ranges
  - [x] `rainfall` and `rain-rate` presets
  - [x] `wind-speed` and `wind-direction` presets
  - [x] `solar` and `uv-index` presets
  - [x] `cloud-base` preset
  - [x] Unit auto-detection logic

### Documentation

- [ ] Element API reference
- [ ] CSS custom properties catalog
- [ ] Visual customization options reference
- [x] Event payload documentation _(updated with structured error payload)_
- [ ] Validation mode behavior guide
- [ ] Accessibility implementation guide

---

## 13. Benefits

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

_End of Document_
