# CI Contract

CI providers are adapters over shared repo commands. Use the package manager that installed the workspace:

```bash
pnpm ci:install # or: npm run ci:install
pnpm ci:test    # or: npm run ci:test
pnpm ci:build   # or: npm run ci:build
pnpm ci:verify  # or: npm run ci:verify
```

`ci:test` owns unit test, architecture, report, coverage, and contract checks.
Adapters publish these shared artifacts:

- `test-results/vitest-junit.xml`
- `test-results/summary.md`
- `coverage/cobertura-coverage.xml`
- `coverage/coverage-summary.json`

New CI provider checklist:

1. Install Node 22 and your package manager.
2. Run `ci:install` through that package manager.
3. Run `ci:test` and publish `test-results/` plus `coverage/`.
4. Run `ci:build` and publish `dist/` if desired.

Docker path:

```bash
docker build -f Dockerfile.ci --target verify .
```
