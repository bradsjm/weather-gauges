# SteelSeries v3 Gauges

Modern, animated gauges for web applications built with TypeScript and Canvas.

![Status](https://img.shields.io/badge/status-beta-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![License](https://img.shields.io/badge/license-MIT-green)

SteelSeries v3 is a complete rewrite of the classic SteelSeries gauges library, designed for modern web development with full TypeScript support, framework-agnostic core rendering, and Lit-based web components.

## 📦 Packages

This monorepo provides two main packages:

- **@bradsjm/steelseries-v3-core** - Framework-agnostic core rendering engine
- **@bradsjm/steelseries-v3-elements** - Lit Web Components for drop-in usage

## 🧭 Gauge Types

### Compass

A circular compass gauge for displaying heading/direction information.

**Features:**
- 0-360° heading display
- Animated needle movement
- Configurable rose and degree scales
- Multiple pointer types and colors
- Custom layer support for maps/images
- Alert indicators at specific headings

### Radial Bargraph

A radial gauge with a bar graph around the perimeter for value visualization.

**Features:**
- Configurable value range
- Animated bar graph with gradient support
- Sections and areas for value zones
- LCD display with customizable formatting
- Multiple pointer and frame designs
- Trend indicators (up/down/steady)

### Wind Direction

Displays both latest and average wind directions with twin pointers.

**Features:**
- Dual pointers for latest and average values
- Configurable pointer types and colors
- Sections and areas for wind rose zones
- LCD displays for both values
- Customizable point symbols
- Alert indicators

## 🚀 Installation

```bash
# Install both packages
pnpm add @bradsjm/steelseries-v3-core @bradsjm/steelseries-v3-elements

# Or just the core for framework integration
pnpm add @bradsjm/steelseries-v3-core

# Or just the elements for HTML/JS projects
pnpm add @bradsjm/steelseries-v3-elements
```

## 📖 Usage

### Using Web Components (Elements Package)

The easiest way to get started - just add custom elements to your HTML:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>SteelSeries v3 Demo</title>
  </head>
  <body>
    <!-- Compass Gauge -->
    <steelseries-compass-v3
      id="compass"
      heading="45"
      size="220"
      title="Heading"
      frame-design="metal"
      pointer-color="red"
      rose-visible="true">
    </steelseries-compass-v3>

    <!-- Radial Bargraph -->
    <steelseries-radial-bargraph-v3
      id="bargraph"
      value="75.5"
      min-value="0"
      max-value="100"
      size="300"
      title="Pressure"
      unit="hPa"
      frame-design="metal"
      value-color="green">
    </steelseries-radial-bargraph-v3>

    <!-- Wind Direction -->
    <steelseries-wind-direction-v3
      id="wind"
      size="300"
      latest-heading="45"
      average-heading="90"
      title="Wind Direction"
      unit="deg"
      frame-design="metal">
    </steelseries-wind-direction-v3>

    <script type="module">
      // Update values programmatically
      const compass = document.getElementById('compass');
      
      compass.heading = 135;
      
      // Listen for value changes
      compass.addEventListener('gauge-value-change', (e) => {
        console.log('Heading changed:', e.detail.value);
      });
    </script>
  </body>
</html>
```

#### Component Attributes

All components share these common attributes:

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `size` | Number | 220 | Size in pixels (square) |
| `title` | String | '' | Title text above gauge |
| `unit` | String | '' | Unit label |
| `frame-design` | String | 'metal' | Frame style (metal, blackMetal, brass, etc.) |
| `background-color` | String | 'DARK_GRAY' | Background color |
| `animate-value` | Boolean | true | Animate value changes |

**Compass-specific:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `heading` | Number | 0 | Current heading (0-360) |
| `pointer-type` | String | 'type2' | Pointer style |
| `pointer-color` | String | 'RED' | Pointer color |
| `rose-visible` | Boolean | true | Show compass rose |
| `degree-scale` | Boolean | false | Show degree marks |

**Radial Bargraph-specific:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | Number | 0 | Current value |
| `min-value` | Number | 0 | Minimum value |
| `max-value` | Number | 100 | Maximum value |
| `value-color` | String | 'RED' | Bar/needle color |
| `lcd-decimals` | Number | 2 | LCD decimal places |

**Wind Direction-specific:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `latest-heading` | Number | 0 | Latest wind direction |
| `average-heading` | Number | 0 | Average wind direction |
| `show-rose` | Boolean | true | Show wind rose |

### Using Core API Directly

For framework integration (React, Vue, Angular, Svelte) or full control:

```typescript
import {
  renderCompassGauge,
  type CompassGaugeConfig
} from '@bradsjm/steelseries-v3-core';

// Get canvas context
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

// Configure gauge
const config: CompassGaugeConfig = {
  heading: {
    current: 45,
    min: 0,
    max: 360
  },
  size: {
    width: 220,
    height: 220
  },
  text: {
    title: 'Heading',
    unit: 'deg'
  },
  style: {
    frameDesign: 'metal',
    backgroundColor: 'DARK_GRAY',
    pointerType: 'type2',
    pointerColor: 'RED',
    foregroundType: 'type1'
  },
  rose: {
    showDegreeLabels: true,
    showOrdinalMarkers: true
  }
};

// Render
renderCompassGauge(ctx, config, {
  heading: 45,
  paint: {} // Optional theme overrides
});
```

#### Animated Values

```typescript
import { animateCompassGauge } from '@bradsjm/steelseries-v3-core';

// Smooth animation from 0° to 45°
const animation = animateCompassGauge({
  context: ctx,
  config,
  from: 0,
  to: 45,
  paint: {},
  showHeadingReadout: true,
  onFrame: (frame) => {
    console.log('Current heading:', frame.heading);
  },
  onComplete: (frame) => {
    console.log('Animation complete:', frame.heading);
  }
});

// Cancel if needed
animation.cancel();
```

### React Integration Example

```typescript
import React, { useEffect, useRef } from 'react';
import { renderRadialBargraphGauge } from '@bradsjm/steelseries-v3-core';

function PressureGauge({ value }: { value: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = {
      value: { current: value, min: 0, max: 100 },
      size: { width: 300, height: 300 },
      text: { title: 'Pressure', unit: 'hPa' },
      style: {
        frameDesign: 'metal',
        backgroundColor: 'DARK_GRAY',
        gaugeType: 'type4',
        valueColor: 'GREEN'
      },
      lcdDecimals: 1
    };

    renderRadialBargraphGauge(ctx, config, {
      value,
      paint: {}
    });
  }, [value]);

  return <canvas ref={canvasRef} width={300} height={300} />;
}
```

## 🎨 Theming

All gauges support CSS custom properties for theming:

```css
:root {
  --ss3-frame-color: #888;
  --ss3-background-color: #333;
  --ss3-text-color: #fff;
  --ss3-value-color: #0f0;
}
```

Or override colors programmatically with the `paint` parameter:

```typescript
renderCompassGauge(ctx, config, {
  heading: 45,
  paint: {
    frameColor: '#888888',
    backgroundColor: '#333333',
    textColor: '#ffffff',
    pointerColor: '#ff0000'
  }
});
```

## 🔧 Configuration Schemas

All configurations are validated at runtime using Zod schemas:

```typescript
import {
  compassGaugeConfigSchema,
  radialBargraphGaugeConfigSchema,
  windDirectionGaugeConfigSchema
} from '@bradsjm/steelseries-v3-core';

// Validate configuration
const config = compassGaugeConfigSchema.parse({
  heading: { current: 45, min: 0, max: 360 },
  size: { width: 220, height: 220 },
  // ... other properties
});
```

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📚 API Reference

Detailed API documentation is available at [docs.steelseries.dev](https://docs.steelseries.dev).

### Core Exports

```typescript
// Gauges
import {
  renderCompassGauge,
  animateCompassGauge,
  type CompassGaugeConfig,
  type CompassDrawContext
} from '@bradsjm/steelseries-v3-core';

import {
  renderRadialBargraphGauge,
  animateRadialBargraphGauge,
  type RadialBargraphGaugeConfig,
  type RadialBargraphDrawContext
} from '@bradsjm/steelseries-v3-core';

import {
  renderWindDirectionGauge,
  animateWindDirectionGauge,
  type WindDirectionGaugeConfig,
  type WindDirectionDrawContext
} from '@bradsjm/steelseries-v3-core';

// Utilities
import {
  easingFunctions,
  type EasingFunction
} from '@bradsjm/steelseries-v3-core';

import {
  themeTokens,
  type ThemePaint
} from '@bradsjm/steelseries-v3-core';
```

### Elements Exports

```typescript
import {
  SteelseriesCompassV3Element,
  SteelseriesRadialBargraphV3Element,
  SteelseriesWindDirectionV3Element
} from '@bradsjm/steelseries-v3-elements';

// TypeScript auto-completion for custom elements
declare global {
  interface HTMLElementTagNameMap {
    'steelseries-compass-v3': SteelseriesCompassV3Element;
    'steelseries-radial-bargraph-v3': SteelseriesRadialBargraphV3Element;
    'steelseries-wind-direction-v3': SteelseriesWindDirectionV3Element;
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 History and Credits

SteelSeries has a rich heritage:

- **2010** - Original Java Swing version created by [HanSolo](https://harmoniccode.blogspot.com/2010/08/java-swing-component-library.html)
- **2013** - JavaScript Canvas-based [SteelSeries-Canvas](https://github.com/HanSolo/SteelSeries-Canvas) created by HanSolo
- **2019** - Web Component implementation by [Nicolas Vanhoren](https://github.com/nicolas-van/steelseries)
- **2021** - SteelSeries Rose Gauge implementation by [Ricky Rebo](https://github.com/ricky-rebo/SteelSeries-Rose-Gauge)

The v3 version maintains the visual fidelity of the original weather gauges while providing a modern, type-safe API and framework-agnostic core.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Documentation](https://docs.steelseries.dev)
- [GitHub Issues](https://github.com/bradsjm/steelseries-v3/issues)
