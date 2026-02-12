# Architecture Remediation TODO

This checklist focuses on improving re-use, reducing coupling, and making future gauge additions easier.

## 1) Schema Duplication & Bloat

- [x] Inventory duplicated enums and config shapes across `compass`, `radial`, `radial-bargraph`, and `wind-direction` schemas.
- [x] Extract shared frame-related schemas into `packages/core/src/schemas/frame.ts` (design, visibility, effect, text placement).
- [x] Extract shared background-related schemas into `packages/core/src/schemas/background.ts` (color presets, texture/options).
- [x] Extract shared pointer-related schemas into `packages/core/src/schemas/pointer.ts` (pointer type/color/family constraints).
- [x] Refactor gauge schemas to compose from shared schema modules instead of redefining similar fields.
- [x] Normalize naming so equivalent concepts use one canonical field name across all gauges.
- [x] Add/expand `superRefine` cross-field validation rules where duplicated ad-hoc validation currently exists.
- [x] Add schema-focused unit tests that assert shared schema behavior is consistent for every gauge.
- [x] Ensure all schema modules remain `.strict()` and preserve existing defaults/backward compatibility.

## 2) Render Function Coupling

- [x] Map current renderer import graph and identify cross-gauge dependencies (especially `compass` -> `radial`).
- [x] Move truly shared rendering logic into neutral modules under `packages/core/src/render/`.
- [x] Introduce a common render pipeline helper (`drawFrame`, `drawBackground`, `drawContent`, `drawForeground`) to reduce repeated orchestration.
- [x] Remove gauge-to-gauge renderer imports; gauges should depend on shared utilities, not sibling gauge renderers.
- [x] Define clear renderer contracts for shared helpers (input context, config fragments, and return types).
- [x] Add tests around shared renderer helpers to prevent regressions during gauge-specific refactors.
- [ ] Keep gauge renderers thin by delegating non-domain-specific drawing to shared render modules.
- [x] Verify no circular dependencies exist after refactor.

## 3) Hardcoded Magic Values

- [x] Audit hardcoded numeric ratios/constants in renderers (geometry, offsets, font scales, stroke widths).
- [x] Extract constants into per-gauge `constants.ts` files with descriptive names and units/purpose.
- [ ] Promote cross-gauge constants into shared render constants where values are intentionally identical.
- [x] Replace string-literal mode switches (e.g. pointer family values) with typed enums or discriminated unions.
- [ ] Introduce optional config overrides for selected layout constants that users may need to tune.
- [ ] Add guardrails (schema validation or clamping) for any new configurable constants.
- [ ] Add visual regression checks for critical gauges after constant extraction.
- [x] Document the intent and expected ranges for non-obvious constants.

## 4) Execution Plan

- [x] Phase 1: Extract shared schemas + migrate one gauge as a proving pass.
- [x] Phase 2: Decouple renderers and introduce shared render pipeline helpers.
- [x] Phase 3: Extract and type constants; remove magic strings.
- [x] Phase 4: Run full validation: `pnpm typecheck && pnpm build && pnpm test`.
- [x] Phase 5: Update docs on gauge authoring guidelines for future additions.
