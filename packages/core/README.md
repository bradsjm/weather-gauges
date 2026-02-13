# @bradsjm/weather-gauges-core

Framework-agnostic typed rendering core for Weather Gauges.

## Gauge Authoring Guidelines

- Keep new gauge configuration schema-first with Zod and `.strict()` objects.
- Compose shared schemas from `src/schemas/frame.ts`, `src/schemas/background.ts`, and `src/schemas/pointer.ts` before introducing gauge-local enums.
- Put cross-field constraints in `superRefine` at the nearest schema boundary where intent is clear.
- Keep renderers thin and orchestrate rendering through `runGaugeRenderPipeline` from `src/render/pipeline.ts`.
- Keep gauge math constants in a local `constants.ts`; only promote values into shared render constants when they are intentionally identical across gauges.
- Use typed mode/value contracts (for example `gaugePointerFamily`) instead of string literals.
- Add tests for schema contracts and shared render helpers when behavior changes.
