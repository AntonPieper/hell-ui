---
name: hell-ui
description: "Guides work in the hell Angular UI library: primitives, composites, features, styling, docs, exports, and tests. Use when editing projects/hell or projects/hell-docs, adding hell components/directives, changing component CSS/tokens/layout, integrating ng-primitives, or documenting hell APIs."
---

# hell UI

## Quick Start

1. Read nearest matching files before editing.
   - Primitive: `button`, `input`, `tabs`, `menu`, `select`, `combobox`, `search`
   - Composite: `app-shell`, `date-input`, `time-input`, `resizable`, `split-view`, `toast`, `omnibar`
   - Feature: `data-table`, `pdf-viewer`, `code-editor`
2. Search local hell APIs before inventing: `rg "hell[A-Z]|HELL_.*_DIRECTIVES|Ngp" projects/hell/src/lib`.
3. Look up ng-primitives before implementing behavior. Use `ngp-mcp` first; use Context7 for Angular/ng-primitives or other library APIs; use web only as fallback.
4. Reuse existing hell components/directives. If a tiny generalization makes a local primitive/composite reusable, improve that instead of duplicating behavior.
5. Find first-principles root causes and fix them, not just symptoms.

If spawning subagents, tell them to use the available `caveman` skill.

## Non-Negotiables

- Never fix styling through `class="..."`, ad hoc `[class...]`, `ngClass`, `style="..."`, visual `[style.*]`, `style.setProperty(...)`, or `classList`.
- Style through data attributes and CSS custom properties. CSS/Tailwind reacts to those.
- Every styled library part exposes `unstyled`; default host class is gated with `!unstyled()`.
- Library defaults live in `projects/hell/src/lib/styles/components/<name>.css` and are imported by `styles/hell.css`.
- Consumer templates stay owned by consumers when that flexibility outweighs wrapper boilerplate.
- Every component/directive gets docs: page, examples, route, nav, and search seeds.

## Workflows

- Add primitive/composite/feature code under the matching `projects/hell/src/lib/{primitives,composites,features}/<slug>` folder.
- Export public APIs from `projects/hell/src/public-api.ts`; use `HELL_<NAME>_DIRECTIVES` arrays for multi-part APIs.
- Add docs under `projects/hell-docs/src/app/pages/components/<slug>` with `.example.ts` files imported live and as raw `?raw` source.
- Add docs route in `app.routes.ts`, nav item in `App.sections`, and `HD_DOCS_EXAMPLES`/`HD_DOCS_CODE_USAGES` entries.
- Validate with `pnpm build:lib`, targeted `pnpm test`, and `pnpm build:docs` when docs change.

Read [references/REFERENCE.md](references/REFERENCE.md) for architecture, styling, docs, validation, and debugging detail when the task touches those areas.
