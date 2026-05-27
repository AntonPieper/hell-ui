# CI Contract

CI providers are adapters over shared repo commands. The repository workspace
is pnpm-first and CI-backed by the checked-in `pnpm-lock.yaml`:

```bash
pnpm ci:install
pnpm ci:playwright
pnpm ci:test
pnpm ci:build
pnpm ci:verify
```

`ci:test` owns unit test, architecture, report, coverage, and contract checks.
Unit tests run through `test:unit` with Vitest's default worker pool and coverage
thresholds enabled; CI adapters should not clamp `VITEST_MAX_WORKERS` unless a
provider-specific incident is being debugged. The meta root serial command
(`npm run hell:test:unit`) is the default for constrained local/agent containers,
not the CI contract.

Adapters publish these shared artifacts:

- `test-results/vitest-junit.xml`
- `test-results/summary.md`
- `coverage/cobertura-coverage.xml`
- `coverage/coverage-summary.json`

New CI provider checklist:

1. Install Node 22 and enable pnpm through Corepack.
2. Run `pnpm ci:install`.
3. Run `pnpm ci:playwright` before browser tests.
4. Run `pnpm ci:test` and publish `test-results/` plus `coverage/`.
5. Run `pnpm ci:build` and publish `dist/` if desired.

Docker path:

```bash
docker build -f Dockerfile.ci --target verify .
```
