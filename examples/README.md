# V3 Browser Demos

These examples are designed for a local browser workflow.

## Prerequisites

1. Build local package artifacts:

```bash
pnpm --filter @bradsjm/steelseries-v3-core build
pnpm --filter @bradsjm/steelseries-v3-elements build
```

2. Keep an internet connection for `lit` and `zod` ESM imports (loaded from `esm.sh` via import maps).

## Run (Recommended)

Run a local static server from the repository root:

```bash
python3 -m http.server 8080
```

Then open:

- `http://localhost:8080/examples/index.html`
- `http://localhost:8080/examples/radial.html`
- `http://localhost:8080/examples/linear.html`
- `http://localhost:8080/examples/compass.html`

## Why this is needed

Modern browsers block module scripts loaded from `file://` with CORS restrictions (`origin 'null'`).
If you open `examples/index.html` directly and see errors like:

- `Access to script ... has been blocked by CORS policy`
- `Failed to load resource: net::ERR_FAILED`

use the local server command above and load via `http://localhost` instead.

## Alternative (Not Recommended)

You can launch a browser with unsafe file-access flags, but this weakens security.
Use the local server approach for normal development.

## What Each Demo Shows

- `index.html`: a documentation-style landing page inspired by the original SteelSeries showcase, with all three v3 gauges and live updates.
- `radial.html`: radial gauge controls, threshold changes, and event stream.
- `linear.html`: linear gauge controls, value animation, and token override example.
- `compass.html`: heading updates, animated bearing changes, and normalized event output.

## Notes

- These demos use local dist outputs:
  - `../packages/core/dist/index.js`
  - `../packages/elements/dist/index.js`
- Gauge events emitted:
  - `ss3-value-change`
  - `ss3-error`
