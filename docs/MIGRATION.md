# SteelSeries v2 to v3 Migration Guide

## Target Audience

This document is designed for **Large Language Models** performing migration tasks. It provides explicit instructions with complete code examples and actionable patterns for converting legacy SteelSeries v2 gauge components to v3 architecture.

---

## Executive Summary

| Aspect               | v2 (Legacy)                     | v3 (Modern)                          |
| -------------------- | ------------------------------- | ------------------------------------ |
| **Architecture**     | Monolithic 1000+ line functions | Layered: Schema → Renderer → Element |
| **Type Safety**      | Runtime only                    | TypeScript + Zod validation          |
| **Config Structure** | Flat parameter object           | Hierarchical nested objects          |
| **Enums**            | Custom object descriptors       | String literal unions via Zod        |
| **Animation**        | D3 timer with manual frames     | Custom scheduler with cancellation   |
| **Rendering**        | Mixed concerns in closures      | Pure functions with clear phases     |

---

## Critical Pre-Flight: Visual Behavior Enforcement

**⚠️ ROOT CAUSE OF PREVIOUS FAILURES**: Migrations succeeded at code structure (properties mapped, functions exist, render order correct) but **failed at visual output**. A function can exist and be called correctly yet produce completely different visual results.

### The Problem

**WindDirection example:**

- ✅ Property `degreeScale` mapped correctly
- ✅ Function `drawDegreeScale` implemented
- ✅ Called in correct render order
- ❌ **VISUAL FAILURE**: v2 shows cardinal directions (N, NE, E...) but v3 showed degree numbers (0, 10, 20...)

### Mandatory Visual Verification Protocol

**For EVERY drawing function, verify:**

```
FUNCTION: drawTickmarksImage / drawDegreeScale / drawCompassRose
├── What pixels does this function draw?
│   ├── v2: Cardinal directions at 45° intervals
│   └── v3: Must match exactly
├── What happens when property X = true vs false?
│   ├── v2: degreeScale=true → degree numbers around edge
│   └── v3: Must match v2 behavior exactly
├── What text/labels are drawn?
│   ├── v2: LCD titles? Labels above displays?
│   └── v3: Must match presence/absence and positioning
├── What is the tick/scale resolution?
│   ├── v2: 1° resolution with 10° major labels
│   └── v3: Must match resolution exactly
└── What number formatting?
    ├── v2: "025" vs "25" vs "025°"
    └── v3: Must match exact formatting
```

### Visual Comparison Procedure

**MANDATORY - Before declaring migration complete:**

1. **Render both versions side-by-side**

   ```bash
   open legacy_code/srcdocs/index.html  # v2
   pnpm --filter @bradsjm/steelseries-v3-docs dev  # v3
   ```

2. **Compare pixel-by-pixel for default configuration**
3. **Verify conditional rendering** - Toggle each boolean, verify v2/v3 match
4. **Check text rendering** - Labels, number formatting, font sizes

### Critical Visual Failures to Avoid

| Property          | v2 Behavior                           | Common v3 Error                          |
| ----------------- | ------------------------------------- | ---------------------------------------- |
| `degreeScale`     | Shows degree numbers (0, 10, 20...)   | Shows cardinal directions or wrong scale |
| `roseVisible`     | Shows 16-point compass rose           | Shows 8-point or wrong style             |
| `lcdTitleStrings` | Shows text labels above LCDs          | Missing labels or wrong defaults         |
| `pointSymbols`    | Shows cardinal directions around edge | Missing or wrong symbols                 |
| LCD values        | "025" (no ° symbol)                   | "025°" or "25" (wrong formatting)        |

---

## Phase 1: Research and Analysis

### 1.1 Read Complete Legacy Source

**CRITICAL**: Read the ENTIRE legacy file. Do not skim.

```bash
cat legacy_code/src/{GaugeName}.js | wc -l  # Note total lines
# Read every line: imports, properties, constructor, all draw functions, animation
```

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

**Legacy property pattern:**

```javascript
static get properties () {
  return {
    size: { type: Number, defaultValue: 200 },
    value: { type: Number, defaultValue: 0 },
    // NEGATIVE BOOLEAN PATTERN - invert in v3
    noFrameVisible: { type: Boolean, defaultValue: false },
    noBackgroundVisible: { type: Boolean, defaultValue: false },
    // Enum pattern
    frameDesign: { type: String, objectEnum: FrameDesign, defaultValue: 'METAL' },
    backgroundColor: { type: String, objectEnum: BackgroundColor, defaultValue: 'DARK_GRAY' },
  }
}
```

### 1.2 Visual Layers Order

Every gauge renders in this exact order:

1. **Frame** (bezel/ring)
2. **Background** (dial face)
3. **Static elements** (ticks, labels, title, unit)
4. **Dynamic elements** (pointers, LEDs, LCD)
5. **Foreground** (glass overlay, knob)

**MANDATORY**: Preserve this exact rendering order.

### 1.3 Phase 1 Checklist

- [ ] Read complete legacy file (every line)
- [ ] List all properties with defaults
- [ ] Identify enum types and values
- [ ] Note negative boolean patterns (noXVisible)
- [ ] List all drawing functions in render order
- [ ] Identify tick mark resolution (1°? 10°?)
- [ ] Note number formatting patterns
- [ ] Check for multiple pointers/indicators

---

## Phase 2: Schema Design (v3 Core)

**File location:** `packages/core/src/{gauge-type}/schema.ts`

### 2.1 Schema Construction Pattern

```typescript
import { z } from 'zod'
import { sharedGaugeConfigSchema } from '../schemas/shared.js'

// Step 1: Enum schemas (string literals, NOT objects)
export const labelNumberFormatSchema = z.enum(['standard', 'fractional', 'scientific'])

// Step 2: Nested schemas with .strict() and .default()
export const styleSchema = z
  .object({
    frameDesign: z.enum(['metal', 'brass', 'steel']).default('metal'),
    backgroundColor: z.enum(['DARK_GRAY', 'SATIN_GRAY']).default('DARK_GRAY'),
    foregroundType: z.enum(['type1', 'type2', 'type3', 'type4', 'type5']).default('type1'),
    gaugeType: z.enum(['type1', 'type2', 'type3', 'type4']).default('type4'),
    valueColor: z.enum(['RED', 'GREEN', 'BLUE', 'ORANGE', 'YELLOW']).default('RED'),
    digitalFont: z.boolean().default(false)
  })
  .strict()

// Step 3: Compose final config
export const gaugeConfigSchema = sharedGaugeConfigSchema
  .extend({
    style: styleSchema.default({
      /* defaults */
    }),
    scale: scaleSchema.default({
      /* defaults */
    }),
    indicators: indicatorsSchema
  })
  .strict()

// Step 4: Export types
export type GaugeConfig = z.infer<typeof gaugeConfigSchema>
```

### 2.2 Schema Rules

1. **Always use `.strict()`** - Prevents unexpected properties
2. **Always provide defaults** - Match legacy exactly
3. **Use positive boolean names** - `showX`, not `noXVisible`
4. **Group related properties** - style, scale, visibility, indicators
5. **Export both schema and type** via `z.infer<>`

### 2.3 Property Migration Reference

| Legacy (v2)                                  | v3                             | Notes                         |
| -------------------------------------------- | ------------------------------ | ----------------------------- |
| `noFrameVisible: false`                      | `showFrame: true`              | Invert negative boolean       |
| `noBackgroundVisible: false`                 | `showBackground: true`         | Invert negative boolean       |
| `frameDesign: FrameDesign.METAL`             | `frameDesign: 'metal'`         | String literal, lowercase     |
| `backgroundColor: BackgroundColor.DARK_GRAY` | `backgroundColor: 'DARK_GRAY'` | String literal, preserve case |
| `gaugeType: GaugeType.TYPE4`                 | `gaugeType: 'type4'`           | String literal, lowercase     |

### 2.4 Phase 2 Checklist

- [ ] Every legacy property in schema
- [ ] Default values match legacy exactly
- [ ] Enum values match legacy objectEnum
- [ ] Negative booleans → positive
- [ ] All `.strict()` calls present
- [ ] Type exports for all schemas

---

## Phase 3: Renderer Implementation (v3 Core)

**File location:** `packages/core/src/{gauge-type}/renderer.ts`

### 3.1 Main Render Function Pattern

```typescript
export const renderGauge = (
  context: CanvasRenderingContext2D,
  config: GaugeConfig,
  options?: { value?: number; paint?: Partial<ThemePaint> }
): RenderResult => {
  // 1. Resolve computed values
  const resolvedScale = resolveScale(config)
  const clampedValue = clamp(
    options?.value ?? config.value.current,
    resolvedScale.min,
    resolvedScale.max
  )
  const geometry = resolveGeometry(config.style.gaugeType, resolvedScale.range)

  // 2. Clear canvas
  context.clearRect(0, 0, config.size.width, config.size.height)

  // 3. Render in EXACT legacy order
  drawFrameBackground(context, config, size, centerX, centerY, radius, paint)
  drawStaticElements(context, config, geometry, resolvedScale, size, centerX, centerY)
  drawDynamicElements(context, config, clampedValue, size, geometry, resolvedScale)
  drawForeground(context, config, centerX, centerY, radius)

  return { value: clampedValue, tone, activeAlerts }
}
```

### 3.2 Visual Fidelity Analysis Methodology

**Before writing ANY drawing function, analyze the legacy code using this methodology:**

#### Trace Conditional Rendering: "When Property X=true, What Draws?"

**For each boolean property, create a conditional rendering map:**

```
PROPERTY: degreeScale (boolean)
├── WHEN true:
│   ├── drawDegreeScale() is CALLED
│   │   ├── Draws numbers: 0, 10, 20, ..., 350 around outer edge
│   │   ├── Position: radius * 0.85 from center
│   │   ├── Font: sans-serif 10px
│   │   └── Color: #000000 (black)
│   └── Cardinal directions HIDDEN or shown INSIDE degree scale
│
└── WHEN false:
    ├── drawDegreeScale() is SKIPPED
    └── Cardinal directions shown at radius * 0.75 instead

PROPERTY: roseVisible (boolean)
├── WHEN true:
│   └── drawCompassRose() is CALLED
│       ├── Draws 16-point compass rose at center
│       ├── Radius: size * 0.25
│       └── Colors: N/S in red, E/W in black, others in gray
│
└── WHEN false:
    └── drawCompassRose() is SKIPPED entirely

PROPERTY: showLcd (boolean)  [Negative in v2: noLcdVisible]
├── WHEN true:
│   ├── drawLcd() is CALLED for EACH LCD display
│   │   ├── Draws background rectangle
│   │   ├── Draws value text (formatted with lcdDecimals)
│   │   └── Position: depends on gauge type
│   └── lcdTitleStrings displayed ABOVE LCDs if provided
│
└── WHEN false:
    └── drawLcd() is SKIPPED
```

**Procedure:**

1. Find all boolean properties in legacy `properties()`
2. For each property, grep for its usage in the `draw()` function
3. Map exactly what drawing calls are made when true vs false
4. Verify v3 implements identical conditional logic

**Gap Detection:**

```bash
# Find all conditionals in legacy draw()
grep -n "if.*degreeScale\|if.*roseVisible\|if.*showLcd" legacy_code/src/WindDirection.js
# Each conditional MUST have corresponding v3 conditional
```

#### Check Every Draw Call: "What Pixels Does This Function Actually Change?"

**For EACH drawing function in legacy, document pixel-level behavior:**

```
FUNCTION: drawDegreeScale(ctx, config)
├── PURPOSE: Draw degree numbers around gauge edge
├── CALLED BY: draw() when degreeScale === true
├── PIXELS CHANGED:
│   ├── Text pixels: Numbers 0, 10, 20, ..., 350
│   ├── Positions: 36 locations at radius * 0.85
│   ├── Angles: Every 10 degrees (0°, 10°, 20°...)
│   └── Font: "10px sans-serif", fillStyle: "#000000"
├── PARAMETERS:
│   ├── ctx: CanvasRenderingContext2D
│   ├── centerX: number (center of gauge)
│   ├── centerY: number (center of gauge)
│   └── radius: number (gauge radius)
└── SIDE EFFECTS: None (no context.save/restore in legacy)

FUNCTION: drawCompassRose(ctx, config)
├── PURPOSE: Draw 16-point compass rose at center
├── CALLED BY: draw() when roseVisible === true
├── PIXELS CHANGED:
│   ├── 16 directional labels: N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW
│   ├── Arranged in circle at radius * 0.25
│   ├── N and S: red (#ff0000)
│   ├── E and W: black (#000000)
│   ├── Others: gray (#808080)
│   └── Font: "12px sans-serif"
├── PARAMETERS:
│   ├── ctx: CanvasRenderingContext2D
│   ├── centerX: number
│   └── centerY: number
└── SIDE EFFECTS: Rotates canvas context (must restore!)

FUNCTION: drawPointer(ctx, type, color, size)
├── PURPOSE: Draw pointer/indicator at current value position
├── CALLED BY: draw() for each value (latest, average)
├── PIXELS CHANGED:
│   ├── Pointer shape based on type parameter
│   ├── Type1: Triangle pointer
│   ├── Type8: Thin needle with counterweight
│   ├── Color: from color parameter (RED, BLUE, etc.)
│   ├── Shadow: applied before drawing (context.shadow*)
│   └── Position: rotated to current value angle
├── PARAMETERS:
│   ├── ctx: CanvasRenderingContext2D (already translated to center)
│   ├── type: string (pointer type identifier)
│   ├── color: string (color constant)
│   └── size: number (gauge size for scaling)
└── SIDE EFFECTS: Modifies context path, fills, may apply shadow
```

**Critical Questions for Each Function:**

1. **What shape does it draw?** (circle, line, text, path)
2. **Where does it draw?** (coordinates, relative to center/size)
3. **What color?** (fillStyle, strokeStyle, gradients)
4. **What font?** (font family, size, weight)
5. **Any shadows/effects?** (shadowColor, shadowBlur, shadowOffset)
6. **Does it transform context?** (save/restore, translate, rotate)
7. **Is it conditional?** (if/switch statements)
8. **How many times called?** (once per render? per tick? per value?)

**Line-by-Line Comparison Procedure:**

```typescript
// Step 1: Copy legacy function to scratchpad
// Step 2: Implement v3 version
// Step 3: Compare LINE BY LINE:

// Legacy (line 234-238):
ctx.font = '10px sans-serif'
ctx.fillStyle = '#000000'
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'
ctx.fillText(angle.toString(), x, y)

// v3 (MUST match exactly):
context.font = '10px sans-serif' // Same font
context.fillStyle = '#000000' // Same color
context.textAlign = 'center' // Same alignment
context.textBaseline = 'middle' // Same baseline
context.fillText(angle.toString(), x, y) // Same text
```

**Common Visual Failures from Draw Call Differences:**

| Function          | Legacy Behavior                     | Common v3 Error                   |
| ----------------- | ----------------------------------- | --------------------------------- |
| `drawDegreeScale` | Shows degree numbers (0, 10, 20...) | Shows cardinal directions instead |
| `drawLcd`         | Value format "025" (no ° symbol)    | Format "25" or "025°"             |
| `drawPointer`     | Shadow offset = size \* 0.015       | No shadow or wrong offset         |
| `drawTickmarks`   | 1° resolution with 10° labels       | Only draws 10° marks              |
| `drawTitle`       | Title centered above gauge          | Title below or wrong position     |

### 3.3 Geometry Resolution (Copy EXACTLY from Legacy)

```typescript
const resolveGeometry = (gaugeType: string, range: number): Geometry => {
  const PI = Math.PI
  const HALF_PI = PI * 0.5
  const TWO_PI = PI * 2

  // LEGACY: type4 has 60 degree free area
  const freeAreaAngle = (60 * PI) / 180

  let rotationOffset = HALF_PI + freeAreaAngle * 0.5
  let angleRange = TWO_PI - freeAreaAngle
  let bargraphOffset = -TWO_PI / 6

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

  return {
    rotationOffset,
    bargraphOffset,
    angleRange,
    angleStep: angleRange / Math.max(range, 1e-9)
  }
}
```

### 3.4 Scale Resolution (Nice Number Algorithm)

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
```

### 3.5 Multi-Pointer Pattern (CRITICAL)

**WindDirection, Compass gauges use relative rotation:**

```typescript
const drawPointers = (context: CanvasRenderingContext2D, config: WindDirectionConfig): void => {
  const angleStep = (2 * Math.PI) / 360
  const angleAverage = config.value.average * angleStep
  const angleLatest = config.value.latest * angleStep

  context.save()
  context.translate(centerX, centerY)

  // Apply shadow
  const shadowOffset = Math.max(2, size * 0.015)
  context.shadowColor = 'rgba(0, 0, 0, 0.8)'
  context.shadowOffsetX = shadowOffset
  context.shadowOffsetY = shadowOffset
  context.shadowBlur = shadowOffset * 2

  // Step 1: Rotate to average position
  context.rotate(angleAverage)
  drawPointer(context, config.style.pointerAverage.type, config.style.pointerAverage.color, size)

  // Step 2: RELATIVE rotation for latest (KEY: subtract current rotation)
  const relativeAngle = angleLatest - angleAverage
  context.rotate(relativeAngle)
  drawPointer(context, config.style.pointerLatest.type, config.style.pointerLatest.color, size)

  // Clear shadow
  context.shadowColor = 'transparent'
  context.restore()
}
```

### 3.6 Animation Function

```typescript
export const animateGauge = (options: AnimationOptions): AnimationRunHandle => {
  const scheduler = createAnimationScheduler()

  const renderWithValue = (value: number): RenderResult => {
    return renderGauge(options.context, options.config, { value, paint: options.paint })
  }

  return scheduler.run({
    from: options.from,
    to: options.to,
    durationMs: options.config.animation.enabled ? options.config.animation.durationMs : 0,
    easing: options.config.animation.easing,
    onUpdate: (sample) => options.onFrame?.(renderWithValue(sample.value)),
    onComplete: () => options.onComplete?.(renderWithValue(options.to))
  })
}
```

### 3.7 Phase 3 Checklist

#### Source Analysis

- [ ] Read legacy source line-by-line (3 passes minimum)
- [ ] Create function mapping table (Section 3.2)
- [ ] Cross-reference EVERY function with renderer

#### Conditional Rendering Trace (Section 3.2)

- [ ] Listed all boolean properties from legacy
- [ ] Mapped what draws when each property is true
- [ ] Mapped what draws when each property is false
- [ ] Verified v3 implements identical conditional logic

#### Draw Call Pixel Audit (Section 3.2)

- [ ] Documented what each draw function draws (shape, position, color)
- [ ] Documented text content and formatting for each label
- [ ] Documented shadow/effects applied before each draw
- [ ] Documented context transforms (save/restore, translate, rotate)
- [ ] Compared line-by-line: legacy vs v3 draw functions

#### Geometry & Math

- [ ] Geometry uses exact legacy constants (copy/paste verify)
- [ ] All legacy `properties()` in schema
- [ ] Render order: Frame → Background → Static → Dynamic → Foreground
- [ ] **Multi-pointer uses relative rotation** (`angleLatest - angleAverage`)
- [ ] Shadow effects on dynamic elements (size \* 0.015, min 2)
- [ ] Tick resolution matches legacy (1° for WindDirection)
- [ ] LCD number formatting exact ("025" not "25" or "025°")

---

## Phase 4: Element Wrapper (v3 Elements)

**File location:** `packages/elements/src/{gauge-type}.ts`

### 4.1 Complete Element Implementation

```typescript
import {
  animateGauge,
  gaugeConfigSchema,
  renderGauge,
  type AnimationRunHandle,
  type GaugeConfig,
  type RenderResult
} from '@bradsjm/steelseries-v3-core'
import { LitElement, css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'

const booleanAttributeConverter = {
  fromAttribute: (value: string | null) => value !== null && value !== 'false'
}

@customElement('steelseries-{gauge}-v3')
export class SteelseriesGaugeV3Element extends LitElement {
  @query('canvas') private canvasElement?: HTMLCanvasElement
  private currentValue = 0
  private animationHandle: AnimationRunHandle | undefined

  static override styles = css`
    :host {
      display: inline-block;
    }
    canvas {
      display: block;
    }
  `

  // === PUBLIC PROPERTIES ===
  @property({ type: Number }) value = 0
  @property({ type: Number, attribute: 'min-value' }) minValue = 0
  @property({ type: Number, attribute: 'max-value' }) maxValue = 100
  @property({ type: Number }) size = 220
  @property({ type: String }) title = ''
  @property({ type: String }) unit = ''

  // Enums
  @property({ type: String, attribute: 'frame-design' })
  frameDesign: 'metal' | 'brass' | 'steel' | 'chrome' = 'metal'

  // Visibility flags (USE booleanAttributeConverter!)
  @property({ type: Boolean, attribute: 'show-frame', converter: booleanAttributeConverter })
  showFrame = true

  @property({ type: Boolean, attribute: 'show-background', converter: booleanAttributeConverter })
  showBackground = true

  @property({ type: Boolean, attribute: 'animate-value', converter: booleanAttributeConverter })
  animateValue = true

  // === LIFECYCLE ===
  override firstUpdated() {
    this.currentValue = this.value
    this.renderGauge(false)
  }

  override disconnectedCallback() {
    this.animationHandle?.cancel() // CRITICAL: Prevent memory leaks
    this.animationHandle = undefined
    super.disconnectedCallback()
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.size === 0) return
    const onlyValueChanged = changedProperties.has('value') && changedProperties.size === 1
    this.renderGauge(onlyValueChanged && this.animateValue)
  }

  // === PRIVATE METHODS ===
  private buildConfig(current: number): GaugeConfig {
    return gaugeConfigSchema.parse({
      value: { min: this.minValue, max: this.maxValue, current },
      size: { width: this.size, height: this.size },
      text: { title: this.title, unit: this.unit },
      visibility: { showFrame: this.showFrame, showBackground: this.showBackground },
      style: { frameDesign: this.frameDesign }
    })
  }

  private renderGauge(animateValue: boolean): void {
    const canvas = this.renderRoot.querySelector('canvas')
    if (!canvas) return

    // Set canvas size FIRST (clears canvas)
    canvas.width = this.size
    canvas.height = this.size

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    this.animationHandle?.cancel()

    if (animateValue && this.currentValue !== this.value) {
      this.animationHandle = animateGauge({
        context: ctx,
        config: this.buildConfig(this.value),
        from: this.currentValue,
        to: this.value,
        onFrame: (frame) => {
          this.currentValue = frame.value
        },
        onComplete: () => {
          this.animationHandle = undefined
        }
      })
    } else {
      renderGauge(ctx, this.buildConfig(this.value))
      this.currentValue = this.value
    }
  }

  override render() {
    return html`<canvas></canvas>`
  }
}
```

### 4.2 Phase 4 Checklist

- [ ] ALL schema properties have `@property()` decorators
- [ ] Boolean attributes use `booleanAttributeConverter`
- [ ] Enum properties have correct TypeScript union types
- [ ] `firstUpdated()` calls render with initial value
- [ ] `disconnectedCallback()` cancels animation
- [ ] `updated()` only animates when ONLY value changes
- [ ] Canvas size set BEFORE rendering
- [ ] `buildConfig()` includes ALL schema properties

---

## Phase 5: Common Pitfalls

### 5.1 Boolean Attribute Converter (CRITICAL)

**PROBLEM**: `animate-value="false"` in HTML is truthy without converter.

```typescript
const booleanAttributeConverter = {
  fromAttribute: (value: string | null) => value !== null && value !== 'false'
}

@property({ type: Boolean, converter: booleanAttributeConverter })
animateValue = true
```

### 5.2 Canvas Size Reset

**PROBLEM**: Setting `canvas.width` clears the canvas.

**SOLUTION**: Set dimensions BEFORE drawing.

### 5.3 Memory Leaks

**PROBLEM**: Animations continue after disconnect.

**SOLUTION**: Always cancel in `disconnectedCallback()`.

### 5.4 Geometry Precision

**PROBLEM**: Small angle calculation changes break visual parity.

**SOLUTION**: Copy legacy math EXACTLY:

```typescript
const freeAreaAngle = (60 * PI) / 180 // NOT 1.04719755
```

### 5.5 Build Artifact Staleness

**PROBLEM**: Changes don't appear.

**SOLUTION**: Rebuild after changes:

```bash
pnpm --filter @bradsjm/steelseries-v3-core build
pnpm --filter @bradsjm/steelseries-v3-elements build
```

### 5.6 Blank Canvas

**PROBLEM**: Visual tests pass but canvas is empty.

**DETECTION**:

```typescript
const data = context.getImageData(0, 0, canvas.width, canvas.height).data
const opaquePixels = data.filter((_, i) => i % 4 === 3 && data[i] > 0).length
console.log('Opaque pixels:', opaquePixels) // Must be > 0
```

**NEVER update snapshots until opaque pixel count > 0.**

### 5.7 Tick Mark Resolution

**PROBLEM**: Wrong tick intervals.

**WindDirection requires 1° resolution:**

```typescript
// WRONG
for (let angle = 0; angle < 360; angle += 10) {
  drawTick(angle)
}

// CORRECT
for (let angle = 0; angle < 360; angle++) {
  // Every 1 degree
  if (angle % 10 === 0) drawMajorTick(angle)
  else drawMinorTick(angle)
}
```

---

## Phase 6: Final Validation Gate

**⚠️ DO NOT DECLARE MIGRATION COMPLETE UNTIL ALL CHECKS PASS ⚠️**

### 6.1 Pre-Validation Checklist

#### Legacy Source Review

- [ ] Read EVERY line of legacy source (imports, properties, constructor, all functions)
- [ ] Create function mapping table:

| Legacy Function (Line) | v3 Function             | Status     |
| ---------------------- | ----------------------- | ---------- |
| `drawFrame()` (L145)   | `drawFrameBackground()` | ✅         |
| `drawLcd()` (L567)     | `drawLcd()`             | ❌ MISSING |

- [ ] Any ❌ items = STOP and implement

#### Property Audit

```bash
# Count legacy properties
grep -E "^\s+\w+:\s*\{" legacy_code/src/{Gauge}.js | wc -l
# Count schema properties
grep -E "^\s+\w+:" packages/core/src/{gauge}/schema.ts | wc -l
```

- [ ] List every legacy property on paper
- [ ] Check off each one in schema and element

#### Visual Parity Check

**Canvas Inspection** (browser console):

```javascript
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
const opaque = data.filter((_, i) => i % 4 === 3 && data[i] > 0).length
console.log('Opaque pixels:', opaque) // Must be > 1000
```

**Side-by-side Comparison**:

- [ ] Frame matches (design, color, thickness)
- [ ] Background matches (material, color)
- [ ] Ticks match (count, length, labels)
- [ ] Pointer(s) match (shape, color, shadow)
- [ ] LCD matches (font, digits, decimals)

#### Behavioral Verification

- [ ] Set value = 0 → pointer at correct position
- [ ] Set value = max → pointer at correct position
- [ ] Toggle visibility flags → elements show/hide
- [ ] Rapid value changes → smooth animation
- [ ] Disconnect element → no console errors

#### Multi-Pointer Specific (if applicable)

- [ ] Both pointers visible
- [ ] Average pointer at correct angle
- [ ] Latest pointer shows RELATIVE to average
- [ ] Both have shadow effects

### 6.2 Final Gate Questions

Answer YES/NO truthfully:

1. Have you read **every line** of the legacy source? \_\_\_\_
2. Does your schema include **all** legacy properties? \_\_\_\_
3. Does your renderer include **all** drawing functions? \_\_\_\_
4. Have you verified **canvas renders non-empty** output? \_\_\_\_
5. Have you compared **visually** with legacy? \_\_\_\_
6. Are there **any** ❌ items in your function mapping? \_\_\_\_

**If any answer is NO, fix the gap before proceeding.**

---

## Phase 7: Testing

### 7.1 Unit Test Pattern

```typescript
import { describe, expect, it } from 'vitest'
import { renderGauge } from './renderer.js'
import { gaugeConfigSchema } from './schema.js'

describe('renderGauge', () => {
  it('should render with valid config', () => {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')!

    const config = gaugeConfigSchema.parse({
      value: { min: 0, max: 100, current: 50 },
      size: { width: 200, height: 200 }
    })

    const result = renderGauge(ctx, config)
    expect(result.value).toBe(50)
  })
})
```

### 7.2 Visual Test Pattern

```typescript
import { test, expect } from '@playwright/test'

test('gauge default state', async ({ page }) => {
  await page.goto('/{gauge}?fixture=default')
  await page.waitForSelector('canvas')
  const canvas = await page.locator('canvas')
  await expect(canvas).toHaveScreenshot('{gauge}-default.png')
})
```

### 7.3 Test Checklist

- [ ] All legacy enum values ported
- [ ] All legacy defaults preserved
- [ ] Geometry calculations match exactly
- [ ] Canvas renders non-empty output
- [ ] Animation cancels properly
- [ ] TypeScript types compile
- [ ] Zod schemas validate correctly
- [ ] Visual tests pass

---

## Appendix: Reference Tables

### A.1 File Mapping

| Legacy File          | v3 Location                                           |
| -------------------- | ----------------------------------------------------- |
| `src/{Gauge}.js`     | `packages/core/src/{gauge}/` (schema.ts, renderer.ts) |
| `src/BaseElement.js` | `packages/elements/src/index.ts`                      |
| `src/definitions.js` | `packages/core/src/{gauge}/schema.ts`                 |
| `src/tools.js`       | `packages/core/src/math/`, `packages/core/src/color/` |
| `src/drawFrame.js`   | `packages/core/src/render/legacy-materials.ts`        |

### A.2 Gauge Type Angles

| Gauge Type | rotationOffset | angleRange       | Visual Description                 |
| ---------- | -------------- | ---------------- | ---------------------------------- |
| type1      | PI (180°)      | HALF_PI (90°)    | Top-left quadrant                  |
| type2      | PI (180°)      | PI (180°)        | Left semicircle                    |
| type3      | HALF_PI (90°)  | 1.5 \* PI (270°) | Three-quarter circle               |
| type4      | HALF_PI + 30°  | TWO_PI - 60°     | Full circle with 60° gap at bottom |

### A.3 LCD Number Formatting

```typescript
const formatLcdValue = (value: number): string => {
  // Legacy: No leading zero for values >= 100
  // 0-99: '005', '045', '099'
  // 100+: '100', '359'
  if (value >= 100) {
    return value.toFixed(0)
  }
  return value.toFixed(0).padStart(3, '0')
}
```

### A.4 Quick Commands

```bash
# Build
pnpm build

# Type check
pnpm typecheck

# Test
pnpm test

# Visual tests
pnpm test:visual

# Single test
pnpm --filter @bradsjm/steelseries-v3-core exec vitest run src/{gauge}/renderer.test.ts

# Dev server
pnpm --filter @bradsjm/steelseries-v3-docs dev
```

---

## Summary

1. **Preserve legacy math exactly** - Copy angle calculations verbatim
2. **Invert negative booleans** - `noXVisible` → `showX`
3. **Nest related properties** - style, scale, visibility, indicators
4. **Use Zod for everything** - Schema is source of truth
5. **Cancel animations** - Always clean up in `disconnectedCallback`
6. **Verify non-empty output** - Never update snapshots without pixel validation
7. **Visual parity over code structure** - Match pixels, not just function names
