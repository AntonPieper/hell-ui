---
name: hell-ui
description: "Guides direct work in the hell Angular UI library: primitives, composites, features, styling, docs, exports, tests, reviews, and commits. Use when editing this repo's projects/hell, projects/hell-docs, projects/hell-pdf-viewer, docs, tools, or release gates."
---

# hell UI

## First Read

1. Read `AGENTS.md`, `CONTEXT.md`, and `docs/agents/domain.md`.
2. Read ADRs or architecture docs that touch the area you are changing:
   `docs/adr/`, `docs/architecture/`, and `docs/release/`.
3. Read nearest matching source files before editing.
   - Primitive: `button`, `input`, `tabs`, `menu`, `select`, `combobox`, `search`, `table`
   - Composite: `app-shell`, `date-input`, `time-input`, `resizable`, `split-view`, `toast`, `omnibar`, `audio-player`
   - Feature/package: `code-editor`, `audio-transcript`, `table-tanstack`, `hell-pdf-viewer`
4. Search local hell APIs before inventing:
   `rg "hell[A-Z]|HELL_.*_DIRECTIVES|Ngp" projects/hell/src/lib`.
5. Use configured docs/MCP before relying on current Angular, ng-primitives, CDK,
   CodeMirror, pdf.js, TanStack, Playwright, pnpm, or Vercel API details.
6. Reuse existing hell components/directives. If a small generalization makes a
   local primitive or composite reusable, improve that instead of duplicating.

Read [references/REFERENCE.md](references/REFERENCE.md) for architecture,
styling, docs, validation, review, commit, and debugging detail when the task
touches those areas.

## Working Rules

- Work on one vertical task. Use GitHub Issues when multi-session tracking is
  useful.
- Keep public API, secondary entrypoints, package-consumer scenarios, API
  reports, docs, and architecture checks in sync when public surface changes.
- Prefer deleting bespoke infrastructure over adding wrappers.
- Do not mutate private third-party state unless an ADR explicitly blesses the
  seam and the guard/tests stay current.
- For docs/UI/CSS/component-appearance work, verify a live docs route with
  browser tooling before handoff. Capture whole-page and zoomed affected-region
  evidence when visuals changed.
- Use subagents only when the user explicitly asks for them. Give each subagent
  one bounded question or disjoint write scope, and tell it not to revert edits
  made by others.

## Styling Contract

- Do not patch library visuals through ad hoc template classes, `ngClass`,
  inline styles, visual `[style.*]`, `style.setProperty(...)`, or `classList`.
- Style library defaults through Part Style Maps, data attributes, CSS custom
  properties, semantic tokens, and component CSS under
  `projects/hell/src/lib/styles/components/`.
- Migrated components use Part Style Maps as the deterministic customization
  path. Do not add new `unstyled`-first APIs for migrated surfaces.
- Consumer templates stay owned by consumers when that flexibility outweighs
  wrapper boilerplate.
- Every public component/directive gets docs: page, examples, route, nav, and
  search seeds.

## Validation

Use the narrowest validation that proves the change, then widen before commit:

- Static/code: `pnpm run lint`, `pnpm run test:architecture`,
  `pnpm run test:ci-contract`
- Unit behavior: `pnpm run test:unit`
- Library packages: `pnpm run build:lib`, `pnpm run test:api-report`,
  `pnpm run test:package-pack`
- Docs/UI: `pnpm run build:docs`, focused `pnpm run e2e`
- Consumer/release: `pnpm run test:package-consumer`,
  `pnpm run release:dry-run:fast`

## Before Commit

- Inspect `git status` and `git diff`.
- Confirm the diff is atomic. Split unrelated edits before committing.
- Run the validation ladder appropriate to the diff.
- Ask for a fresh-context review when code or public behavior changed.
- Use a conventional message such as `fix(scope): ...`,
  `refactor(scope): ...`, `test(scope): ...`, `docs(scope): ...`, or
  `chore(scope): ...`. Keep the body terse: what changed, why, validation.
