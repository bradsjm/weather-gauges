# SteelSeries v2 to v3 Migration Guide

## Target Audience

This document is designed for **Large Language Models** performing migration tasks. It provides explicit, detailed instructions with complete code examples, exact file paths, and actionable patterns for converting legacy SteelSeries v2 gauge components to v3 architecture.

---

## Executive Summary

The SteelSeries v3 represents a **complete architectural overhaul** from v2:

| Aspect               | v2 (Legacy)                     | v3 (Modern)                          |
| -------------------- | ------------------------------- | ------------------------------------ |
| **Architecture**     | Monolithic 1000+ line functions | Layered: Schema → Renderer → Element |
| **Type Safety**      | Runtime only                    | TypeScript + Zod validation          |
| **Config Structure** | Flat parameter object           | Hierarchical nested objects          |
| **Enums**            | Custom object descriptors       | String literal unions via Zod        |
| **Animation**        | D3 timer with manual frames     | Custom scheduler with cancellation   |
| **Rendering**        | Mixed concerns in closures      | Pure functions with clear phases     |

---

## Phase 1: Research and Analysis

### 1.1 Identify Legacy Source Files

**CRITICAL**: Always start by reading the complete legacy implementation.

**Legacy radial-bargraph location:**

```
legacy_code/src/RadialBargraph.js
legacy_code/src/BaseElement.js
legacy_code/src/definitions.js
legacy_code/src/tools.js
legacy_code/src/drawFrame.js
legacy_code/src/drawBackground.js
legacy_code/src/drawForeground.js
```

**Legacy v2 property schema pattern:**

```javascript
// legacy_code/src/RadialBargraph.js
static get properties () {
  return {
    size: { type: Number, defaultValue: 200 },
    value: { type: Number, defaultValue: 0 },
    real_value: { state: true },
    // NEGATIVE BOOLEAN PATTERN - will be inverted in v3
    noFrameVisible: { type: Boolean, defaultValue: false },
    noBackgroundVisible: { type: Boolean, defaultValue: false },
    noLcdVisible: { type: Boolean, defaultValue: false },
    // Enum pattern with objectEnum mapping
    frameDesign: { type: String, objectEnum: FrameDesign, defaultValue: 'METAL' },
    backgroundColor: { type: String, objectEnum: BackgroundColor, defaultValue: 'DARK_GRAY' },
    gaugeType: { type: String, objectEnum: GaugeType, defaultValue: 'TYPE4' },
    valueColor: { type: String, objectEnum: ColorDef, defaultValue: 'RED' },
    // ... 30+ more properties
  }
}
```

**Key insight**: Legacy uses **`noXVisible`** negative booleans. v3 uses **`showX`** positive booleans.

### 1.2 Document Visual Layers

Every SteelSeries gauge renders in this exact order:

1. **Frame** (bezel/ring) - `drawFrame.js`
2. **Background** (dial face material) - `drawBackground.js`
3. **Static elements** (ticks, labels, title, unit)
4. **Dynamic elements** (bargraph LEDs, pointers, LCD)
5. **Foreground** (glass overlay, knob) - `drawForeground.js`

**MANDATORY**: Preserve this exact rendering order in v3.

---

## Phase 2: Schema Design (v3 Core)

### 2.1 Create Schema File

**File location:** `packages/core/src/radial-bargraph/schema.ts`

**Step-by-step schema construction:**

```typescript
import { z } from 'zod'
import { radialBackgroundColorSchema, radialFrameDesignSchema } from '../radial/schema.js'
import { sharedGaugeConfigSchema } from '../schemas/shared.js'

// Step 1: Define enum schemas first (string literals, NOT objects)
export const radialBargraphLabelNumberFormatSchema = z.enum([
  'standard',
  'fractional',
  'scientific'
])

export const radialBargraphTickLabelOrientationSchema = z.enum(['horizontal', 'tangent', 'normal'])

// Step 2: Define LCD color enum (legacy compatible)
export const radialBargraphLcdColorSchema = z.enum([
  'STANDARD',
  'STANDARD_GREEN',
  'BLUE',
  'ORANGE',
  'RED',
  'YELLOW',
  'WHITE',
  'GRAY',
  'BLACK'
])

// Step 3: Define section schema with validation
export const radialBargraphSectionSchema = z
  .object({
    from: z.number().finite(),
    to: z.number().finite(),
    color: z.string().trim().min(1)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.to <= value.from) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'to must be greater than from'
      })
    }
  })

// Step 4: Define gradient stop schema
export const radialBargraphValueGradientStopSchema = z
  .object({
    fraction: z.number().min(0).max(1),
    color: z.string().trim().min(1)
  })
  .strict()

// Step 5: Define alert schema with severity levels (v3 enhancement)
export const radialBargraphAlertSchema = z
  .object({
    id: z.string().trim().min(1),
    value: z.number().finite(),
    message: z.string().trim().min(1),
    severity: z.enum(['info', 'warning', 'critical']).default('warning')
  })
  .strict()

// Step 6: Define threshold with show flag
export const radialBargraphThresholdSchema = z
  .object({
    value: z.number().finite(),
    show: z.boolean().default(true)
  })
  .strict()

// Step 7: Define indicators container
export const radialBargraphIndicatorsSchema = z
  .object({
    threshold: radialBargraphThresholdSchema.optional(),
    alerts: z.array(radialBargraphAlertSchema).default([]),
    ledVisible: z.boolean().default(false),
    userLedVisible: z.boolean().default(false),
    trendVisible: z.boolean().default(false),
    trendState: z.enum(['up', 'steady', 'down', 'off']).default('off')
  })
  .strict()
  .default({
    alerts: [],
    ledVisible: false,
    userLedVisible: false,
    trendVisible: false,
    trendState: 'off'
  })

// Step 8: Define scale configuration
export const radialBargraphScaleSchema = z
  .object({
    niceScale: z.boolean().default(true),
    maxNoOfMajorTicks: z.number().int().min(2).default(10),
    maxNoOfMinorTicks: z.number().int().min(1).default(10),
    fractionalScaleDecimals: z.number().int().min(0).max(8).default(1)
  })
  .strict()

// Step 9: Define style configuration (v3 groups related properties)
export const radialBargraphStyleSchema = z
  .object({
    frameDesign: radialFrameDesignSchema.default('metal'),
    backgroundColor: radialBackgroundColorSchema.default('DARK_GRAY'),
    foregroundType: z.enum(['type1', 'type2', 'type3', 'type4', 'type5']).default('type1'),
    gaugeType: z.enum(['type1', 'type2', 'type3', 'type4']).default('type4'),
    valueColor: z
      .enum([
        'RED',
        'GREEN',
        'BLUE',
        'ORANGE',
        'YELLOW',
        'CYAN',
        'MAGENTA',
        'WHITE',
        'GRAY',
        'BLACK',
        'RAITH',
        'GREEN_LCD',
        'JUG_GREEN'
      ])
      .default('RED'),
    lcdColor: radialBargraphLcdColorSchema.default('STANDARD'),
    digitalFont: z.boolean().default(false),
    labelNumberFormat: radialBargraphLabelNumberFormatSchema.default('standard'),
    tickLabelOrientation: radialBargraphTickLabelOrientationSchema.default('normal'),
    useSectionColors: z.boolean().default(false),
    useValueGradient: z.boolean().default(false)
  })
  .strict()

// Step 10: Compose final config schema
export const radialBargraphGaugeConfigSchema = sharedGaugeConfigSchema
  .extend({
    scale: radialBargraphScaleSchema.default(() => ({
      niceScale: true,
      maxNoOfMajorTicks: 10,
      maxNoOfMinorTicks: 10,
      fractionalScaleDecimals: 1
    })),
    style: radialBargraphStyleSchema.default({
      frameDesign: 'metal',
      backgroundColor: 'DARK_GRAY',
      foregroundType: 'type1',
      gaugeType: 'type4',
      valueColor: 'RED',
      lcdColor: 'STANDARD',
      digitalFont: false,
      labelNumberFormat: 'standard',
      tickLabelOrientation: 'normal',
      useSectionColors: false,
      useValueGradient: false
    }),
    sections: z.array(radialBargraphSectionSchema).default([]),
    valueGradientStops: z.array(radialBargraphValueGradientStopSchema).default([]),
    lcdDecimals: z.number().int().min(0).max(6).default(2),
    indicators: radialBargraphIndicatorsSchema
  })
  .strict()

// Step 11: Export inferred types (TYPE SAFETY SOURCE OF TRUTH)
export type RadialBargraphGaugeConfig = z.infer<typeof radialBargraphGaugeConfigSchema>
export type RadialBargraphSection = z.infer<typeof radialBargraphSectionSchema>
export type RadialBargraphAlert = z.infer<typeof radialBargraphAlertSchema>
// ... export all other types
```

### 2.2 Schema Design Rules

**CRITICAL RULES:**

1. **Always use `.strict()`** - Prevents unexpected properties
2. **Always provide defaults** - Match legacy defaults exactly
3. **Use positive boolean names** - `showFrame`, not `noFrameVisible`
4. **Group related properties** - Use nested objects (style, scale, indicators)
5. **Add refinement validation** - Use `.superRefine()` for cross-field validation
6. **Export both schema and type** - Types are inferred from schemas via `z.infer<>`

---

## Phase 3: Renderer Implementation (v3 Core)

### 3.1 Create Renderer File

**File location:** `packages/core/src/radial-bargraph/renderer.ts`

**Architecture overview:**

```typescript
// Type definitions
export type RadialBargraphDrawContext = CanvasRenderingContext2D
export type RadialBargraphRenderResult = {
  value: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: RadialBargraphAlert[]
}
export type RadialBargraphRenderOptions = {
  value?: number
  paint?: Partial<ThemePaint>
}

// Main render function - PURE FUNCTION, NO SIDE EFFECTS
export const renderRadialBargraphGauge = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  options: RadialBargraphRenderOptions = {}
): RadialBargraphRenderResult => {
  // 1. Resolve all computed values
  const resolvedScale = resolveScale(config)
  const clampedValue = clamp(
    options.value ?? config.value.current,
    resolvedScale.minValue,
    resolvedScale.maxValue
  )
  const geometry = resolveGeometry(config.style.gaugeType, resolvedScale.range)

  // 2. Clear canvas
  context.clearRect(0, 0, config.size.width, config.size.height)

  // 3. Render in EXACT legacy order
  drawFrameBackground(context, config, size, centerX, centerY, radius, paint)
  drawTrackAndInactiveLeds(context, size, geometry, centerX, centerY)
  drawTickMarks(context, config, geometry, resolvedScale, size, centerX, centerY)
  drawTitleAndUnit(context, config, size, centerX)
  drawActiveLeds(
    context,
    config,
    clampedValue,
    size,
    geometry,
    resolvedScale,
    sectionAngles,
    gradientSampler
  )
  drawLcd(context, config, clampedValue, size, paint)
  drawSimpleLed(context, ledX, ledY, ledSize, '#ff2a2a', config.indicators.ledVisible)
  drawTrendIndicator(context, config, size)
  drawForeground(context, config, centerX, centerY, radius)

  // 4. Return result with computed state
  return { value: clampedValue, tone, activeAlerts }
}
```

### 3.2 Geometry Resolution (CRITICAL - Exact Legacy Math)

**Copy this function EXACTLY from legacy:**

```typescript
const resolveGeometry = (
  gaugeType: RadialBargraphGaugeConfig['style']['gaugeType'],
  range: number
): GaugeGeometry => {
  const PI = Math.PI
  const HALF_PI = PI * 0.5
  const TWO_PI = PI * 2

  // LEGACY: type4 has 60 degree free area
  const freeAreaAngle = (60 * PI) / 180

  let rotationOffset = HALF_PI + freeAreaAngle * 0.5
  let angleRange = TWO_PI - freeAreaAngle
  let bargraphOffset = -TWO_PI / 6

  // LEGACY: Switch on gauge type with exact angle calculations
  if (gaugeType === 'type1') {
    rotationOffset = PI
    angleRange = HALF_PI
    bargraphOffset = 0
  } else if (gaugeType === 'type2') {
    rotationOffset = PI
    angleRange = PI
    bargraphOffset = 0
  } else if (gaugeType === 'type3') {
    rotationOffset = HALF_PI
    angleRange = PI * 1.5
    bargraphOffset = -HALF_PI
  }
  // type4 uses defaults calculated above

  return {
    rotationOffset,
    bargraphOffset,
    angleRange,
    degAngleRange: angleRange * (180 / PI),
    angleStep: angleRange / Math.max(range, 1e-9)
  }
}
```

### 3.3 Scale Resolution (Legacy Nice Number Algorithm)

**CRITICAL**: Port the exact nice number algorithm:

```typescript
const calcNiceNumber = (range: number, round: boolean): number => {
  const exponent = Math.floor(Math.log10(range))
  const fraction = range / 10 ** exponent

  let niceFraction: number
  if (round) {
    if (fraction < 1.5) niceFraction = 1
    else if (fraction < 3) niceFraction = 2
    else if (fraction < 7) niceFraction = 5
    else niceFraction = 10
  } else {
    if (fraction <= 1) niceFraction = 1
    else if (fraction <= 2) niceFraction = 2
    else if (fraction <= 5) niceFraction = 5
    else niceFraction = 10
  }

  return niceFraction * 10 ** exponent
}

const resolveScale = (config: RadialBargraphGaugeConfig) => {
  const min = config.value.min
  const max = config.value.max
  const rawRange = Math.max(1e-9, max - min)

  if (config.scale.niceScale) {
    // LEGACY: Nice scale calculation
    const niceRange = calcNiceNumber(rawRange, false)
    const majorTickSpacing = calcNiceNumber(niceRange / (config.scale.maxNoOfMajorTicks - 1), true)
    const niceMin = Math.floor(min / majorTickSpacing) * majorTickSpacing
    const niceMax = Math.ceil(max / majorTickSpacing) * majorTickSpacing
    const minorTickSpacing = calcNiceNumber(
      majorTickSpacing / (config.scale.maxNoOfMinorTicks - 1),
      true
    )

    return {
      minValue: niceMin,
      maxValue: niceMax,
      range: niceMax - niceMin,
      majorTickSpacing,
      minorTickSpacing
    }
  }

  // Non-nice scale
  const majorTickSpacing = calcNiceNumber(rawRange / (config.scale.maxNoOfMajorTicks - 1), true)
  const minorTickSpacing = calcNiceNumber(
    majorTickSpacing / (config.scale.maxNoOfMinorTicks - 1),
    true
  )

  return {
    minValue: min,
    maxValue: max,
    range: rawRange,
    majorTickSpacing,
    minorTickSpacing
  }
}
```

### 3.4 Drawing Functions Pattern

**Each draw function follows this pattern:**

```typescript
const drawFrameBackground = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  size: number,
  centerX: number,
  centerY: number,
  radius: number,
  paint: ThemePaint
): void => {
  // 1. Check visibility flags
  if (config.visibility.showFrame) {
    // 2. Use legacy material drawing functions
    if (isChromeLikeFrame(config.style.frameDesign)) {
      drawLegacyRadialFrame(context, centerX, centerY, radius)
    } else {
      drawLegacyRadialFrameMetal(context, centerX, centerY, radius)
    }
  }

  if (!config.visibility.showBackground) {
    return
  }

  // 3. Apply legacy background with theme integration
  const patchedPaint: ThemePaint = {
    ...paint,
    textColor: LEGACY_BACKGROUND_TEXT[config.style.backgroundColor],
    backgroundColor: paint.backgroundColor
  }

  // 4. Draw background material
  drawLegacyRadialBackground(
    context,
    config.style.backgroundColor,
    size,
    centerX,
    centerY,
    radius,
    patchedPaint
  )
}
```

### 3.5 Animation Function

**File location**: Same renderer.ts file

```typescript
export const animateRadialBargraphGauge = (
  options: RadialBargraphAnimationOptions
): AnimationRunHandle => {
  const scheduler = createAnimationScheduler()

  // Helper to render with a specific value
  const renderWithValue = (value: number): RadialBargraphRenderResult => {
    return renderRadialBargraphGauge(
      options.context,
      options.config,
      options.paint ? { value, paint: options.paint } : { value }
    )
  }

  return scheduler.run({
    from: options.from,
    to: options.to,
    durationMs: options.config.animation.enabled ? options.config.animation.durationMs : 0,
    easing: options.config.animation.easing,
    onUpdate: (sample) => {
      const result = renderWithValue(sample.value)
      options.onFrame?.(result)
    },
    onComplete: () => {
      const result = renderWithValue(options.to)
      options.onComplete?.(result)
    }
  })
}
```

### 3.6 Renderer Export Pattern

**File location**: `packages/core/src/radial-bargraph/index.ts`

```typescript
export * from './schema.js'
export * from './renderer.js'
```

---

## Phase 4: Element Wrapper (v3 Elements)

### 4.1 Create Element File

**File location:** `packages/elements/src/index.ts` (or dedicated file)

**Complete element implementation:**

```typescript
import {
  animateRadialBargraphGauge,
  radialBargraphGaugeConfigSchema,
  renderRadialBargraphGauge,
  resolveThemePaint,
  createStyleTokenSource,
  gaugeContract,
  toGaugeContractState,
  type AnimationRunHandle,
  type RadialBargraphDrawContext,
  type RadialBargraphGaugeConfig,
  type RadialBargraphRenderResult,
  type ThemePaint
} from '@bradsjm/steelseries-v3-core'
import { LitElement, css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'

// Boolean converter for proper 'false' string handling
const booleanAttributeConverter = {
  fromAttribute: (value: string | null) => value !== null && value !== 'false'
}

// Helper to read CSS custom property with fallback
const readCssCustomPropertyColor = (
  element: Element,
  propertyName: string,
  fallback: string
): string => {
  const value = getComputedStyle(element).getPropertyValue(propertyName).trim()
  return value.length > 0 ? value : fallback
}

@customElement('steelseries-radial-bargraph-v3')
export class SteelseriesRadialBargraphV3Element extends LitElement {
  // Canvas reference using Lit query decorator
  @query('canvas') private canvasElement?: HTMLCanvasElement

  // Current animated value (internal state)
  private currentValue = 0

  // Animation handle for cancellation
  private animationHandle: AnimationRunHandle | undefined

  // CSS styles with CSS custom property contract
  static override styles = css`
    :host {
      --ss3-font-family: system-ui, sans-serif;
      --ss3-text-color: #eceff3;
      --ss3-accent-color: #c5162e;
      --ss3-warning-color: #d97706;
      --ss3-danger-color: #ef4444;
      display: inline-block;
      font-family: var(--ss3-font-family);
      color: var(--ss3-text-color);
    }
    canvas {
      display: block;
    }
  `

  // === PUBLIC PROPERTIES ===
  // All properties MUST have converters for boolean attributes

  @property({ type: Number }) value = 0
  @property({ type: Number, attribute: 'min-value' }) minValue = 0
  @property({ type: Number, attribute: 'max-value' }) maxValue = 100
  @property({ type: Number }) size = 220
  @property({ type: String }) override title = 'Radial Bargraph'
  @property({ type: String }) unit = ''
  @property({ type: Number }) threshold = 80
  @property({ type: Number, attribute: 'lcd-decimals' }) lcdDecimals = 2

  // Frame design enum
  @property({ type: String, attribute: 'frame-design' })
  frameDesign: 'metal' | 'brass' | 'steel' | 'chrome' | 'blackMetal' | 'shinyMetal' = 'metal'

  // Background color enum (legacy values preserved)
  @property({ type: String, attribute: 'background-color' })
  backgroundColor: 'DARK_GRAY' | 'SATIN_GRAY' | 'LIGHT_GRAY' | 'WHITE' | 'BLACK' = 'DARK_GRAY'

  // Foreground type enum
  @property({ type: String, attribute: 'foreground-type' })
  foregroundType: 'type1' | 'type2' | 'type3' | 'type4' | 'type5' = 'type1'

  // Gauge type enum
  @property({ type: String, attribute: 'gauge-type' })
  gaugeType: 'type1' | 'type2' | 'type3' | 'type4' = 'type4'

  // Value color enum
  @property({ type: String, attribute: 'value-color' })
  valueColor: 'RED' | 'GREEN' | 'BLUE' | 'ORANGE' | 'YELLOW' = 'RED'

  // LCD color enum
  @property({ type: String, attribute: 'lcd-color' })
  lcdColor: 'STANDARD' | 'BLUE' | 'RED' | 'GREEN' = 'STANDARD'

  // Format options
  @property({ type: String, attribute: 'label-number-format' })
  labelNumberFormat: 'standard' | 'fractional' | 'scientific' = 'standard'

  @property({ type: String, attribute: 'tick-label-orientation' })
  tickLabelOrientation?: 'horizontal' | 'tangent' | 'normal'

  @property({ type: Number, attribute: 'fractional-scale-decimals' })
  fractionalScaleDecimals = 1

  // === VISIBILITY FLAGS (POSITIVE BOOLEANS) ===
  @property({ type: Boolean, attribute: 'show-frame', converter: booleanAttributeConverter })
  showFrame = true

  @property({ type: Boolean, attribute: 'show-background', converter: booleanAttributeConverter })
  showBackground = true

  @property({ type: Boolean, attribute: 'show-foreground', converter: booleanAttributeConverter })
  showForeground = true

  @property({ type: Boolean, attribute: 'show-lcd', converter: booleanAttributeConverter })
  showLcd = true

  // === INDICATOR FLAGS ===
  @property({ type: Boolean, attribute: 'led-visible', converter: booleanAttributeConverter })
  ledVisible = false

  @property({ type: Boolean, attribute: 'user-led-visible', converter: booleanAttributeConverter })
  userLedVisible = false

  @property({ type: Boolean, attribute: 'trend-visible', converter: booleanAttributeConverter })
  trendVisible = false

  @property({ type: String, attribute: 'trend-state' })
  trendState: 'up' | 'steady' | 'down' | 'off' = 'off'

  // === STYLE FLAGS ===
  @property({ type: Boolean, attribute: 'digital-font', converter: booleanAttributeConverter })
  digitalFont = false

  @property({
    type: Boolean,
    attribute: 'use-section-colors',
    converter: booleanAttributeConverter
  })
  useSectionColors = false

  @property({
    type: Boolean,
    attribute: 'use-value-gradient',
    converter: booleanAttributeConverter
  })
  useValueGradient = false

  @property({ type: Boolean, attribute: 'animate-value', converter: booleanAttributeConverter })
  animateValue = true

  // === LIFECYCLE METHODS ===

  override firstUpdated() {
    this.currentValue = this.value
    this.renderGauge(false)
  }

  override disconnectedCallback() {
    // CRITICAL: Cancel animation on disconnect to prevent memory leaks
    this.animationHandle?.cancel()
    this.animationHandle = undefined
    super.disconnectedCallback()
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.size === 0) return

    const valueChanged = changedProperties.has('value')
    const onlyValueChanged = valueChanged && changedProperties.size === 1

    // Animate only if value changed and no other properties changed
    this.renderGauge(onlyValueChanged && this.animateValue)
  }

  // === PRIVATE METHODS ===

  private getThemePaint(): ThemePaint {
    const computedStyle = getComputedStyle(this)
    return resolveThemePaint({
      source: createStyleTokenSource(computedStyle)
    })
  }

  private getDrawContext(): RadialBargraphDrawContext | undefined {
    const canvas = this.renderRoot.querySelector('canvas')
    if (!(canvas instanceof HTMLCanvasElement)) return undefined
    const drawContext = canvas.getContext('2d')
    if (!drawContext) return undefined
    return drawContext as RadialBargraphDrawContext
  }

  private buildConfig(current: number): RadialBargraphGaugeConfig {
    // Read theme colors from CSS custom properties
    const accentColor = readCssCustomPropertyColor(this, '--ss3-accent-color', '#d97706')
    const warningColor = readCssCustomPropertyColor(this, '--ss3-warning-color', '#c5162e')
    const dangerColor = readCssCustomPropertyColor(this, '--ss3-danger-color', '#ef4444')

    // Build sections from configuration
    const sections = this.useSectionColors
      ? [
          { from: this.minValue, to: this.threshold, color: accentColor },
          { from: this.threshold, to: this.maxValue, color: warningColor }
        ]
      : []

    // Build gradient stops from configuration
    const valueGradientStops = this.useValueGradient
      ? [
          { fraction: 0, color: accentColor },
          { fraction: 0.75, color: warningColor },
          { fraction: 1, color: dangerColor }
        ]
      : []

    // Default tick label orientation depends on gauge type (LEGACY BEHAVIOR)
    const defaultTickLabelOrientation = this.gaugeType === 'type1' ? 'tangent' : 'normal'

    // Parse and validate configuration using Zod schema
    return radialBargraphGaugeConfigSchema.parse({
      value: { min: this.minValue, max: this.maxValue, current },
      size: { width: this.size, height: this.size },
      text: {
        ...(this.title ? { title: this.title } : {}),
        ...(this.unit ? { unit: this.unit } : {})
      },
      visibility: {
        showFrame: this.showFrame,
        showBackground: this.showBackground,
        showForeground: this.showForeground,
        showLcd: this.showLcd
      },
      scale: {
        niceScale: true,
        maxNoOfMajorTicks: 10,
        maxNoOfMinorTicks: 10,
        fractionalScaleDecimals: this.fractionalScaleDecimals
      },
      style: {
        frameDesign: this.frameDesign,
        backgroundColor: this.backgroundColor,
        foregroundType: this.foregroundType,
        gaugeType: this.gaugeType,
        valueColor: this.valueColor,
        lcdColor: this.lcdColor,
        digitalFont: this.digitalFont,
        labelNumberFormat: this.labelNumberFormat,
        tickLabelOrientation: this.tickLabelOrientation ?? defaultTickLabelOrientation,
        useSectionColors: this.useSectionColors,
        useValueGradient: this.useValueGradient
      },
      sections,
      valueGradientStops,
      lcdDecimals: this.lcdDecimals,
      indicators: {
        threshold: { value: this.threshold, show: true },
        alerts: [
          {
            id: 'critical',
            value: this.maxValue * 0.95,
            message: 'critical',
            severity: 'critical'
          },
          { id: 'warning', value: this.threshold, message: 'warning', severity: 'warning' }
        ],
        ledVisible: this.ledVisible,
        userLedVisible: this.userLedVisible,
        trendVisible: this.trendVisible,
        trendState: this.trendState
      }
    })
  }

  private emitValueChange(result: RadialBargraphRenderResult): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.valueChangeEvent, {
        detail: toGaugeContractState('radial-bargraph', result),
        bubbles: true,
        composed: true
      })
    )
  }

  private emitError(error: unknown): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.errorEvent, {
        detail: {
          kind: 'radial-bargraph',
          message:
            error instanceof Error ? error.message : 'Unknown radial bargraph rendering error'
        },
        bubbles: true,
        composed: true
      })
    )
  }

  private renderGauge(animateValue: boolean): void {
    const drawContext = this.getDrawContext()
    const canvas = this.renderRoot.querySelector('canvas')

    if (!drawContext || !(canvas instanceof HTMLCanvasElement)) return

    // Set canvas size
    canvas.width = this.size
    canvas.height = this.size

    const paint = this.getThemePaint()
    const nextValue = this.value

    // Cancel any existing animation
    this.animationHandle?.cancel()

    try {
      if (animateValue && this.currentValue !== nextValue) {
        // Animate from current to next value
        const animationConfig = this.buildConfig(nextValue)

        this.animationHandle = animateRadialBargraphGauge({
          context: drawContext,
          config: animationConfig,
          from: this.currentValue,
          to: nextValue,
          paint,
          onFrame: (frame) => {
            this.currentValue = frame.value
            this.emitValueChange(frame)
          },
          onComplete: (frame) => {
            this.currentValue = frame.value
            this.emitValueChange(frame)
            this.animationHandle = undefined
          }
        })
      } else {
        // Render immediately without animation
        const config = this.buildConfig(nextValue)
        const result = renderRadialBargraphGauge(drawContext, config, { paint })
        this.currentValue = result.value
        this.emitValueChange(result)
      }
    } catch (error) {
      this.emitError(error)
    }
  }

  // === RENDER TEMPLATE ===

  override render() {
    return html`<canvas></canvas>`
  }
}

// TypeScript declaration for custom element registry
declare global {
  interface HTMLElementTagNameMap {
    'steelseries-radial-bargraph-v3': SteelseriesRadialBargraphV3Element
  }
}
```

---

## Phase 5: Critical Migration Patterns

### 5.1 Property Name Migration

**Legacy v2 → v3 mapping:**

| Legacy (v2)                                  | v3                             | Notes                          |
| -------------------------------------------- | ------------------------------ | ------------------------------ |
| `noFrameVisible: false`                      | `showFrame: true`              | Inverted negative boolean      |
| `noBackgroundVisible: false`                 | `showBackground: true`         | Inverted negative boolean      |
| `noForegroundVisible: false`                 | `showForeground: true`         | Inverted negative boolean      |
| `noLcdVisible: false`                        | `showLcd: true`                | Inverted negative boolean      |
| `frameDesign: FrameDesign.METAL`             | `frameDesign: 'metal'`         | String literal, lowercase      |
| `backgroundColor: BackgroundColor.DARK_GRAY` | `backgroundColor: 'DARK_GRAY'` | String literal, preserved case |
| `gaugeType: GaugeType.TYPE4`                 | `gaugeType: 'type4'`           | String literal, lowercase      |
| `valueColor: ColorDef.RED`                   | `valueColor: 'RED'`            | String literal, preserved case |
| `lcdColor: LcdColor.STANDARD`                | `lcdColor: 'STANDARD'`         | String literal, preserved case |

### 5.2 Config Structure Migration

**Legacy flat config:**

```javascript
{
  size: 200,
  minValue: 0,
  maxValue: 100,
  value: 50,
  frameDesign: FrameDesign.METAL,
  backgroundColor: BackgroundColor.DARK_GRAY,
  foregroundType: ForegroundType.TYPE1,
  gaugeType: GaugeType.TYPE4,
  valueColor: ColorDef.RED,
  lcdColor: LcdColor.STANDARD,
  niceScale: true,
  lcdDecimals: 2,
  // ... 30 more properties
}
```

**v3 nested config:**

```typescript
{
  value: { min: 0, max: 100, current: 50 },
  size: { width: 200, height: 200 },
  text: { title: 'Title', unit: 'Unit' },
  visibility: {
    showFrame: true,
    showBackground: true,
    showForeground: true,
    showLcd: true
  },
  style: {
    frameDesign: 'metal',
    backgroundColor: 'DARK_GRAY',
    foregroundType: 'type1',
    gaugeType: 'type4',
    valueColor: 'RED',
    lcdColor: 'STANDARD',
    digitalFont: false,
    labelNumberFormat: 'standard',
    tickLabelOrientation: 'normal',
    useSectionColors: false,
    useValueGradient: false
  },
  scale: {
    niceScale: true,
    maxNoOfMajorTicks: 10,
    maxNoOfMinorTicks: 10,
    fractionalScaleDecimals: 1
  },
  sections: [],
  valueGradientStops: [],
  lcdDecimals: 2,
  indicators: {
    threshold: { value: 80, show: true },
    alerts: [],
    ledVisible: false,
    userLedVisible: false,
    trendVisible: false,
    trendState: 'off'
  }
}
```

### 5.3 Animation Migration

**Legacy v2 animation (D3-based):**

```javascript
import { timer, now } from 'd3-timer'
import { scaleLinear } from 'd3-scale'
import { easeCubicInOut } from 'd3-ease'

updated(changedProperties) {
  if (changedProperties.has('value')) {
    const transitionTime = this.transitionTime
    const originTime = now()
    const originValue = this.real_value
    const targetValue = this.value

    const timeScale = scaleLinear()
      .domain([0, transitionTime])
      .range([0, 1])
      .clamp(true)

    const valueScale = scaleLinear()
      .domain([0, 1])
      .range([originValue, targetValue])

    this._timer.restart((elapsedTime) => {
      const scaled = timeScale(elapsedTime)
      const eased = easeCubicInOut(scaled)
      const newValue = valueScale(eased)
      this.real_value = newValue

      // Repaint on each frame
      this.draw()

      if (scaled >= 1) {
        this._timer.stop()
      }
    })
  }
}
```

**v3 animation (Scheduler-based):**

```typescript
import { animateRadialBargraphGauge, type AnimationRunHandle } from '@bradsjm/steelseries-v3-core'

private animationHandle: AnimationRunHandle | undefined

updated(changedProperties: Map<string, unknown>) {
  if (changedProperties.size === 0) return

  const valueChanged = changedProperties.has('value')
  const onlyValueChanged = valueChanged && changedProperties.size === 1

  this.renderGauge(onlyValueChanged && this.animateValue)
}

private renderGauge(animateValue: boolean): void {
  // ... setup code ...

  // Cancel any existing animation
  this.animationHandle?.cancel()

  if (animateValue && this.currentValue !== nextValue) {
    this.animationHandle = animateRadialBargraphGauge({
      context: drawContext,
      config: animationConfig,
      from: this.currentValue,
      to: nextValue,
      paint,
      onFrame: (frame) => {
        this.currentValue = frame.value
        this.emitValueChange(frame)
      },
      onComplete: (frame) => {
        this.currentValue = frame.value
        this.emitValueChange(frame)
        this.animationHandle = undefined
      }
    })
  }
  // ...
}
```

---

## Phase 6: Common Pitfalls and Lessons Learned

### 6.1 Boolean Attribute Converter Pitfall

**PROBLEM**: `animate-value="false"` in HTML is still truthy without a converter.

**SOLUTION**: Always use a converter for boolean attributes:

```typescript
const booleanAttributeConverter = {
  fromAttribute: (value: string | null) => value !== null && value !== 'false'
}

@property({
  type: Boolean,
  attribute: 'animate-value',
  converter: booleanAttributeConverter
})
animateValue = true
```

### 6.2 Canvas Size Reset Pitfall

**PROBLEM**: Setting `canvas.width` clears the canvas, losing rendered content.

**SOLUTION**: Set dimensions BEFORE drawing:

```typescript
private renderGauge(animateValue: boolean): void {
  const canvas = this.renderRoot.querySelector('canvas')
  if (!canvas) return

  // Set size FIRST
  canvas.width = this.size
  canvas.height = this.size

  // Then render
  // ...
}
```

### 6.3 Memory Leak Pitfall

**PROBLEM**: Animations continue after element is disconnected.

**SOLUTION**: Always cancel in `disconnectedCallback`:

```typescript
override disconnectedCallback() {
  this.animationHandle?.cancel()
  this.animationHandle = undefined
  super.disconnectedCallback()
}
```

### 6.4 Geometry Precision Pitfall

**PROBLEM**: Small changes to angle calculations break visual parity.

**SOLUTION**: Copy legacy math EXACTLY:

```typescript
// LEGACY - Copy verbatim
const freeAreaAngle = (60 * PI) / 180 // NOT 1.04719755
let rotationOffset = HALF_PI + freeAreaAngle * 0.5

// Type1: exact match to legacy
if (gaugeType === 'type1') {
  rotationOffset = PI
  angleRange = HALF_PI
  bargraphOffset = 0
}
```

### 6.5 Build Artifact Staleness Pitfall

**PROBLEM**: Changes appear not to take effect.

**ROOT CAUSE**: Visual test harness uses `dist/` outputs, not source.

**SOLUTION**: Rebuild packages after changes:

```bash
# After modifying core or elements
pnpm --filter @bradsjm/steelseries-v3-core build
pnpm --filter @bradsjm/steelseries-v3-elements build
```

### 6.6 Blank Canvas Pitfall

**PROBLEM**: Visual tests pass but canvas is empty.

**DETECTION**: Always verify with runtime probe:

```typescript
// Add to test harness
const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d')
const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
const opaquePixels = imageData.data.filter((_, i) => i % 4 === 3 && imageData.data[i] > 0).length
console.log('Opaque pixels:', opaquePixels) // Should be > 0
```

**NEVER update snapshots until opaque pixel count > 0.**

---

## Phase 7: Testing and Validation

### 7.1 Unit Test Pattern

**File location:** `packages/core/src/radial-bargraph/renderer.test.ts`

```typescript
import { describe, expect, it } from 'vitest'
import { renderRadialBargraphGauge } from './renderer.js'
import { radialBargraphGaugeConfigSchema } from './schema.js'

describe('renderRadialBargraphGauge', () => {
  it('should render with valid config', () => {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const context = canvas.getContext('2d')!

    const config = radialBargraphGaugeConfigSchema.parse({
      value: { min: 0, max: 100, current: 50 },
      size: { width: 200, height: 200 }
    })

    const result = renderRadialBargraphGauge(context, config)

    expect(result.value).toBe(50)
    expect(result.tone).toBe('accent')
    expect(result.activeAlerts).toHaveLength(0)
  })

  it('should clamp value to range', () => {
    // Test boundary conditions
  })

  it('should resolve alerts when value exceeds threshold', () => {
    // Test alert resolution
  })
})
```

### 7.2 Visual Test Pattern

**File location:** `packages/test-assets/src/radial-bargraph.visual.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test('radial-bargraph default state', async ({ page }) => {
  await page.goto('/radial-bargraph?fixture=default')

  // Wait for canvas to render
  await page.waitForSelector('canvas')

  // Verify non-empty canvas
  const canvas = await page.locator('canvas')
  await expect(canvas).toHaveScreenshot('radial-bargraph-default.png')
})
```

### 7.3 Validation Checklist

Before marking migration complete:

- [ ] All legacy enum values ported
- [ ] All legacy defaults preserved
- [ ] Geometry calculations match exactly
- [ ] Rendering order preserved
- [ ] Canvas renders non-empty output
- [ ] Animation cancels properly
- [ ] TypeScript types compile
- [ ] Zod schemas validate correctly
- [ ] Visual tests pass
- [ ] Element events fire correctly

---

## Phase 8: Reference Tables

### 8.1 File Mapping

| Legacy File             | v3 Location                                           | Purpose                           |
| ----------------------- | ----------------------------------------------------- | --------------------------------- |
| `src/RadialBargraph.js` | `packages/core/src/radial-bargraph/`                  | Split into schema.ts, renderer.ts |
| `src/BaseElement.js`    | `packages/elements/src/index.ts`                      | Element wrapper pattern           |
| `src/definitions.js`    | `packages/core/src/radial/schema.ts`                  | Enum definitions                  |
| `src/tools.js`          | `packages/core/src/math/`, `packages/core/src/color/` | Utility modules                   |
| `src/drawFrame.js`      | `packages/core/src/render/legacy-materials.ts`        | Frame drawing                     |
| `src/drawBackground.js` | `packages/core/src/render/legacy-materials.ts`        | Background drawing                |
| `src/drawForeground.js` | `packages/core/src/render/legacy-materials.ts`        | Foreground drawing                |

### 8.2 Gauge Type Angles

| Gauge Type | rotationOffset | angleRange       | bargraphOffset | Visual Description                 |
| ---------- | -------------- | ---------------- | -------------- | ---------------------------------- |
| type1      | PI (180°)      | HALF_PI (90°)    | 0              | Top-left quadrant                  |
| type2      | PI (180°)      | PI (180°)        | 0              | Left semicircle                    |
| type3      | HALF_PI (90°)  | 1.5 \* PI (270°) | -HALF_PI       | Three-quarter circle               |
| type4      | HALF_PI + 30°  | TWO_PI - 60°     | -TWO_PI/6      | Full circle with 60° gap at bottom |

### 8.3 LCD Color Definitions

**Copy these exact RGB values from legacy:**

```typescript
const LCD_COLORS = {
  STANDARD: {
    gradientStart: 'rgb(131, 133, 119)',
    gradientFraction1: 'rgb(176, 183, 167)',
    gradientFraction2: 'rgb(165, 174, 153)',
    gradientFraction3: 'rgb(166, 175, 156)',
    gradientStop: 'rgb(175, 184, 165)',
    text: 'rgb(35, 42, 52)'
  }
  // ... other LCD colors
}
```

### 8.4 Pointer Color Definitions

**Copy these exact RGB values:**

```typescript
const LEGACY_POINTER_COLORS = {
  RED: {
    dark: 'rgb(82, 0, 0)',
    medium: 'rgb(213, 0, 25)',
    light: 'rgb(255, 171, 173)',
    veryDark: 'rgb(82, 0, 0)'
  }
  // ... other colors
}
```

---

## Phase 9: Quick Reference Commands

### Build and Test

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test

# Run visual tests
pnpm test:visual

# Build specific package
pnpm --filter @bradsjm/steelseries-v3-core build

# Run single test file
pnpm --filter @bradsjm/steelseries-v3-core exec vitest run src/radial-bargraph/renderer.test.ts
```

### Debug Visual Issues

```bash
# Start docs site for manual testing
pnpm --filter @bradsjm/steelseries-v3-docs dev

# Check canvas pixel data in browser console
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
const opaqueCount = data.filter((_, i) => i % 4 === 3 && data[i] > 0).length
console.log('Opaque pixels:', opaqueCount)
```

---

## Summary

This migration guide provides explicit, copy-paste ready patterns for converting SteelSeries v2 gauges to v3 architecture. Key takeaways:

1. **Preserve legacy math exactly** - Copy angle calculations, nice number algorithm verbatim
2. **Invert negative booleans** - `noXVisible` → `showX`
3. **Nest related properties** - Group into style, scale, visibility, indicators
4. **Use Zod for everything** - Schema is source of truth for types
5. **Cancel animations** - Always clean up in `disconnectedCallback`
6. **Verify non-empty output** - Never update snapshots without pixel validation
7. **Rebuild after changes** - `dist/` artifacts must be refreshed

The v3 architecture separates concerns (schema → renderer → element) while preserving exact visual behavior through careful porting of legacy algorithms and constants.
