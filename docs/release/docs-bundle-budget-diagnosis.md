# Docs bundle budget diagnosis

- Slice: HELL-030 diagnosis; HELL-031 remediation; HELL-032 policy classification
- Source stats: `dist/hell-docs/stats.json`
- Budget policy: `docs/release/docs-budget-policy.md`
- Report generator: `tools/docs-bundle-budget-report.mjs`
- Scope: diagnosis plus current remediation status; remaining split/import work stays in HELL-050, HELL-053, HELL-054, and HELL-056.

## Budget status

| Budget | Current | Warning | Error | Status |
| --- | ---: | ---: | ---: | --- |
| Initial bundle | 775.38 kB | 500.00 kB | 1050.00 kB | accepted warning: 275.38 kB over; accepted ceiling: 776.00 kB; owner: Docs shell / global styles; follow-up: HELL-050 |
| Any component style | 3.98 kB largest | 4.00 kB | 8.00 kB | within warning budget |

## Budget policy

- Policy source: `docs/release/docs-budget-policy.md`
- Policy check: ok
- Accepted current warnings: Initial bundle (HELL-050)
- Regression budget warnings: none

## Largest initial chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `styles-MLBEIBJ3.css` | 169.88 kB | Docs global stylesheet (`styles.css`) | `projects/hell-docs/src/styles.css` (169.87 kB)<br>`angular:styles/global:styles` (0 B) |
| 2 | `chunk-5U5DV66A.js` | 166.37 kB | Angular runtime baseline | `node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_debug_node-chunk.mjs` (97.85 kB)<br>`node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_effect-chunk2.mjs` (24.68 kB)<br>`node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/core.mjs` (5.65 kB) |
| 3 | `chunk-2P637ENN.js` | 78.73 kB | Docs router shell | `node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/_router-chunk.mjs` (67.56 kB)<br>`node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/_router_module-chunk.mjs` (10.32 kB)<br>`node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/router.mjs` (0 B) |
| 4 | `chunk-H7LPC6QE.js` | 73.54 kB | Docs search / omnibar shell | `node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_overlay-module-chunk.mjs` (39.50 kB)<br>`dist/hell/fesm2022/hell-ui-angular-omnibar.mjs` (32.92 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_test-environment-chunk.mjs` (138 B) |
| 5 | `chunk-Y2PQ2D3P.js` | 64.93 kB | Docs shell primitive dependencies | `node_modules/.pnpm/@angular+forms@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@_e663037e195188727d713988f22a1e9a/node_modules/@angular/forms/fesm2022/forms.mjs` (20.45 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_a11y-module-chunk.mjs` (7.96 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_focus-monitor-chunk.mjs` (6.23 kB) |
| 6 | `chunk-KUFCLGY2.js` | 39.75 kB | Docs app icon registry | `node_modules/.pnpm/@ng-icons+font-awesome@33.2.2/node_modules/@ng-icons/font-awesome/fesm2022/ng-icons-font-awesome-solid.mjs` (34.78 kB)<br>`node_modules/.pnpm/@ng-icons+core@33.2.2_@angular-devkit+schematics@21.2.11_chokidar@5.0.0__@angular+commo_7954e6d23a17fbdcd11ff1e8306c50f8/node_modules/@ng-icons/core/fesm2022/ng-icons-core.mjs` (4.15 kB) |
| 7 | `chunk-AMZOXWUL.js` | 39.19 kB | Docs shell primitive dependencies | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-portal.mjs` (20.79 kB)<br>`node_modules/.pnpm/@floating-ui+dom@1.7.6/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs` (7.06 kB)<br>`node_modules/.pnpm/@floating-ui+core@1.7.5/node_modules/@floating-ui/core/dist/floating-ui.core.mjs` (7.00 kB) |
| 8 | `chunk-53VIY3NY.js` | 22.19 kB | Docs theme filter select shell | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-select.mjs` (10.77 kB)<br>`dist/hell/fesm2022/hell-ui-angular-select.mjs` (10.70 kB) |
| 9 | `main-3XPNTX4V.js` | 21.47 kB | Docs app shell bootstrap | `projects/hell-docs/src/app/app.ts` (19.60 kB)<br>`projects/hell-docs/src/app/app.config.ts` (74 B)<br>`projects/hell-docs/src/main.ts` (35 B) |
| 10 | `chunk-J4XGBEB5.js` | 18.43 kB | Docs menu shell | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-menu.mjs` (12.11 kB)<br>`dist/hell/fesm2022/hell-ui-angular-menu.mjs` (5.72 kB) |
| 11 | `chunk-KF7L5VMB.js` | 16.29 kB | Docs app-shell layout | `dist/hell/fesm2022/hell-ui-angular-app-shell.mjs` (15.91 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/layout.mjs` (0 B) |
| 12 | `chunk-5Y4R4ST2.js` | 13.21 kB | Docs toast host | `dist/hell/fesm2022/hell-ui-angular-toast.mjs` (12.77 kB) |

Initial owner summary: the overage is mostly the docs shell, not a single routed page. The shell eagerly owns Angular runtime/router, global Tailwind + Hell composite CSS, the app-shell/omnibar/menu/select controls used for navigation/search/theme UI, and the top-level Font Awesome icon registry.

## Largest lazy chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-EP6S7L75.js` | 426.88 kB | Code Editor docs page (`/components/code-editor`) | `node_modules/.pnpm/@codemirror+view@6.41.1/node_modules/@codemirror/view/dist/index.js` (164.90 kB)<br>`node_modules/.pnpm/@lezer+javascript@1.5.4/node_modules/@lezer/javascript/dist/index.js` (77.73 kB)<br>`node_modules/.pnpm/@codemirror+state@6.6.0/node_modules/@codemirror/state/dist/index.js` (46.38 kB) |
| 2 | `chunk-PQVVO2VM.js` | 406.72 kB | PDF viewer feature (`pdfjs-dist`) | `node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/build/pdf.mjs` (405.44 kB) |
| 3 | `chunk-ZLWXDXUP.js` | 163.92 kB | PDF viewer feature (`pdfjs-dist`) | `node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/web/pdf_viewer.mjs` (163.41 kB) |
| 4 | `chunk-I6OO4DFF.js` | 92.88 kB | Table utilities docs page (`/components/data-table`) | `projects/hell-docs/src/app/pages/components/data-table/examples/example.example.ts?raw` (31.09 kB)<br>`projects/hell-docs/src/app/pages/components/data-table/examples/example.example.ts` (21.13 kB)<br>`dist/hell/fesm2022/hell-ui-angular-features-table-utilities.mjs` (18.35 kB) |
| 5 | `chunk-7I3E462X.js` | 44.05 kB | Audio Player docs page (`/components/audio-player`) | `dist/hell/fesm2022/hell-ui-angular-audio-player.mjs` (33.71 kB)<br>`projects/hell-docs/src/app/pages/components/audio-player/audio-player.page.ts` (6.27 kB)<br>`projects/hell-docs/src/app/pages/components/audio-player/examples/with-title-and-date.example.ts?raw` (626 B) |
| 6 | `chunk-VDEMXGUI.js` | 40.72 kB | Combobox docs page (`/components/combobox`) | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-combobox.mjs` (16.69 kB)<br>`dist/hell/fesm2022/hell-ui-angular-combobox.mjs` (10.85 kB)<br>`projects/hell-docs/src/app/pages/components/combobox/combobox.page.ts` (3.90 kB) |
| 7 | `chunk-WFZCJU6F.js` | 36.07 kB | Time Input docs page (`/components/time-input`) | `dist/hell/fesm2022/hell-ui-angular-time-input.mjs` (21.94 kB)<br>`projects/hell-docs/src/app/pages/components/time-input/time-input.page.ts` (4.42 kB)<br>`projects/hell-docs/src/app/pages/components/time-input/examples/examples.example.ts?raw` (1.91 kB) |
| 8 | `chunk-3RY3SVD3.js` | 36.05 kB | Docs search index (loaded on search open) | `projects/hell-docs/src/app/docs-search-index.ts` (35.83 kB) |
| 9 | `chunk-L7TXSHK5.js` | 33.54 kB | PDF viewer feature entrypoint<br>Pdf Viewer docs page (`/components/pdf-viewer`) | `dist/hell/fesm2022/hell-ui-angular-features-pdf-viewer.mjs` (32.82 kB) |
| 10 | `chunk-OOHGO6KB.js` | 31.49 kB | Dialog docs page (`/components/dialog`) | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-dialog.mjs` (9.48 kB)<br>`dist/hell/fesm2022/hell-ui-angular-dialog.mjs` (7.23 kB)<br>`projects/hell-docs/src/app/pages/components/dialog/dialog.page.ts` (4.38 kB) |
| 11 | `chunk-FM2PZZ5P.js` | 26.17 kB | Accessibility guide page | `projects/hell-docs/src/app/pages/accessibility/accessibility.page.ts` (25.92 kB) |
| 12 | `chunk-3T4MCHVP.js` | 24.12 kB | Flyout docs page (`/components/flyout`) | `dist/hell/fesm2022/hell-ui-angular-flyout.mjs` (8.91 kB)<br>`projects/hell-docs/src/app/pages/testing/floating-dismissal-harness.page.ts` (5.76 kB)<br>`projects/hell-docs/src/app/pages/components/flyout/flyout.page.ts` (4.45 kB) |

Lazy owner summary: the largest lazy chunks are correctly behind feature/page boundaries. The expensive lazy owners are Code editor (CodeMirror/Lezer), PDF viewer (pdf.js core/viewer/runtime), Table utilities (demo code/raw examples + table utilities), and Audio player (Hell audio runtime).

## Component style budget contributors

| Rank | Style chunk | Size | Owner | Status |
| ---: | --- | ---: | --- | --- |
| 1 | `data-table.page-B2WO4VEL.css` | 3.98 kB | Table utilities docs page (`/components/data-table`) | within warning |
| 2 | `accessibility.page-ZP4PIUDH.css` | 1.11 kB | Accessibility guide page | within warning |
| 3 | `code-editor.page-LS2UQFVC.css` | 994 B | Code Editor docs page (`/components/code-editor`) | within warning |
| 4 | `example-boundary-keeps-siblings-interactive.example-TQC5YXT6.css` | 531 B | Flyout docs page (`/components/flyout`) | within warning |
| 5 | `floating-dismissal-harness.page-ZY5KPT2D.css` | 364 B | Testing guide page | within warning |

## Root causes and follow-up fixes

| Warning / risk | Root cause from stats | Owner | Follow-up fix |
| --- | --- | --- | --- |
| Initial bundle exceeds 500 kB by 275.38 kB | Static imports from `main` pull router/runtime plus docs-shell controls; `styles.css` globally imports Tailwind and `@hell-ui/angular/styles/composites`. Top chunks: `styles-MLBEIBJ3.css`, `chunk-5U5DV66A.js`, `chunk-2P637ENN.js`, `chunk-H7LPC6QE.js`, `chunk-Y2PQ2D3P.js`. | Docs shell / global styles | Accepted by the docs budget policy until HELL-050; HELL-050 audits future eager imports across docs route boundaries, and any undocumented new warning is a regression. |
| PDF viewer docs style is isolated from component-style budget | No pdf-viewer component style chunk exceeds the 4 kB warning budget; the docs page serves `@hell-ui/angular/styles/features/pdf-viewer` as a copied lazy asset instead of an Angular component style. | PDF viewer docs page | HELL-031 keeps the lazy boundary; docs budget policy keeps component-style warnings unaccepted unless explicitly documented. |
| PDF lazy weight is large even when initial bundle is protected | `pdfjs-dist/build/pdf.mjs`, `pdfjs-dist/web/pdf_viewer.mjs`, and `hell-ui-angular-features-pdf-viewer.mjs` are the top PDF lazy inputs. | PDF viewer feature | HELL-031 keeps the docs page lazy/isolated; HELL-053 splits PDF viewer into a separate Angular package before beta. |
| Code editor lazy chunk is the largest lazy page | CodeMirror and Lezer packages dominate `code-editor-page`; this is expected feature weight, not initial shell weight. | Code editor feature | HELL-054 locks CodeMirror as a kept optional entrypoint and prevents leaks into root/composites. |
| Table utilities lazy chunk carries demo/raw source cost | `data-table-page` includes live examples plus `?raw` source text and table utilities feature code. | Table utilities feature docs | HELL-056 locks table utilities as a kept feature entrypoint; HELL-050 verifies docs examples stay behind lazy routes. |

## Reproduce

~~~bash
npm run build:lib
npm run build:docs
npm run diagnose:docs-bundle
~~~

`build:docs` enables Angular's `statsJson` option for the production docs app, which writes `dist/hell-docs/stats.json`. Local Angular builder schema documents that `statsJson` generates a `stats.json` file for esbuild analysis; Context7 `/websites/angular_dev` confirms `ng build` uses the application builder options from `angular.json` for app builds.
