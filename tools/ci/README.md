# CI

GitHub Actions (`.github/workflows/ci.yml`) is the CI provider. Jobs are thin
adapters over shared repo commands; the workspace is pnpm-only and CI-backed by
the checked-in `pnpm-lock.yaml`:

```bash
pnpm run ci:install
pnpm run ci:test:static
pnpm run ci:test:unit
pnpm run ci:test:e2e
pnpm run ci:test:package-consumer
pnpm run ci:test:api-report:prepared
```

`ci:test:static` runs lint, the architecture checker, and the derived CI
coverage check (`tools/check-ci-coverage.mjs`), which verifies that every
Playwright test lands in exactly one CI shard and every consumer scenario in
exactly one matrix entry. Unit tests run through `test:unit` with Vitest's
default worker pool and coverage thresholds enabled; CI adapters should not
clamp `VITEST_MAX_WORKERS` unless a provider-specific incident is being
debugged. `ci:verify` is the local pre-push preflight and delegates to
`release:dry-run:fast`.

Provider scripts run on Linux and require a POSIX shell for inline environment
assignment and build-existence checks. Cross-platform local testing should use
the Node entrypoints (`tools/run-unit-tests.mjs` and the package/release
checkers) rather than copying provider shell snippets.

`dist/` is a build artifact, not a broad mutable cache. `ci:ensure:*` may skip
work only after a content-addressed restore or an upstream build artifact for
the same checkout; provider caches keyed only by dependency files must not store
`dist/`.

`ci:test:unit` removes stale JUnit, markdown summary, and coverage artifacts
before spawning Angular/Vitest, then regenerates `summary.md` after every
attempted unit run, including failures. A run is invalid when an expected
report is missing, empty, stale, malformed, or below the configured coverage
thresholds.

Jobs publish these shared artifacts from the repository root:

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
  Actions adds `github-actions`; consume the JUnit and markdown artifacts
  rather than changing reporters.
- Coverage reporters are `text`, `json-summary`, `html`, `lcov`, and
  `cobertura`. CI consumes `coverage/coverage-summary.json` and
  `coverage/cobertura-coverage.xml`.

Browser artifact policy:

- Playwright writes JSON, HTML, traces, and screenshots under `test-results/`.
- Browser jobs select semantic Playwright projects with `HELL_E2E_PROJECTS=ci`
  and the workflow matrix group; jobs must not shard by spec path.
- Built docs are served by nginx (`tools/ci/nginx-spa.conf`) with
  `HELL_E2E_BASE_URL`. The nginx config returns 404 for missing static assets
  and falls back to `index.html` only for SPA routes.
