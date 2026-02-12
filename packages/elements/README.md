# @bradsjm/steelseries-v3-elements

Lit Web Components for SteelSeries v3, powered by the core renderer package.

## Notes

- Complex object/array options are exposed as property-only APIs (not HTML attributes).
- Wind direction now supports direct `sections`, `areas`, and `customLayer` properties.
- Radial bargraph now supports direct `sections` and `valueGradientStops` properties.
- `SteelseriesGaugeElement` is exported for composing custom gauge elements with shared canvas/theme/event lifecycle behavior.
