# @bradsjm/weather-gauges-core

Framework-agnostic rendering engine and configuration schemas for weather gauge visualizations.

## Overview

`@bradsjm/weather-gauges-core` provides a complete, framework-independent rendering pipeline for creating animated weather gauges. It includes canvas-based rendering, animation systems, validation schemas, and theme support—without any UI framework dependencies.

## Key Features

- **Multiple Gauge Types**: Compass, radial, radial-bargraph, wind-direction, and wind-rose visualizations
- **Animation System**: Configurable animations with easing functions and timeline control
- **Theme Support**: CSS custom property integration and theme token resolution
- **Validation**: Zod schemas for runtime type safety and validation
- **Rendering Context**: Canvas-based rendering with static layer caching for performance
- **Contract System**: Standardized events and error handling across all gauge types

## Installation

```bash
pnpm add @bradsjm/weather-gauges-core
```

## Quick Start

```typescript
import { renderCompassGauge, compassGaugeConfigSchema } from '@bradsjm/weather-gauges-core'

// Validate and render
const config = compassGaugeConfigSchema.parse({
  heading: { current: 45, min: 0, max: 360 },
  size: { width: 300, height: 300 },
  style: { pointerType: 'slim-angular-needle' }
})

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')
const result = renderCompassGauge(context, config, { heading: 45 })
```

## Architecture

The package is organized into several modules:

### Schemas (`schemas/`)

Configuration validation and type definitions using Zod schemas. All gauge configurations are validated at runtime for type safety.

- **primitives.ts**: Base validation schemas (numbers, strings, easing functions)
- **shared.ts**: Shared schemas used across all gauge types (range, value, size, animation, visibility, text, overlay)
- **validation.ts**: Validation utilities and error formatting
- **background.ts**, **frame.ts**, **knob.ts**, **pointer.ts**, **sections.ts**, **threshold.ts**: Gauge-specific configuration schemas

### Math (`math/`)

Utility functions for geometric calculations and data transformations.

- **range.ts**: Range manipulation and value mapping
- **ticks.ts**: Tick mark calculation and positioning
- **geometry.ts**: Geometric utility functions

### Animation (`animation/`)

Animation control and easing functions.

- **easing.ts**: Easing function library (linear, easeInOutCubic, etc.)
- **timeline.ts**: Timeline management for animations
- **scheduler.ts**: Animation scheduler and lifecycle management

### Render (`render/`)

Canvas rendering utilities and static layer caching.

- **gauge-angles.ts**: Angle normalization utilities
- **gauge-canvas-primitives.ts**: Low-level canvas drawing primitives
- **gauge-text-primitives.ts**: Text rendering utilities
- **overlay-layer.ts**: Image overlay rendering
- **static-layer-cache.ts**: Performance optimization for static gauge elements
- Additional render modules for specific gauge elements (LEDs, materials, pointers, sections, thresholds, ticks, LCD display, trends, labels, foregrounds)

### Theme (`theme/`)

Color palette and theme token management.

- **tokens.ts**: Theme token definitions (colors, tones, gradients)

### Trend (`trend/`)

Trend calculation utilities.

- **calculator.ts**: Trend detection and calculation

### Gauges (`compass/`, `radial/`, `radial-bargraph/`, `wind-direction/`, `wind-rose/`)

Individual gauge implementations, each containing:

- **schema.ts**: Gauge-specific configuration schema
- **renderer.ts**: Rendering logic using the canvas API
- **index.ts**: Public API exports

### Contracts (`contracts/`)

Standardized event system for all gauge types.

- **gauge-contract.ts**: Event names, state types, error types, validation functions

### Pointers (`pointers/`)

Pointer configuration and types.

- **types.ts**: Pointer type definitions
- **schema.ts**: Pointer configuration schema

## Supported Gauge Types

### Compass

Displays a compass rose with heading indicator, degree scales, and optional rose visibility.

```typescript
import { renderCompassGauge, compassGaugeConfigSchema } from '@bradsjm/weather-gauges-core'

const config = compassGaugeConfigSchema.parse({
  heading: { current: 45, min: 0, max: 360 },
  size: { width: 300, height: 300 },
  style: {
    pointerType: 'slim-angular-needle',
    roseVisible: true,
    rotateFace: false
  }
})

const result = renderCompassGauge(context, config, { heading: 45 })
```

### Radial

Circular gauge with configurable start/end angles, value display, and optional sections.

```typescript
import { renderRadialGauge, radialGaugeConfigSchema } from '@bradsjm/weather-gauges-core'

const config = radialGaugeConfigSchema.parse({
  value: { current: 75, min: 0, max: 100 },
  size: { width: 400, height: 400 },
  scale: {
    startAngle: -Math.PI * 0.75,
    endAngle: Math.PI * 0.75
  }
})

const result = renderRadialGauge(context, config)
```

### Radial Bargraph

Circular gauge with bar graph visualization and value history tracking.

```typescript
import {
  renderRadialBargraphGauge,
  radialBargraphGaugeConfigSchema
} from '@bradsjm/weather-gauges-core'

const config = radialBargraphGaugeConfigSchema.parse({
  value: { current: 75, min: 0, max: 100 },
  size: { width: 400, height: 400 },
  style: { valueColor: 'red', gaugeType: 'full-gap' }
})

const result = renderRadialBargraphGauge(context, config)
```

### Wind Direction

Specialized compass for wind direction with average heading calculation.

```typescript
import {
  renderWindDirectionGauge,
  windDirectionGaugeConfigSchema
} from '@bradsjm/weather-gauges-core'

const config = windDirectionGaugeConfigSchema.parse({
  heading: { current: 45, min: 0, max: 360 },
  size: { width: 300, height: 300 },
  average: { enabled: true, samples: 10 }
})

const result = renderWindDirectionGauge(context, config, { heading: 45 })
```

### Wind Rose

Polar chart for displaying wind direction and frequency data.

```typescript
import { renderWindRoseGauge, windRoseGaugeConfigSchema } from '@bradsjm/weather-gauges-core'

const config = windRoseGaugeConfigSchema.parse({
  size: { width: 400, height: 400 },
  max: 10
})

const result = renderWindRoseGauge(context, config, {
  petals: [
    { value: 5, color: 'red' },
    { value: 3, color: 'blue' },
    { value: 2, color: 'green' }
  ]
})
```

## Rendering Pipeline

1. **Create Configuration**: Build a configuration object (use schemas for validation)
2. **Get Context**: Obtain a 2D canvas rendering context
3. **Render**: Call the appropriate render function with context and config
4. **Animate** (optional): Use the `animate*` functions for smooth transitions

### Static Rendering

```typescript
import { renderRadialGauge, radialGaugeConfigSchema } from '@bradsjm/weather-gauges-core'

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

const config = radialGaugeConfigSchema.parse({
  value: { current: 75, min: 0, max: 100 },
  size: { width: 400, height: 400 }
})

renderRadialGauge(ctx, config)
```

### Animated Rendering

```typescript
import { animateCompassGauge, compassGaugeConfigSchema } from '@bradsjm/weather-gauges-core'

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

const config = compassGaugeConfigSchema.parse({
  heading: { current: 0, min: 0, max: 360 },
  size: { width: 300, height: 300 },
  animation: { enabled: true, durationMs: 1000 }
})

const animation = animateCompassGauge({
  context: ctx,
  config,
  from: 0,
  to: 90,
  onFrame: (result) => console.log('Current heading:', result.heading),
  onComplete: (result) => console.log('Animation complete:', result.heading)
})

// Cancel animation if needed:
// animation.cancel()
```

## Validation

All gauge configurations are validated using Zod schemas. Always validate user input:

```typescript
import { validateCompassConfig } from '@bradsjm/weather-gauges-core'

const result = validateCompassConfig(userInput)
if (!result.success) {
  console.error('Validation errors:', result.errors)
  // Handle errors...
}
```

### Validation Result

The `ValidationResult<T>` type provides:

- `success: boolean`: Whether validation passed
- `data?: T`: Parsed and validated data (if success)
- `errors?: GaugeErrorIssue[]`: Array of error details (if failed)

## Contract System

The contract system provides standardized events and error handling across all gauge types.

### Events

Two events are available:

- **`wx-state-change`**: Dispatched when gauge value changes
- **`wx-error`**: Dispatched when gauge encounters an error

### State Event

```typescript
type GaugeContractState = {
  kind: 'compass' | 'radial' | 'radial-bargraph' | 'wind-direction' | 'wind-rose'
  reading: number
  tone: 'accent' | 'warning' | 'danger'
  alerts: GaugeContractAlert[]
  timestampMs: number
}
```

### Error Event

```typescript
type GaugeContractError = {
  kind: GaugeContractKind
  code: 'invalid_config' | 'invalid_value' | 'render_error'
  message: string
  issues?: GaugeContractErrorIssue[]
}
```

### Converting Render Results

```typescript
import { toGaugeContractState, toGaugeContractError } from '@bradsjm/weather-gauges-core'

// Convert render result to contract state
const state = toGaugeContractState('radial', renderResult)
dispatchEvent(new CustomEvent('wx-state-change', { detail: state }))

// Convert validation errors to contract error
const error = toGaugeContractError('radial', errors, 'Invalid gauge configuration')
dispatchEvent(new CustomEvent('wx-error', { detail: error }))
```

## Theme Support

Gauges support theming through CSS custom properties. Theme colors are resolved using the `resolveThemePaint` function.

```typescript
import { resolveThemePaint, createStyleTokenSource } from '@bradsjm/weather-gauges-core'

const computedStyle = getComputedStyle(element)
const paint = resolveThemePaint({
  source: createStyleTokenSource(computedStyle)
})

// Use paint in rendering
renderRadialGauge(context, config, { paint })
```

### Theme Tokens

Theme tokens are defined in `theme/tokens.ts` and include:

- Background colors
- Frame materials
- Pointer colors
- LCD display colors
- Gradient definitions

## Configuration Schema

### Shared Configuration

All gauges share common configuration options:

```typescript
interface SharedGaugeConfig {
  value: GaugeValue // { current: number, min: number, max: number }
  size: GaugeSize // { width: number, height: number }
  animation: GaugeAnimation // { enabled: boolean, durationMs: number, easing: string }
  visibility: GaugeVisibility // { showFrame, showBackground, showForeground, showLcd }
  text: GaugeText // { title?: string, unit?: string, thresholdLabel?: string }
}
```

### Gauge-Specific Configuration

Each gauge type extends the shared configuration with type-specific options:

- **Compass**: heading, rose, scale, style options
- **Radial**: scale, threshold, style options
- **Radial Bargraph**: valueColor, gaugeType, threshold options
- **Wind Direction**: heading, average, style options
- **Wind Rose**: max, petals array

## Alerts and Thresholds

Gauges support alerts and thresholds for visual indication of value ranges.

```typescript
const config = compassGaugeConfigSchema.parse({
  heading: { current: 45, min: 0, max: 360 },
  size: { width: 300, height: 300 },
  indicators: {
    alerts: [
      {
        id: 'warning',
        heading: 90,
        message: 'warning at 90 deg',
        severity: 'warning'
      },
      {
        id: 'critical',
        heading: 180,
        message: 'critical at 180 deg',
        severity: 'critical'
      }
    ]
  }
})
```

## Performance Optimization

### Static Layer Caching

The rendering system caches static gauge elements (frame, background, tick marks) to improve performance. Static layers are rendered once and reused across frames.

### Canvas Context Reuse

Reuse canvas contexts when possible to avoid context creation overhead.

```typescript
class GaugeRenderer {
  private context: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('2d')!
  }

  render(config: GaugeConfig) {
    this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height)
    renderGauge(this.context, config)
  }
}
```

## API Reference

### Render Functions

- `renderCompassGauge(context, config, drawContext?)`
- `renderRadialGauge(context, config, drawContext?)`
- `renderRadialBargraphGauge(context, config, drawContext?)`
- `renderWindDirectionGauge(context, config, drawContext?)`
- `renderWindRoseGauge(context, config, drawContext?)`

### Animation Functions

- `animateCompassGauge(options)`
- `animateRadialGauge(options)`
- `animateRadialBargraphGauge(options)`
- `animateWindDirectionGauge(options)`

### Validation Functions

- `validateCompassConfig(input)`
- `validateRadialBargraphConfig(input)`

### Contract Utilities

- `toGaugeContractState(kind, result)`
- `toGaugeContractError(kind, errors, message?)`

### Theme Utilities

- `resolveThemePaint(options)`
- `createStyleTokenSource(style)`

## Gauge Authoring Guidelines

When creating new gauge types or modifying existing ones:

1. **Schema-First**: Start with Zod schema definition
2. **Compose Shared**: Use shared schemas as base, extend with gauge-specific options
3. **Cross-Field Constraints**: Use `superRefine` for constraints that span multiple fields
4. **Thin Renderers**: Renderers should be thin and delegate to `runGaugeRenderPipeline` or similar utilities
5. **Local Constants**: Keep gauge-specific constants (angles, colors) within the gauge module
6. **Typed Contracts**: Use typed `mode`/`value` contracts for render context

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Typecheck
pnpm typecheck

# Lint
pnpm lint
```

## License

MIT
