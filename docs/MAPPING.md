# Legacy-to-v3 Mapping Reference

## 1) Purpose

This document maps legacy SteelSeries v2 configuration/property patterns to the clean v3 API direction.

Use this when implementing renderers and element wrappers in:

- `@bradsjm/steelseries-v3-core`
- `@bradsjm/steelseries-v3-elements`
- `@bradsjm/steelseries-v3-ha-cards`

This is an internal engineering mapping, not end-user migration copy.

## 2) Mapping Principles

1. Preserve behavior and visual output, not legacy naming.
2. Replace negative booleans (`noXVisible`) with positive flags (`showX`).
3. Replace enum-object indirection with typed string unions in v3 schemas.
4. Move internal animated state (`real_*`) out of public API.
5. Normalize dimensions/range/value structures across gauge types.

## 3) Canonical v3 Shape (Target)

```ts
type GaugeCommonConfig = {
  size?: { width: number; height: number } // radial can use square dimensions
  value: { current: number; min: number; max: number }
  animation?: { enabled: boolean; durationMs: number; easing: 'linear' | 'cubicInOut' }
  text?: { title?: string; unit?: string }
  visibility?: {
    frame: boolean
    background: boolean
    foreground: boolean
    lcd: boolean
  }
  theme?: {
    frameDesign?: FrameDesign
    background?: BackgroundTheme
    foregroundType?: ForegroundType
    accentColor?: ColorName
  }
  indicators?: {
    threshold?: { value: number; visible: boolean }
    minMeasured?: { visible: boolean }
    maxMeasured?: { visible: boolean }
    trend?: { visible: boolean }
  }
}
```

Note: exact final schema names may evolve, but mapping should retain this semantic structure.

## 4) Shared Property Mapping Rules

| Legacy Pattern | v3 Pattern | Notes |
|---|---|---|
| `noFrameVisible` | `visibility.frame` | Invert boolean (`!noFrameVisible`) |
| `noBackgroundVisible` | `visibility.background` | Invert boolean |
| `noForegroundVisible` | `visibility.foreground` | Invert boolean |
| `noLcdVisible` | `visibility.lcd` | Invert boolean |
| `value` | `value.current` | Keep numeric semantics |
| `minValue` / `maxValue` | `value.min` / `value.max` | Normalize across gauges |
| `transitionTime` | `animation.durationMs` + `animation.enabled` | enabled false when duration <= 0 |
| `titleString` / `unitString` | `text.title` / `text.unit` | Naming cleanup |
| `real_value` / `real_*` | internal renderer state | Not exposed in v3 public config |
| `objectEnum` string keys | typed unions | Parse/validate in zod schemas |

## 5) Enum Family Mapping

Legacy enum catalogs in `definitions.js` should become typed unions and resolver maps.

| Legacy Catalog | v3 Type Alias (suggested) |
|---|---|
| `BackgroundColor` | `BackgroundTheme` |
| `FrameDesign` | `FrameDesign` |
| `ForegroundType` | `ForegroundType` |
| `PointerType` | `PointerType` |
| `ColorDef` / `LedColor` / `LcdColor` | `ColorName`, `LedColorName`, `LcdPalette` |
| `GaugeType` | `GaugeArcProfile` |
| `Orientation` | `Orientation` |
| `LabelNumberFormat` | `LabelNumberFormat` |
| `TickLabelOrientation` | `TickLabelOrientation` |
| `TrendState` | `TrendState` |

Guidance:

- Keep legacy enum value coverage where practical for parity.
- Allow aliases only if they do not expand complexity.
- Enforce with zod `z.enum([...])` or string-literal unions.

## 6) Radial Gauge Mapping

Primary source: `src/Radial.js`

| Legacy `Radial` Property | v3 Field | Transform |
|---|---|---|
| `size` | `size.width`, `size.height` | set both to legacy `size` |
| `value` | `value.current` | direct |
| `minValue` / `maxValue` | `value.min` / `value.max` | direct |
| `transitionTime` | `animation.durationMs` | direct |
| `noNiceScale` | `scale.nice` | invert |
| `threshold` + `thresholdVisible` | `indicators.threshold` | merge |
| `minMeasuredValueVisible` | `indicators.minMeasured.visible` | direct |
| `maxMeasuredValueVisible` | `indicators.maxMeasured.visible` | direct |
| `gaugeType` | `dial.arcProfile` | rename |
| `frameDesign` | `theme.frameDesign` | direct |
| `backgroundColor` | `theme.background` | direct |
| `foregroundType` | `theme.foregroundType` | direct |
| `pointerType` | `pointer.type` | direct |
| `pointerColor` | `pointer.color` | direct |
| `knobType` / `knobStyle` | `pointer.knob.type` / `pointer.knob.style` | regroup |
| `lcdColor` | `lcd.palette` | direct |
| `lcdDecimals` | `lcd.decimals` | direct |
| `fractionalScaleDecimals` | `scale.fractionDigits` | direct |
| `labelNumberFormat` | `scale.labelFormat` | direct |
| `tickLabelOrientation` | `scale.tickLabelOrientation` | direct |
| `digitalFont` | `lcd.digitalFont` | direct |
| `titleString` / `unitString` | `text.title` / `text.unit` | rename |
| `trendVisible` | `indicators.trend.visible` | direct |
| `useOdometer` | `lcd.mode = 'odometer'` | normalize to mode |
| `real_value` | internal state | remove public surface |

## 7) Linear Gauge Mapping

Primary source: `src/Linear.js`

| Legacy `Linear` Property | v3 Field | Transform |
|---|---|---|
| `width` / `height` | `size.width` / `size.height` | direct |
| `value` | `value.current` | direct |
| `minValue` / `maxValue` | `value.min` / `value.max` | direct |
| `transitionTime` | `animation.durationMs` | direct |
| `valueColor` | `bar.color` or `pointer.color` | depends on renderer mode |
| `threshold` + visibility | `indicators.threshold` | merge |
| `noFrameVisible` etc. | `visibility.*` | invert/rename |
| `lcd*` fields | `lcd.*` | regroup |
| `titleString` / `unitString` | `text.*` | rename |
| `real_value` | internal state | remove public surface |

## 8) Compass Gauge Mapping

Primary source: `src/Compass.js`

| Legacy `Compass` Property | v3 Field | Transform |
|---|---|---|
| `size` | `size.width`, `size.height` | square map |
| `value` | `heading.current` | semantic rename |
| `real_value` | internal state | remove public surface |
| `rotateFace` | `dial.rotateFace` | direct |
| `pointSymbols` | `dial.pointSymbols` | direct |
| `pointSymbolsVisible` | `dial.showPointSymbols` | rename |
| `degreeScale` | `dial.showDegreeScale` | rename |
| `noRoseVisible` | `dial.showRose` | invert |
| `frame/background/foreground props` | `visibility.*`, `theme.*` | normalize shared fields |

## 9) Wind Direction Mapping (Deferred Gauge but Important)

Primary source: `src/WindDirection.js`

| Legacy Property | v3 Field | Transform |
|---|---|---|
| `valueLatest` | `heading.latest` | direct |
| `valueAverage` | `heading.average` | direct |
| `real_valueLatest` / `real_valueAverage` | internal state | remove public surface |
| `pointerTypeLatest` / `pointerTypeAverage` | `pointers.latest.type`, `pointers.average.type` | regroup |
| `pointerColor` / `pointerColorAverage` | `pointers.latest.color`, `pointers.average.color` | regroup |
| `lcdTitleStrings` | `lcd.labels` | rename |
| `useColorLabels` | `dial.useColorLabels` | direct |

## 10) Clock and Stopwatch Mapping (Deferred)

### Clock (`src/Clock.js`)

| Legacy Property | v3 Field | Transform |
|---|---|---|
| `isCurrentTime` | `mode = 'system-time' | 'manual'` | normalize mode |
| `hour`, `minute`, `second` | `manualTime.{hour,minute,second}` | regroup |
| `timeZoneOffsetHour`, `timeZoneOffsetMinute` | `timeZone.offsetMinutes` | combine |
| `noSecondPointerVisible` | `hands.showSecond` | invert |

### StopWatch (`src/StopWatch.js`)

| Legacy Property | v3 Field | Transform |
|---|---|---|
| `seconds` | `elapsedSeconds` | rename |
| `running` | `running` | direct |
| style and visibility fields | shared groups (`theme`, `visibility`) | normalize |

## 11) Negative Boolean Conversion Table

Legacy flags with `no*` prefix require inversion.

| Legacy | v3 |
|---|---|
| `noFrameVisible` | `showFrame = !noFrameVisible` |
| `noBackgroundVisible` | `showBackground = !noBackgroundVisible` |
| `noForegroundVisible` | `showForeground = !noForegroundVisible` |
| `noLcdVisible` | `showLcd = !noLcdVisible` |
| `noNiceScale` | `niceScale = !noNiceScale` |
| `noRoseVisible` | `showRose = !noRoseVisible` |
| `noSecondPointerVisible` | `showSecondHand = !noSecondPointerVisible` |

Rule: these are migration-only transformations; new v3 API should never expose `no*` names.

## 12) Internal-State (`real_*`) Handling

Legacy elements often surface animated state as schema properties (usually marked stateful).

v3 approach:

- keep only external target values in public config
- hold animated/interpolated values in renderer instance state
- expose animation events when useful (`animation-start`, `animation-end`)
- do not include `real_*` in serialized config or HA card config

## 13) Suggested Normalization Pipeline for v3

1. Parse external config with zod.
2. Apply legacy mapping only in adapter/import path (if needed).
3. Normalize booleans and dimension forms.
4. Resolve enums/unions to internal render constants.
5. Compute derived fields (angle ranges, label formats, thresholds).
6. Produce immutable renderer input object.

## 14) Minimal Adapter Example (Legacy -> v3)

```ts
function mapLegacyRadial(input: LegacyRadialConfig): RadialGaugeConfig {
  return {
    size: { width: input.size, height: input.size },
    value: {
      current: input.value,
      min: input.minValue,
      max: input.maxValue
    },
    animation: {
      enabled: input.transitionTime > 0,
      durationMs: input.transitionTime,
      easing: 'cubicInOut'
    },
    visibility: {
      frame: !input.noFrameVisible,
      background: !input.noBackgroundVisible,
      foreground: !input.noForegroundVisible,
      lcd: !input.noLcdVisible
    },
    text: {
      title: input.titleString,
      unit: input.unitString
    }
  }
}
```

## 15) v3 Implementation Priorities from Mapping

1. Implement shared normalized schema groups first (`value`, `visibility`, `animation`, `theme`, `text`).
2. Implement radial mapping first and lock parity tests.
3. Reuse shared groups for linear and compass to prevent API drift.
4. Add deferred mapping adapters for wind/clock/stopwatch after phase-3 gauges are stable.

## 16) Open Decisions to Resolve During Implementation

- Exact v3 enum value casing (`camelCase` vs `UPPER_SNAKE`) for external API.
- Whether to support optional legacy alias adapter package in v3.x.
- Whether compass `heading` should reuse generic `value` model or a dedicated type.
- Whether LCD/odometer modes remain one component with mode switch or split elements.

Keep this document updated as schemas are finalized in `@bradsjm/steelseries-v3-core`.
