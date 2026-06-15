# Docs bundle budget diagnosis

- Slice: HELL-030 diagnosis; HELL-031 remediation; HELL-032 policy classification
- Source stats: `dist/hell-docs/stats.json`
- Budget policy: `docs/release/docs-budget-policy.md`
- Report generator: `tools/docs-bundle-budget-report.mjs`
- Scope: diagnosis plus current remediation status; HELL-050 guards docs route imports, HELL-087 guards shared docs code-preview lazy loading, and remaining split/import work stays in HELL-053, HELL-054, and HELL-056.

## Budget status

| Budget | Current | Warning | Error | Status |
| --- | ---: | ---: | ---: | --- |
| Initial bundle | 821.41 kB | 500.00 kB | 1050.00 kB | accepted warning: 321.42 kB over; accepted ceiling: 822.00 kB; owner: Docs shell / global styles; follow-up: HELL-050 static guard |
| Any component style | 1.35 kB largest | 4.00 kB | 8.00 kB | within warning budget |

## Budget policy

- Policy source: `docs/release/docs-budget-policy.md`
- Policy check: ok
- Accepted current warnings: Initial bundle (HELL-050 static guard)
- Regression budget warnings: none

## Largest initial chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `styles-XOK3VB46.css` | 188.64 kB | Docs global stylesheet (`styles.css`) | `projects/hell-docs/src/styles.css` (188.64 kB)<br>`angular:styles/global:styles` (0 B) |
| 2 | `chunk-MWRJDVZP.js` | 183.74 kB | Angular runtime baseline | `node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_debug_node-chunk.mjs` (98.25 kB)<br>`node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_effect-chunk2.mjs` (24.74 kB)<br>`node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/core.mjs` (16.65 kB) |
| 3 | `chunk-5TBVP3O2.js` | 78.73 kB | Docs router shell | `node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/_router-chunk.mjs` (67.56 kB)<br>`node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/_router_module-chunk.mjs` (10.32 kB)<br>`node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/router.mjs` (0 B) |
| 4 | `chunk-OV2DKPRR.js` | 74.86 kB | Docs search / omnibar shell | `node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_overlay-module-chunk.mjs` (39.50 kB)<br>`dist/hell/fesm2022/hell-ui-angular-omnibar.mjs` (34.24 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_test-environment-chunk.mjs` (138 B) |
| 5 | `chunk-ZHYHX7L7.js` | 57.09 kB | Docs shell primitive dependencies | `node_modules/.pnpm/@angular+platform-browser@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angula_a3fa5d93eb842c3383125d4df5d950df/node_modules/@angular/platform-browser/fesm2022/_dom_renderer-chunk.mjs` (8.10 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_a11y-module-chunk.mjs` (7.96 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_focus-monitor-chunk.mjs` (6.23 kB) |
| 6 | `chunk-5Q7HYX3N.js` | 39.75 kB | Docs app icon registry | `node_modules/.pnpm/@ng-icons+font-awesome@33.2.2/node_modules/@ng-icons/font-awesome/fesm2022/ng-icons-font-awesome-solid.mjs` (33.67 kB)<br>`node_modules/.pnpm/@ng-icons+core@33.2.2_@angular-devkit+schematics@21.2.11_chokidar@5.0.0__@angular+commo_7954e6d23a17fbdcd11ff1e8306c50f8/node_modules/@ng-icons/core/fesm2022/ng-icons-core.mjs` (4.15 kB)<br>`dist/hell/fesm2022/hell-ui-angular-icon.mjs` (1.06 kB) |
| 7 | `chunk-NL4C6NG3.js` | 22.28 kB | Docs theme filter select shell | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-select.mjs` (10.77 kB)<br>`dist/hell/fesm2022/hell-ui-angular-select.mjs` (10.76 kB) |
| 8 | `main-44BFVRTZ.js` | 21.61 kB | Docs app shell bootstrap | `projects/hell-docs/src/app/app.ts` (19.71 kB)<br>`projects/hell-docs/src/app/app.config.ts` (74 B)<br>`projects/hell-docs/src/main.ts` (35 B) |
| 9 | `chunk-EDBENIK4.js` | 21.39 kB | Docs shell primitive dependencies | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-portal.mjs` (20.72 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/cdk.mjs` (23 B) |
| 10 | `chunk-YPUURY4P.js` | 20.69 kB | Docs shell primitive dependencies | `node_modules/.pnpm/@angular+forms@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@_e663037e195188727d713988f22a1e9a/node_modules/@angular/forms/fesm2022/forms.mjs` (20.36 kB) |
| 11 | `chunk-CP5MQCN6.js` | 17.93 kB | Docs shell primitive dependencies | `node_modules/.pnpm/@floating-ui+dom@1.7.6/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs` (7.06 kB)<br>`node_modules/.pnpm/@floating-ui+core@1.7.5/node_modules/@floating-ui/core/dist/floating-ui.core.mjs` (7.00 kB)<br>`node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs` (2.29 kB) |
| 12 | `chunk-NQ3QYNS7.js` | 17.64 kB | Docs toast host | `dist/hell/fesm2022/hell-ui-angular-toast.mjs` (17.18 kB) |

Initial owner summary: the overage is mostly the docs shell, not a single routed page. The shell eagerly owns Angular runtime/router, global Tailwind + Hell composite CSS, the app-shell/omnibar/menu/select controls used for navigation/search/theme UI, and the top-level Font Awesome icon registry.

## Largest lazy chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-RAIQFFML.js` | 406.72 kB | PDF viewer feature (`pdfjs-dist`) | `node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/build/pdf.mjs` (405.44 kB) |
| 2 | `chunk-YT2UJ5RK.js` | 378.37 kB | Table utilities docs page (`/components/data-table`) | `dist/hell/fesm2022/hell-ui-angular-data-table.mjs` (65.98 kB)<br>`node_modules/.pnpm/@tanstack+table-core@8.21.3/node_modules/@tanstack/table-core/build/lib/index.mjs` (49.87 kB)<br>`projects/hell-docs/src/app/pages/components/data-table/examples/example.example.ts?raw` (42.53 kB) |
| 3 | `chunk-N2CVHTIR.js` | 301.63 kB | Code Editor docs page (`/components/code-editor`)<br>Omnibar docs page (`/components/omnibar`)<br>Getting Started guide page | `node_modules/.pnpm/@codemirror+view@6.41.1/node_modules/@codemirror/view/dist/index.js` (164.86 kB)<br>`node_modules/.pnpm/@codemirror+state@6.6.0/node_modules/@codemirror/state/dist/index.js` (46.36 kB)<br>`node_modules/.pnpm/@codemirror+language@6.12.3/node_modules/@codemirror/language/dist/index.js` (23.36 kB) |
| 4 | `chunk-4I3JISD5.js` | 163.92 kB | PDF viewer feature (`pdfjs-dist`) | `node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/web/pdf_viewer.mjs` (163.41 kB) |
| 5 | `chunk-6PDBVC47.js` | 128.03 kB | Code Editor docs page (`/components/code-editor`) | `node_modules/.pnpm/@lezer+javascript@1.5.4/node_modules/@lezer/javascript/dist/index.js` (77.72 kB)<br>`node_modules/.pnpm/@lezer+lr@1.4.10/node_modules/@lezer/lr/dist/index.js` (26.49 kB)<br>`node_modules/.pnpm/@codemirror+autocomplete@6.20.1/node_modules/@codemirror/autocomplete/dist/index.js` (7.54 kB) |
| 6 | `chunk-WED6VJIJ.js` | 51.87 kB | Table utilities docs page (`/components/data-table`)<br>Accessibility guide page | `dist/hell/fesm2022/hell-ui-angular-table.mjs` (51.10 kB) |
| 7 | `chunk-Q2SYLLWQ.js` | 49.47 kB | Audio Player docs page (`/components/audio-player`) | `dist/hell/fesm2022/hell-ui-angular-audio-player.mjs` (35.19 kB)<br>`projects/hell-docs/src/app/pages/components/audio-player/audio-player.page.ts` (7.13 kB)<br>`dist/hell/fesm2022/hell-ui-angular-features-audio-transcript.mjs` (2.83 kB) |
| 8 | `chunk-MLTTFWWD.js` | 40.82 kB | Combobox docs page (`/components/combobox`) | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-combobox.mjs` (16.69 kB)<br>`dist/hell/fesm2022/hell-ui-angular-combobox.mjs` (10.91 kB)<br>`projects/hell-docs/src/app/pages/components/combobox/combobox.page.ts` (3.90 kB) |
| 9 | `chunk-4P73HXCU.js` | 39.67 kB | Docs search index (loaded on search open) | `projects/hell-docs/src/app/docs-search-index.ts` (39.45 kB) |
| 10 | `chunk-MN33FUNG.js` | 34.86 kB | Time Input docs page (`/components/time-input`) | `dist/hell/fesm2022/hell-ui-angular-time-input.mjs` (20.53 kB)<br>`projects/hell-docs/src/app/pages/components/time-input/time-input.page.ts` (4.40 kB)<br>`projects/hell-docs/src/app/pages/components/time-input/examples/examples.example.ts?raw` (2.09 kB) |
| 11 | `chunk-5RLXAMWS.js` | 31.52 kB | Dialog docs page (`/components/dialog`) | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-dialog.mjs` (9.48 kB)<br>`dist/hell/fesm2022/hell-ui-angular-dialog.mjs` (7.23 kB)<br>`projects/hell-docs/src/app/pages/components/dialog/dialog.page.ts` (4.38 kB) |
| 12 | `chunk-T3WEYQ7S.js` | 30.67 kB | Pdf Viewer docs page (`/components/pdf-viewer`) | `dist/hell-pdf-viewer/fesm2022/hell-ui-pdf-viewer.mjs` (29.93 kB) |

Lazy owner summary: the largest lazy chunks are correctly behind feature/page boundaries. The expensive lazy owners are Code editor (CodeMirror/Lezer), PDF viewer (pdf.js core/viewer/runtime), Table utilities (demo code/raw examples + table utilities), and Audio player (Hell audio runtime).

## Component style budget contributors

| Rank | Style chunk | Size | Owner | Status |
| ---: | --- | ---: | --- | --- |
| 1 | `accessibility.page-ZLXKLNGR.css` | 1.35 kB | Accessibility guide page | within warning |
| 2 | `docs-code-viewer-RNDQ5VH3.css` | 1.27 kB | `projects/hell-docs/src/app/shared/docs-code-viewer.ts` | within warning |
| 3 | `code-editor.page-LS2UQFVC.css` | 994 B | Code Editor docs page (`/components/code-editor`) | within warning |
| 4 | `example-boundary-keeps-siblings-interactive.example-YUF5QKYC.css` | 471 B | Flyout docs page (`/components/flyout`) | within warning |
| 5 | `floating-dismissal-harness.page-ZY5KPT2D.css` | 364 B | Testing guide page | within warning |

## Root causes and follow-up fixes

| Warning / risk | Root cause from stats | Owner | Follow-up fix |
| --- | --- | --- | --- |
| Initial bundle exceeds 500 kB by 321.42 kB | Static imports from `main` pull router/runtime plus docs-shell controls; `styles.css` globally imports Tailwind and `@hell-ui/angular/styles/composites`. Top chunks: `styles-XOK3VB46.css`, `chunk-MWRJDVZP.js`, `chunk-5TBVP3O2.js`, `chunk-OV2DKPRR.js`, `chunk-ZHYHX7L7.js`. | Docs shell / global styles | Accepted by the docs budget policy (HELL-050 static guard); HELL-050 guards future eager imports across docs route boundaries, and any undocumented new warning is a regression. |
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
