# Docs bundle budget diagnosis

- Source stats: `dist/hell-docs/stats.json`
- Budget policy: `docs/release/docs-budget-policy.md`
- Report generator: `tools/docs-bundle-budget-report.mjs`
- Scope: diagnosis plus current remediation status for docs budgets, lazy route imports, shared docs code previews, and feature split boundaries.

## Budget status

| Budget | Current | Warning | Error | Status |
| --- | ---: | ---: | ---: | --- |
| Initial bundle | 866.44 kB | 500.00 kB | 1050.00 kB | accepted warning: 366.44 kB over; accepted ceiling: 870.00 kB; owner: Docs shell / global styles; follow-up: lazy-route import graph guard |
| Any component style | 1.35 kB largest | 4.00 kB | 8.00 kB | within warning budget |

## Budget policy

- Policy source: `docs/release/docs-budget-policy.md`
- Policy check: ok
- Accepted current warnings: Initial bundle (lazy-route import graph guard)
- Regression budget warnings: none

## Accepted warning details

| Budget | Current | Accepted ceiling | Owner | Rationale | Evidence | Follow-up | Expiry |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
| Initial bundle | 866.44 kB | 870.00 kB | Docs shell / global styles | The current warning is the accepted internal-beta docs-shell baseline: Angular runtime/router, global Tailwind, Hell composite/table CSS, app-shell/search/menu/select navigation UI, top-level icons, Button recipe utilities, and tailwind-merge. Heavy feature examples and raw source previews stay behind lazy docs route boundaries. This acceptance is not permission for unrelated eager imports. | `docs/release/docs-bundle-budget-diagnosis.md` | lazy-route import graph guard | Any build that exceeds the accepted ceiling, reaches the initial maximumError threshold, or reopens the production-readiness budget decision. |

## Largest initial chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `styles-YI7MYORF.css` | 207.16 kB | Docs global stylesheet (`styles.css`) | `src/styles.css` (207.15 kB)<br>`angular:styles/global:styles` (0 B) |
| 2 | `chunk-CUNHFVUL.js` | 162.13 kB | Angular runtime baseline | `../../node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_debug_node-chunk.mjs` (97.75 kB)<br>`../../node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_effect-chunk2.mjs` (24.67 kB)<br>`../../node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/core.mjs` (9.62 kB) |
| 3 | `chunk-EQQUMDSV.js` | 78.76 kB | Docs router shell | `../../node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/_router-chunk.mjs` (67.56 kB)<br>`../../node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/_router_module-chunk.mjs` (10.32 kB)<br>`../../node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/router.mjs` (0 B) |
| 4 | `chunk-JPDTEAXN.js` | 69.32 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_overlay-module-chunk.mjs` (45.26 kB)<br>`../../packages/angular/omnibar/omnibar.ts` (19.18 kB)<br>`../../packages/angular/omnibar/omnibar.runtime.ts` (2.56 kB) |
| 5 | `chunk-O7ZUB63C.js` | 59.38 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/tailwind-merge@3.5.0/node_modules/tailwind-merge/dist/bundle-mjs.mjs` (27.06 kB)<br>`../../node_modules/.pnpm/@angular+forms@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@_e663037e195188727d713988f22a1e9a/node_modules/@angular/forms/fesm2022/forms.mjs` (20.47 kB)<br>`../../node_modules/.pnpm/@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2__rxjs@7.8.2/node_modules/@angular/common/fesm2022/_location-chunk.mjs` (3.86 kB) |
| 6 | `chunk-SH4LCJTN.js` | 56.37 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/@angular+platform-browser@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angula_a3fa5d93eb842c3383125d4df5d950df/node_modules/@angular/platform-browser/fesm2022/_dom_renderer-chunk.mjs` (8.09 kB)<br>`../../node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_a11y-module-chunk.mjs` (7.96 kB)<br>`../../node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_focus-monitor-chunk.mjs` (6.23 kB) |
| 7 | `chunk-SFVU2H6S.js` | 38.86 kB | Docs app icon registry | `../../node_modules/.pnpm/@ng-icons+font-awesome@33.2.2/node_modules/@ng-icons/font-awesome/fesm2022/ng-icons-font-awesome-solid.mjs` (32.84 kB)<br>`../../node_modules/.pnpm/@ng-icons+core@33.2.2_@angular-devkit+schematics@21.2.11_chokidar@5.0.0__@angular+commo_7954e6d23a17fbdcd11ff1e8306c50f8/node_modules/@ng-icons/core/fesm2022/ng-icons-core.mjs` (4.15 kB)<br>`../../packages/angular/icon/icon.ts` (986 B) |
| 8 | `main-FI6TPPHO.js` | 21.98 kB | Docs app shell bootstrap | `src/app/app.ts` (19.71 kB)<br>`src/app/app.config.ts` (74 B)<br>`src/main.ts` (35 B) |
| 9 | `chunk-KB44SIGC.js` | 21.38 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-portal.mjs` (20.72 kB)<br>`../../node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/cdk.mjs` (23 B) |
| 10 | `chunk-GIKCDMOI.js` | 21.20 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-menu.mjs` (14.22 kB)<br>`../../packages/angular/menu/menu.ts` (6.19 kB) |
| 11 | `chunk-IVLY54DR.js` | 19.79 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-select.mjs` (10.77 kB)<br>`../../packages/angular/select/select.ts` (8.04 kB) |
| 12 | `chunk-P3SEYM2X.js` | 17.93 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/@floating-ui+dom@1.7.6/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs` (7.06 kB)<br>`../../node_modules/.pnpm/@floating-ui+core@1.7.5/node_modules/@floating-ui/core/dist/floating-ui.core.mjs` (7.00 kB)<br>`../../node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs` (2.29 kB) |

Initial owner summary: the overage is mostly the docs shell, not a single routed page. The shell eagerly owns Angular runtime/router, global Tailwind + Hell composite CSS, the app-shell/omnibar/menu/select controls used for navigation/search/theme UI, and the top-level Font Awesome icon registry.

## Largest lazy chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-WLJNHYMH.js` | 406.72 kB | PDF viewer feature (`pdfjs-dist`) | `../../node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/build/pdf.mjs` (405.44 kB) |
| 2 | `chunk-V6MBJNWH.js` | 301.43 kB | Code Editor docs page (`/components/code-editor`)<br>Omnibar docs page (`/components/omnibar`)<br>Getting Started guide page | `../../node_modules/.pnpm/@codemirror+view@6.41.1/node_modules/@codemirror/view/dist/index.js` (164.86 kB)<br>`../../node_modules/.pnpm/@codemirror+state@6.6.0/node_modules/@codemirror/state/dist/index.js` (46.36 kB)<br>`../../node_modules/.pnpm/@codemirror+language@6.12.3/node_modules/@codemirror/language/dist/index.js` (23.36 kB) |
| 3 | `chunk-SE7YD2IQ.js` | 193.17 kB | Table docs page (`/components/table`) | `../../node_modules/.pnpm/@tanstack+table-core@8.21.3/node_modules/@tanstack/table-core/build/lib/index.mjs` (52.71 kB)<br>`src/app/pages/components/table/examples/tanstack-shell.example.ts?raw` (22.81 kB)<br>`../../node_modules/.pnpm/@tanstack+virtual-core@3.17.0/node_modules/@tanstack/virtual-core/dist/esm/index.js` (20.83 kB) |
| 4 | `chunk-VINDRPQJ.js` | 163.92 kB | PDF viewer feature (`pdfjs-dist`) | `../../node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/web/pdf_viewer.mjs` (163.41 kB) |
| 5 | `chunk-BLKL4JTJ.js` | 128.03 kB | Code Editor docs page (`/components/code-editor`) | `../../node_modules/.pnpm/@lezer+javascript@1.5.4/node_modules/@lezer/javascript/dist/index.js` (77.72 kB)<br>`../../node_modules/.pnpm/@lezer+lr@1.4.10/node_modules/@lezer/lr/dist/index.js` (26.49 kB)<br>`../../node_modules/.pnpm/@codemirror+autocomplete@6.20.1/node_modules/@codemirror/autocomplete/dist/index.js` (7.54 kB) |
| 6 | `chunk-UWFJVWNY.js` | 38.73 kB | Combobox docs page (`/components/combobox`) | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-combobox.mjs` (16.68 kB)<br>`../../packages/angular/combobox/combobox.ts` (8.60 kB)<br>`src/app/pages/components/combobox/combobox.page.ts` (3.90 kB) |
| 7 | `chunk-QCZKO4LK.js` | 38.32 kB | Docs search index (loaded on search open) | `src/app/docs-search-index.ts` (38.10 kB) |
| 8 | `chunk-D675G65D.js` | 30.85 kB | Pdf Viewer docs page (`/components/pdf-viewer`) | `../../packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts` (12.70 kB)<br>`../../packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.runtime.ts` (9.27 kB)<br>`../../packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.adapter.ts` (5.13 kB) |
| 9 | `chunk-VPGGXXUU.js` | 30.83 kB | Accessibility guide page | `src/app/pages/accessibility/accessibility.page.ts` (30.16 kB) |
| 10 | `chunk-NCGP4TO5.js` | 29.00 kB | Date Input docs page (`/components/date-input`)<br>Date Picker docs page (`/components/date-picker`)<br>Field docs page (`/components/field`) | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-date-picker.mjs` (18.10 kB)<br>`../../packages/angular/date-picker/date-picker.ts` (8.21 kB)<br>`../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-date-time.mjs` (2.01 kB) |
| 11 | `chunk-T3EL3DB5.js` | 28.71 kB | Dialog docs page (`/components/dialog`) | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-dialog.mjs` (9.48 kB)<br>`src/app/pages/components/dialog/dialog.page.ts` (4.38 kB)<br>`../../packages/angular/dialog/dialog.ts` (3.74 kB) |
| 12 | `chunk-I7COV3SN.js` | 28.69 kB | Audio Player docs page (`/components/audio-player`) | `../../packages/angular/audio-player/audio-player.ts` (11.98 kB)<br>`src/app/pages/components/audio-player/audio-player.page.ts` (7.13 kB)<br>`../../packages/angular/features/audio-transcript/audio-transcript.ts` (2.67 kB) |

Lazy owner summary: the largest lazy chunks are correctly behind feature/page boundaries. The expensive lazy owners are Code editor (CodeMirror/Lezer), PDF viewer (pdf.js core/viewer/runtime), Table utilities (demo code/raw examples + table utilities), and Audio player (Hell audio runtime).

## Component style budget contributors

| Rank | Style chunk | Size | Owner | Status |
| ---: | --- | ---: | --- | --- |
| 1 | `accessibility.page-ZLXKLNGR.css` | 1.35 kB | Accessibility guide page | within warning |
| 2 | `docs-code-viewer-RNDQ5VH3.css` | 1.27 kB | `apps/docs/src/app/shared/docs-code-viewer.ts` | within warning |
| 3 | `code-editor.page-LS2UQFVC.css` | 994 B | Code Editor docs page (`/components/code-editor`) | within warning |
| 4 | `example-boundary-keeps-siblings-interactive.example-YUF5QKYC.css` | 471 B | Flyout docs page (`/components/flyout`) | within warning |
| 5 | `floating-dismissal-harness.page-ZY5KPT2D.css` | 364 B | Testing guide page | within warning |

## Root causes and follow-up fixes

| Warning / risk | Root cause from stats | Owner | Follow-up fix |
| --- | --- | --- | --- |
| Initial bundle exceeds 500 kB by 366.44 kB | Static imports from `main` pull router/runtime plus docs-shell controls; `styles.css` globally imports Tailwind and explicit Hell entrypoint styles. Top chunks: `styles-YI7MYORF.css`, `chunk-CUNHFVUL.js`, `chunk-EQQUMDSV.js`, `chunk-JPDTEAXN.js`, `chunk-O7ZUB63C.js`. | Docs shell / global styles | Accepted by the docs budget policy (lazy-route import graph guard; expires when: Any build that exceeds the accepted ceiling, reaches the initial maximumError threshold, or reopens the production-readiness budget decision.); the architecture guard blocks future eager imports across docs route boundaries, and any undocumented new warning is a regression. |
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
