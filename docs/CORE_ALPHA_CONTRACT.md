# Core Alpha Contract (`@bradsjm/steelseries-v3-core`)

Status: Reviewed and frozen for Phase 2 start

## Scope

This document records the Phase 1 alpha contract freeze for the public core package API.
The frozen baseline includes the public runtime export surface from `packages/core/src/index.ts`.

## Frozen Artifacts

- Runtime export baseline: `packages/core/src/contracts/alpha-runtime-exports.ts`
- Contract enforcement test: `packages/core/test/public-api-contract.test.ts`

## Review Procedure

1. Build core package.
2. Review exported symbols from `dist/index.js`.
3. Confirm the baseline list matches intended public API.
4. Run contract and package validation tests.

## Validation Commands

```bash
pnpm --filter @bradsjm/steelseries-v3-core test
pnpm --filter @bradsjm/steelseries-v3-core typecheck
pnpm --filter @bradsjm/steelseries-v3-core build
```

## Change Control After Freeze

- Any change to the runtime export list is a contract change.
- Contract changes require:
  - updating `alpha-runtime-exports.ts`
  - updating this document if scope changes
  - tests/typecheck/build passing
  - explicit review in PR notes before merge
