# CI Contract

CI providers are adapters over shared repo commands:

```bash
pnpm ci:install
pnpm ci:test
pnpm ci:build
pnpm ci:verify
```

`pnpm ci:test` owns unit test, architecture, report, coverage, and contract checks.
Adapters publish these shared artifacts:

- `test-results/vitest-junit.xml`
- `test-results/summary.md`
- `coverage/cobertura-coverage.xml`
- `coverage/coverage-summary.json`

New CI provider checklist:

1. Install Node 22 and pnpm.
2. Run `pnpm ci:install`.
3. Run `pnpm ci:test` and publish `test-results/` plus `coverage/`.
4. Run `pnpm ci:build` and publish `dist/` if desired.

Docker path:

```bash
docker build -f Dockerfile.ci --target verify .
```
