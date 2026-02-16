# @bradsjm/weather-gauges-ha-cards

Home Assistant Lovelace custom cards for Weather Gauges.

## Overview

This package provides single-gauge Lovelace cards:

- `custom:weather-gauges-radial-card`
- `custom:weather-gauges-radial-bargraph-card`
- `custom:weather-gauges-compass-card`
- `custom:weather-gauges-wind-direction-card`
- `custom:weather-gauges-wind-rose-card`
- Backed by `@bradsjm/weather-gauges-elements`
- Works with Home Assistant entity state updates in real time
- Includes a visual card editor (`getConfigForm`) and sensible defaults

## Supported Gauge Types (v1)

- `radial` (`wx-gauge`)
- `radial-bargraph` (`wx-bargraph`)
- `compass` (`wx-compass`)
- `wind-direction` (`wx-wind-direction`)
- `wind-rose` (`wx-wind-rose`)

## Installation

### HACS

1. Open HACS.
2. Go to Frontend -> Explore & Download Repositories.
3. Search for Weather Gauges.
4. Install and restart Home Assistant if prompted.

### Manual

1. Build or download `dist/index.js`.
2. Copy it to your Home Assistant config directory, for example:

```text
<config>/www/weather-gauges.js
```

3. Add the Lovelace resource:

```yaml
resources:
  - url: /local/weather-gauges.js
    type: module
```

## Quick Start

```yaml
type: custom:weather-gauges-radial-card
entity: sensor.outdoor_temperature
title: Outdoor Temperature
preset: temperature
```

## Card Types

| Card type                                    | Gauge behavior                 |
| -------------------------------------------- | ------------------------------ |
| `custom:weather-gauges-radial-card`          | Fixed radial gauge             |
| `custom:weather-gauges-radial-bargraph-card` | Fixed radial-bargraph gauge    |
| `custom:weather-gauges-compass-card`         | Fixed compass gauge            |
| `custom:weather-gauges-wind-direction-card`  | Fixed wind-direction gauge     |
| `custom:weather-gauges-wind-rose-card`       | History-driven wind rose gauge |

`gauge_type` is optional and only useful for compatibility; if provided, it must match the selected card type.

## Card Configuration

### Core Options

| Option       | Type   | Default  | Notes                                                          |
| ------------ | ------ | -------- | -------------------------------------------------------------- |
| `type`       | string | required | Any supported weather-gauges card type from Card Types section |
| `entity`     | string | required | Entity id to read from                                         |
| `title`      | string | unset    | Optional card header                                           |
| `label`      | string | derived  | Gauge label fallback                                           |
| `gauge_type` | string | inferred | Optional compatibility field; must match the card type         |

`gauge_type` is for scalar cards and is not used by the wind-rose card.

### Value Source Options

| Option              | Type   | Default | Notes                                                                                                           |
| ------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------- |
| `attribute`         | string | unset   | Read value from `state.attributes[attribute]`                                                                   |
| `average_attribute` | string | unset   | `wind-direction` only; optional average heading                                                                 |
| `preset`            | string | `""`    | `temperature`, `humidity`, `pressure`, `wind-speed`, `rainfall`, `rain-rate`, `solar`, `uv-index`, `cloud-base` |
| `unit`              | string | derived | Overrides detected entity unit                                                                                  |

### Wind Rose History Options

| Option                     | Type   | Default | Notes                                    |
| -------------------------- | ------ | ------- | ---------------------------------------- |
| `history_hours`            | number | `24`    | Lookback window in hours; max is `24`    |
| `bin_count`                | number | `16`    | Bucket count; must be `8`, `16`, or `32` |
| `refresh_interval_seconds` | number | `300`   | Refresh interval; minimum `60`           |
| `gauge_max`                | number | auto    | Optional fixed max rose value            |

### Display and Behavior Options

| Option            | Type    | Default        | Notes                                |
| ----------------- | ------- | -------------- | ------------------------------------ |
| `gauge_min`       | number  | preset-derived | Minimum range bound                  |
| `gauge_max`       | number  | preset-derived | Maximum range bound                  |
| `threshold`       | number  | unset          | Supported for radial/radial-bargraph |
| `threshold_label` | string  | unset          | Threshold caption                    |
| `show_threshold`  | boolean | `false`        | Show threshold indicator             |
| `decimals`        | number  | unset          | Used by bargraph readout             |
| `size`            | number  | auto           | Pixel size override                  |
| `animated`        | boolean | `true`         | Enable gauge animation               |
| `duration`        | number  | `500`          | Animation duration (ms)              |
| `validation`      | string  | `clamp`        | `clamp`, `coerce`, `strict`          |
| `theme`           | string  | `classic`      | `classic`, `flat`, `high-contrast`   |

## Examples

### Radial Temperature Gauge

```yaml
type: custom:weather-gauges-radial-card
entity: sensor.outdoor_temperature
title: Temperature
preset: temperature
```

### Radial Bargraph Humidity Gauge

```yaml
type: custom:weather-gauges-radial-bargraph-card
entity: sensor.outdoor_humidity
title: Humidity
preset: humidity
decimals: 0
```

### Compass Wind Heading

```yaml
type: custom:weather-gauges-compass-card
entity: sensor.wind_direction
title: Wind Heading
unit: deg
```

### Wind Direction with Average Attribute

```yaml
type: custom:weather-gauges-wind-direction-card
entity: sensor.wind_direction
title: Wind Direction
average_attribute: average_heading
unit: deg
```

### Wind Rose (Sample-Count Frequency)

```yaml
type: custom:weather-gauges-wind-rose-card
entity: sensor.wind_direction
title: Wind Rose
history_hours: 24
bin_count: 16
refresh_interval_seconds: 300
```

### Attribute-Based Pressure Gauge

```yaml
type: custom:weather-gauges-radial-card
entity: weather.home
attribute: pressure
title: Pressure
preset: pressure
```

## Lovelace Layout Tips

- Use `grid` or `horizontal-stack` for station-like dashboards.
- Leave `size` unset to use responsive auto-size.
- In Sections view, the card provides a default grid footprint via `getGridOptions()`.

## Known Limitations (v1)

- Wind rose uses sample-count frequency buckets only (no speed weighting yet).
- Wind rose lookback is capped at 24 hours.
- Full pass-through for all low-level visual options (for example `frame_design`, `pointer_color`) is not wired in this version.
- `decimals` currently affects radial-bargraph output; other gauge types ignore it.

## Troubleshooting

### Card Not Showing

1. Confirm the resource URL is loaded as `type: module`.
2. Check browser console errors.
3. Verify `entity` exists in Developer Tools -> States.

### Value Not Numeric

The card expects a numeric value from either:

- `state.state` (default), or
- the configured `attribute`.

If the selected source is not numeric, the card renders an inline error message.

### Unit Is Wrong

- Set `unit` explicitly to override detection.
- For attribute mode, the card first looks for `<attribute>_unit`, then `unit_of_measurement`.

## Development

```bash
pnpm install
pnpm --filter @bradsjm/weather-gauges-ha-cards lint
pnpm --filter @bradsjm/weather-gauges-ha-cards typecheck
pnpm --filter @bradsjm/weather-gauges-ha-cards test
pnpm --filter @bradsjm/weather-gauges-ha-cards build
```

Build output for Home Assistant/HACS is:

```text
packages/ha-cards/dist/index.js
```

## Related Packages

- [@bradsjm/weather-gauges-core](../core/README.md)
- [@bradsjm/weather-gauges-elements](../elements/README.md)
- [@bradsjm/weather-gauges-docs](../docs-site/README.md)
