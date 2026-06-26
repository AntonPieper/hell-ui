# CI Contract

CI providers are adapters over shared repo commands. The repository workspace
is pnpm-only and CI-backed by the checked-in `pnpm-lock.yaml`:

```bash
pnpm run ci:install
pnpm run ci:playwright
pnpm run ci:test
pnpm run ci:build
pnpm run ci:verify
```

`ci:test` owns unit test, architecture, report, coverage, and contract checks.
Unit tests run through `test:unit` with Vitest's default worker pool and coverage
thresholds enabled; CI adapters should not clamp `VITEST_MAX_WORKERS` unless a
provider-specific incident is being debugged.

Current provider scripts run on Linux and require a POSIX shell for inline
environment assignment and build-existence checks. Cross-platform local testing
should use the Node entrypoints (`tools/run-ci-tests.mjs`,
`tools/run-unit-tests.mjs`, and the package/release checkers) rather than
copying provider shell snippets.

`dist/` is a build artifact, not a broad mutable cache. `ci:ensure:*` may skip
work only after a content-addressed restore or an upstream build artifact for
the same checkout; provider caches keyed only by dependency files must not store
`dist/`.

The shared runners clear stale `test-results/` and `coverage/` output before a
full CI run. `ci:test:unit` removes stale JUnit, markdown summary, and coverage
artifacts before spawning Angular/Vitest, then regenerates `summary.md` after
every attempted unit run, including failures. A run is invalid when an expected
report is missing, empty, stale, malformed, or below the configured coverage
thresholds.

Adapters publish these shared artifacts from the repository root:

- `test-results/vitest-junit.xml`
- `test-results/summary.md`
- `coverage/cobertura-coverage.xml`
- `coverage/coverage-summary.json`
- `test-results/playwright-report.json`
- `test-results/playwright-html/`
- `test-results/playwright/`

Unit artifact policy:

- `HELL_UNIT_TEST_TIMEOUT_MS` controls the wrapper timeout and defaults to
  `180000` milliseconds.
- `HELL_UNIT_TEST_CASE_TIMEOUT_MS` controls the Vitest per-test timeout and
  defaults to `30000` milliseconds.
- Vitest CI reporters are `default`, `hanging-process`, and JUnit. GitHub
  Actions adds `github-actions`; other providers should consume the JUnit and
  markdown artifacts rather than changing reporters.
- Coverage reporters are `text`, `json-summary`, `html`, `lcov`, and
  `cobertura`. CI consumes `coverage/coverage-summary.json` and
  `coverage/cobertura-coverage.xml`.

Browser artifact policy:

- Playwright writes JSON, HTML, traces, and screenshots under `test-results/`.
- Browser jobs select semantic Playwright projects with `HELL_E2E_PROJECTS=ci`
  and the provider matrix group; adapters must not shard by spec path.
- Built docs are served by nginx with `HELL_E2E_BASE_URL`. The nginx config
  returns 404 for missing static assets and falls back to `index.html` only for
  SPA routes.

New CI provider checklist:

1. Install Node 22 and enable pnpm through Corepack.
2. Run `pnpm run ci:install`.
3. Use the official Playwright image for browser jobs, or run `pnpm run ci:playwright` before browser tests on non-container Linux agents.
   Built docs can be served by nginx with `HELL_E2E_BASE_URL` set; local tests default to Angular's dev server.
4. Run `pnpm run ci:test` and publish `test-results/` plus `coverage/`.
5. Run `pnpm run ci:build` and publish `dist/` if desired.

Docker path:

```bash
docker build -f Dockerfile.ci --target verify .
```
