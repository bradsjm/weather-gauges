# Gauge Consistency and Reuse Plan

## Scope

This plan covers all fixes identified in the review of compass, wind-direction, and radial-bargraph gauge code across:

- `packages/core` schemas and renderers
- `packages/elements` web components
- shared utilities, tests, and docs

Goals:

- remove inconsistent behavior across equivalent gauge capabilities
- close incomplete/partially wired features in elements vs core schemas
- increase reuse of shared functionality without API regressions
- preserve strict TypeScript and Zod validation

Non-goals:

- broad visual redesign
- Home Assistant card feature expansion beyond gauge parity

## Findings Covered By This Plan

1. Compass schema historically diverges from shared base pattern.
2. Alert defaults and schema conventions were inconsistent across gauges.
3. Wind-direction and radial-bargraph element APIs are missing schema-backed features.
4. Core and element layers duplicate common lifecycle/event/canvas logic.
5. Canvas access and default behavior patterns are inconsistent across elements.
6. Some renderer utilities can be consolidated for maintainability.

## Phase 0: Baseline and Safety Net

### Objective

Freeze current behavior and define compatibility expectations before broader refactors.

### Work

1. Record current public option surfaces for all three elements.
2. Add/expand regression tests for key parse defaults and render entrypoints.
3. Capture event behavior (`value-change`, error event semantics) for parity checks.

### Exit Criteria

- Baseline tests fail on behavior drift introduced by subsequent phases.

## Phase 1: Compass Shared Enum Adoption

### Objective

Use shared radial enum schemas in compass while preserving compass exports.

### Work

1. In `packages/core/src/compass/schema.ts`, alias compass enums to:
   - `radialFrameDesignSchema`
   - `radialBackgroundColorSchema`
   - `radialForegroundTypeSchema`
   - `radialPointerColorSchema`
2. Keep existing exported compass schema/type names for compatibility.

### Exit Criteria

- No import breakage in existing compass consumers.

## Phase 2: Compass Base Config Alignment

### Objective

Align compass config composition with `sharedGaugeConfigSchema` architecture.

### Work

1. Refactor `compassGaugeConfigSchema` to `sharedGaugeConfigSchema.extend({...})`.
2. Preserve existing compass defaults for animation/visibility/text where behavior matters.
3. Keep `.strict()` contract and heading range validation semantics.

### Exit Criteria

- Parsed compass config shape remains compatible with renderer/element call sites.

## Phase 3: Alert Schema Standardization

### Objective

Unify alert severity default behavior across all three gauges.

### Work

1. Ensure each alert schema uses:
   - `severity: z.enum(['info', 'warning', 'critical']).default('warning')`
2. Keep domain field differences:
   - heading-based alerts: compass, wind-direction
   - value-based alerts: radial-bargraph

### Exit Criteria

- Omitted severity consistently parses to `warning` in all schemas.

## Phase 4: Element API Parity (Incomplete Feature Wiring)

### Objective

Expose core-supported options in web components that currently omit them.

### Work

1. Wind-direction element (`packages/elements/src/components/wind-direction-element.ts`):
   - add properties and config mapping for `sections`, `areas`
   - add property support for `knobType`, `knobStyle`
   - add property support for `customLayer`
2. Radial-bargraph element (`packages/elements/src/components/radial-bargraph-element.ts`):
   - add property support for `valueGradientStops`
   - allow section definitions via properties (not only CSS-derived defaults)
3. Compass element (`packages/elements/src/components/compass-element.ts`):
   - verify/align readout options with core config fields

### Exit Criteria

- Every schema-backed option intended for public use is reachable from element API.

## Phase 5: Shared Element Base Class Extraction

### Objective

Remove repeated Lit element boilerplate shared by all gauge elements.

### Work

1. Introduce shared base class in `packages/elements/src/shared/` for:
   - canvas lookup/context creation
   - animation handle lifecycle management
   - value-change and error event helpers
   - common update/render guards
2. Migrate compass, wind-direction, radial-bargraph elements onto base class incrementally.
3. Keep existing tag names/events/attributes stable.

### Exit Criteria

- Behavior parity retained while duplicate lifecycle logic is reduced.

## Phase 6: Renderer Utility Consolidation

### Objective

Increase reuse in core renderer logic without changing visual output.

### Work

1. Evaluate shared alert resolution wrapper for heading/value variants.
2. Consolidate repeated LCD layout/draw helper patterns where safe.
3. Standardize heading normalization and scale helper usage paths.

### Exit Criteria

- No render regressions in existing visual and unit tests.

## Phase 7: Defaults and Behavioral Consistency

### Objective

Decide and document intentional vs accidental behavior differences.

### Work

1. Align or document default sizes (`200` vs `220`) across radial-style gauges.
2. Standardize canvas lookup style (`@query('canvas')`) across elements.
3. Normalize title/unit fallback handling patterns where feasible.

### Exit Criteria

- Intentional differences are documented; accidental ones are removed.

## Phase 8: Test Expansion

### Objective

Protect cross-gauge consistency contracts going forward.

### Work

1. Add schema parse tests for all shared default expectations.
2. Add element tests for newly wired properties and emitted events.
3. Add targeted renderer tests for shared utility behavior.

### Exit Criteria

- New tests fail if consistency contracts regress.

## Phase 9: Docs, Changelog, and Release Readiness

### Objective

Finalize public-facing clarity and release hygiene.

### Work

1. Update docs in affected packages for newly exposed element properties.
2. Add migration notes if any behavior/default changes are user-visible.
3. Create changeset(s) for user-visible changes.

### Exit Criteria

- Documentation and release notes match shipped behavior.

## Recommended Implementation Order

1. Phase 0
2. Phase 1-3 (schema fixes)
3. Phase 4 (API completeness)
4. Phase 5 (element base extraction)
5. Phase 6-7 (shared renderer/util and behavior normalization)
6. Phase 8-9 (tests/docs/release)

## Validation Commands

During iteration:

- `pnpm --filter @bradsjm/steelseries-v3-core typecheck`
- `pnpm --filter @bradsjm/steelseries-v3-core test`
- `pnpm --filter @bradsjm/steelseries-v3-elements typecheck`
- `pnpm --filter @bradsjm/steelseries-v3-elements test`

Before merge:

- `pnpm typecheck && pnpm build && pnpm test`

## Risks and Mitigations

- Risk: export/type alias breakage from schema consolidation.
  - Mitigation: preserve existing export names and add compatibility tests.

- Risk: subtle default changes from shared schema adoption.
  - Mitigation: lock defaults with explicit parse tests before/after.

- Risk: element API growth increases maintenance complexity.
  - Mitigation: phase with shared base class and strict property typing.

- Risk: renderer refactors change visuals unintentionally.
  - Mitigation: preserve draw order; rely on visual/renderer tests for parity.

## Definition of Done

- All phases completed or explicitly deferred with rationale.
- Public API parity achieved for core schema features exposed via elements.
- Cross-gauge consistency rules are enforced by tests.
- Typecheck/build/test pass at root.
