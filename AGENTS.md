# AGENTS.md
Guidance for agentic coding tools working in this repository.

## 1) Repository Overview
- Monorepo managed with `pnpm` workspaces and `turbo`
- TypeScript strict mode, ESM modules, browser-first targets
- Architecture reference document `docs/ARCHITECTURE.md`
- Primary implementation reference in `docs/RESEARCH.md`
- Legacy SteelSeries v2 reference repository at `https://github.com/nicolas-van/steelseries/`
- Packages:
  - `@bradsjm/steelseries-v3-core`
  - `@bradsjm/steelseries-v3-elements`
  - `@bradsjm/steelseries-v3-ha-cards`
  - `@bradsjm/steelseries-v3-docs` (private)
  - `@bradsjm/steelseries-v3-test-assets`

## 2) Environment
- Node.js: `>=20`
- Package manager: `pnpm@9.15.0`
- Run commands from repo root unless package-scoping intentionally

## 3) Install and Bootstrap
- Install dependencies: `pnpm install`
- CI-style install: `pnpm install --frozen-lockfile`

## 4) Root Commands
- Build all packages: `pnpm build`
- Lint all packages: `pnpm lint`
- Typecheck all packages: `pnpm typecheck`
- Run all tests: `pnpm test`
- Run visual test graph: `pnpm test:visual`
- Run dev tasks in parallel: `pnpm dev`
- Format all supported files: `pnpm format`
- Clean workspace artifacts: `pnpm clean`

## 5) Package-Scoped Commands
Use `pnpm --filter <package-name> <script>`.
- Core build: `pnpm --filter @bradsjm/steelseries-v3-core build`
- Elements typecheck: `pnpm --filter @bradsjm/steelseries-v3-elements typecheck`
- HA cards lint: `pnpm --filter @bradsjm/steelseries-v3-ha-cards lint`
- Docs dev server: `pnpm --filter @bradsjm/steelseries-v3-docs dev`
- Test-assets tests: `pnpm --filter @bradsjm/steelseries-v3-test-assets test`

## 6) Running a Single Test (Important)
Package scripts use `vitest run --passWithNoTests` by default.
For single tests, call Vitest directly via `pnpm exec`.

### Single test file
- `pnpm --filter @bradsjm/steelseries-v3-core exec vitest run src/foo.test.ts`

### Single named test case
- `pnpm --filter @bradsjm/steelseries-v3-core exec vitest run src/foo.test.ts -t "clamps max value"`

### Pattern match
- `pnpm --filter @bradsjm/steelseries-v3-elements exec vitest run --include "src/**/*.test.ts"`

### Watch mode for one file
- `pnpm --filter @bradsjm/steelseries-v3-core exec vitest src/foo.test.ts`

## 7) Turbo Behavior
- `build` depends on upstream `^build` and caches `dist/**`
- `typecheck` depends on upstream `^typecheck`
- `test` and `test:visual` depend on upstream builds
- Prefer root-level full validation before merging

## 8) TypeScript Standards
Do not weaken strictness to make builds pass.
- Keep strict flags enabled:
  - `strict`
  - `noImplicitAny`
  - `noImplicitOverride`
  - `exactOptionalPropertyTypes`
  - `noUncheckedIndexedAccess`
- Keep modern module settings:
  - `module: ESNext`
  - `moduleResolution: Bundler`
  - `moduleDetection: force`
  - `verbatimModuleSyntax: true`
- Use `unknown` + narrowing instead of `any`
- Use runtime validation (`zod`) at config boundaries

## 9) Imports and Module Boundaries
- Import order:
  1. External packages
  2. Workspace package imports
  3. Relative imports
- Use type-only imports where applicable (`import type`)
- Respect package `exports`; do not deep-import internals
- Keep cross-package dependencies one-directional per architecture docs

## 10) Formatting and Linting
Prettier is canonical:
- no semicolons
- single quotes
- no trailing commas
- print width 100

ESLint highlights:
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/consistent-type-imports`: error

## 11) Naming Conventions
- Types/interfaces/classes: `PascalCase`
- Variables/functions/properties: `camelCase`
- Element tags: kebab-case (for v3 use `*-v3` suffix)
- Prefer positive booleans (`showFrame`) over negative forms (`noFrame`)
- Keep public API names explicit and domain-oriented

## 12) Error Handling
- Validate external input early
- Throw actionable errors with context
- Never silently swallow errors
- In UI layers, fail safely and keep rendering stable where possible
- In pure core logic, prefer typed return states for expected failures

## 13) Web Component / Lit Guidance
- Keep components thin; move heavy logic to `core`
- Use CSS custom properties for theming contract (`--ss3-*`)
- Guard custom element registration if definition may run more than once
- Prefer DOM APIs over unsafe HTML string assembly when practical

## 14) Home Assistant Guidance
- Keep HA-specific logic in `ha-cards` package only
- Maintain required lifecycle shape:
  - `setConfig(config)`
  - `hass` setter
  - `getCardSize()`
  - `getGridOptions()`
- Keep entity mapping typed and validated
- Avoid HA dependency leakage into `core`

## 15) Testing Expectations Before Merge
- Minimum full check: `pnpm typecheck && pnpm build && pnpm test`
- Add tests for changed behavior in `core`
- Update `test-assets` fixtures when render output changes
- Run `pnpm test:visual` for visual-impacting changes

## 16) Release Workflow
- Create changeset for user-visible changes: `pnpm changeset`
- Version packages: `pnpm version-packages`
- Publish packages: `pnpm release`

## 17) Agent Checklist
1. Read relevant package scripts before introducing new commands.
2. Keep changes minimal, typed, and package-scoped.
3. Run targeted checks during iteration; run full root checks before finishing.
4. Update docs when changing APIs, workflows, or conventions.
