# Phase 3 Release Candidate Notes

Status: Phase 0-3 API frozen for RC validation

## Scope Included in RC

- Core package foundations (schemas, math, animation, render context, theme, extension interfaces).
- Gauge implementations: radial, linear, compass.
- Cross-gauge contract normalization (`ss3-value-change`, `ss3-error`).
- Visual baselines for radial, linear, and compass fixtures.
- Migration guidance for v2 -> v3 adopters.

## Freeze Artifacts

- Alpha export baseline: `packages/core/src/contracts/alpha-runtime-exports.ts`
- RC export baseline: `packages/core/src/contracts/phase3-rc-runtime-exports.ts`
- RC contract test: `packages/core/test/phase3-rc-contract.test.ts`

## Validation Commands

```bash
pnpm typecheck
pnpm build
pnpm test
pnpm test:visual
pnpm --filter @bradsjm/steelseries-v3-core test:api
pnpm --filter @bradsjm/steelseries-v3-core test:api:rc
```

## Suggested RC Tagging (local/CI)

- `steelseries-v3-core@0.3.0-rc.0`
- `steelseries-v3-elements@0.3.0-rc.0`
- `steelseries-v3-ha-cards@0.3.0-rc.0`
- `steelseries-v3-test-assets@0.3.0-rc.0`

## Publish Dry-Run Checklist

1. Ensure all validation commands pass.
2. Generate version changes (`pnpm version-packages`) on a release branch.
3. Run package publish dry-run (`pnpm release --dry-run` in CI context).
4. Attach this RC note and API contract results to release PR.
