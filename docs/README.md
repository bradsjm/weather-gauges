# Docs Scope (Active)

This folder is intentionally focused on artifacts required for current and upcoming visual fidelity phases.

Primary implementation directive for this repository:

- Port legacy gauge rendering at algorithm fidelity for all implemented gauges.
- Preserve legacy visual output and runtime behavior while using modern TypeScript architecture and best practices under the hood.
- Optimization is acceptable and desirable, especially in rendering and animation paths, as long as visual and functional fidelity to the legacy output is preserved.
- Treat screenshots as verification artifacts, not as design input.

## Active Documents

- `API_CONVENTIONS.md` - public API naming/behavior rules.
- `ARCHITECTURE.md` - package and rendering architecture constraints.
- `CSS_TOKENS.md` - current token contract used by renderers/elements.
- `MAPPING.md` - legacy-to-v3 field mapping rules.
- `PLAN.md` - execution plan and tracker for algorithm-fidelity visual implementation phases (VP0-VP4).
- `RESEARCH.md` - legacy research context supporting algorithm-fidelity implementation.
- `VISUAL_PARITY.md` - implementation reference and source-of-truth legacy code references.

## Removed as Historical Artifacts

The following docs were removed from active docs scope because their contents are complete historical checkpoints and not needed for forward-phase execution:

- `CORE_ALPHA_CONTRACT.md`
- `PHASE3_RC.md`
- `RADIAL.md`

Historical state remains available in git history.
