# Default Style Bundle size benchmark and budget

The Default Style Bundle (`hell-ui/styles.css`) trades convenience for CSS
bytes every consumer ships. This benchmark makes that cost visible on every
release and fails the release gate when the accepted budget is exceeded.

## What is measured

The benchmark measures the compiled production CSS emitted by the
`styles-aggregate` packed-consumer fixture
(`tools/consumer-fixtures/styles-aggregate/`): the packed `hell-ui` tarball is
installed with strict peers, the fixture imports `hell-ui/styles.css` through
the supported Tailwind/PostCSS production path, and every CSS byte of the
resulting minified build output is counted. It never measures source files or
an unprocessed concatenation, and it never filters, excludes, or
outlier-corrects the emitted CSS. The same fixture's forbidden CSS sentinels
and forbidden dependencies are what prove Heavy Feature Stylesheets (Code
Editor, PDF Viewer, TanStack integrations) and Theme Adapter Stylesheets stay
out of the bundle being measured.

Raw bytes and gzip bytes (fixed compression level 9) are both reported. Both
counts are deterministic for a given package revision and pinned toolchain.

## Where the baseline and budget live

`tools/consumer-fixtures/style-bundle-budget.json` records:

- `baseline` — the accepted measurement: the fixture, package version, the
  package revision it was measured from, the command that reproduces it, the
  measurement date, and the measured raw and gzip byte counts.
- `budget` — the explicit release limits (`maxRawBytes`, `maxGzipBytes`)
  derived from that baseline, with a `derivation` note explaining the
  headroom.

The recorded `revision` identifies the package sources the baseline CSS was
measured from; the recorded `command` reproduces the measurement:

```bash
pnpm run benchmark:style-bundle
```

(The initial baseline records the accepted Default Style Bundle
implementation revision; the benchmark tooling itself landed in the
immediately following change with identical library sources, so run the
command from a checkout that includes the tooling.)

This builds the library, packs it, and runs the `styles-aggregate` fixture,
which prints per-file and total raw/gzip sizes and enforces the budget. When
`dist/hell` is already built (for example inside `pnpm release:dry-run`),
`pnpm run benchmark:style-bundle --skip-build` reuses it.

## When it runs

- `pnpm release:dry-run` runs the benchmark after the library build and
  package audit, so a local or CI dry run fails before an over-budget bundle
  reaches a release.
- The npm publication workflow (`.github/workflows/npm-publish.yml` via the
  shared `.github/workflows/release-gate.yml`) runs the benchmark twice
  before any publish job: inside its `pnpm release:dry-run` step and again
  when the consumer-fixture step replays `styles-aggregate` against the
  audited release tarball.
- Regular CI's per-fixture `Package consumer (styles-aggregate)` job enforces
  the same budget on every pull request, so growth is visible where it is
  introduced rather than at release time.

A budget failure names the fixture being measured, the measured size, the
allowed size, and the budget file.

## Reviewing an intentional size increase

An over-budget benchmark is a decision point, not a formality:

1. Inspect the growth. Compare the fixture's per-file report against the
   recorded baseline and confirm the delta comes from the change you made
   (new component styles in the Default Style Bundle, token additions), not
   from an accidental inclusion. The fixture's forbidden sentinels must still
   pass: heavy or optional styles leaking into the bundle are a bug to fix,
   never a budget to raise.
2. Prefer alternatives first. Styling that only some consumers need belongs
   in an opt-in Entrypoint-Scoped Stylesheet, Heavy Feature Stylesheet, or
   Theme Adapter Stylesheet rather than in every consumer's bundle.
3. If the increase is justified, update
   `tools/consumer-fixtures/style-bundle-budget.json` in the same pull
   request that grows the CSS: re-run `pnpm run benchmark:style-bundle`, copy
   the newly measured raw/gzip bytes into `baseline` together with the new
   revision, version, date, and command, and derive new `maxRawBytes` /
   `maxGzipBytes` limits from that baseline, documenting the headroom in
   `derivation`. The budget must never be raised without refreshing the
   baseline it is derived from (the benchmark rejects a budget below its own
   baseline).
4. The pull request review covers the budget change explicitly: the reviewer
   confirms the measured growth matches the intent of the change and that the
   new headroom is justified. A budget-only change with no styling change is
   a red flag.

Shrinking is the easy direction: when the bundle gets smaller, re-measure and
lower the baseline and budget in the same way so the gate keeps tracking the
accepted cost.
