# @bradsjm/weather-gauges-docs

Documentation and playground package for Weather Gauges.

## API Contract Focus

The docs site and examples are moving toward the stable HTML-first API surface documented in the root README:

- Small shared attribute set for common usage (`value`, `gauge-min`, `gauge-max`, `label`, `unit`, `size`, `animated`, `duration`, `preset`, `validation`, `theme`)
- Gauge-specific additions only where needed (`threshold`, `threshold-label`, `average`, `average-label`, etc.)
- Advanced visual/behavioral options primarily via JS properties

Canonical child configuration tags used in docs:

- `wx-section`: `start`, `end`, `color`, optional `label`
- `wx-alert`: `threshold`, `severity`, optional `message`, optional `id`
- `wx-petal`: `direction`, `value`, optional `color`
