# Consumer fixtures

Checked-in consumer projects that prove `@hell-ui/angular` works when installed
from the packed npm tarball. Each fixture sits on one real dependency and
packaging boundary (a strict-peer install set plus the entry points it
unlocks), not on one component: the fixture count tracks packaging boundaries
(#275), and per-component behavior belongs in unit and E2E suites.

## Layout

```
tools/consumer-fixtures/
  README.md
  <fixture-name>/
    fixture.json        # runner-facing manifest (see below)
    package.json        # real consumer manifest; dependency names with "*" versions
    .npmrc              # strict-peer-dependencies=true, auto-install-peers=false
    .postcssrc.json     # only in fixtures with the tailwindcss peer
    angular.json
    tsconfig.json
    tsconfig.app.json
    src/                # the consumer application
```

Every fixture is a real project: open it, read it, edit it like any consumer
app. Two rules keep fixtures honest:

- Dependency versions are always `"*"`. The runner pins each dependency to the
  repo's tested version (installed version, else `pnpm-workspace.yaml` catalog,
  else root `package.json`), so fixtures cannot drift onto untested versions.
- `@hell-ui/angular` is declared like any other dependency and is replaced at
  run time with the packed tarball. Fixtures never install workspace links, and
  they never commit lockfiles.

## fixture.json

```json
{
  "description": "one-line contract statement",
  "peerGroup": "core",
  "forbiddenDependencies": ["@tanstack/angular-table"],
  "cssSentinels": ["table-layout:fixed"],
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

- `description` — printed while the fixture runs.
- `peerGroup` (optional) — a peer group name from
  `tools/package-pack-audit.mjs`. The fixture's declared dependencies that are
  package peers must match that group exactly, preserving the strict-peer
  install contract per boundary.
- `forbiddenDependencies` (optional) — packages that must not appear anywhere
  in the installed workspace, including the pnpm store (guards optional peers
  against transitive leaks).
- `cssSentinels` (optional) — distinctive fragments that must appear in the
  built CSS, compared with all whitespace stripped. Keep one or two sentinels
  per imported stylesheet export: they prove the export resolved from the
  packed tarball and shipped compiled output. Exhaustive fragment lists belong
  to unit tests, not the packaging boundary. Projection-first entries whose
  stylesheets emit no distinctive output (for example `master-detail`) need no
  sentinel — a broken export path already fails the build. Note that the
  production minifier collapses `::before`/`::after` to `:before`/`:after` and
  drops quotes in attribute selectors.
- `smoke` (optional) — one runtime smoke: the runner serves the production
  build and loads it in headless Chromium. A step either polls `selector`
  until its text contains `textIncludes`, or asserts one resolved
  `computedStyle` (`property` equals `equals`) — the computed form proves
  semantic token overrides survive the packed build. Runs only when
  `HELL_CONSUMER_FIXTURE_SMOKE=1` (or `--smoke`) because it needs an installed
  Playwright Chromium.

## Runner

`tools/check-consumer-fixtures.mjs` (`pnpm run test:consumer-fixtures`):

1. Builds the library once (`build:lib`), unless
   `HELL_PACKAGE_CONSUMER_SKIP_BUILD=1` or `--skip-build` reuses `dist/hell`.
2. Packs `dist/hell` once with `pnpm pack` and audits the tarball with
   `auditPackedPackage`. Alternatively, `HELL_PACKAGE_CONSUMER_TARBALL=<path>`
   (or `--tarball <path>`) skips both build and pack and audits a prebuilt
   tarball instead; the path is a `.tgz` file or a directory holding exactly
   one, such as a downloaded CI artifact directory.
3. For every fixture directory (or the fixture names passed as arguments):
   copies the project to a temp workspace, pins dependency versions, applies
   the repo's pnpm overrides, and runs
   `pnpm install --strict-peer-dependencies --ignore-scripts`.
4. Asserts the library resolved to the packed tarball (never the repo
   checkout) and that forbidden dependencies are absent.
5. Runs the fixture's own `build` script, asserts the CSS sentinels, and,
   when enabled, the smoke.

`HELL_KEEP_PACKAGE_CONSUMER=1` keeps the temp workspaces for debugging.

## Adding a fixture

Copy an existing fixture directory, adjust `fixture.json`, `package.json`, and
`src/`, and run `pnpm run test:consumer-fixtures <fixture-name>`. Discovery is
directory-based: no runner or CI changes are needed. In CI the
`package-consumer-plan` job enumerates fixture directories and fans one matrix
job out per fixture; the stable `Package consumer` gate context aggregates
them (see `tools/ci/README.md` — per-fixture job names are never pinned by
rulesets). The shared release gate in `.github/workflows/release-gate.yml`
(called by both publish workflows) runs the whole set serially against the
audited release tarball.

## Current fixtures

- `root-core` — foundation without CSS: the root entry (`@hell-ui/angular`)
  and `/core` plus behavior-only Part Style Map controls (Button `ui`, Chip
  Input bridge) compile and boot with only the package-wide light peers
  (`core` peer group), no CSS or Tailwind.
- `testing` — the `/testing` harness entry compiles with the `core` peer
  group and no CSS.
- `styled-controls` — normal styled controls: the styled primitive, mixed,
  and table-primitive entries with `core` peers plus `tailwindcss`
  (`primitive` peer group), entrypoint CSS sentinels per imported stylesheet,
  and a runtime semantic-token-override smoke. It is also the Control Value
  Authority binding matrix (`docs/adr/0001-control-value-authority.md`): every
  migrated styled form control — Checkbox, Switch, Radio Group, Slider, Toggle
  Group, Select, Combobox, Date/Time/Number Input — binds its packed model
  through direct, two-way, `[formField]`, `[formControl]`, and `[(ngModel)]`
  paths at once.
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
