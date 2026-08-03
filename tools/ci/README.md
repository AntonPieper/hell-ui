# CI

Two providers run this repository's CI over the same repo commands:

- **GitHub Actions** — `.github/workflows/ci.yml`, one workflow.
- **GitLab CI** — a slim root `.gitlab-ci.yml` carrying only the pipeline
  topology and the dispatch hooks, plus one include per concern under
  `.gitlab/ci/`.

Jobs on both sides are thin adapters over shared repo commands; the workspace
is pnpm-only and CI-backed by the checked-in `pnpm-lock.yaml`:

```bash
pnpm run ci:install
pnpm run ci:test:static
pnpm run ci:test:unit
pnpm run ci:test:e2e
pnpm run ci:test:consumer-fixtures        # one fixture, by name
pnpm run ci:test:consumer-fixtures:shard  # this shard's slice of the whole set
pnpm run ci:test:release-notes
pnpm run ci:check:entrypoints
pnpm run ci:build:lib
pnpm run ci:pack:lib
pnpm run ci:build:docs:prepared
pnpm run ci:test:api-report:prepared
```

`ci:test:static` runs ESLint, Knip, and the repository's static contracts:
architecture, PR-state policy, secret-detection policy, pipeline shape, and the
main-policy document. Local unit tests run through `test:unit` without coverage
output; CI and release checks use `test:coverage`, which enables Angular's
native coverage switch and enforces the thresholds in `vitest.config.ts`.

The two pipelines cover the same ground. They diverge only where the execution
environment forces it: GitHub fans work out across ephemeral hosted runners,
while the GitLab jobs share one docker host and are therefore sized to that
machine instead of multiplied across it. Read this file as a map — the CI
definitions and the pipeline-shape contract below are the spec.

## Where the GitLab shape is specified

`pnpm run test:pipeline-shape` (`tools/check-pipeline-shape.mjs`) is the source
of truth for the GitLab pipeline's shape, and it enforces rather than describes
it: `tools/pipeline-shape-contracts.mjs` parses the real root file plus its
includes and proves the job roster per pipeline source, the `docker` runner tag
on every job, the five-source workflow topology, that exactly one E2E tier job
instantiates per test pipeline and selects exactly its own tier, and that every
`needs` edge points at a job present in the same pipeline — then replays
adversarial fixtures proving the contract still rejects each of those
regressions. Anything outside its minimal interpreted subset fails the contract
instead of being half-read, so growing the pipeline means growing the contract
in the same change. The GitLab pipeline has no aggregate gate job — the merge
gate is the pipeline itself — so this contract carries the silent-shrink
protection GitHub gets from its gate jobs. It runs inside `ci:test:static`,
which means both providers run it.

## Pipeline sources

- GitHub: pushes to `main` and `v*.*.*` tags, every pull request, a nightly
  schedule, and `workflow_dispatch` with an `e2e-tier` input.
- GitLab: exactly five sources — merge-request events, pushes to `main`, pushes
  of a `v*` tag, schedules, and web/api dispatch. Anything else, in particular
  a plain branch push with no open merge request, creates no pipeline.
  Schedules and dispatch select behavior through the `$E2E_TIER` and
  `$PIPELINE_KIND` hooks declared in the root file.

Every GitLab Node job extends `.node-job` (`.gitlab/ci/base.yml`): the pinned
Node image, the `docker` runner tag, pnpm provisioned by corepack from the root
`packageManager` pin, and `retry` restricted to infrastructure failures so a
failing test stays red on its first run. The two contract jobs that need no
workspace (`pr-state`, `secret-detection-gate`) drop the install and the caches
outright. On GitHub the steps read `.node-version` through `actions/setup-node`,
the same runtime source of truth the release machinery uses.

## E2E tiers

`playwright.config.ts` owns the tier definitions and reads the tier from
`HELL_E2E_TIER`; the same test code backs every tier, so a tier only selects
browser projects and, for `main`, the engine-sensitive subset:

- `pr`: chromium runs every behavioral suite plus the docs axe smoke
  (`e2e/docs-axe-smoke.spec.ts`).
- `main`: chromium as in `pr`, plus firefox and webkit for the engine-sensitive
  suites enumerated in `ENGINE_SENSITIVE_SUITES` in `playwright.config.ts` —
  focus and keyboard semantics, overlays, native inputs, media and motion,
  embedded runtimes, and measured layout. The config fails loudly when an
  enumerated suite is renamed or removed.
- `full`: the full three-browser matrix, including the full axe suite on every
  engine. Also the local default when `HELL_E2E_TIER` is unset.

Tier selection differs by provider:

- GitHub: the `e2e-plan` job maps the triggering event to a tier — pull request
  to `pr`, branch push to `main`, tag push and schedule to `full`, dispatch to
  its input.
- GitLab: the tier *is* the job. `e2e:pr` gates merge requests, `e2e:main` runs
  on pushes to `main`, and `e2e:full` runs on `v*` tags and is the default for
  scheduled and dispatched pipelines (`$E2E_TIER` picks another one there).
  Exactly one tier job instantiates per test pipeline, which the shape contract
  proves.

### GitHub: shards behind a stable gate

`e2e-plan` also picks a shard count (`pr` = 3, `main` = 6, `full` = 9) that
keeps the per-shard test load roughly constant. Shards use Playwright's native
`--shard=N/T`; every selected test runs in exactly one shard by construction.

Shard job names embed the tier and shard count (`E2E pr (shard 1/3)`,
`E2E main (shard 4/6)`, ...), so branch protection never pins per-shard
contexts. The `e2e-gate` job publishes the single stable `E2E` context for
rulesets to require: it runs on every outcome and fails unless `e2e-plan` and
every planned shard succeeded, so a failed, cancelled, or skipped shard cannot
pass as a missing check. Tier or shard-count changes therefore never require a
ruleset edit.

### GitLab: one unsharded job per tier

Deliberately unsharded, and `.gitlab/ci/e2e.yml` carries the measurements
behind it. Every job lands on the same shared 8-core docker host, so N shard
jobs buy no compute over one job whose in-process workers already use every
core — they only multiply setup and multiply the worker count by N, which
starves the tests until frame-driven waits time out suite-wide.
`resource_group: browser-host` extends the same reasoning to concurrency across
pipelines: one browser job at a time, so an MR's `pr` run cannot double the
worker count next to a dispatched `full` run. In-process Playwright retries
absorb test flake; job retry stays infrastructure-only. There is no aggregate
gate job — the pipeline is the gate, and silent-shrink protection is the shape
contract's job.

## Package-consumer coverage

The fixture set is the checked-in one under `tools/consumer-fixtures/` (see its
README for the fixture contract), verified against the audited tarball with the
runtime smoke enabled. Neither provider enumerates fixtures in configuration,
so adding, renaming, or removing one never requires a CI edit:

- GitHub: the `package-consumer-plan` job enumerates the fixture directories
  and one matrix job per fixture runs `ci:test:consumer-fixtures <fixture>`.
  Fixture job names embed the fixture name (`Package consumer (root-core)`,
  ...), so branch protection never pins per-fixture contexts; the
  `package-consumer-gate` job publishes the single stable `Package consumer`
  context, runs on every outcome (`if: always()`), and fails unless the plan and
  every planned fixture job succeeded.
- GitLab: one `package-consumer` job with `parallel: 3` runs
  `ci:test:consumer-fixtures:shard` (`tools/run-consumer-fixture-shard.mjs`),
  which discovers the fixtures in-job and deals them round-robin over the
  shards. The shard count is capacity tuning, not coverage. Each fixture gets
  its own collapsible log section, and a failing fixture never stops the rest
  of the shard — the shard's summary names every failure.

## Built output, artifacts, and caches

`dist/` is never stored in or restored from a provider cache. On both providers
the build job is the single producer of built output: every run asserts no
pre-existing `dist/` or `artifacts/`, checks the entrypoint manifests
(`ci:check:entrypoints`), builds the library fresh, runs the API report, audits
and packs the tarball (`ci:pack:lib` keeps the audited `.tgz` under
`artifacts/package/`), builds and stamps the docs, and publishes the tarball and
the docs bundle as job artifacts. Package-consumer jobs test exactly that
tarball (`HELL_PACKAGE_CONSUMER_TARBALL`); E2E jobs serve exactly that docs
bundle. Nothing downstream rebuilds anything.

Jobs publish these shared artifacts from the repository root:

- `artifacts/package/*.tgz` (the audited package tarball)
- `dist/hell-docs/` (the built docs the E2E jobs serve)
- `coverage/`
- `test-results/playwright-html/`
- `test-results/playwright/` (GitHub only, see below)

Caches hold only the pnpm store and the Angular compiler cache — plus, on
GitHub, the consumer jobs' Playwright chromium download. The GitLab browser
jobs (the E2E tiers and `package-consumer`) run the derived image with the
browsers baked in at `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`, so there is no
chromium download and no browser cache at all. The pnpm cache is read-only for
jobs that only install the workspace; `build` holds the one pull-push copy per
pipeline, and `package-consumer` keeps pull-push because fixture installs pull
packages the workspace lockfile does not cover.

## Docs serving in E2E

- GitHub: `vite preview` — the same server the local `webServer` command uses —
  pointed at the downloaded docs artifact.
- GitLab: nginx inside the job's own image, using the repository's
  [`nginx-spa.conf`](./nginx-spa.conf). The job copies the build job's bundle
  into the docs root, starts nginx, and polls until it answers before testing.

Both set `HELL_E2E_BASE_URL`, which keeps the preflight in external-target
mode: it identifies the served build by the stamp the build job baked into the
artifact rather than by comparing checkout identity, since the job's checkout
did not produce what it serves. A missing bundle fails as a missing bundle.

Unit artifact policy:

- Vitest uses a fixed 30-second per-test timeout and the `default` plus
  `hanging-process` reporters. GitHub Actions adds `github-actions`; the GitLab
  runner adds a JUnit report, which the merge-request test widget reads.
- Coverage uses text output plus an uploaded HTML report, plus Cobertura on the
  GitLab runner for the merge-request coverage visualization (the text
  reporter's "All files" row is what that job's coverage regex reads). Nothing
  else — no LCOV, no JSON summary — is generated without a provider that
  consumes it.

Browser artifact policy:

- Playwright writes HTML, traces, and screenshots under `test-results/`.
- Both providers run the browser tests inside a container that already has the
  browsers, so there is no per-job install or image cache. The worker count
  lives in `playwright.config.ts` (one worker per core on CI), not in either
  pipeline.
- GitHub uploads the reports on every outcome. GitLab uploads on failure only,
  and only the HTML report: it already copies every trace and screenshot into
  its own `data/` directory, so archiving the raw `test-results/` alongside it
  would just double the payload.

## Contract jobs beyond the test set

Two GitLab includes carry contracts that live in separate workflows on GitHub:

- `.gitlab/ci/mr-contract.yml` — the merge-request contract (ADR 0003) as two
  jobs with two diagnostics, `pr-state` (exactly one state claimed) and
  `release-notes` (the release-note content itself). GitHub's counterparts are
  `pr-state.yml` and `pr-content.yml`.
- `.gitlab/ci/secret-detection.yml` — the analyzer plus a gate job that replays
  its report and goes red on any finding the in-repo allowlist does not cover,
  standing in for GitHub secret scanning, which does not survive the
  repository going private.

## The browser job image

`e2e-image/` derives the image the GitLab browser jobs run — the pinned
Playwright browsers plus nginx, using the same `nginx-spa.conf` — so those jobs
run the tests and the docs server in one image pulled from the project's own
container registry (`$CI_REGISTRY_IMAGE/e2e`), with no public-registry pull at
job time. It is built and pushed by the `e2e-image` job in the pipeline itself,
only when the derivation's inputs change; the browser jobs order themselves
behind it with an optional `needs`. GitHub Actions does not consume it: those
E2E jobs pull the upstream Playwright image directly. The image contract, the
build and push procedure, and the rebuild-on-Playwright-bump rule live in
[`e2e-image/README.md`](./e2e-image/README.md).
