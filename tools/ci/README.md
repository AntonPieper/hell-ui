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

`ci:test:static` runs ESLint, Knip, and the architecture checker. Local unit
tests run through `test:unit` without coverage output; CI and release checks use
`test:coverage`, which enables Angular's native coverage switch and enforces the
thresholds in `vitest.config.ts`.

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

- `coverage/`
- `test-results/playwright-html/`
- `test-results/playwright/`

Unit artifact policy:

- Vitest uses a fixed 30-second per-test timeout and the `default` plus
  `hanging-process` reporters. GitHub Actions adds `github-actions`.
- Coverage uses text output plus an uploaded HTML report. No duplicate JUnit,
  LCOV, JSON-summary, or Cobertura artifacts are generated without a consumer.

Browser artifact policy:

- Playwright writes HTML, traces, and screenshots under `test-results/`.
- Built docs are served by nginx (`tools/ci/nginx-spa.conf`) with
  `HELL_E2E_BASE_URL`. The nginx config returns 404 for missing static assets
  and falls back to `index.html` only for SPA routes.
