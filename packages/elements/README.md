# @bradsjm/weather-gauges-elements

Lit-based Web Components for weather gauge visualizations.

## Overview

`@bradsjm/weather-gauges-elements` provides a set of lightweight, framework-agnostic Web Components for rendering weather gauges. Built on Lit, these components wrap the rendering engine from `@bradsjm/weather-gauges-core` and expose a simple HTML-first API.

## Key Features

- **Framework-Agnostic**: Works with any frontend framework or vanilla JavaScript
- **Declarative API**: Use HTML attributes and child elements for configuration
- **Accessibility**: Built-in ARIA attributes and screen reader support
- **Theme Support**: CSS custom properties for easy theming
- **Animation**: Smooth transitions with configurable duration and easing
- **Validation Modes**: Multiple validation modes for value handling (clamp, coerce, strict)
- **Event System**: Standardized events for state changes and errors

## Installation

```bash
pnpm add @bradsjm/weather-gauges-elements
```

Import the components you need:

```html
<script type="module">
  import '@bradsjm/weather-gauges-elements'
</script>
```

Or in a bundler:

```typescript
import '@bradsjm/weather-gauges-elements'
```

## Quick Start

```html
<wx-compass value="45" label="Wind Direction" size="300" animated duration="500"> </wx-compass>
```

## Component Reference

### wx-compass

Displays a compass rose with heading indicator.

#### HTML-First Attributes

| Attribute    | Type                                   | Default   | Description                           |
| ------------ | -------------------------------------- | --------- | ------------------------------------- |
| `value`      | number                                 | 0         | Current heading value (0-360)         |
| `gauge-min`  | number                                 | 0         | Minimum heading value                 |
| `gauge-max`  | number                                 | 360       | Maximum heading value                 |
| `label`      | string                                 | 'Compass' | Title displayed on gauge              |
| `unit`       | string                                 | 'deg'     | Unit displayed with value             |
| `size`       | number                                 | 220       | Gauge size in pixels (width = height) |
| `animated`   | boolean                                | true      | Enable value animations               |
| `duration`   | number                                 | 500       | Animation duration in milliseconds    |
| `preset`     | string                                 | -         | Measurement preset configuration      |
| `validation` | 'clamp' \| 'coerce' \| 'strict'        | 'clamp'   | Value validation mode                 |
| `theme`      | 'classic' \| 'flat' \| 'high-contrast' | 'classic' | Theme preset                          |

#### Compass-Specific Attributes

| Attribute              | Type    | Default | Description                            |
| ---------------------- | ------- | ------- | -------------------------------------- |
| `rose-visible`         | boolean | true    | Show compass rose                      |
| `show-degrees`         | boolean | false   | Show degree labels                     |
| `degree-scale-half`    | boolean | false   | Show half-scale degree marks           |
| `face-rotates`         | boolean | false   | Rotate compass face instead of pointer |
| `show-labels`          | boolean | true    | Show ordinal markers (N, NE, E, etc.)  |
| `show-tickmarks`       | boolean | true    | Show tick marks                        |
| `show-heading-readout` | boolean | false   | Show digital heading readout           |
| `alerts-enabled`       | boolean | false   | Enable heading alerts                  |

#### Property-Only Options

Complex configuration options are exposed as JavaScript properties (not HTML attributes):

```javascript
const compass = document.querySelector('wx-compass')

compass.frameDesign = 'metal' // 'blackMetal', 'metal', 'shinyMetal', 'brass', 'steel', 'chrome', 'gold', 'anthracite', 'tiltedGray', 'tiltedBlack', 'glossyMetal'
compass.backgroundColor = 'dark-gray' // 'dark-gray', 'satin-gray', 'light-gray', 'white', 'black', 'beige', 'brown', 'red', 'green', 'blue', 'anthracite', 'mud', 'punched-sheet', 'carbon', 'stainless', 'brushed-metal', 'brushed-stainless', 'turned'
compass.pointerType = 'slim-angular-needle' // Pointer style
compass.pointerColor = 'red' // Pointer color
compass.knobType = 'standardKnob' // 'standardKnob' or 'metalKnob'
compass.knobStyle = 'silver' // 'black', 'brass', 'silver'
compass.foregroundType = 'top-arc-glass' // 'top-arc-glass', 'side-reflection-glass', 'dome-glass', 'center-glow-glass', 'sweep-glass'
compass.lcdColor = 'standard' // 'standard', 'standard-green', 'blue', 'orange', 'red', 'yellow', 'white', 'gray', 'black'
compass.digitalFont = false // Use digital font for LCD
compass.warningAlertHeading = 90 // Alert threshold for warning
compass.criticalAlertHeading = 180 // Alert threshold for critical
compass.customLayer = imageElement // CanvasImageSource for custom overlay
compass.overlay = {
  // Overlay configuration
  image: imageElement,
  visible: true,
  opacity: 0.3,
  position: 'center', // 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  scale: 0.5
}
```

#### Example

```html
<wx-compass
  id="myCompass"
  value="45"
  label="Wind Direction"
  size="300"
  rose-visible
  show-degrees
  face-rotates
  alerts-enabled
>
</wx-compass>

<script>
  const compass = document.getElementById('myCompass')

  // Configure advanced options
  compass.frameDesign = 'brass'
  compass.pointerColor = 'red'
  compass.knobStyle = 'brass'

  // Update value
  compass.value = 90

  // Listen for state changes
  compass.addEventListener('wx-state-change', (e) => {
    console.log('State changed:', e.detail)
  })

  // Listen for errors
  compass.addEventListener('wx-error', (e) => {
    console.error('Gauge error:', e.detail)
  })
</script>
```

### wx-radial

Circular gauge with configurable start/end angles.

#### HTML-First Attributes

| Attribute         | Type                                   | Default   | Description                                |
| ----------------- | -------------------------------------- | --------- | ------------------------------------------ |
| `value`           | number                                 | 0         | Current value                              |
| `gauge-min`       | number                                 | 0         | Minimum value                              |
| `gauge-max`       | number                                 | 100       | Maximum value                              |
| `label`           | string                                 | 'Gauge'   | Title displayed on gauge                   |
| `unit`            | string                                 | -         | Unit displayed with value                  |
| `size`            | number                                 | 220       | Gauge size in pixels                       |
| `animated`        | boolean                                | true      | Enable value animations                    |
| `duration`        | number                                 | 500       | Animation duration in milliseconds         |
| `preset`          | string                                 | -         | Measurement preset configuration           |
| `validation`      | 'clamp' \| 'coerce' \| 'strict'        | 'clamp'   | Value validation mode                      |
| `theme`           | 'classic' \| 'flat' \| 'high-contrast' | 'classic' | Theme preset                               |
| `threshold`       | number                                 | -         | Threshold value for warning indication     |
| `threshold-label` | string                                 | -         | Label displayed at threshold               |
| `decimals`        | number                                 | 0         | Number of decimal places for value display |

#### Radial-Specific Properties

```javascript
const radial = document.querySelector('wx-radial')

radial.frameDesign = 'metal' // Frame design (same options as compass)
radial.backgroundColor = 'dark-gray' // Background color (same options as compass)
radial.pointerType = 'slim-angular-needle' // Pointer style
radial.pointerColor = 'red' // Pointer color
radial.knobType = 'standardKnob' // Knob type
radial.knobStyle = 'silver' // Knob style
radial.foregroundType = 'top-arc-glass' // Foreground type
radial.lcdColor = 'standard' // LCD color
radial.digitalFont = false // Digital font
radial.startAngle = -135 // Start angle in degrees
radial.endAngle = 135 // End angle in degrees
radial.useColorLabels = false // Use colored tick labels
radial.useSectionColors = false // Color sections instead of threshold
radial.sectionsEnabled = false // Enable colored sections
```

#### Example

```html
<wx-radial
  id="myRadial"
  value="75"
  label="Temperature"
  unit="°C"
  size="300"
  threshold="80"
  threshold-label="High"
  decimals="1"
>
</wx-radial>

<script>
  const radial = document.getElementById('myRadial')

  // Configure advanced options
  radial.frameDesign = 'chrome'
  radial.startAngle = -120
  radial.endAngle = 120

  // Update value
  radial.value = 85.5
</script>
```

### wx-radial-bargraph

Circular gauge with bar graph visualization.

#### HTML-First Attributes

Same as `wx-radial`, plus:

| Attribute   | Type   | Default | Description     |
| ----------- | ------ | ------- | --------------- |
| `threshold` | number | -       | Threshold value |

#### Radial Bargraph-Specific Properties

```javascript
const bargraph = document.querySelector('wx-radial-bargraph')

bargraph.valueColor = 'red' // Bar color
bargraph.gaugeType = 'full-gap' // 'full-gap', 'quarter-gap', 'eighth-gap', 'no-gap'
bargraph.thresholdColor = 'orange' // Threshold indicator color
```

#### Example

```html
<wx-radial-bargraph
  id="myBargraph"
  value="75"
  label="Humidity"
  unit="%"
  size="300"
  threshold="80"
  threshold-label="Dry"
>
</wx-radial-bargraph>

<script>
  const bargraph = document.getElementById('myBargraph')

  bargraph.valueColor = 'blue'
  bargraph.gaugeType = 'full-gap'
</script>
```

### wx-wind-direction

Specialized compass for wind direction with average calculation.

#### HTML-First Attributes

Same as `wx-compass`, plus:

| Attribute       | Type    | Default | Description               |
| --------------- | ------- | ------- | ------------------------- |
| `average`       | boolean | true    | Show average heading      |
| `average-label` | string  | 'Avg'   | Label for average display |

#### Wind Direction-Specific Properties

```javascript
const windDir = document.querySelector('wx-wind-direction')

windDir.averageSamples = 10 // Number of samples for average
windDir.frameDesign = 'metal' // (same as compass)
windDir.backgroundColor = 'dark-gray' // (same as compass)
windDir.pointerType = 'slim-angular-needle' // (same as compass)
// ... other properties same as compass
```

#### Example

```html
<wx-wind-direction id="myWindDir" value="45" label="Wind" size="300" average average-label="Avg">
</wx-wind-direction>

<script>
  const windDir = document.getElementById('myWindDir')

  windDir.averageSamples = 20
  windDir.value = 120
</script>
```

### wx-wind-rose

Polar chart for wind direction and frequency data.

#### HTML-First Attributes

| Attribute   | Type                                   | Default     | Description                      |
| ----------- | -------------------------------------- | ----------- | -------------------------------- |
| `size`      | number                                 | 220         | Gauge size in pixels             |
| `label`     | string                                 | 'Wind Rose' | Title displayed on gauge         |
| `gauge-max` | number                                 | -           | Maximum value for rose petals    |
| `animated`  | boolean                                | true        | Enable animations                |
| `duration`  | number                                 | 500         | Animation duration               |
| `preset`    | string                                 | -           | Measurement preset configuration |
| `theme`     | 'classic' \| 'flat' \| 'high-contrast' | 'classic'   | Theme preset                     |

#### Wind Rose-Specific Properties

```javascript
const windRose = document.querySelector('wx-wind-rose')

windRose.frameDesign = 'metal' // (same as compass)
windRose.backgroundColor = 'dark-gray' // (same as compass)
windRose.pointerType = 'slim-angular-needle' // Pointer style
windRose.pointerColor = 'red' // Pointer color
windRose.knobType = 'standardKnob' // Knob type
windRose.knobStyle = 'silver' // Knob style
windRose.foregroundType = 'top-arc-glass' // Foreground type
```

#### Child Elements: wx-petal

Wind rose uses child `wx-petal` elements to define direction data:

```html
<wx-wind-rose id="myWindRose" label="Wind Rose" size="400" gauge-max="10">
  <wx-petal direction="N" value="5" color="#ff0000"></wx-petal>
  <wx-petal direction="NE" value="3" color="#00ff00"></wx-petal>
  <wx-petal direction="E" value="7" color="#0000ff"></wx-petal>
  <wx-petal direction="SE" value="2" color="#ffff00"></wx-petal>
  <wx-petal direction="S" value="4" color="#ff00ff"></wx-petal>
  <wx-petal direction="SW" value="1" color="#00ffff"></wx-petal>
  <wx-petal direction="W" value="6" color="#ff8800"></wx-petal>
  <wx-petal direction="NW" value="3" color="#8800ff"></wx-petal>
</wx-wind-rose>

<script>
  const windRose = document.getElementById('myWindRose')

  // Update programmatic
  const petal = document.createElement('wx-petal')
  petal.setAttribute('direction', 'N')
  petal.setAttribute('value', '8')
  petal.setAttribute('color', '#ff4444')
  windRose.appendChild(petal)
</script>
```

### wx-section

Colored section for radial gauges.

```html
<wx-radial label="Temperature" value="75" gauge-min="0" gauge-max="100">
  <wx-section start="0" end="40" color="blue" label="Cold"></wx-section>
  <wx-section start="40" end="70" color="green" label="Comfortable"></wx-section>
  <wx-section start="70" end="100" color="red" label="Hot"></wx-section>
</wx-radial>
```

### wx-alert

Alert indicator for gauges.

```html
<wx-compass label="Wind Direction" value="45">
  <wx-alert id="warning" heading="90" severity="warning"></wx-alert>
  <wx-alert id="critical" heading="180" severity="critical"></wx-alert>
</wx-compass>
```

## Measurement Presets

Presets provide pre-configured settings for common measurement types:

```html
<wx-radial preset="temperature" label="Temperature"></wx-radial>
<wx-radial preset="humidity" label="Humidity"></wx-radial>
<wx-radial preset="pressure" label="Pressure"></wx-radial>
<wx-radial preset="speed" label="Speed"></wx-radial>
<wx-wind-direction preset="wind" label="Wind"></wx-wind-direction>
<wx-compass preset="bearing" label="Bearing"></wx-compass>
```

Available presets:

- **temperature**: Celsius scale, typical temperature styling
- **humidity**: Percentage scale (0-100), humidity-friendly styling
- **pressure**: hPa scale, pressure gauge styling
- **speed**: km/h scale, speedometer styling
- **wind**: Wind direction styling with cardinal labels
- **bearing**: Compass/bearing styling

## Validation Modes

Controls how invalid values are handled:

- **`clamp`**: Clamp values to valid range (default)
- **`coerce`**: Try to coerce string values to numbers before clamping
- **`strict`**: Pass values through without validation

```html
<wx-radial validation="clamp" value="150" gauge-max="100"></wx-radial>
<!-- Value will be clamped to 100 -->

<wx-radial validation="coerce" value="75.5" gauge-max="100"></wx-radial>
<!-- String "75.5" will be coerced to number 75.5 -->

<wx-radial validation="strict" value="150" gauge-max="100"></wx-radial>
<!-- Value will be 150 (out of range) -->
```

## Theme System

Components use CSS custom properties for theming. Set them on a parent element:

```css
:root {
  --wx-primary-color: #3498db;
  --wx-secondary-color: #2980b9;
  --wx-text-color: #333;
  --wx-background-color: #fff;
  --wx-border-color: #ddd;
}

.weather-gauges {
  --wx-primary-color: #e74c3c;
  --wx-secondary-color: #c0392b;
}
```

### Theme Presets

Use built-in theme presets:

```html
<wx-radial theme="classic"></wx-radial>
<wx-radial theme="flat"></wx-radial>
<wx-radial theme="high-contrast"></wx-radial>
```

## Event System

### wx-state-change

Dispatched when gauge value changes:

```javascript
const gauge = document.querySelector('wx-radial')

gauge.addEventListener('wx-state-change', (event) => {
  const state = event.detail
  console.log('Kind:', state.kind) // 'radial', 'compass', etc.
  console.log('Reading:', state.reading) // Current value
  console.log('Tone:', state.tone) // 'accent', 'warning', 'danger'
  console.log('Alerts:', state.alerts) // Array of active alerts
  console.log('Timestamp:', state.timestampMs)
})
```

### wx-error

Dispatched when gauge encounters an error:

```javascript
const gauge = document.querySelector('wx-radial')

gauge.addEventListener('wx-error', (event) => {
  const error = event.detail
  console.log('Kind:', error.kind) // Gauge type
  console.log('Code:', error.code) // 'invalid_config', 'invalid_value', 'render_error'
  console.log('Message:', error.message)
  console.log('Issues:', error.issues) // Array of validation issues (if any)
})
```

## Accessibility

Components include built-in accessibility features:

- **ARIA Labels**: Automatically set based on gauge label and value
- **Screen Reader Support**: Custom slot for screen reader content
- **Keyboard Navigation**: Supports focus and keyboard interaction
- **High Contrast Mode**: Theme preset for improved visibility

### Custom Screen Reader Content

```html
<wx-compass label="Wind Direction" value="45">
  <span slot="sr-content">Current wind direction is 45 degrees, coming from the northeast</span>
</wx-compass>
```

## CSS Custom Properties

Components use CSS custom properties for styling:

```css
:root {
  /* Colors */
  --wx-primary-color: #3498db;
  --wx-warning-color: #f39c12;
  --wx-danger-color: #e74c3c;

  /* Dimensions */
  --wx-default-size: 220px;

  /* Typography */
  --wx-font-family: system-ui, sans-serif;

  /* Animation */
  --wx-animation-duration: 500ms;
  --wx-animation-easing: ease-in-out;
}
```

## Responsive Design

Gauges automatically size to their `size` attribute. Use CSS for responsive layouts:

```css
.responsive-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.responsive-container wx-compass {
  width: 100%;
  max-width: 300px;
}

@media (max-width: 600px) {
  .responsive-container wx-compass {
    max-width: 200px;
  }
}
```

## Performance Tips

1. **Reuse Components**: Create gauges once and update values instead of recreating
2. **Disable Animation**: Set `animated="false"` for static displays
3. **Optimize Size**: Use appropriate sizes (don't over-size gauges)
4. **Limit Updates**: Throttle rapid value updates if needed

```javascript
// Good: Update existing gauge
const gauge = document.querySelector('wx-radial')
gauge.value = newValue

// Avoid: Recreating gauge
container.innerHTML = `<wx-radial value="${newValue}"></wx-radial>`
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

Requires:

- ES2020+ support
- Web Components (Custom Elements, Shadow DOM)
- Canvas API

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

# Visual tests
pnpm test:visual
```

## License

MIT
