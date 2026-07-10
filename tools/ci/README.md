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

`ci:test:static` runs lint and the architecture checker. Unit tests run
through `test:unit` (Angular's Vitest builder with `vitest.config.ts`), which
enforces coverage thresholds natively; CI adapters should not clamp
`VITEST_MAX_WORKERS` unless a provider-specific incident is being debugged.

E2E jobs shard with Playwright's native `--shard=N/9`; every test runs in
exactly one shard by construction. Package-consumer jobs select scenario
groups with `HELL_PACKAGE_CONSUMER_GROUP`; the harness owns the group
definitions and fails when a scenario is missing from group coverage or a
group name is unknown.

`dist/` is a build artifact, not a broad mutable cache. `ci:ensure:*` may skip
work only after a content-addressed restore or an upstream build artifact for
the same checkout; provider caches keyed only by dependency files must not store
`dist/`.

Jobs publish these shared artifacts from the repository root:

- `test-results/vitest-junit.xml`
- `coverage/cobertura-coverage.xml`
- `coverage/coverage-summary.json`
- `test-results/playwright-report.json`
- `test-results/playwright-html/`
- `test-results/playwright/`

Unit artifact policy:

- `HELL_UNIT_TEST_CASE_TIMEOUT_MS` controls the Vitest per-test timeout and
  defaults to `30000` milliseconds.
- Vitest reporters are `default`, `hanging-process`, and JUnit. GitHub
  Actions adds `github-actions`; consume the JUnit artifact rather than
  changing reporters.
- Coverage reporters are `text`, `json-summary`, `html`, `lcov`, and
  `cobertura`. CI consumes `coverage/coverage-summary.json` and
  `coverage/cobertura-coverage.xml`.

Browser artifact policy:

- Playwright writes JSON, HTML, traces, and screenshots under `test-results/`.
- Built docs are served by nginx (`tools/ci/nginx-spa.conf`) with
  `HELL_E2E_BASE_URL`. The nginx config returns 404 for missing static assets
  and falls back to `index.html` only for SPA routes.
