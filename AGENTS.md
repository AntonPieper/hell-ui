# AGENTS.md

## Durable repository facts

- Use pnpm only. Do not add npm fallback commands or lockfiles.
- Use GitHub Issues for work tracking when a ticket is useful. See
  `docs/agents/issue-tracker.md`.
- Use the triage labels in `docs/agents/triage-labels.md`.
- This is a single-context repo. Read `CONTEXT.md` and relevant files in
  `docs/adr/` before changing architecture or public contracts.
- For current Angular, ng-primitives, CDK, CodeMirror, pdf.js, TanStack,
  Playwright, pnpm, or Vercel facts, use the configured docs/MCP path before
  guessing from memory.
- For docs, UI, CSS, and component-appearance work, verify a live page with
  browser tooling before handoff. Capture whole-page and zoomed affected-region
  evidence when visuals changed.
- Use subagents only when the user explicitly asks for delegation, subagents,
  parallel agents, scouts, or a fresh reviewer. Give each one a bounded task.
- Do not commit or package `node_modules`, `dist`, coverage, Playwright reports,
  test output, local review logs, or AppleDouble `._*` sidecars.

## Workflow Docs

### Issue tracker

Issues and PRDs live in GitHub Issues for `AntonPieper/hell-ui`; external pull
requests are reviewed as pull requests, not triaged as requests. See
`docs/agents/issue-tracker.md`.

### Triage labels

Use these GitHub triage labels: `needs-triage`, `needs-info`,
`ready-for-agent`, `ready-for-human`, and `wontfix`. See
`docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context layout: root `CONTEXT.md` plus product ADRs in
`docs/adr/`. See `docs/agents/domain.md`.

## Default validation ladder

Use the narrowest validation that proves the change, then widen before commit:

```bash
pnpm run lint
pnpm run test:architecture
pnpm run test:ci-coverage
pnpm run build:lib
```

Add focused `pnpm run test:unit`, `pnpm run build:docs`, `pnpm run e2e`,
`pnpm run test:package-consumer`, `pnpm run test:api-report`, or
`pnpm run release:dry-run:fast` when the touched surface warrants it.
