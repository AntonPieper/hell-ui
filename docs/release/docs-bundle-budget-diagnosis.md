# Docs bundle budget diagnosis

- Source stats: `dist/hell-docs/stats.json`
- Budget policy: `docs/release/docs-budget-policy.md`
- Report generator: `tools/docs-bundle-budget-report.mjs`
- Scope: diagnosis plus current remediation status for docs budgets, lazy route imports, shared docs code previews, and feature split boundaries.

## Budget status

| Budget | Current | Warning | Error | Status |
| --- | ---: | ---: | ---: | --- |
| Initial bundle | 940.10 kB | 500.00 kB | 1050.00 kB | accepted warning: 440.10 kB over; accepted ceiling: 945.00 kB; owner: Docs shell / global styles; follow-up: lazy-route import graph guard |
| Any component style | 1.41 kB largest | 4.00 kB | 8.00 kB | within warning budget |

## Budget policy

- Policy source: `docs/release/docs-budget-policy.md`
- Policy check: ok
- Accepted current warnings: Initial bundle (lazy-route import graph guard)
- Regression budget warnings: none

## Accepted warning details

| Budget | Current | Accepted ceiling | Owner | Rationale | Evidence | Follow-up | Expiry |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
| Initial bundle | 940.10 kB | 945.00 kB | Docs shell / global styles | The current warning is the accepted Angular 22 and TypeScript 6 internal-beta docs-shell baseline: Angular runtime/router, global Tailwind, Hell composite/table/toast CSS imported from public stylesheet entry points exactly as an external consumer would, app-shell/search/menu/select navigation UI, the full sidebar icon registry, shared docs page-header chrome, and tailwind-merge. The 2026-07 docs example-suite rewrite (simple/composite/all-part-styles examples on every component page) adds ~14 kB: new example Tailwind utilities in the global stylesheet and additional fa-solid icons in the shared eager icon module. Heavy feature examples and raw source previews stay behind lazy docs route boundaries. This acceptance is not permission for unrelated eager imports. | `docs/release/docs-bundle-budget-diagnosis.md` | lazy-route import graph guard | Any build that exceeds the accepted ceiling, reaches the initial maximumError threshold, or reopens the production-readiness budget decision. |

## Largest initial chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `main-XVMPHVSI.js` | 714.52 kB | Docs app shell bootstrap | `../../node_modules/.pnpm/@angular+core@22.0.5_@angular+compiler@22.0.5_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_debug_node-chunk.mjs` (107.20 kB)<br>`../../node_modules/.pnpm/@angular+router@22.0.5_@angular+common@22.0.5_@angular+core@22.0.5_@angular+compiler@22_cf52b306686970b4d8f4ed611e0cf122/node_modules/@angular/router/fesm2022/_router-chunk.mjs` (69.21 kB)<br>`../../node_modules/.pnpm/@ng-icons+font-awesome@33.2.2/node_modules/@ng-icons/font-awesome/fesm2022/ng-icons-font-awesome-solid.mjs` (51.81 kB) |
| 2 | `styles-4CYK24AM.css` | 225.57 kB | Docs global stylesheet (`styles.css`) | `src/styles.css` (225.57 kB)<br>`angular:styles/global:styles` (0 B) |

Initial owner summary: the overage is mostly the docs shell, not a single routed page. The shell eagerly owns Angular runtime/router, global Tailwind + Hell composite CSS, the app-shell/omnibar/menu/select controls used for navigation/search/theme UI, and the top-level Font Awesome icon registry.

## Largest lazy chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-DDRLn8nC.js` | 423.22 kB | Code Editor docs page (`/components/code-editor`)<br>Getting Started guide page<br>Guide guide page | `../../node_modules/.pnpm/@codemirror+view@6.41.1/node_modules/@codemirror/view/dist/index.js` (166.13 kB)<br>`../../node_modules/.pnpm/@lezer+javascript@1.5.4/node_modules/@lezer/javascript/dist/index.js` (78.32 kB)<br>`../../node_modules/.pnpm/@codemirror+state@6.6.0/node_modules/@codemirror/state/dist/index.js` (46.72 kB) |
| 2 | `chunk-Btz3jQzj.js` | 410.61 kB | PDF viewer feature (`pdfjs-dist`) | `../../node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/build/pdf.mjs` (409.32 kB) |
| 3 | `chunk-BPZarotF.js` | 224.14 kB | Table docs page (`/components/table`) | `../../node_modules/.pnpm/@tanstack+table-core@8.21.3/node_modules/@tanstack/table-core/build/lib/index.mjs` (53.22 kB)<br>`src/app/pages/components/table/table.page.ts` (24.59 kB)<br>`src/app/pages/components/table/examples/tanstack-shell.example.ts?raw` (23.03 kB) |
| 4 | `chunk-CwEVAJ1h.js` | 165.48 kB | PDF viewer feature (`pdfjs-dist`) | `../../node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/web/pdf_viewer.mjs` (164.97 kB) |
| 5 | `chunk-D77QTcXQ.js` | 74.64 kB | Docs search index (loaded on search open) | `src/app/docs-search-index.ts` (74.50 kB) |
| 6 | `chunk-DkxGNmks.js` | 72.05 kB | Pdf Viewer docs page (`/components/pdf-viewer`) | `src/app/pages/components/pdf-viewer/pdf-viewer.page.ts` (16.55 kB)<br>`../../packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts` (13.90 kB)<br>`../../packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.runtime.ts` (9.42 kB) |
| 7 | `chunk-BpRBLyNr.js` | 69.21 kB | Combobox docs page (`/components/combobox`) | `src/app/pages/components/combobox/combobox.page.ts` (20.84 kB)<br>`../../node_modules/.pnpm/ng-primitives@0.123.0_2d92e22ef8f64707773e19771a48aacc/node_modules/ng-primitives/fesm2022/ng-primitives-combobox.mjs` (17.52 kB)<br>`../../packages/angular/combobox/combobox.ts` (11.75 kB) |
| 8 | `chunk-Gb5h9l0I.js` | 64.45 kB | Omnibar docs page (`/components/omnibar`) | `src/app/pages/components/omnibar/omnibar.page.ts` (28.34 kB)<br>`src/app/pages/components/omnibar/examples/async-search.example.ts?raw` (5.52 kB)<br>`src/app/pages/components/omnibar/examples/styling.example.ts?raw` (4.72 kB) |
| 9 | `chunk-B8qXrWtL.js` | 52.53 kB | Dialog docs page (`/components/dialog`) | `src/app/pages/components/dialog/dialog.page.ts` (14.55 kB)<br>`../../node_modules/.pnpm/ng-primitives@0.123.0_2d92e22ef8f64707773e19771a48aacc/node_modules/ng-primitives/fesm2022/ng-primitives-dialog.mjs` (9.69 kB)<br>`../../packages/angular/dialog/dialog.ts` (6.03 kB) |
| 10 | `chunk-BgA6b3e7.js` | 49.82 kB | App Shell docs page (`/components/app-shell`) | `src/app/pages/components/app-shell/app-shell.page.ts` (17.73 kB)<br>`src/app/pages/components/app-shell/examples/with-omnibar-menu-avatar.example.ts?raw` (5.62 kB)<br>`src/app/pages/components/app-shell/examples/with-omnibar-menu-avatar.example.ts` (4.21 kB) |
| 11 | `chunk-CVvh8-vq.js` | 49.30 kB | Audio Player docs page (`/components/audio-player`) | `../../packages/angular/audio-player/audio-player.ts` (16.67 kB)<br>`src/app/pages/components/audio-player/audio-player.page.ts` (14.96 kB)<br>`src/app/pages/components/audio-player/examples/voicemail-inbox.example.ts?raw` (2.84 kB) |
| 12 | `chunk-dD0r8cQo.js` | 47.23 kB | Time Input docs page (`/components/time-input`) | `src/app/pages/components/time-input/time-input.page.ts` (15.76 kB)<br>`../../packages/angular/time-input/time-input.ts` (15.40 kB)<br>`src/app/pages/components/time-input/examples/with-field-schedule-row.example.ts?raw` (1.99 kB) |

Lazy owner summary: the largest lazy chunks are correctly behind feature/page boundaries. The expensive lazy owners are Code editor (CodeMirror/Lezer), PDF viewer (pdf.js core/viewer/runtime), Table utilities (demo code/raw examples + table utilities), and Audio player (Hell audio runtime).

## Component style budget contributors

| Rank | Style chunk | Size | Owner | Status |
| ---: | --- | ---: | --- | --- |
| 1 | `docs-code-viewer-AUZACH5W.css` | 1.41 kB | `apps/docs/src/app/shared/docs-code-viewer.ts` | within warning |
| 2 | `accessibility.page-L6DPPVLS.css` | 1.39 kB | Accessibility guide page | within warning |
| 3 | `code-editor.page-226UBHIP.css` | 1.07 kB | Code Editor docs page (`/components/code-editor`) | within warning |
| 4 | `floating-dismissal-harness.page-ZX4M6KTZ.css` | 431 B | Testing guide page | within warning |

## Root causes and follow-up fixes

| Warning / risk | Root cause from stats | Owner | Follow-up fix |
| --- | --- | --- | --- |
| Initial bundle exceeds 500 kB by 440.10 kB | Static imports from `main` pull router/runtime plus docs-shell controls; `styles.css` globally imports Tailwind and explicit Hell entrypoint styles. Top chunks: `main-XVMPHVSI.js`, `styles-4CYK24AM.css`. | Docs shell / global styles | Accepted by the docs budget policy (lazy-route import graph guard; expires when: Any build that exceeds the accepted ceiling, reaches the initial maximumError threshold, or reopens the production-readiness budget decision.); the architecture guard blocks future eager imports across docs route boundaries, and any undocumented new warning is a regression. |
| PDF viewer docs style is isolated from component-style budget | No pdf-viewer component style chunk exceeds the 4 kB warning budget; the docs page serves `@hell-ui/pdf-viewer/styles` as a copied lazy asset instead of an Angular component style. | PDF viewer docs page | Keep the lazy boundary; docs budget policy keeps component-style warnings unaccepted unless explicitly documented. |
| PDF lazy weight is large even when initial bundle is protected | `pdfjs-dist/build/pdf.mjs`, `pdfjs-dist/web/pdf_viewer.mjs`, and `hell-ui-pdf-viewer.mjs` are the top PDF lazy inputs. | PDF viewer split package | Keep the docs page lazy/isolated and keep PDF outside the core package. |
| Code editor lazy chunks stay behind lazy docs boundaries | CodeMirror and Lezer packages dominate the code editor route and shared docs code-viewer lazy chunks; this is expected feature weight, not initial shell weight. | Code editor feature / docs code previews | Keep CodeMirror behind its optional entrypoint and keep shared docs code previews dynamically imported instead of part of the docs shell. |
| Table docs lazy chunk carries demo/raw source cost | `table-page` includes live examples plus `?raw` source text and TanStack table shell examples. | Table docs | Keep table examples behind the lazy docs route and verify the supported `/table` plus `/table-tanstack` paths. |

## Reproduce

~~~bash
pnpm run build:lib
pnpm run build:docs
pnpm run diagnose:docs-bundle
~~~

`build:docs` enables Angular's `statsJson` option for the production docs app, which writes `dist/hell-docs/stats.json`. Local Angular builder schema documents that `statsJson` generates a `stats.json` file for esbuild analysis; Angular's CLI build docs confirm `ng build` uses the application builder options from `apps/docs/angular.json` for app builds.
