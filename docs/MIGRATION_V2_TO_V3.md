# Migration Guide: SteelSeries v2 -> v3

This guide shows practical conversions from legacy v2 configuration/property style to the v3 grouped, typed API model.

## Migration Principles

- Move flat legacy fields into grouped v3 config sections (`value`, `size`, `text`, `visibility`, `animation`, `indicators`).
- Replace `no*` booleans with positive flags (`showFrame`, `showBackground`, `showForeground`, `showLcd`).
- Convert enum-object references to string unions.
- Keep animation behavior, but move `transitionTime` into `animation.durationMs`.
- Apply CSS token overrides instead of hardcoded color settings where possible.

## Conversion Examples

1. **Value range mapping**

v2:

```js
{ minValue: 0, maxValue: 100, value: 42 }
```

v3:

```ts
{ value: { min: 0, max: 100, current: 42 } }
```

2. **Dimension mapping**

v2:

```js
{
  size: 220
}
```

v3 radial/compass:

```ts
{ size: { width: 220, height: 220 } }
```

v3 linear:

```ts
{ size: { width: 130, height: 280 } }
```

3. **Title/unit mapping**

v2:

```js
{ titleString: 'Pressure', unitString: 'psi' }
```

v3:

```ts
{ text: { title: 'Pressure', unit: 'psi' } }
```

4. **Animation mapping**

v2:

```js
{
  transitionTime: 400
}
```

v3:

```ts
{ animation: { enabled: true, durationMs: 400, easing: 'easeInOutCubic' } }
```

5. **Frame/background/foreground/lcd visibility conversion**

v2:

```js
{ noFrameVisible: true, noBackgroundVisible: false, noForegroundVisible: true, noLcdVisible: false }
```

v3:

```ts
{
  visibility: {
    showFrame: false,
    showBackground: true,
    showForeground: false,
    showLcd: true
  }
}
```

6. **Threshold conversion**

v2:

```js
{ threshold: 80, thresholdVisible: true }
```

v3:

```ts
{ indicators: { threshold: { value: 80, show: true }, alerts: [] } }
```

7. **Alert severity conversion**

v2 custom logic:

```js
{ warningAt: 75, criticalAt: 95 }
```

v3:

```ts
{
  indicators: {
    alerts: [
      { id: 'warn', value: 75, message: 'warning', severity: 'warning' },
      { id: 'crit', value: 95, message: 'critical', severity: 'critical' }
    ]
  }
}
```

8. **Compass heading conversion**

v2:

```js
{
  value: 132
}
```

v3:

```ts
{ heading: { min: 0, max: 360, current: 132 } }
```

9. **Token-based theming conversion**

v2:

```js
{ backgroundColor: '#e0f2fe', frameDesign: 'METAL', valueColor: '#0f766e' }
```

v3:

```css
steelseries-radial-v3 {
  --ss3-background-color: #e0f2fe;
  --ss3-frame-color: #bae6fd;
  --ss3-accent-color: #0f766e;
}
```

10. **Element usage conversion (radial)**

v2:

```html
<steelseries-radial
  value="42"
  min-value="0"
  max-value="100"
  title-string="Pressure"
  unit-string="psi"
></steelseries-radial>
```

v3:

```html
<steelseries-radial-v3
  value="42"
  min-value="0"
  max-value="100"
  title="Pressure"
  unit="psi"
  threshold="80"
></steelseries-radial-v3>
```

11. **Element usage conversion (linear)**

v2:

```html
<steelseries-linear value="58"></steelseries-linear>
```

v3:

```html
<steelseries-linear-v3
  value="58"
  min-value="0"
  max-value="100"
  width="140"
  height="300"
  title="Tank"
  unit="%"
></steelseries-linear-v3>
```

12. **Element usage conversion (compass)**

v2:

```html
<steelseries-compass value="184"></steelseries-compass>
```

v3:

```html
<steelseries-compass-v3
  heading="184"
  size="240"
  title="Bearing"
  unit="deg"
></steelseries-compass-v3>
```

## Checklist for Migration PRs

- Validate incoming config with v3 schema helpers.
- Replace all negative booleans with positive `visibility` flags.
- Keep animation duration/easing explicit.
- Move all color customization to CSS tokens.
- Add visual fixture snapshots for any changed gauge appearance.
