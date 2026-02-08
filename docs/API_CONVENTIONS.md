# SteelSeries v3 API Conventions

Status: Approved for Phase 0-3 implementation

## 1) Purpose

This document defines naming, defaults, and behavioral rules for the public v3 API.
All package APIs in `@bradsjm/steelseries-v3-*` must follow these rules.

## 2) Design Principles

- Clean-break v3 API: preserve behavior and visual intent, not legacy property names.
- Type-safe by default: strict TypeScript shapes plus runtime validation for external input.
- Consistent cross-gauge semantics: radial, linear, and compass use shared terms when behavior matches.
- Deterministic rendering: same config produces the same output in browser and tests.
- Positive configuration model: avoid negative booleans and hidden inversions.

## 3) Naming Rules

### 3.1 Casing

- Types/interfaces/classes: `PascalCase`
- Values/functions/properties: `camelCase`
- Custom elements: kebab-case with `-v3` suffix (for example, `steelseries-radial-v3`)

### 3.2 Boolean Names

- Public booleans must be positive (`showFrame`, `showBackground`, `showForeground`).
- Legacy `no*` boolean names are not allowed in v3 public APIs.

### 3.3 Domain Terms

- Use explicit domain names over abbreviations (`heading`, `threshold`, `animationDurationMs`).
- Prefer gauge-agnostic shared terms where possible (`value`, `range`, `theme`, `visibility`).

## 4) Configuration Shape Conventions

### 4.1 Grouped Configuration

Public configs should use grouped sections for readability and reuse:

- `size` (dimensions)
- `value` (current/min/max)
- `animation` (enabled, duration, easing)
- `text` (title, unit, labels)
- `visibility` (frame/background/foreground/lcd)
- `theme` (token-resolved visual properties)
- `indicators` (thresholds, alerts, markers)

### 4.2 Shared + Variant Types

- Shared primitives live in `core` and are reused by all gauge configs.
- Variant configs add only type-specific fields:
  - `RadialGaugeConfig`
  - `LinearGaugeConfig`
  - `CompassGaugeConfig`

## 5) Defaults and Fallback Behavior

- Defaults are explicit and stable.
- Omitted optional fields must resolve to documented defaults.
- CSS token reads must include local fallback values.
- Missing optional visual settings must never crash rendering.

## 6) Validation and Error Semantics

- External config entry points are validated with `zod` at boundaries.
- Validation failures return actionable, structured errors.
- Do not silently coerce invalid values except where explicitly documented.
- Internal rendering code may assume normalized, typed input.

## 7) Import and Boundary Rules

- No deep imports across workspace package internals.
- Public consumers use package exports only.
- `ha-cards` contains Home Assistant-specific behavior.
- `core` remains framework-agnostic and HA-agnostic.

## 8) Behavioral Consistency Requirements

- Equivalent settings must behave equivalently across gauges.
- Animation timing/easing semantics are shared.
- Visibility flags mean the same thing across gauge families.
- Event names and error semantics should be normalized before Phase 3 API freeze.

## 9) Legacy Mapping Policy

- Legacy compatibility is handled by mapping/adapter layers, not by polluting v3 public APIs.
- Legacy enum-object patterns map to typed unions.
- Legacy animated `real_*` fields are internal renderer state only.

## 10) Documentation and Change Control

- Any public API change must update docs and tests in the same change.
- User-visible API changes require a changeset and semver-appropriate versioning.
- Breaking changes are not allowed after Phase 3 API freeze without explicit reopen decision.
