# Weather Gauges

Modern, animated weather-oriented gauges for web apps, built with TypeScript and Canvas.

![Status](https://img.shields.io/badge/status-beta-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Packages

- `@bradsjm/weather-gauges-core`: framework-agnostic rendering engine
- `@bradsjm/weather-gauges-elements`: Lit web components
- `@bradsjm/weather-gauges-ha-cards`: Home Assistant cards

## Gauge Types

- `wx-gauge`: radial scalar gauge
- `wx-bargraph`: radial bargraph gauge
- `wx-compass`: heading/direction gauge
- `wx-wind-direction`: latest + average wind direction
- `wx-wind-rose`: petal-based wind rose

## Installation

```bash
# Core + web components
pnpm add @bradsjm/weather-gauges-core @bradsjm/weather-gauges-elements

# Core only
pnpm add @bradsjm/weather-gauges-core

# Elements only
pnpm add @bradsjm/weather-gauges-elements
```

## Quick Start (Web Components)

```html
<!doctype html>
<html>
  <head>
    <title>Weather Gauges Demo</title>
    <script type="module">
      import '@bradsjm/weather-gauges-elements'
    </script>
  </head>
  <body>
    <wx-compass id="compass" value="45" size="220" label="Heading" unit="deg"></wx-compass>

    <wx-bargraph
      id="pressure"
      value="75.5"
      gauge-min="0"
      gauge-max="100"
      size="300"
      label="Pressure"
      unit="hPa"
    ></wx-bargraph>

    <wx-wind-direction
      id="wind"
      value="45"
      average="90"
      size="300"
      label="Wind Direction"
      unit="deg"
    ></wx-wind-direction>

    <script type="module">
      const compass = document.getElementById('compass')
      compass.value = 135

      compass.addEventListener('wx-state-change', (event) => {
        console.log('Reading:', event.detail.reading)
      })
    </script>
  </body>
</html>
```

## Common Attributes

| Attribute   | Type    | Default | Description                   |
| ----------- | ------- | ------- | ----------------------------- |
| `value`     | Number  | `0`     | Primary reading               |
| `gauge-min` | Number  | `0`     | Scale minimum (scalar gauges) |
| `gauge-max` | Number  | `100`   | Scale maximum (scalar gauges) |
| `label`     | String  | `''`    | Gauge label                   |
| `unit`      | String  | `''`    | Unit label                    |
| `size`      | Number  | `220`   | Canvas size in px             |
| `animated`  | Boolean | `true`  | Enable value animation        |
| `duration`  | Number  | `500`   | Animation duration in ms      |
| `preset`    | String  | `''`    | Measurement preset            |

Wind-direction specific:

| Attribute | Type   | Default | Description            |
| --------- | ------ | ------- | ---------------------- |
| `value`   | Number | `0`     | Latest wind direction  |
| `average` | Number | `0`     | Average wind direction |

## Events

- `wx-state-change`: emitted on state/value changes
- `wx-error`: emitted on validation/render failures

`wx-state-change` detail includes:

```ts
{
  kind: 'radial' | 'bargraph' | 'compass' | 'wind-direction' | 'wind-rose'
  reading: number
  tone: 'accent' | 'warning' | 'danger'
  alerts: Array<{ id: string; message: string; severity: 'info' | 'warning' | 'critical' }>
  timestampMs: number
}
```

## Core API Example

```ts
import { renderCompassGauge, type CompassGaugeConfig } from '@bradsjm/weather-gauges-core'

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('2D context unavailable')

const config: CompassGaugeConfig = {
  value: { current: 45, min: 0, max: 360 },
  size: { width: 220, height: 220 },
  text: { title: 'Heading', unit: 'deg' }
}

renderCompassGauge(ctx, config, { value: 45, paint: {} })
```

## Theming

Use CSS custom properties with the `--wx-*` prefix:

```css
:root {
  --wx-frame-color: #888;
  --wx-background-color: #333;
  --wx-text-color: #fff;
  --wx-accent-color: #0f0;
}
```

## Local Docs

- Interactive docs/playground live in `packages/docs-site`
- Start locally with `pnpm --filter @bradsjm/weather-gauges-docs dev`

## License

MIT - see `LICENSE`.
