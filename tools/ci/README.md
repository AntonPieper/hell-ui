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
provider-specific incident is being debugged. The meta root serial command
(`pnpm run hell:test:unit`) is the default for constrained local/agent containers,
not the CI contract.

Adapters publish these shared artifacts:

- `test-results/vitest-junit.xml`
- `test-results/summary.md`
- `coverage/cobertura-coverage.xml`
- `coverage/coverage-summary.json`

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
