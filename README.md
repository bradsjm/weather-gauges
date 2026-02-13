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

## Stable HTML-First API (Implementation In Progress)

The stable, long-term attribute surface is intentionally small for common use:

| Attribute    | Type    | Default   | Description                                         |
| ------------ | ------- | --------- | --------------------------------------------------- |
| `value`      | Number  | `0`       | Current gauge reading                               |
| `gauge-min`  | Number  | `0`       | Scale minimum (scalar gauges)                       |
| `gauge-max`  | Number  | `100`     | Scale maximum (scalar gauges)                       |
| `label`      | String  | `''`      | Primary label                                       |
| `unit`       | String  | `''`      | Unit label                                          |
| `size`       | Number  | `200`     | Canvas size in px (square)                          |
| `animated`   | Boolean | `true`    | Enable value animation                              |
| `duration`   | Number  | `500`     | Animation duration in ms                            |
| `preset`     | String  | `''`      | Measurement preset                                  |
| `validation` | String  | `clamp`   | Validation mode: `clamp`, `coerce`, or `strict`     |
| `theme`      | String  | `classic` | Theme selector (`classic`, `flat`, `high-contrast`) |

Gauge-specific attributes in the stable surface:

- Radial + bargraph: `threshold`, `threshold-label`, `decimals`
- Compass: `show-labels`, `show-degrees`, `face-rotates`
- Wind direction: `average`, `average-label`
- Wind rose: optional `gauge-max` (auto-derived from petals when omitted)

Notes:

- Additional advanced HTML attributes currently work, but are being moved behind JS properties and are not considered stable long-term API.
- `theme` is documented as part of the target public contract; current theming remains CSS token driven (`--wx-*`) until the discrete selector ships.

### Canonical Child Config Tags

Child tags are parsed as declarative configuration and do not need custom element registration.

- `wx-section`: `start`, `end`, `color`, optional `label`
- `wx-alert`: `threshold`, `severity`, optional `message`, optional `id`
- `wx-petal`: `direction`, `value`, optional `color`

Compatibility aliases are currently accepted by some gauges (for example `from`/`to` and `heading`), but the canonical names above are the supported long-term docs contract.

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
