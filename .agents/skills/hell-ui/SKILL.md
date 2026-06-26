---
name: hell-ui
description: "Local-first hell-ui work: orient, implement, or review Angular library changes involving public contracts, Part Style Maps, docs/visual QA, runtime seams, package/release gates, issue/domain workflows, or commits in this repo."
---

# hell UI

hell-ui work is **local-first** and **contract-driven**: prove the existing
shape, then change the smallest contract that satisfies the task.

## Orientation Gate

Complete this gate before editing:

1. Read `AGENTS.md`, `CONTEXT.md`, and `docs/agents/domain.md`.
2. Identify touched source, docs, tests, exports, package entrypoints, and
   architecture guards with file search.
3. Search for existing Hell APIs and precedent before inventing:
   `rg "Hell[A-Z]|hell[A-Z]|HELL_.*_DIRECTIVES|Ngp|HellUi|PartStyle|data-slot" packages/angular apps/docs/src`.
4. Open the matching branch reference below before editing or reviewing that
   branch.
5. Use configured docs/MCP before relying on current Angular, ng-primitives,
   CDK, CodeMirror, pdf.js, TanStack, Playwright, pnpm, or Vercel facts.

The gate is complete when relevant domain terms and ADRs are named or ruled out,
the touched contract files are known, and the reuse/generalization path or reason
to create new surface is clear.

## Branch References

Open only the branch files that match the work. If more than one branch matches,
read the specific contract branch first, then any cross-cutting validation or
risk branch.

- Architecture, component patterns, or package boundary:
  [repo-contracts.md](references/repo-contracts.md).
- Table primitives, TanStack shell, table docs, or virtual rows:
  [table-contract.md](references/table-contract.md).
- Styling, Part Style Maps, themes, or design polish:
  [styling.md](references/styling.md).
- Docs pages, examples, UI/CSS visuals, or browser evidence:
  [docs-visual-qa.md](references/docs-visual-qa.md).
- Runtime seams, browser behavior, or hard debugging:
  [runtime-debugging.md](references/runtime-debugging.md).
- Validation, package checks, release evidence, or production language:
  [validation-release.md](references/validation-release.md).
- Issues, PRDs, triage, domain terms, or ADR conflicts:
  [issues-domain.md](references/issues-domain.md).
- Reviews or explicit commit requests:
  [review-commit.md](references/review-commit.md).
- Cross-cutting risk checklist for package, visual, styling, runtime, or
  production work:
  [risk-checks.md](references/risk-checks.md).

## Core Rules

- Local-first: reuse Hell primitives, composites, directives, shared style
  helpers, and docs patterns. If the task needs a small generalization, improve
  the local primitive or composite instead of adding a one-off wrapper.
- Contract: public surface changes keep exports, secondary entrypoints, docs
  pages/examples/routes/nav/search, API reports, package-consumer scenarios, and
  architecture checks in sync. Use `CONTEXT.md` vocabulary in user-facing output.
- Styling: library visuals go through Part Style Maps, Public Parts/data-slot,
  data attributes, semantic tokens, CSS custom properties, and component CSS. Do
  not use ad hoc template classes, `ngClass`, inline visual styles,
  `style.setProperty(...)`, or `classList` as visual patches.
- Third-party seams: do not mutate private third-party state unless an ADR
  explicitly blesses the seam and the guard/tests stay current.
- Visual QA: docs/UI/CSS/component-appearance changes need a live docs route
  checked with browser tooling plus whole-page and affected-region evidence.

## Validation

Use the narrowest command set that proves the changed contract, then widen
before commit. Start from `AGENTS.md`'s validation ladder and the branch detail
in [validation-release.md](references/validation-release.md).

Validation is complete when the commands match the touched surface, results are
recorded, and skipped relevant checks have a reason.

For commit requests, open [review-commit.md](references/review-commit.md) and
finish its commit criterion before committing.
