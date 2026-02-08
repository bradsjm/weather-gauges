# SteelSeries v3 Technical Architecture

## 1) Purpose

Rebuild the legacy SteelSeries gauge library as a modern, typed, maintainable platform while preserving the quality of gauge visuals and behavior.

Primary outcomes:

- Strongly typed v3 API (clean break from legacy naming/model)
- Library-first architecture for reuse beyond Home Assistant
- Web Components implementation optimized for Home Assistant cards
- Themeability through CSS custom properties
- Reliable quality via unit, integration, and visual regression testing

## 2) Scope

This document defines architecture for the monorepo and implementation direction, with execution scope focused on phases 0-3:

- Phase 0: repo/platform foundation
- Phase 1: core rendering engine foundation
- Phase 2: radial gauge vertical slice
- Phase 3: linear and compass gauges + API consistency hardening

Out-of-scope for phases 0-3:

- Full Home Assistant card editor UX
- Complete gauge catalog parity with legacy
- Legacy runtime compatibility layer

## 3) Design Principles

- **Visual fidelity first:** maintain high-quality visuals and behavior
- **Typed contracts first:** strict TypeScript + schema validation
- **Separation of concerns:** rendering engine separated from UI wrappers
- **Deterministic rendering:** predictable outputs for visual regression
- **Stable public API:** explicit surface and compatibility policy
- **Framework-agnostic core:** core package has no Lit/Home Assistant dependency

## 4) Monorepo Structure

Namespace: `@bradsjm`

Planned workspace layout:

```text
.
├── docs/
│   ├── ARCHITECTURE.md
│   └── PLAN.md
├── packages/
│   ├── core/                  # @bradsjm/steelseries-v3-core
│   ├── elements/              # @bradsjm/steelseries-v3-elements
│   ├── ha-cards/              # @bradsjm/steelseries-v3-ha-cards
│   ├── docs-site/             # @bradsjm/steelseries-v3-docs
│   └── test-assets/           # @bradsjm/steelseries-v3-test-assets
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .changeset/
└── .github/workflows/
```

### Package responsibilities

1. `@bradsjm/steelseries-v3-core`
   - Gauge math, scales, geometry
   - Animation timeline/scheduler
   - Canvas rendering pipeline and buffer orchestration
   - Shared v3 config schemas and type contracts

2. `@bradsjm/steelseries-v3-elements`
   - Lit-based custom elements
   - Typed property/event API
   - CSS custom property contract implementation
   - Thin adaptation over core renderer

3. `@bradsjm/steelseries-v3-ha-cards`
   - Home Assistant Lovelace card wrappers
   - `setConfig`, `hass`, size/grid integration
   - Entity-to-gauge mapping
   - HACS packaging metadata

4. `@bradsjm/steelseries-v3-docs`
   - Interactive docs and examples
   - API references and migration guides
   - Theming playground

5. `@bradsjm/steelseries-v3-test-assets`
   - Canonical fixture configurations
   - Golden images for visual regression
   - Shared test helpers

## 5) Technology Decisions

- **Language:** TypeScript (strict mode)
- **UI wrappers:** Lit Web Components
- **Rendering:** Canvas 2D + offscreen buffers where beneficial
- **Validation:** zod schemas for config parsing/guardrails
- **Build:** Vite (library mode) + declaration generation
- **Tests:** Vitest (logic) + Playwright (visual regression)
- **Monorepo:** pnpm workspaces + turbo
- **Release:** changesets + npm publish under `@bradsjm`

## 6) v3 API Model (Clean Break)

The v3 API intentionally does not preserve legacy names or quirks.

### API goals

- Consistent naming across all gauges
- Positive booleans only (`showFrame`, not `noFrame`)
- Shared primitives across gauge types
- Variant-specific options clearly isolated

### Core config primitives (conceptual)

```ts
type GaugeValue = {
  value: number
  min: number
  max: number
}

type GaugeAnimation = {
  enabled: boolean
  durationMs: number
  easing: 'linear' | 'cubicInOut'
}

type GaugeTheme = {
  palette?: {
    background?: string
    foreground?: string
    accent?: string
    warning?: string
    danger?: string
  }
}
```

### Gauge variant model

- `RadialGaugeConfig`
- `LinearGaugeConfig`
- `CompassGaugeConfig`

Variant schemas are validated with zod and composed from shared primitives.

## 7) Rendering Architecture

Rendering is split into deterministic stages:

1. **Parse + validate config** (zod)
2. **Normalize state** (defaults, clamping, derived values)
3. **Compute geometry/scales** (angles, ticks, needle position)
4. **Build/reuse static layers** (frame, background, static marks)
5. **Render dynamic layers** (needle, active value, alerts, indicators)
6. **Composite layers to visible canvas**
7. **Animate via scheduler** when values/config change

Key constraints:

- Avoid full static redraw when only dynamic layers change
- Respect reduced-motion preferences
- Keep render path deterministic for screenshot tests

## 8) CSS Custom Property Contract

Theming is driven by host-level CSS variables (with defaults).

Example token families:

- `--ss3-font-family`
- `--ss3-text-color`
- `--ss3-background-color`
- `--ss3-frame-color`
- `--ss3-accent-color`
- `--ss3-warning-color`
- `--ss3-danger-color`

Rules:

- Tokens are documented as public API
- Element-level defaults provided in Shadow DOM
- HA themes can override tokens on host/card container
- Internal canvas style values are resolved from computed styles

## 9) Home Assistant Integration Strategy

Library-first remains the primary architecture. HA-specific behavior is implemented in adapters without contaminating core.

Integration points:

- `setConfig(config)` validates and stores card config
- `hass` updates map entity state to gauge input values
- `getCardSize()` and `getGridOptions()` for layout behavior
- Optional config editor support can be layered in later phases

## 10) Quality and Governance

CI gates required for merge:

- Lint
- Typecheck
- Unit tests
- Visual regression checks
- Build and package integrity

Additional controls:

- API report diff in PRs for public-package changes
- Bundle size budgets for `core` and `elements`
- Semver managed with changesets

## 11) Risks and Mitigations

1. **Visual drift from legacy**
   - Mitigation: fixture parity tests + approved goldens

2. **API inconsistency between gauges**
   - Mitigation: shared schema primitives + contract tests

3. **Performance regressions during animation**
   - Mitigation: render-layer caching + benchmark tests

4. **HA coupling leaking into core**
   - Mitigation: strict package dependency boundaries

## 12) Deliverables by End of Phase 3

- Stable alpha-level packages for:
  - `@bradsjm/steelseries-v3-core`
  - `@bradsjm/steelseries-v3-elements`
- Implemented gauges:
  - Radial
  - Linear
  - Compass
- Documented CSS token contract
- Migration guidance (legacy concepts to v3 clean-break model)
- CI-enforced quality gates and reproducible visual baselines
