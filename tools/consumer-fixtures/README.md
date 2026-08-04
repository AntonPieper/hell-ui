# Consumer fixtures

Checked-in consumer projects that prove `hell-ui` works when installed
from the packed npm tarball. Each fixture sits on one real dependency and
packaging boundary (a strict-peer install set plus the entry points it
unlocks), not on one component: the fixture count tracks packaging boundaries
(#275), and per-component behavior belongs in unit and E2E suites.

## Layout

```
tools/consumer-fixtures/
  README.md
  _base/                # shared workspace scaffolding, overlaid by the runner
    project/            # onto every fixture
      .npmrc            # strict-peer-dependencies=true, auto-install-peers=false
      angular.json
      tsconfig.json
      tsconfig.app.json
      src/index.html
    tailwind/           # only onto fixtures that install the tailwindcss peer
      .postcssrc.json
  <fixture-name>/
    fixture.json        # runner-facing manifest (see below)
    src/                # the consumer application
```

A fixture directory holds only what makes it that scenario. Everything a real
Angular consumer project also needs but no scenario varies is the runner's:
`_base/project/` is copied into every workspace, `_base/tailwind/` only into
workspaces that install the style peer, and the consumer `package.json` is
composed per run. Directories whose name starts with `_` are shared material,
never fixtures.

The runner materializes the real project into a temp workspace: base overlay
first, then the fixture's own files, which win on collision — a scenario that
needs its own `angular.json` or `index.html` simply checks one in.
`HELL_KEEP_PACKAGE_CONSUMER=1` keeps that workspace, and it is a complete
project: open it, read it, build it like any consumer app.

Two rules keep the composed manifest honest:

- No fixture writes a dependency version. The runner pins each dependency to
  the repo's tested version — the root-installed version, else the exact
  version the lockfile's `catalogs:` snapshot records for the
  `pnpm-workspace.yaml` catalog entry, else the root `package.json` — so
  fixtures cannot drift onto untested versions. A dependency that resolves to
  a range fails the run rather than being written through: a range re-resolves
  at install time, which is exactly the drift this contract exists to prevent.
- `hell-ui` is composed in like any other dependency and resolves to the
  packed tarball. Fixtures never install workspace links, and they never commit
  lockfiles.

## The composed package.json

The runner owns the whole consumer manifest, so the parts every fixture shares
live in `tools/package/check-consumer-fixtures.mjs` exactly once:

- the scaffold: `name` (`hell-consumer-fixture-<directory>`), `private`,
  `type`, and the `build` script;
- the dependencies every fixture installs (Angular CDK/common/compiler/core/
  forms/platform-browser, `@floating-ui/dom`, `ng-primitives`, `rxjs`,
  `tslib`) plus the packed library under its own packed name;
- the dev dependencies every fixture builds with (`@angular/build`,
  `@angular/cli`, `@angular/compiler-cli`, `typescript`);
- the Tailwind/PostCSS toolchain (`@tailwindcss/postcss`, `postcss`) and the
  `.postcssrc.json` overlay, added together for fixtures whose dependencies
  include `tailwindcss` and for no others — the build toolchain follows the
  style peer rather than being declared per fixture.

A fixture adds only the dependencies that make it its scenario, via
`fixture.json`'s `dependencies`.

## fixture.json

```json
{
  "description": "one-line contract statement",
  "peerGroup": "table-tanstack",
  "dependencies": ["@tanstack/angular-table", "tailwindcss"],
  "cssSentinels": ["table-layout:fixed"],
  "forbiddenCssSentinels": ["hell-code-editor"],
  "styleBundleBudget": true,
  "smoke": {
    "steps": [
      { "selector": "app-root p", "textIncludes": "expected text" },
      {
        "selector": "[data-test-id=\"primary-link\"]",
        "computedStyle": { "property": "color", "equals": "rgb(52, 82, 255)" }
      }
    ]
  }
}
```

An unknown key fails discovery: a field the runner does not read is a promise
the fixture is not keeping.

- `description` (required) — printed while the fixture runs.
- `peerGroup` (required) — a peer group name from
  `tools/package/package-pack-audit.mjs`. The fixture's composed dependencies that are
  package peers must match that group exactly, preserving the strict-peer
  install contract per boundary. It also derives the fixture's forbidden
  dependencies: the closed pool of peer-group markers (every package some peer
  group installs that another does not) minus this group's own peers. Each of
  those must be absent from `node_modules` **and** from the pnpm store, so a
  transitive leak counts too. Nothing is declared per fixture, which is what
  the old hand-written lists got wrong — the core fixture forbade the table,
  editor, and pdf.js markers but not the icon or style peers its siblings
  forbade.
- `dependencies` (optional) — the extra dependencies this scenario installs on
  top of the composed set above, as bare package names. `root-core` declares
  none.
- `cssSentinels` (optional) — the scenario's distinctive fragments that must
  appear in the built CSS, compared with all whitespace stripped, on top of the
  runner's own `--color-hell-surface-muted:` token probe. That probe applies to
  every fixture that installs the `tailwindcss` peer, because a stylesheet
  export that resolved from the packed tarball always pulls the token layer with
  it — and for those fixtures a build that emits no CSS is a failure. A fixture
  without the style peer and without sentinels of its own (the no-CSS
  `root-core` boundary) is exempt by contract. Keep one or two sentinels
  per imported stylesheet export: they prove the export resolved from the
  packed tarball and shipped compiled output. Exhaustive fragment lists belong
  to unit tests, not the packaging boundary. Entries whose stylesheets emit no
  distinctive output need no sentinel — a broken export path already fails the
  build. That covers projection-first entries (for example `master-detail`) and
  entries that only re-register another entry's recipe source: `input`,
  `date-input`, and `time-input` all register `input/input.ts`, so their
  compiled output is indistinguishable and no fragment can prove one of them
  specifically. Note that the
  production minifier collapses `::before`/`::after` to `:before`/`:after` and
  drops quotes in attribute selectors.
- `forbiddenCssSentinels` (optional) — distinctive fragments that must NOT
  appear in the built CSS, compared the same way as `cssSentinels`. Use them
  for heavy/optional stylesheet markers (Code Editor, PDF Viewer, Theme
  Adapter Stylesheets) that a standard-style fixture must never pick up
  implicitly.
- `styleBundleBudget` (optional) — `true` opts the fixture into the size gate.
  The runner owns the path (`style-bundle-budget.json` in this directory), so
  no fixture can point the gate somewhere else. It measures every CSS byte the
  fixture's production build emitted (compiled and minified, nothing
  filtered), prints deterministic per-file and total raw/gzip byte counts,
  and fails when the file's `budget` limits are exceeded. The file also
  records the accepted `baseline` (package revision, measurement command,
  measured bytes) the budget is derived from — including the `fixture` it was
  measured from, which must be the fixture being measured against it: a budget
  derived from one bundle says nothing about another's. `styles-aggregate` is
  the Default Style Bundle release gate; see
  `docs/release/style-bundle-budget.md` for the review and update process.
- `smoke` (optional) — one runtime smoke: the runner serves the production
  build and loads it in headless Chromium. A step either polls `selector`
  until its text contains `textIncludes`, or asserts one resolved
  `computedStyle` (`property` equals `equals`) — the computed form proves
  semantic token overrides survive the packed build. Steps come inline
  (`smoke.steps`) or from a shared JSON array file (`smoke.stepsFile`,
  resolved against the fixture directory but staying inside
  `tools/consumer-fixtures/`); a shared steps file lets two fixtures assert
  byte-identical expectations, which is how the aggregate and granular
  style-mode fixtures prove computed-style equivalence. Runs only when
  `HELL_CONSUMER_FIXTURE_SMOKE=1` because it needs an installed Playwright
  Chromium.

## Runner

`tools/package/check-consumer-fixtures.mjs` (`pnpm run test:consumer-fixtures`):

1. Builds the library once (`build:lib`), unless `--skip-build` reuses
   `dist/hell`.
2. Packs `dist/hell` once with `pnpm pack` and audits the tarball with
   `auditPackedPackage`. Alternatively, `HELL_PACKAGE_CONSUMER_TARBALL=<path>`
   skips both build and pack and audits a prebuilt tarball instead; the path is
   a `.tgz` file or a directory holding exactly one, such as a downloaded CI
   artifact directory.
3. For every fixture directory (or the fixture names passed as arguments):
   materializes the project into a temp workspace (base overlay, then the
   fixture's files, then the composed `package.json`), applies the repo's pnpm
   overrides, and runs
   `pnpm install --strict-peer-dependencies --ignore-scripts`.
4. Asserts the library resolved to the packed tarball (never the repo
   checkout) and that the peer-group markers outside the fixture's own group
   are absent.
5. Runs the fixture's own `build` script, asserts the CSS sentinels,
   enforces the style bundle size budget when the fixture opts in, and,
   when enabled, runs the smoke.

This entry stops at the first failing fixture and names the ones it therefore
did not run — a red local run tells you about one fixture, not the whole set.

`HELL_KEEP_PACKAGE_CONSUMER=1` keeps the temp workspaces for debugging — each
is a complete, openable consumer project.

The sharded CI entry (`tools/package/run-consumer-fixture-shard.mjs`) is shard
arithmetic over the same runner: it reads the fixture set from the runner's own
discovery, deals it round-robin across `CI_NODE_TOTAL` shards, and runs its
slice by importing the runner in-process. One shard therefore audits the packed
tarball once rather than once per fixture, and both entries share one discovery
and validation path. In that batch mode each fixture runs inside its own
collapsible log section, a failing fixture never stops the ones after it, and a
prebuilt tarball is mandatory — in CI the audited artifact the build job
published is the only thing consumers are meant to test. Per-fixture verdicts
and the closing summary print outside the collapsed sections, so a red job names
its failures without anyone expanding anything.

## Adding a fixture

Copy an existing fixture directory, adjust `fixture.json` and `src/`, and run
`pnpm run test:consumer-fixtures <fixture-name>`. Discovery is
directory-based: no runner or CI changes are needed. The directory name must
match `[A-Za-z0-9_.-]+` because it labels a collapsible GitLab log section, and
must not start with `_`, which marks shared material; a name that
cannot be labeled fails on the run that adds it. In GitHub CI the
`package-consumer-plan` job enumerates fixture directories and fans one matrix
job out per fixture; the stable `Package consumer` gate context aggregates
them (see `tools/ci/README.md` — per-fixture job names are never pinned by
rulesets). In GitLab CI one sharded `package-consumer` job
(`.gitlab/ci/package-consumer.yml`) discovers fixtures in-job and deals them
round-robin across its shards via `tools/package/run-consumer-fixture-shard.mjs`, with
one collapsible log section per fixture. The shared release gate in
`.github/workflows/release-gate.yml` (called by both publish workflows) runs
the whole set serially against the audited release tarball.

## Current fixtures

- `root-core` — foundation without CSS: the root entry (`hell-ui`),
  `/core`, and the `/testing` harness entry plus behavior-only Part Style Map
  controls (Button `ui`, Chip Input bridge) compile and boot with only the
  package-wide light peers (`core` peer group), no CSS or Tailwind. The
  `/testing` harness classes ride on this install rather than a fixture of
  their own: the harness entry sits on the same `core` peer group and the same
  no-CSS boundary, so a separate project would install the same dependency set
  twice.
- `styled-controls` — normal styled controls: the styled primitive, mixed,
  and table-primitive entries with `core` peers plus `tailwindcss`
  (`primitive` peer group), entrypoint CSS sentinels per imported stylesheet,
  and a runtime semantic-token-override smoke. It is also the Control Value
  Authority binding matrix (`docs/adr/0001-control-value-authority.md`): every
  migrated styled form control — Checkbox, Switch, Radio Group, Slider, Toggle
  Group, Select, Combobox, Date/Time/Number Input — binds its packed model
  through direct, two-way, `[formField]`, `[formControl]`, and `[(ngModel)]`
  paths at once.
- `styles-aggregate` — Default Style Bundle mode: one `hell-ui/styles.css`
  import through the Tailwind/PostCSS production path with the `composite`
  peer group. Renders representative primitive (button, card), composite
  (page header, toolbar), and overlay (popover) surfaces, proves unused
  standard styles ship in the bundle via CSS sentinels, and proves heavy
  markers and peers stay absent. Its computed-style smoke steps are shared
  with `styles-granular` through `style-modes-smoke.steps.json`, so both
  standard-style modes must render identically. It is also the release-size
  measurement surface: its compiled CSS is benchmarked against
  `style-bundle-budget.json` (`pnpm run benchmark:style-bundle`; see
  `docs/release/style-bundle-budget.md`).
- `styles-granular` — Granular Style Mode: `hell-ui/tokens.css` plus only the
  Entrypoint-Scoped Stylesheets the app imports, rendering the same surfaces
  as `styles-aggregate` and asserting the same shared computed-style steps.
  Forbidden sentinels prove unselected standard styles (skeleton, table) and
  heavy markers stay out of the granular build.
- `overlays-router` — overlays and router boundary: app shell, dialog,
  omnibar, toast, Confirm/HellPrompt flows, time picker, page header,
  resizable + master detail, toolbar, and Filter Builder with the
  `composite-router` peer group.
- `icon-audio` — icon-backed boundary: `hell-icon`, date pickers, dialpad,
  and the audio player plus the `features/audio-transcript` provider with the
  `composite-icons` peer group (icon peers installed, heavy peers forbidden).
- `table-tanstack` — Hell-styled TanStack Table shell with the strict
  optional table peer (`table-tanstack` peer group); TanStack Virtual is
  forbidden.
- `table-tanstack-virtual` — the optional TanStack Virtual body strategy on
  the shell (`table-tanstack-virtual` peer group).
- `code-editor` — the kept optional CodeMirror feature entry with the
  `code-editor` peer group, binding the packed editor's document `value` model
  through the same five Control Value Authority paths.
- `pdf-viewer` — the optional pdf.js feature entry with the `pdf-viewer` peer
  group (exact pdf.js peer plus icon peers).
