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
pnpm run build:lib
```

Add focused `pnpm run test:unit`, `pnpm run test:tools`, `pnpm run build:docs`,
`pnpm run e2e`, `pnpm run test:consumer-fixtures`, `pnpm run test:api-report`, or
`pnpm run release:dry-run` when the touched surface warrants it.

`pnpm run test:tools` is the gate for anything under `tools/`: the tooling's own
specs, run by `vitest.tools.config.ts` in a node environment. It is part of
`ci:test:static`, so both providers run it.

`pnpm run e2e` runs a preflight that refuses to start on a host with no
headroom, or against a docs server it cannot identify as this checkout's
current build. Two escape hatches exist, and both make the run say so:

- `HELL_E2E_ALLOW_LOADED_HOST=1` starts anyway on a saturated host. The
  reporter still records the load measured during each failure.
- `HELL_E2E_ALLOW_UNVERIFIED_BUILD=1` measures an external
  `HELL_E2E_BASE_URL` that serves no build stamp, accepting that the run
  cannot say which build it measured.

`pnpm run test:api-report` reads the built library, so it needs a current
`pnpm run build:lib`. It refuses any `dist/hell` that was not produced by a
completed production build of the working tree, and refuses one whose emitted
declarations or package manifest changed afterwards — a `pnpm run watch`
session, an interrupted build, or two builds sharing the directory. It names
which case it found, because an API report from the wrong build names changes
nobody made.

Four limits worth knowing, because a stamp believed to be airtight is worse
than one whose edges are written down.

- It guards what the report reads, not all of `dist/hell`: an edit to a
  `fesm2022` bundle passes, because the report derives from `types/*.d.ts` and
  `package.json` alone.
- It cannot detect a compiler that emits different declarations from identical
  sources. Both builds are completed production builds of the same tree and
  each writes a valid stamp. That case is handled by union sorting, below.
- It catches sources that change and stay changed, but not A to B and back to
  A. The digest is taken before the build and compared after, so a file edited
  and undone while ng-packagr was reading it hashes identically both times: the
  declarations describe B and the stamp says A. An edit-then-undo, or a
  `git stash`, `checkout` or rebase during a 90-second build, reaches this.
- `test:api-report` validates `dist/hell` and then re-reads it into its staging
  copy, so a writer landing between those two steps is extracted from without
  having been validated.

The last two need isolated per-build output with atomic promotion, or a build
lock, to close properly. That is deliberately not built: the cost is out of
proportion to a window that requires someone to edit the tree mid-build. Know
they exist, and rebuild rather than reason about them if a report ever looks
impossible.

### Union member order in API reports

The compiler does not print an inferred union in source order. It prints it in
the order the constituent types were created, which depends on what else the
program had already checked. `resizable.ts` writes `'line' | 'grip'` and emits
`"grip" | "line"`, because `HellResizableHandlePart` creates `'grip'` 420 lines
earlier. Around 33 exported members have unions whose order the compiler
chooses this way, and adding a *private, unexported* alias can reorder one.

So union member order is a fact about compilation, not about the API. The report
input sorts every union before extraction (`tools/api-report-model.mjs`), which
makes the gate immune to reordering while still catching a member being added,
removed or changed — the set is what matters, and TypeScript re-normalises order
when it reads a declaration, so printed order never reaches consumers.

If you see a report diff that only moves union members around, that is a bug in
the sorting, not an API change. Do not "fix" it by naming the union: that mints a
public export to work around a compiler artifact, and there are 33 of them.
