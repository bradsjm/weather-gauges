# AGENTS.md

Operational guidance for agentic coding tools in this repository.
Goal: make correct, minimal, well-tested changes that match repo conventions.

## Repository Shape

- Monorepo: `pnpm` workspaces (`packages/*`) + `turbo`
- Language/runtime: TypeScript (strict), ESM, browser-first targets
- Packages:
  - `@bradsjm/weather-gauges-core` (renderer + schemas + gauge logic)
  - `@bradsjm/weather-gauges-elements` (Lit web components)
  - `@bradsjm/weather-gauges-ha-cards` (Home Assistant card wrappers)
  - `@bradsjm/weather-gauges-docs` (private docs/playground, Vite)
- Legacy reference: `https://github.com/nicolas-van/steelseries/`

## Agent Rule Files

- Cursor rules: none detected (`.cursor/rules/**`, `.cursorrules` absent)
- Copilot rules: none detected (`.github/copilot-instructions.md` absent)

## Environment

- Node.js: `>=20`
- Package manager: `pnpm@10.29.3` (see root `package.json`)
- Run commands from repo root unless intentionally package-scoping

## Install

- Install: `pnpm install`
- CI-style install: `pnpm install --frozen-lockfile`

## Standard Commands (Root)

- Build all packages: `pnpm build` (Turbo; caches `dist/**`)
- Lint all packages: `pnpm lint`
- Typecheck all packages: `pnpm typecheck`
- Test all packages: `pnpm test` (depends on upstream builds)
- Dev (parallel): `pnpm dev` (persistent, uncached)
- Format: `pnpm format` (Prettier)
- Clean: `pnpm clean` (Turbo clean + removes root `node_modules`; destructive)

## Package-Scoped Commands

Use: `pnpm --filter <package> <script>`

- Core build: `pnpm --filter @bradsjm/weather-gauges-core build`
- Elements typecheck: `pnpm --filter @bradsjm/weather-gauges-elements typecheck`
- HA cards lint: `pnpm --filter @bradsjm/weather-gauges-ha-cards lint`
- Docs dev server: `pnpm --filter @bradsjm/weather-gauges-docs dev`

## Running Tests

Notes:

- Package scripts run `vitest run --passWithNoTests`.
- For single files or selecting tests, call Vitest directly via `pnpm ... exec vitest ...`.
- Tests live under `packages/*/test/*.test.ts`.

Single test file:

```bash
pnpm --filter @bradsjm/weather-gauges-core exec vitest run test/render-pipeline.test.ts
```

Single named test:

```bash
pnpm --filter @bradsjm/weather-gauges-core exec vitest run test/render-pipeline.test.ts -t "clamps max value"
```

Pattern match (include):

```bash
pnpm --filter @bradsjm/weather-gauges-elements exec vitest run --include "test/**/*.test.ts"
```

Watch one file:

```bash
pnpm --filter @bradsjm/weather-gauges-core exec vitest test/render-pipeline.test.ts
```

Visual tests:

- Some packages have `test:visual` (outputs `test-results/**`, `playwright-report/**`).
- Only mark visual checks “passing” after actually viewing/reviewing the output.

## Code Style (Repo-Wide)

Formatting:

- Prettier is canonical (see `.prettierrc.json`):
  - `semi: false`, `singleQuote: true`, `trailingComma: none`, `printWidth: 100`
- Do not hand-format around Prettier; run `pnpm format` when in doubt.

Linting:

- ESLint uses flat config (`eslint.config.mjs`). Key rules:
  - No `any`: `@typescript-eslint/no-explicit-any` (error)
  - Use type-only imports where applicable: `@typescript-eslint/consistent-type-imports` (error)
  - Unused vars disallowed; prefix intentionally-unused values with `_`.

Imports:

- Order:
  1. External packages
  2. Workspace packages (`@bradsjm/...`)
  3. Relative imports
- Prefer `import type { ... } from '...'` for types.
- Respect package boundaries and `exports`; do not deep-import `src/**` of another package.

TypeScript:

- Keep strictness; do not weaken flags to “make it pass”. This repo relies on:
  - `strict`, `noImplicitAny`, `noImplicitOverride`
  - `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
  - ESM/bundler settings (`module: ESNext`, `moduleResolution: Bundler`, `verbatimModuleSyntax: true`)
- Prefer `unknown` + narrowing over `any`.
- Validate config boundaries with runtime schemas (Zod) rather than trusting external input.

Naming:

- Types/interfaces/classes: `PascalCase`
- Functions/vars/properties: `camelCase`
- Files: prefer `kebab-case.ts` or `camelCase.ts` matching local conventions; keep consistent within a folder.
- Custom element tags: kebab-case with `wx-` prefix (public API).
- Prefer positive booleans: `showFrame` (not `noFrame`).

Error handling:

- Validate early; fail with actionable, contextual errors.
- Never silently swallow errors.
- UI layers: fail safely and keep rendering stable where possible.
- Core logic: prefer typed “expected failure” states when appropriate; throw for programmer errors.

## Architecture Boundaries

- Keep heavy/complex logic in `@bradsjm/weather-gauges-core`.
- `@bradsjm/weather-gauges-elements` should be thin wrappers (properties/attributes/events + rendering orchestration).
- Home Assistant specifics stay in `@bradsjm/weather-gauges-ha-cards` only.
- Avoid HA dependency leakage into `core`.

Zod schemas (core):

- New configs should be schema-first; use `z.object(...).strict()`.
- Compose shared schemas before adding gauge-local enums/options.
- Put cross-field constraints in `superRefine` at the nearest schema boundary.

## Web Components / Lit Guidance

- Use CSS custom properties for theming (`--wx-*`).
- Guard `customElements.define(...)` if code can run more than once.
- Prefer DOM APIs over unsafe HTML string assembly.

## Definition Of Done (Before Hand-Off)

- Local checks pass: `pnpm lint && pnpm typecheck && pnpm build && pnpm test`
- Behavior changes have tests (typically in `packages/core/test/**`).
- Public API changes include docs/example updates where applicable.

## Release Notes (Changesets)

- User-visible changes should include a changeset: `pnpm changeset`.
- Version: `pnpm version-packages`; publish: `pnpm release`.
- Changesets config uses `baseBranch: main` and does not auto-commit (`commit: false`).
