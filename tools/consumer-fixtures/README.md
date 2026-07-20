# Consumer fixtures

Checked-in consumer projects that prove `@hell-ui/angular` works when installed
from the packed npm tarball. They are the replacement pattern for the embedded
template-string scenarios in `tools/check-package-consumer.mjs` (#263); the
remaining legacy scenarios will consolidate onto fixtures in #275.

## Layout

```
tools/consumer-fixtures/
  README.md
  <fixture-name>/
    fixture.json        # runner-facing manifest (see below)
    package.json        # real consumer manifest; dependency names with "*" versions
    .npmrc              # strict-peer-dependencies=true, auto-install-peers=false
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
  "smoke": {
    "steps": [{ "selector": "app-root p", "textIncludes": "expected text" }]
  }
}
```

- `description` — printed while the fixture runs.
- `peerGroup` (optional) — a peer group name from
  `tools/package-pack-audit.mjs`. The fixture's declared dependencies that are
  package peers must match that group exactly, preserving the peer-tier
  contract the legacy scenarios assert.
- `forbiddenDependencies` (optional) — packages that must not appear anywhere
  in the installed workspace, including the pnpm store (guards optional peers
  against transitive leaks).
- `smoke` (optional) — one runtime smoke: the runner serves the production
  build, loads it in headless Chromium, and polls each `selector` until its
  text contains `textIncludes`. Runs only when `HELL_CONSUMER_FIXTURE_SMOKE=1`
  (or `--smoke`) because it needs an installed Playwright Chromium.

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
5. Runs the fixture's own `build` script and, when enabled, the smoke.

`HELL_KEEP_PACKAGE_CONSUMER=1` keeps the temp workspaces for debugging.

## Adding a fixture

Copy an existing fixture directory, adjust `fixture.json`, `package.json`, and
`src/`, and run `pnpm run test:consumer-fixtures <fixture-name>`. Discovery is
directory-based: no runner or CI changes are needed. In CI the whole set runs
as the `fixtures` group of the package-consumer matrix in
`.github/workflows/ci.yml` and as a release-gate step in
`.github/workflows/npm-publish.yml`.

## Current fixtures

- `root-core` — the root entry point (`@hell-ui/angular`) core contract:
  compiles with only the package-wide light peers (`core` peer group), no CSS
  or Tailwind, no icon/table/feature peers, and boots to a rendered
  `hellSearchResource` result.
