# @bradsjm/weather-gauges-ha-cards

Home Assistant Lovelace cards for Weather Gauges.

## Overview

`@bradsjm/weather-gauges-ha-cards` provides custom Lovelace cards for displaying weather gauges in Home Assistant. These cards wrap the Lit web components from `@bradsjm/weather-gauges-elements` and integrate seamlessly with Home Assistant's entity system.

## Key Features

- **Native Home Assistant Integration**: Seamlessly integrates with Lovelace dashboard
- **Entity-Based**: Bind gauges to Home Assistant sensor entities
- **HACS Support**: Easy installation via HACS
- **Full Gauge Support**: All gauge types (compass, radial, radial-bargraph, wind-direction, wind-rose)
- **Theming**: Respects Home Assistant themes
- **Real-Time Updates**: Automatically updates when entity state changes
- **Custom Configuration**: Advanced options via YAML configuration

## Installation

### Via HACS

1. Open HACS
2. Go to **Frontend** → **Explore & Download Repositories**
3. Search for **Weather Gauges**
4. Click **Download**
5. Follow the prompts to install

### Manual Installation

1. Download the latest release from GitHub
2. Copy `dist/index.js` to your Home Assistant configuration directory:
   ```
   <config_dir>/www/weather-gauges.js
   ```
3. Add the resource to your Lovelace configuration:

```yaml
resources:
  - url: /local/weather-gauges.js
    type: module
```

## Quick Start

Add a weather gauge card to your Lovelace dashboard:

```yaml
type: custom:weather-gauges-card
entity: sensor.wind_direction
title: Wind Direction
```

## Card Types

### Compass Card

Displays a compass rose with heading indicator.

```yaml
type: custom:weather-gauges-card
entity: sensor.wind_direction
title: Wind Direction
```

### Radial Gauge Card

Circular gauge for scalar values.

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
title: Temperature
unit: '°C'
```

### Radial Bargraph Card

Circular gauge with bar graph visualization.

```yaml
type: custom:weather-gauges-card
entity: sensor.humidity
title: Humidity
unit: '%'
```

### Wind Direction Card

Specialized compass for wind direction with average heading.

```yaml
type: custom:weather-gauges-card
entity: sensor.wind_direction
title: Wind Direction
average: true
```

## Card Configuration

### Basic Options

| Option   | Type   | Default     | Description              |
| -------- | ------ | ----------- | ------------------------ |
| `entity` | string | required    | Home Assistant entity ID |
| `title`  | string | entity name | Card title               |

### Advanced Configuration

Advanced options are passed directly to the underlying web component:

```yaml
type: custom:weather-gauges-card
entity: sensor.wind_direction
title: Wind Direction
size: 300
animated: true
duration: 500
validation: clamp
theme: classic
frame_design: brass
pointer_color: red
background_color: dark-gray
rose_visible: true
show_degrees: true
face_rotates: false
alerts_enabled: false
```

### Common Configuration Options

#### Size and Layout

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
size: 300 # Gauge size in pixels (square)
```

#### Animation

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
animated: true
duration: 500 # Animation duration in milliseconds
```

#### Validation

Controls how entity values are handled:

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
validation: clamp # clamp, coerce, or strict
```

- **`clamp`**: Clamp values to valid range (default)
- **`coerce`**: Try to coerce string values to numbers
- **`strict`**: Pass values through without validation

#### Theme

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
theme: classic # classic, flat, or high-contrast
```

### Compass Card Options

```yaml
type: custom:weather-gauges-card
entity: sensor.wind_direction
rose_visible: true
show_degrees: true
degree_scale_half: false
face_rotates: false
show_labels: true
show_tickmarks: true
show_heading_readout: false
```

#### Frame Design

Available frame designs:

- `blackMetal`
- `metal`
- `shinyMetal`
- `brass`
- `steel`
- `chrome`
- `gold`
- `anthracite`
- `tiltedGray`
- `tiltedBlack`
- `glossyMetal`

#### Background Color

Available background colors:

- `dark-gray`
- `satin-gray`
- `light-gray`
- `white`
- `black`
- `beige`
- `brown`
- `red`
- `green`
- `blue`
- `anthracite`
- `mud`
- `punched-sheet`
- `carbon`
- `stainless`
- `brushed-metal`
- `brushed-stainless`
- `turned`

#### Pointer Type

Available pointer types:

- `slim-angular-needle`
- `standard-arrow-needle`
- `slim-arrow-needle`
- `flat-arrow-needle`
- `flat-slim-needle`

#### Pointer Color

Common pointer colors: `red`, `blue`, `green`, `yellow`, `orange`, `white`, `black`

#### Knob Style

Available knob styles:

- `black`
- `brass`
- `silver`

#### Knob Type

Available knob types:

- `standardKnob`
- `metalKnob`

#### Foreground Type

Available foreground types:

- `top-arc-glass`
- `side-reflection-glass`
- `dome-glass`
- `center-glow-glass`
- `sweep-glass`

#### LCD Color

Available LCD colors:

- `standard`
- `standard-green`
- `blue`
- `orange`
- `red`
- `yellow`
- `white`
- `gray`
- `black`

### Radial Card Options

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
gauge_min: 0
gauge_max: 100
threshold: 80
threshold_label: High
decimals: 1
start_angle: -135
end_angle: 135
use_color_labels: false
use_section_colors: false
sections_enabled: false
```

### Radial Bargraph Card Options

```yaml
type: custom:weather-gauges-card
entity: sensor.humidity
value_color: blue
gauge_type: full-gap # full-gap, quarter-gap, eighth-gap, no-gap
threshold_color: orange
```

### Wind Direction Card Options

```yaml
type: custom:weather-gauges-card
entity: sensor.wind_direction
average: true
average_label: Avg
average_samples: 10
```

## Entity Integration

### Automatic Value Updates

The card automatically updates when the entity state changes:

```yaml
type: custom:weather-gauges-card
entity: sensor.wind_direction
title: Wind Direction
```

### Unit Handling

Units are automatically derived from the entity:

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature # Uses entity's unit_of_measurement
title: Temperature
```

Override the unit:

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
title: Temperature
unit: '°C' # Override entity unit
```

### Icon Handling

The entity icon is used in the card header:

```yaml
type: custom:weather-gauges-card
entity: sensor.wind_direction
title: Wind Direction # Shows wind direction icon
```

### State Class Handling

State classes are automatically handled:

- **`measurement`**: Scalar gauges (radial, radial-bargraph)
- **`None`**: Directional gauges (compass, wind-direction, wind-rose)

## Theming

### Home Assistant Theme Integration

The card respects Home Assistant themes:

```yaml
# themes/my-theme.yaml
my-theme:
  weather-gauges-primary-color: '#3498db'
  weather-gauges-secondary-color: '#2980b9'
  weather-gauges-text-color: '#333'
  weather-gauges-background-color: '#fff'
```

### Card-Level Theme

Override theme per card:

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
theme: high-contrast
```

## Dashboard Layout

### Card Sizing

Cards can be sized using standard Lovelace card options:

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
size: 300
```

Or use view-based sizing:

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
```

### Card Grid

Combine multiple gauge cards:

```yaml
type: grid
columns: 2
square: false
cards:
  - type: custom:weather-gauges-card
    entity: sensor.temperature
    title: Temperature
  - type: custom:weather-gauges-card
    entity: sensor.humidity
    title: Humidity
  - type: custom:weather-gauges-card
    entity: sensor.wind_direction
    title: Wind Direction
  - type: custom:weather-gauges-card
    entity: sensor.pressure
    title: Pressure
```

### Horizontal Stack

Stack cards horizontally:

```yaml
type: horizontal-stack
cards:
  - type: custom:weather-gauges-card
    entity: sensor.temperature
    title: Temperature
  - type: custom:weather-gauges-card
    entity: sensor.humidity
    title: Humidity
```

## Advanced Examples

### Weather Dashboard

```yaml
type: vertical-stack
cards:
  - type: horizontal-stack
    cards:
      - type: custom:weather-gauges-card
        entity: sensor.temperature
        title: Temperature
        unit: '°C'
        size: 300
      - type: custom:weather-gauges-card
        entity: sensor.humidity
        title: Humidity
        unit: '%'
        size: 300
  - type: horizontal-stack
    cards:
      - type: custom:weather-gauges-card
        entity: sensor.wind_direction
        title: Wind Direction
        size: 300
        average: true
      - type: custom:weather-gauges-card
        entity: sensor.wind_speed
        title: Wind Speed
        unit: 'km/h'
        size: 300
```

### Styled Compass

```yaml
type: custom:weather-gauges-card
entity: sensor.wind_direction
title: Wind Direction
size: 350
frame_design: brass
background_color: dark-gray
pointer_color: red
knob_style: brass
foreground_type: top-arc-glass
rose_visible: true
show_degrees: true
show_labels: true
```

### Threshold Alerts

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
title: Temperature
threshold: 80
threshold_label: High
theme: high-contrast
```

## Troubleshooting

### Card Not Displaying

1. Check browser console for errors (F12 → Console)
2. Verify HACS installation completed successfully
3. Ensure the resource is loaded in Lovelace configuration
4. Check that the entity exists and has a valid state

### Values Not Updating

1. Verify the entity is actively updating in Home Assistant
2. Check the entity's state in Developer Tools → States
3. Ensure the card configuration is correct (entity name spelling)

### Incorrect Units

1. Check the entity's `unit_of_measurement` attribute
2. Override the unit using the `unit` option:

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
unit: '°C'
```

### Value Out of Range

1. Check the entity's value range
2. Adjust `gauge_min` and `gauge_max`:

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
gauge_min: -20
gauge_max: 50
```

3. Change validation mode to `clamp`:

```yaml
type: custom:weather-gauges-card
entity: sensor.temperature
validation: clamp
```

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/bradsjm/weather-gauges.git
cd weather-gauges

# Install dependencies
pnpm install

# Build packages
pnpm build

# Build HA cards
pnpm --filter @bradsjm/weather-gauges-ha-cards build
```

### Local Testing

1. Build the package:

   ```bash
   pnpm --filter @bradsjm/weather-gauges-ha-cards build
   ```

2. Copy `dist/index.js` to your Home Assistant configuration directory

3. Load in Lovelace:

   ```yaml
   resources:
     - url: /local/weather-gauges.js
       type: module
   ```

4. Add card to dashboard and test

### Running Tests

```bash
pnpm --filter @bradsjm/weather-gauges-ha-cards test
```

### Running Linter

```bash
pnpm --filter @bradsjm/weather-gauges-ha-cards lint
```

### Typecheck

```bash
pnpm --filter @bradsjm/weather-gauges-ha-cards typecheck
```

## HACS Configuration

The package includes a `hacs.json` file for HACS integration:

```json
{
  "name": "Weather Gauges Cards",
  "content_in_root": false,
  "filename": "dist/index.js",
  "homeassistant": ">=2024.1.0",
  "render_readme": true
}
```

## Version Requirements

- **Home Assistant**: `>=2024.1.0`
- **Browser**: Modern browsers with ES2020+ and Web Components support

## Related Packages

- [@bradsjm/weather-gauges-core](../core/README.md): Framework-agnostic rendering engine
- [@bradsjm/weather-gauges-elements](../elements/README.md): Lit web components
- [@bradsjm/weather-gauges-docs](../docs-site/README.md): Documentation and playground

## Support

- **GitHub Issues**: Report bugs and request features at [github.com/bradsjm/weather-gauges/issues](https://github.com/bradsjm/weather-gauges/issues)

## License

MIT
