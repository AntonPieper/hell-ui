# hell UI Reference

## Architecture

- Workspace has library `projects/hell` and docs app `projects/hell-docs`.
- Split package `projects/hell-pdf-viewer` owns the PDF viewer.
- Library source is split into `core/`, `primitives/`, `composites/`,
  `features/`, `table/`, `table-tanstack/`, and `styles/components/`.
- `projects/hell/src/public-api.ts` is the public export surface.
- `projects/hell/src/lib/styles/hell.css` imports tokens and each component CSS file.
- `projects/hell/src/lib/core/types.ts` holds shared sizes, variants, and orientation.
- `projects/hell/src/lib/core/styleable.ts` owns the Part Style Map pipeline.
- `projects/hell/src/lib/core/search.ts` provides reusable weighted search.
- `projects/hell/src/lib/core/floating-scope.ts` coordinates floating surfaces
  rendered outside logical hosts.
- `docs/adr/` records product architecture decisions. Reopen an ADR when the
  implementation contradicts it.

## Component Patterns

- Prefer directives when consumers should own markup: buttons, tabs, menus, fields, data tables.
- Use components when intrinsic structure matters: date input, time input, split view, app shell, toaster, audio player.
- Use Angular standalone APIs: `input()`, `output()`, `signal()`, `computed()`, `booleanAttribute`, `numberAttribute`.
- Wrap ng-primitives with `hostDirectives`; alias ngp inputs/outputs to hell names.
- Reuse hell primitives inside composites and features: `HellButton`, `HellIcon`, `HellInput`, `HellPopover`, directive arrays, search service.
- Keep heavy feature dependencies behind narrow entrypoints. PDF viewer lives in
  `projects/hell-pdf-viewer`.
- Preserve justified exceptions from ADRs. Example: table behavior follows
  `docs/adr/tanstack-table-shell.md`; ng-primitives state writes follow
  `docs/adr/ng-primitives-state-adapter.md`.

## Styling Contract

- State and variants flow through `data-*`: size, orientation, invalid, disabled, selected, open, compact, busy, expanded, position.
- Visual values flow through semantic tokens or named component vars: `--color-hell-*`, `--spacing-hell-*`, `--radius-hell-*`, `--shadow-hell-*`, `--hell-*`.
- Component CSS lives in `@layer components`.
- Variants should set internal vars; base declarations read those vars.
- Part Style Maps are the deterministic customization path for migrated
  components. Template `class` is additive, not the conflict-resolution path.
- `unstyled` is legacy compatibility for surfaces not yet migrated; do not add it
  as a new primary customization API.
- Tailwind utilities are acceptable in docs/demo layout, not as library component styling.
- Dynamic geometry may expose a named `--hell-*` contract at one boundary. Do not use imperative styles as visual patches.

## Design Taste

- hell is compact, neutral, and work-focused for business interfaces.
- Use dense but breathable spacing: 4, 6, 8, 12, 16, 20, 24, 32px; controls around 28, 34, 40px.
- App screens use persistent topbar, sidenav, content, and optional secondary panel.
- Cards are for repeated items, demos, modals, and framed tools; page sections stay unframed.
- Prefer tonal layers and 1px borders. Heavy shadows are for overlays and floating surfaces.
- Avoid oversized hero treatment, decorative gradients, giant rounded cards, one-note palettes, and marketing composition in product UI.

## Docs Pattern

- Normal component pages use `article.hd-prose`.
- Wide workflow pages use `article.hd-doc-page`, inner `.hd-prose`, `hd-doc-wide`, and `flush` examples.
- Page shape: H1, concise intro, examples, API, Do, Don't.
- Example components use `ChangeDetectionStrategy.OnPush` and selector `app-<component>-<case>-example`.
- Import examples twice in page files: live component and same file raw via `?raw` with `with { loader: 'text' }`.
- Render through `ExampleTabs`; use `previewClass` for preview layout.
- `docs-search.ts` seed fields are `title`, `path`, `section`, `detail`, `terms`.
- Page search auto-seeds from nav, so missing nav means missing page search result.
- Docs/UI/CSS changes need live-page visual verification with whole-page and
  zoomed affected-region evidence.

## Validation

- `pnpm run lint`: ESLint.
- `pnpm run test:architecture`: architecture rules.
- `pnpm run test:ci-contract`: CI contract rules.
- `pnpm run test:unit`: Vitest suite.
- `pnpm run build:lib`: library package builds.
- `pnpm run build:docs`: docs build and bundle budget report.
- `pnpm run e2e`: Playwright browser tests.
- `pnpm run test:package-consumer`: package-consumer scenarios.
- `pnpm run test:api-report`: API report policy.
- `pnpm run release:dry-run:fast`: release preflight.
- Add focused specs for behavior, a11y state, emitted outputs, overlay scope, responsive/compact state, measurement logic, and root-cause bug fixes.

## Review Posture

- Findings first, with file and line evidence.
- Previous reviews are leads, not proof. Inspect current files.
- For release/a11y/API/package claims, run or cite the strongest relevant local
  command. Name anything not run.
- For manual runtime concerns, start with
  `docs/architecture/manual-runtime-ownership.md`.
- Do not claim production readiness unless lint, architecture, CI contract,
  builds, package-consumer, API, browser/a11y, pack, and release dry-run evidence
  is boringly strong.

## Commit Posture

- Keep commits atomic and conventional.
- Do not mix product code, docs migration, generated artifacts, and unrelated
  cleanup in one commit unless the task explicitly requires the bundle.
- Never include `node_modules`, `dist`, coverage, Playwright reports, local
  review logs, or AppleDouble sidecars.

## Root-Cause Debugging

Trace the actual contract before editing:

1. Input/model/output state.
2. Host directive or local hell behavior.
3. Data attributes.
4. CSS variables and token values.
5. Component CSS selector.
6. DOM/a11y result.

Patch the broken contract layer. Do not mask the symptom with a local class or inline style.
