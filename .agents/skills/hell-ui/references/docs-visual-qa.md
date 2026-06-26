# Docs And Visual QA

Read this for docs pages, examples, docs catalog/search, UI/CSS visual changes,
or browser verification.

## Docs Pattern

- Normal component pages use `article.hd-prose`.
- Wide workflow pages use `article.hd-doc-page`, inner `.hd-prose`,
  `hd-doc-wide`, and `flush` examples.
- Page shape: H1, concise intro, examples, API, Do, Don't.
- Example components use `ChangeDetectionStrategy.OnPush` and selector
  `app-<component>-<case>-example`.
- Import examples twice in page files: the live component and the same file raw
  via `?raw` with `with { loader: 'text' }`.
- Render examples through `ExampleTabs`; use `previewClass` for preview layout.
- Register pages in `apps/docs/src/app/docs-catalog.ts`. Page search
  auto-seeds from nav, so missing nav means missing page search result.
- Add example/search seeds in `apps/docs/src/app/docs-search-index.ts`
  with `title`, `path`, `section`, `detail`, and `terms`.
- Keep each page's live examples and raw `?raw` imports inside that lazy route's
  page boundary. Move shared docs widgets to `apps/docs/src/app/shared/`.
- Read `docs/architecture/docs-example-import-boundaries.md` before moving
  examples, heavy docs routes, or shared docs code. Search metadata must not
  import example implementations.
- Docs layout has contracts: normal pages use `article.hd-prose`; wide pages use
  `article.hd-doc-page`, `.hd-prose`, and `.hd-doc-wide`. `.hd-example > *`
  uses `display: contents`, so preview layout classes land on demo children, not
  wrapper hosts.

## Hidden Contract Surfaces

- `/components/flyout?floatingDismissalHarness=1`
- `/components/resizable?resizeHarness=1`
- `/components/table?tableA11yHarness=1`

These harnesses are contract pages, not normal docs content. Use them for
floating dismissal, resize, and table accessibility/browser behavior.

## Visual QA

- Docs/UI/CSS/component-appearance changes need a live docs route with browser
  tooling before handoff.
- Capture whole-page and zoomed affected-region evidence. Check desktop and a
  narrow mobile viewport when layout can change.
- Inspect the actual affected component surface, not only a nearby page shell.
- Check console errors. For interaction or ARIA work, use relevant accessibility
  snapshots, axe smoke tests, or targeted Playwright specs.
- Scroll-container captures can lie. When the affected surface scrolls inside a
  nested container, verify the region in the real scroll context and call out
  any artifact limitations.
- Prefer focused specs before broad `pnpm run e2e`: `e2e/floating-dismissal.spec.ts`,
  `e2e/resize-contracts.spec.ts`, `e2e/table-a11y-contracts.spec.ts`,
  `e2e/docs-axe-smoke.spec.ts`, and `e2e/aria-snapshots.spec.ts`.

Completion criterion: visual work is done when the changed surface has live
evidence, responsive state checked where relevant, console status known, and any
artifact limitation stated.
