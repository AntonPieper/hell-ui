# Docs bundle budget diagnosis

- Slice: HELL-030 diagnosis; HELL-031 remediation; HELL-032 policy classification
- Source stats: `dist/hell-docs/stats.json`
- Budget policy: `docs/release/docs-budget-policy.md`
- Report generator: `tools/docs-bundle-budget-report.mjs`
- Scope: diagnosis plus current remediation status; HELL-050 guards docs route imports, HELL-087 guards shared docs code-preview lazy loading, and remaining split/import work stays in HELL-053, HELL-054, and HELL-056.

## Budget status

| Budget | Current | Warning | Error | Status |
| --- | ---: | ---: | ---: | --- |
| Initial bundle | 790.47 kB | 500.00 kB | 1050.00 kB | accepted warning: 290.47 kB over; accepted ceiling: 792.00 kB; owner: Docs shell / global styles; follow-up: HELL-050 static guard |
| Any component style | 1.27 kB largest | 4.00 kB | 8.00 kB | within warning budget |

## Budget policy

- Policy source: `docs/release/docs-budget-policy.md`
- Policy check: ok
- Accepted current warnings: Initial bundle (HELL-050 static guard)
- Regression budget warnings: none

## Largest initial chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-QBVPE4MI.js` | 179.63 kB | Angular runtime baseline | `node_modules/@angular/core/fesm2022/_debug_node-chunk.mjs` (98.20 kB)<br>`node_modules/@angular/core/fesm2022/_effect-chunk2.mjs` (24.68 kB)<br>`node_modules/@angular/core/fesm2022/core.mjs` (12.71 kB) |
| 2 | `styles-Z3O64PVF.css` | 169.67 kB | Docs global stylesheet (`styles.css`) | `projects/hell-docs/src/styles.css` (169.67 kB)<br>`angular:styles/global:styles` (0 B) |
| 3 | `chunk-ULBEONFT.js` | 78.73 kB | Docs router shell | `node_modules/@angular/router/fesm2022/_router-chunk.mjs` (67.56 kB)<br>`node_modules/@angular/router/fesm2022/_router_module-chunk.mjs` (10.32 kB)<br>`node_modules/@angular/router/fesm2022/router.mjs` (0 B) |
| 4 | `chunk-IWTR64D3.js` | 73.94 kB | Docs search / omnibar shell | `node_modules/@angular/cdk/fesm2022/_overlay-module-chunk.mjs` (39.50 kB)<br>`dist/hell/fesm2022/hell-ui-angular-omnibar.mjs` (33.32 kB)<br>`node_modules/@angular/cdk/fesm2022/_test-environment-chunk.mjs` (138 B) |
| 5 | `chunk-QFLFJU7R.js` | 45.99 kB | Docs shell primitive dependencies | `node_modules/@angular/cdk/fesm2022/_a11y-module-chunk.mjs` (7.96 kB)<br>`node_modules/@angular/cdk/fesm2022/_focus-monitor-chunk.mjs` (6.22 kB)<br>`node_modules/ng-primitives/fesm2022/ng-primitives-interactions.mjs` (5.95 kB) |
| 6 | `chunk-YRSWWUBJ.js` | 40.87 kB | Docs app icon registry | `node_modules/@ng-icons/font-awesome/fesm2022/ng-icons-font-awesome-solid.mjs` (34.78 kB)<br>`node_modules/@ng-icons/core/fesm2022/ng-icons-core.mjs` (4.15 kB)<br>`dist/hell/fesm2022/hell-ui-angular-icon.mjs` (1.06 kB) |
| 7 | `chunk-6RN45KIM.js` | 39.22 kB | Docs shell primitive dependencies | `node_modules/ng-primitives/fesm2022/ng-primitives-portal.mjs` (20.79 kB)<br>`node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs` (7.06 kB)<br>`node_modules/@floating-ui/core/dist/floating-ui.core.mjs` (7.00 kB) |
| 8 | `chunk-7R5FZAQ7.js` | 22.22 kB | Docs theme filter select shell | `node_modules/ng-primitives/fesm2022/ng-primitives-select.mjs` (10.77 kB)<br>`dist/hell/fesm2022/hell-ui-angular-select.mjs` (10.70 kB) |
| 9 | `main-XOCAIYST.js` | 21.47 kB | Docs app shell bootstrap | `projects/hell-docs/src/app/app.ts` (19.60 kB)<br>`projects/hell-docs/src/app/app.config.ts` (74 B)<br>`projects/hell-docs/src/main.ts` (35 B) |
| 10 | `chunk-LIT5DCUO.js` | 20.69 kB | Docs shell primitive dependencies | `node_modules/@angular/forms/fesm2022/forms.mjs` (20.36 kB) |
| 11 | `chunk-XT4MBJG7.js` | 18.43 kB | Docs menu shell | `node_modules/ng-primitives/fesm2022/ng-primitives-menu.mjs` (12.11 kB)<br>`dist/hell/fesm2022/hell-ui-angular-menu.mjs` (5.72 kB) |
| 12 | `chunk-HINVJU5Z.js` | 16.29 kB | Docs app-shell layout | `dist/hell/fesm2022/hell-ui-angular-app-shell.mjs` (15.91 kB)<br>`node_modules/@angular/cdk/fesm2022/layout.mjs` (0 B) |

Initial owner summary: the overage is mostly the docs shell, not a single routed page. The shell eagerly owns Angular runtime/router, global Tailwind + Hell composite CSS, the app-shell/omnibar/menu/select controls used for navigation/search/theme UI, and the top-level Font Awesome icon registry.

## Largest lazy chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-OTQYSJDP.js` | 406.72 kB | PDF viewer feature (`pdfjs-dist`) | `node_modules/pdfjs-dist/build/pdf.mjs` (405.44 kB) |
| 2 | `chunk-NGXEB2L2.js` | 301.73 kB | Code Editor docs page (`/components/code-editor`)<br>Omnibar docs page (`/components/omnibar`)<br>Getting Started guide page | `node_modules/@codemirror/view/dist/index.js` (164.96 kB)<br>`node_modules/@codemirror/state/dist/index.js` (46.36 kB)<br>`node_modules/@codemirror/language/dist/index.js` (23.36 kB) |
| 3 | `chunk-SSUQGWTQ.js` | 194.72 kB | Table utilities docs page (`/components/data-table`) | `dist/hell/fesm2022/hell-ui-angular-data-table.mjs` (43.97 kB)<br>`projects/hell-docs/src/app/pages/components/data-table/examples/example.example.ts?raw` (34.09 kB)<br>`node_modules/@angular/cdk/fesm2022/table.mjs` (29.52 kB) |
| 4 | `chunk-NDY7HXA3.js` | 163.92 kB | PDF viewer feature (`pdfjs-dist`) | `node_modules/pdfjs-dist/web/pdf_viewer.mjs` (163.41 kB) |
| 5 | `chunk-WQ4LAU73.js` | 128.05 kB | Code Editor docs page (`/components/code-editor`) | `node_modules/@lezer/javascript/dist/index.js` (77.72 kB)<br>`node_modules/@lezer/lr/dist/index.js` (26.49 kB)<br>`node_modules/@codemirror/autocomplete/dist/index.js` (7.56 kB) |
| 6 | `chunk-NJWON232.js` | 46.15 kB | Audio Player docs page (`/components/audio-player`) | `dist/hell/fesm2022/hell-ui-angular-audio-player.mjs` (31.96 kB)<br>`projects/hell-docs/src/app/pages/components/audio-player/audio-player.page.ts` (7.13 kB)<br>`dist/hell/fesm2022/hell-ui-angular-features-audio-transcript.mjs` (2.83 kB) |
| 7 | `chunk-646FLEQA.js` | 40.72 kB | Combobox docs page (`/components/combobox`) | `node_modules/ng-primitives/fesm2022/ng-primitives-combobox.mjs` (16.69 kB)<br>`dist/hell/fesm2022/hell-ui-angular-combobox.mjs` (10.85 kB)<br>`projects/hell-docs/src/app/pages/components/combobox/combobox.page.ts` (3.90 kB) |
| 8 | `chunk-JY2222TL.js` | 37.57 kB | Docs search index (loaded on search open) | `projects/hell-docs/src/app/docs-search-index.ts` (37.35 kB) |
| 9 | `chunk-VWIGLYBF.js` | 36.08 kB | Time Input docs page (`/components/time-input`) | `dist/hell/fesm2022/hell-ui-angular-time-input.mjs` (21.94 kB)<br>`projects/hell-docs/src/app/pages/components/time-input/time-input.page.ts` (4.42 kB)<br>`projects/hell-docs/src/app/pages/components/time-input/examples/examples.example.ts?raw` (1.91 kB) |
| 10 | `chunk-JBQZBM5V.js` | 31.48 kB | Dialog docs page (`/components/dialog`) | `node_modules/ng-primitives/fesm2022/ng-primitives-dialog.mjs` (9.48 kB)<br>`dist/hell/fesm2022/hell-ui-angular-dialog.mjs` (7.23 kB)<br>`projects/hell-docs/src/app/pages/components/dialog/dialog.page.ts` (4.38 kB) |
| 11 | `chunk-VO5QVNHQ.js` | 26.97 kB | Pdf Viewer docs page (`/components/pdf-viewer`) | `dist/hell-pdf-viewer/fesm2022/hell-ui-pdf-viewer.mjs` (26.23 kB) |
| 12 | `chunk-MZ6RJESX.js` | 26.48 kB | Accessibility guide page | `projects/hell-docs/src/app/pages/accessibility/accessibility.page.ts` (26.15 kB)<br>`dist/hell/styles/components/table.css` (0 B) |

Lazy owner summary: the largest lazy chunks are correctly behind feature/page boundaries. The expensive lazy owners are Code editor (CodeMirror/Lezer), PDF viewer (pdf.js core/viewer/runtime), Table utilities (demo code/raw examples + table utilities), and Audio player (Hell audio runtime).

## Component style budget contributors

| Rank | Style chunk | Size | Owner | Status |
| ---: | --- | ---: | --- | --- |
| 1 | `docs-code-viewer-LCX7HP3M.css` | 1.27 kB | `projects/hell-docs/src/app/shared/docs-code-viewer.ts` | within warning |
| 2 | `code-editor.page-F4WQTVYL.css` | 994 B | Code Editor docs page (`/components/code-editor`) | within warning |
| 3 | `accessibility.page-74TW3JQM.css` | 957 B | Accessibility guide page | within warning |
| 4 | `example-boundary-keeps-siblings-interactive.example-TQC5YXT6.css` | 531 B | Flyout docs page (`/components/flyout`) | within warning |
| 5 | `floating-dismissal-harness.page-ZY5KPT2D.css` | 364 B | Testing guide page | within warning |

## Root causes and follow-up fixes

| Warning / risk | Root cause from stats | Owner | Follow-up fix |
| --- | --- | --- | --- |
| Initial bundle exceeds 500 kB by 290.47 kB | Static imports from `main` pull router/runtime plus docs-shell controls; `styles.css` globally imports Tailwind and `@hell-ui/angular/styles/composites`. Top chunks: `chunk-QBVPE4MI.js`, `styles-Z3O64PVF.css`, `chunk-ULBEONFT.js`, `chunk-IWTR64D3.js`, `chunk-QFLFJU7R.js`. | Docs shell / global styles | Accepted by the docs budget policy (HELL-050 static guard); HELL-050 guards future eager imports across docs route boundaries, and any undocumented new warning is a regression. |
| PDF viewer docs style is isolated from component-style budget | No pdf-viewer component style chunk exceeds the 4 kB warning budget; the docs page serves `@hell-ui/pdf-viewer/styles` as a copied lazy asset instead of an Angular component style. | PDF viewer docs page | HELL-031 keeps the lazy boundary; docs budget policy keeps component-style warnings unaccepted unless explicitly documented. |
| PDF lazy weight is large even when initial bundle is protected | `pdfjs-dist/build/pdf.mjs`, `pdfjs-dist/web/pdf_viewer.mjs`, and `hell-ui-pdf-viewer.mjs` are the top PDF lazy inputs. | PDF viewer split package | HELL-031 keeps the docs page lazy/isolated; HELL-053 keeps PDF outside the core package. |
| Code editor lazy chunks stay behind lazy docs boundaries | CodeMirror and Lezer packages dominate the code editor route and shared docs code-viewer lazy chunks; this is expected feature weight, not initial shell weight. | Code editor feature / docs code previews | HELL-054 locks CodeMirror as a kept optional entrypoint; HELL-087 keeps shared docs code previews dynamically imported instead of part of the docs shell. |
| Table utilities lazy chunk carries demo/raw source cost | `data-table-page` includes live examples plus `?raw` source text and table utilities feature code. | Table utilities feature docs | HELL-056 locks table utilities as a kept feature entrypoint; HELL-050 verifies docs examples stay behind lazy routes. |

## Reproduce

~~~bash
pnpm run build:lib
pnpm run build:docs
pnpm run diagnose:docs-bundle
~~~

`build:docs` enables Angular's `statsJson` option for the production docs app, which writes `dist/hell-docs/stats.json`. Local Angular builder schema documents that `statsJson` generates a `stats.json` file for esbuild analysis; Context7 `/websites/angular_dev` confirms `ng build` uses the application builder options from `angular.json` for app builds.
