# hell UI Reference

## Architecture

- Workspace has library `projects/hell` and docs app `projects/hell-docs`.
- Library source is split into `core/`, `primitives/`, `composites/`, `features/`, and `styles/components/`.
- `projects/hell/src/public-api.ts` is the public export surface.
- `projects/hell/src/lib/styles/hell.css` imports tokens and each component CSS file.
- `projects/hell/src/lib/core/types.ts` holds shared sizes, variants, and orientation.
- `projects/hell/src/lib/core/styleable.ts` documents the `unstyled` opt-out contract.
- `projects/hell/src/lib/core/search.ts` provides reusable weighted search.
- `projects/hell/src/lib/core/overlay-scope.ts` coordinates overlays rendered outside logical hosts.

## Component Patterns

- Prefer directives when consumers should own markup: buttons, tabs, menus, fields, data tables.
- Use components when intrinsic structure matters: date input, time input, split view, app shell, toaster, audio player.
- Use Angular standalone APIs: `input()`, `output()`, `signal()`, `computed()`, `booleanAttribute`, `numberAttribute`.
- Wrap ng-primitives with `hostDirectives`; alias ngp inputs/outputs to hell names.
- Reuse hell primitives inside composites and features: `HellButton`, `HellIcon`, `HellInput`, `HellPopover`, directive arrays, search service.
- Keep heavy feature dependencies inside `features/`; optional publish deps belong in `projects/hell/package.json`.
- Preserve justified exceptions. Example: table column resizing should not reuse flex-pane resizable machinery because table layout differs.

## Styling Contract

- State and variants flow through `data-*`: size, orientation, invalid, disabled, selected, open, compact, busy, expanded, position.
- Visual values flow through semantic tokens or named component vars: `--color-hell-*`, `--spacing-hell-*`, `--radius-hell-*`, `--shadow-hell-*`, `--hell-*`.
- Component CSS lives in `@layer components`.
- Variants should set internal vars; base declarations read those vars.
- `unstyled` must remove default classes while keeping behavior, a11y, and data attrs intact.
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

## Validation

- `pnpm build:lib`: library build.
- `pnpm build:docs`: docs build.
- `pnpm build`: full library and docs build.
- `pnpm test`: Vitest suite.
- Add focused specs for behavior, a11y state, emitted outputs, overlay scope, responsive/compact state, measurement logic, and root-cause bug fixes.

## Root-Cause Debugging

Trace the actual contract before editing:

1. Input/model/output state.
2. Host directive or local hell behavior.
3. Data attributes.
4. CSS variables and token values.
5. Component CSS selector.
6. DOM/a11y result.

Patch the broken contract layer. Do not mask the symptom with a local class or inline style.
