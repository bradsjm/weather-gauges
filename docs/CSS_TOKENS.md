# SteelSeries v3 CSS Custom Property Contract v1

Status: Approved for Phase 0-3 implementation

## 1) Purpose

This document defines the public CSS custom property contract for SteelSeries v3 components.
The contract provides stable theming hooks while preserving deterministic rendering behavior.

## 2) Resolution Model

- Components read tokens from host/computed styles.
- Each token has a documented fallback.
- If a token is missing or invalid, the component uses its fallback value.
- Components must remain render-stable with default token values.

Resolution order:

1. Host-provided token value
2. Inherited/app-level token value
3. Component fallback value (documented below)

## 3) Token Contract v1

| Token | Purpose | Default Fallback |
|---|---|---|
| `--ss3-font-family` | Gauge typography family | `system-ui, sans-serif` |
| `--ss3-text-color` | Primary text and labels | `#1f2937` |
| `--ss3-background-color` | Gauge body/background surface | `#f8fafc` |
| `--ss3-frame-color` | Frame ring/background color | `#dbe4ee` |
| `--ss3-accent-color` | Nominal/healthy value color | `#0f766e` |
| `--ss3-warning-color` | Warning-level value color | `#b45309` |
| `--ss3-danger-color` | Critical-level value color | `#b91c1c` |

## 4) Semantics

- `accent`/`warning`/`danger` represent state color intent, not fixed thresholds.
- Threshold-to-color mapping is component behavior and may vary by gauge type.
- Tokens should support light and dark host themes by override.

## 5) Sample Usage

```css
steelseries-radial-v3 {
  --ss3-font-family: 'Avenir Next', 'Segoe UI', sans-serif;
  --ss3-background-color: #f1f5f9;
  --ss3-frame-color: #cbd5e1;
  --ss3-text-color: #0f172a;
  --ss3-accent-color: #0f766e;
  --ss3-warning-color: #b45309;
  --ss3-danger-color: #b91c1c;
}
```

## 6) Stability Rules

- Token names are public API.
- Removing or renaming a token is a breaking change.
- Adding new optional tokens is non-breaking when defaults remain intact.

## 7) Current Consumer Coverage

The scaffold radial element consumes all v1 tokens in `packages/elements/src/index.ts`.
This satisfies the Phase 0 requirement that documented tokens are used by a sample component.
