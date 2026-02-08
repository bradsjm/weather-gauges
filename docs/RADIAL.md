# Radial Gauge v3

## Element

`<steelseries-radial-v3>`

## Primary Attributes

- `value` (number): current gauge value.
- `min-value` (number): minimum scale value.
- `max-value` (number): maximum scale value.
- `threshold` (number): warning threshold marker.
- `size` (number): square pixel size for canvas.
- `title` (string): gauge title label.
- `unit` (string): value unit suffix.
- `animate-value` (boolean): enables transition animation on value updates.

## Copy-Ready Examples

### Minimal

```html
<steelseries-radial-v3
  title="Pressure"
  unit="psi"
  value="42"
  min-value="0"
  max-value="100"
  threshold="80"
></steelseries-radial-v3>
```

### Full Theme Override

```html
<steelseries-radial-v3
  title="Temperature"
  unit="°F"
  value="88"
  min-value="0"
  max-value="120"
  threshold="72"
  style="
    --ss3-font-family: 'IBM Plex Sans', sans-serif;
    --ss3-background-color: #e0f2fe;
    --ss3-frame-color: #bae6fd;
    --ss3-text-color: #0c4a6e;
    --ss3-accent-color: #0f766e;
    --ss3-warning-color: #ca8a04;
    --ss3-danger-color: #dc2626;
  "
></steelseries-radial-v3>
```

### High Update Stream

```html
<steelseries-radial-v3
  id="load-gauge"
  title="Load"
  unit="%"
  value="15"
  threshold="70"
></steelseries-radial-v3>
<script type="module">
  const gauge = document.getElementById('load-gauge')
  let value = 15
  let direction = 1

  setInterval(() => {
    value += direction * 5
    if (value >= 95) direction = -1
    if (value <= 10) direction = 1
    gauge?.setAttribute('value', String(value))
  }, 350)
</script>
```

## Caveats

- If screenshots are required for CI visual tests, set `animate-value="false"` for deterministic captures.
- Keep `min-value < max-value`; invalid range input is rejected by core schema validation.
- Prefer CSS token overrides over hardcoded inline colors for cross-theme consistency.
