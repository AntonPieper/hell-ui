# Validation And Release

Read this before choosing validation, changing package/public contracts, making
release claims, or preparing a handoff that cites proof.

## Validation Ladder

Use the narrowest command set that proves the changed contract, then widen
before commit:

- Static/code: `pnpm run lint`, `pnpm run test:architecture`,
  `pnpm run test:ci-contract`
- Unit behavior: `pnpm run test:unit`
- Library packages: `pnpm run build:lib`, `pnpm run test:api-report`,
  `pnpm run test:package-pack`
- Docs/UI: `pnpm run build:docs`, focused `pnpm run e2e`, and live Visual QA
- Consumer/release: `pnpm run test:package-consumer -- --minimal-deps`,
  `pnpm run release:dry-run:fast`, `pnpm run release:dry-run:full`

Playwright is grouped by docs axe, ARIA snapshots, component a11y contracts,
overlay/keyboard behavior, table/resize behavior, and UI regressions. Prefer the
focused spec that matches the changed behavior before running the full suite.

For public API/package/release work, the usual widening path is lint,
architecture, CI contract, build lib, API report, package-consumer, pack audit,
and release dry-run when imports, peers, packed files, reports, or release
claims are affected.

## Evidence Rules

- Only current command/browser evidence proves the current checkout. Treat
  review notes, issue text, and existing docs as claims until verified.
- Release language stays internal-beta, beta, or experimental until
  `pnpm run release:dry-run:full` and `pnpm run e2e` pass against fresh
  evidence for the current clean commit.
- `release:dry-run --fast` is a preflight. Full dry-run adds unit tests,
  selected strict-peer package-consumer scenarios, API report, docs build, and
  JSON/log evidence under `test-results/release-evidence`.
- Do not commit or package `node_modules`, `dist`, coverage, Playwright reports,
  test output, local review logs, or AppleDouble sidecars.

Completion criterion: validation is done when changed surface, chosen command or
browser proof, result, and any skipped relevant gate are all explicit.
