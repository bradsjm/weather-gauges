# @bradsjm/weather-gauges-elements

Lit Web Components for Weather Gauges, powered by the core renderer package.

## Stable HTML-First Subset

The long-term public HTML contract intentionally stays small:

- Shared: `value`, `gauge-min`, `gauge-max`, `label`, `unit`, `size`, `animated`, `duration`, `preset`, `validation`, `theme`
- Radial + bargraph: `threshold`, `threshold-label`, `decimals`
- Compass: `show-labels`, `show-degrees`, `face-rotates`
- Wind direction: `average`, `average-label`
- Wind rose: optional `gauge-max` (auto-derived from petals when omitted)

Additional advanced HTML attributes currently exist for backward compatibility and playground use, but those are being migrated to JS property APIs.

## Canonical Child Tags

- `wx-section`: `start`, `end`, `color`, optional `label`
- `wx-alert`: `threshold`, `severity`, optional `message`, optional `id`
- `wx-petal`: `direction`, `value`, optional `color`

Compatibility aliases remain accepted in some gauges (for example `from`/`to` and `heading`), but new examples and docs should use the canonical names above.

## Notes

- Complex object/array options are exposed as property-only APIs (not HTML attributes).
- Wind direction now supports direct `sections`, `areas`, and `customLayer` properties.
- Radial bargraph now supports direct `sections` and `valueGradientStops` properties.
- `WeatherGaugeElement` is exported for composing custom gauge elements with shared canvas/theme/event lifecycle behavior.
