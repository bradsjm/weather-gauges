# SteelSeries v3 Delivery Plan (Phases 0-3)

Namespace: `@bradsjm`  
Monorepo: `pnpm` workspaces + `turbo`  
Architecture model: library-first, clean-break v3 API, CSS custom properties

## 1) Milestone Overview

- **Phase 0 - Foundation:** monorepo, tooling, CI, release plumbing, docs skeleton
- **Phase 1 - Core Engine:** typed schemas, rendering primitives, animation scheduler, core package alpha
- **Phase 2 - Radial Slice:** first end-to-end gauge from core -> element -> docs -> tests
- **Phase 3 - Expand + Harden:** linear and compass gauges, cross-gauge consistency, API freeze prep

## 2) Backlog

### Progress Tracker (updated by implementation)

| ID    | Status   | Notes                                                                                                                                       |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 | Complete | Monorepo packages + workspace scripts are in place.                                                                                         |
| P0-02 | Complete | Strict TypeScript baseline is configured across packages.                                                                                   |
| P0-03 | Complete | ESLint/Prettier/typecheck scripts are active.                                                                                               |
| P0-04 | Complete | CI runs lint, typecheck, test, and build checks.                                                                                            |
| P0-05 | Complete | Changesets and release/version scripts are configured.                                                                                      |
| P0-06 | Complete | API conventions are documented in `docs/API_CONVENTIONS.md`.                                                                                |
| P0-07 | Complete | CSS token contract v1 is documented in `docs/CSS_TOKENS.md` and consumed by the radial sample element.                                      |
| P0-08 | Complete | Docs/playground package and app shell are bootstrapped.                                                                                     |
| P0-09 | Complete | Playwright-based fixture + screenshot baseline pipeline is implemented and wired to CI.                                                     |
| P1-01 | Complete | Shared zod schema modules are implemented in `packages/core/src/schemas`, with structured validation helpers and unit tests.                |
| P1-02 | Complete | Math and scale primitives are implemented in `packages/core/src/math` with edge-case tests in `packages/core/test/math-primitives.test.ts`. |
| P1-03 | Complete | Animation timeline, easing, and scheduler modules are implemented in `packages/core/src/animation` with fake-timer transition tests.        |
| P1-04 | Complete | Render context abstraction is implemented in `packages/core/src/render/context.ts` with canvas/offscreen strategy and deterministic tests.  |

## Phase 0 - Foundation

| ID    | Task                                             | Deliverable                                    | Acceptance Criteria                                     | Dependencies |
| ----- | ------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------- | ------------ |
| P0-01 | Create monorepo skeleton with package workspaces | `packages/*`, workspace config, shared scripts | `pnpm -r build` and `pnpm -r test` run on clean clone   | None         |
| P0-02 | Configure strict TypeScript baseline             | `tsconfig.base.json` + per-package extends     | strict compile succeeds, no implicit `any` allowed      | P0-01        |
| P0-03 | Establish lint/format/typecheck standards        | ESLint, Prettier, root scripts                 | CI fails on lint/type violations                        | P0-01        |
| P0-04 | Set up CI pipeline and required checks           | GitHub workflow(s) for lint/type/test/build    | PR checks are required and reproducible                 | P0-02, P0-03 |
| P0-05 | Add release/version management                   | changesets config + publish scripts            | version PR and npm publish dry-run work                 | P0-01        |
| P0-06 | Define v3 API conventions document               | Naming/default/behavior standard doc           | conventions approved before gauge implementation        | P0-02        |
| P0-07 | Define CSS custom property contract v1           | token list + fallback semantics                | documented tokens consumed by sample component          | P0-06        |
| P0-08 | Bootstrap docs/playground                        | docs app shell with example component mount    | docs run locally and in CI preview                      | P0-01        |
| P0-09 | Bootstrap visual regression harness              | fixture format + baseline generation scripts   | screenshot test pipeline generates and compares goldens | P0-08        |

## Phase 1 - Core Engine

| ID    | Task                                 | Deliverable                                            | Acceptance Criteria                                    | Dependencies |
| ----- | ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------ | ------------ |
| P1-01 | Implement shared zod config schemas  | schema modules for shared primitives                   | invalid input returns structured errors and messages   | P0-06        |
| P1-02 | Implement math and scale primitives  | clamp/normalize/range/tick geometry modules            | edge-case unit tests pass                              | P1-01        |
| P1-03 | Implement animation scheduler        | timeline module with easing and timing controls        | fake-timer tests verify transitions                    | P1-02        |
| P1-04 | Implement render context abstraction | canvas context + offscreen buffer strategy             | deterministic behavior in test env and browser         | P1-02        |
| P1-05 | Implement theme resolution pipeline  | CSS-token to typed-paint resolver                      | token overrides change rendered outputs predictably    | P0-07, P1-04 |
| P1-06 | Define extension interfaces          | typed hook points for overlays/markers/needle variants | extension sample compiles without internal imports     | P1-01        |
| P1-07 | Publish core alpha contract          | `@bradsjm/steelseries-v3-core` alpha release           | API report reviewed and baseline frozen for next phase | P1-01..P1-06 |

## Phase 2 - Radial Gauge Vertical Slice

| ID    | Task                                       | Deliverable                                   | Acceptance Criteria                                | Dependencies |
| ----- | ------------------------------------------ | --------------------------------------------- | -------------------------------------------------- | ------------ |
| P2-01 | Build radial renderer in core              | radial draw pipeline using v3 config          | supports ticks/segments/threshold/alerts/animation | P1-07        |
| P2-02 | Build Lit radial element                   | `<steelseries-radial-v3>` custom element      | prop updates re-render correctly and efficiently   | P2-01        |
| P2-03 | Apply CSS token contract to radial wrapper | themed host and label styling                 | token overrides documented and demoed              | P0-07, P2-02 |
| P2-04 | Add radial fixture + golden suite          | canonical fixture configs and baseline images | CI screenshot diff check passes on stable baseline | P0-09, P2-01 |
| P2-05 | Add radial performance checks              | benchmark script and budget thresholds        | frame/render budget is within agreed limits        | P2-01        |
| P2-06 | Publish radial docs and examples           | API docs + minimal/full/high-update examples  | docs include copy-ready examples and caveats       | P2-02, P2-03 |

## Phase 3 - Linear and Compass + Hardening

| ID    | Task                                  | Deliverable                                        | Acceptance Criteria                                 | Dependencies        |
| ----- | ------------------------------------- | -------------------------------------------------- | --------------------------------------------------- | ------------------- |
| P3-01 | Build linear renderer + element       | core linear renderer + `<steelseries-linear-v3>`   | shared primitives reused with no undocumented drift | P1-07               |
| P3-02 | Build compass renderer + element      | core compass renderer + `<steelseries-compass-v3>` | heading/rose behavior validated with tests          | P1-07               |
| P3-03 | Normalize cross-gauge contracts       | unified event names/defaults/error semantics       | contract tests pass across radial/linear/compass    | P2-06, P3-01, P3-02 |
| P3-04 | Expand visual regression coverage     | fixture sets for linear + compass themes           | CI stable across all three gauges                   | P3-01, P3-02        |
| P3-05 | Author migration guide (legacy -> v3) | mapping doc with examples and rationale            | includes at least 10 conversion examples            | P3-03               |
| P3-06 | Freeze Phase 0-3 API and cut RC       | release candidate notes + tagged versions          | API diff clean and RC packages publish successfully | P3-03, P3-04, P3-05 |

## 3) Sequencing Notes

- Phase 1 begins only after API conventions and token contract are approved.
- Radial (phase 2) is the reference implementation for all quality gates.
- Linear and compass must pass the same contract/visual/performance standards before RC.

## 4) Done Criteria for Phase 0-3

- Core and elements packages are publishable under `@bradsjm`.
- Three gauges are implemented (`radial`, `linear`, `compass`) with typed v3 APIs.
- CSS custom property contract is documented and tested in real examples.
- CI enforces lint/type/unit/visual gates.
- Legacy migration documentation exists for adopters.

## 5) Deferred to Later Phases

- Complete Home Assistant card productization and advanced editor UX
- Full legacy gauge catalog parity
- Additional rendering enhancements and optional plugin ecosystem
