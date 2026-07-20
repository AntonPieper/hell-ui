# CI

GitHub Actions (`.github/workflows/ci.yml`) is the CI provider. Jobs are thin
adapters over shared repo commands; the workspace is pnpm-only and CI-backed by
the checked-in `pnpm-lock.yaml`:

```bash
pnpm run ci:install
pnpm run ci:test:static
pnpm run ci:test:unit
pnpm run ci:test:e2e
pnpm run ci:test:consumer-fixtures
pnpm run ci:test:api-report:prepared
```

`ci:test:static` runs ESLint, Knip, and the architecture checker. Local unit
tests run through `test:unit` without coverage output; CI and release checks use
`test:coverage`, which enables Angular's native coverage switch and enforces the
thresholds in `vitest.config.ts`.

E2E jobs run browser-risk tiers. `playwright.config.ts` owns the tier
definitions and reads the tier from `HELL_E2E_TIER`; the same test code backs
every tier, so a tier only selects browser projects and, for `main`, the
engine-sensitive subset:

- `pr` (pull requests): chromium runs every behavioral suite plus the docs
  axe smoke (`e2e/docs-axe-smoke.spec.ts`).
- `main` (pushes to `main`): chromium as in `pr`, plus firefox and webkit for
  the engine-sensitive suites enumerated in `ENGINE_SENSITIVE_SUITES` in
  `playwright.config.ts` — focus and keyboard semantics, overlays, native
  inputs, media and motion, and measured layout. The config fails loudly when
  an enumerated suite is renamed or removed.
- `full` (nightly schedule, release tag pushes, the `workflow_dispatch`
  default, and local runs without `HELL_E2E_TIER`): the full three-browser
  matrix, including the full axe suite on every engine.

The `e2e-plan` job maps the triggering event to a tier and a shard count
(`pr` = 3, `main` = 6, `full` = 9) that keeps the per-shard test load roughly
constant. Shards use Playwright's native `--shard=N/T`; every selected test
runs in exactly one shard by construction.

Shard job names embed the tier and shard count (`E2E pr (shard 1/3)`,
`E2E main (shard 4/6)`, ...), so branch protection never pins per-shard
contexts. The `e2e-gate` job publishes the single stable `E2E` context for
rulesets to require: it runs on every outcome and fails unless `e2e-plan` and
every planned shard succeeded, so a failed, cancelled, or skipped shard cannot
pass as a missing check. Tier or shard-count changes therefore never require a
ruleset edit.

Package-consumer coverage is the checked-in fixture set under
`tools/consumer-fixtures/` (see its README for the fixture contract). The
`package-consumer-plan` job enumerates the fixture directories, and one matrix
job per fixture runs `pnpm run ci:test:consumer-fixtures <fixture>` against
the audited tarball artifact with the runtime smoke enabled. Adding, renaming,
or removing a fixture therefore never requires a workflow edit.

Fixture job names embed the fixture name (`Package consumer (root-core)`,
`Package consumer (styled-controls)`, ...), so branch protection never pins
per-fixture contexts — pinned per-fixture names would break on every fixture
change. The `package-consumer-gate` job publishes the single stable
`Package consumer` context for rulesets to require: it runs on every outcome
(`if: always()`) and fails unless the plan and every planned fixture job
succeeded, so a failed, cancelled, or skipped fixture cannot pass as a
missing check. Fixture-set changes therefore never require a ruleset edit.

`dist/` is never stored in or restored from a provider cache. The build job is
the single producer of built output: every run checks the entrypoint manifests
(`ci:check:entrypoints`), builds the library fresh, runs the API report, audits
and packs the tarball (`ci:pack:lib` keeps the audited `.tgz` under
`artifacts/package/`), builds the docs, and uploads the tarball and docs as
immutable run artifacts. Package-consumer jobs download and test exactly that
tarball (`HELL_PACKAGE_CONSUMER_TARBALL` points the runners at the artifact
directory); E2E jobs serve exactly that docs artifact. Provider caches hold
only the pnpm store, the Angular compiler cache, and the Playwright browser
image.

Jobs publish these shared artifacts from the repository root:

- `artifacts/package/*.tgz` (the audited package tarball)
- `dist/hell-docs/` (the built docs the E2E jobs serve)
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
