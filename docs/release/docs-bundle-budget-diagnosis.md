# Docs bundle budget diagnosis

- Slice: HELL-030 diagnosis; HELL-031 remediation; HELL-032 policy classification
- Source stats: `dist/hell-docs/stats.json`
- Budget policy: `docs/release/docs-budget-policy.md`
- Report generator: `tools/docs-bundle-budget-report.mjs`
- Scope: diagnosis plus current remediation status; HELL-050 guards docs route imports, HELL-087 guards shared docs code-preview lazy loading, HELL-120 records the intentional global table stylesheet needed for production styling, and remaining split/import work stays in HELL-053, HELL-054, and HELL-056.

## Budget status

| Budget | Current | Warning | Error | Status |
| --- | ---: | ---: | ---: | --- |
| Initial bundle | 805.06 kB | 500.00 kB | 1050.00 kB | accepted warning: 305.06 kB over; accepted ceiling: 820.00 kB; owner: Docs shell / global styles; follow-up: HELL-050 static guard + HELL-120 table CSS guard |
| Any component style | 1.29 kB largest | 4.00 kB | 8.00 kB | within warning budget |

## Budget policy

- Policy source: `docs/release/docs-budget-policy.md`
- Policy check: ok
- Accepted current warnings: Initial bundle (HELL-050 static guard + HELL-120 table CSS guard)
- Regression budget warnings: none

## Largest initial chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-GFDEGWDO.js` | 183.62 kB | Angular runtime baseline | `node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_debug_node-chunk.mjs` (98.22 kB)<br>`node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_effect-chunk2.mjs` (24.68 kB)<br>`node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/core.mjs` (16.65 kB) |
| 2 | `styles-N4CYBOYN.css` | 180.18 kB | Docs global stylesheet (`styles.css`) | `projects/hell-docs/src/styles.css` (180.18 kB, including the intentional global `@hell-ui/angular/styles/table` import from HELL-120)<br>`angular:styles/global:styles` (0 B) |
| 3 | `chunk-R4KRB32A.js` | 78.73 kB | Docs router shell | `node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/_router-chunk.mjs` (67.56 kB)<br>`node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/_router_module-chunk.mjs` (10.32 kB)<br>`node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/router.mjs` (0 B) |
| 4 | `chunk-7QE2LEZ5.js` | 73.94 kB | Docs search / omnibar shell | `node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_overlay-module-chunk.mjs` (39.50 kB)<br>`dist/hell/fesm2022/hell-ui-angular-omnibar.mjs` (33.32 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_test-environment-chunk.mjs` (138 B) |
| 5 | `chunk-UVKHLKUU.js` | 57.09 kB | Docs shell primitive dependencies | `node_modules/.pnpm/@angular+platform-browser@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angula_a3fa5d93eb842c3383125d4df5d950df/node_modules/@angular/platform-browser/fesm2022/_dom_renderer-chunk.mjs` (8.10 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_a11y-module-chunk.mjs` (7.96 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_focus-monitor-chunk.mjs` (6.23 kB) |
| 6 | `chunk-YB7J6G42.js` | 40.87 kB | Docs app icon registry | `node_modules/.pnpm/@ng-icons+font-awesome@33.2.2/node_modules/@ng-icons/font-awesome/fesm2022/ng-icons-font-awesome-solid.mjs` (34.78 kB)<br>`node_modules/.pnpm/@ng-icons+core@33.2.2_@angular-devkit+schematics@21.2.11_chokidar@5.0.0__@angular+commo_7954e6d23a17fbdcd11ff1e8306c50f8/node_modules/@ng-icons/core/fesm2022/ng-icons-core.mjs` (4.15 kB)<br>`dist/hell/fesm2022/hell-ui-angular-icon.mjs` (1.06 kB) |
| 7 | `chunk-MV6R4T4N.js` | 39.22 kB | Docs shell primitive dependencies | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-portal.mjs` (20.79 kB)<br>`node_modules/.pnpm/@floating-ui+dom@1.7.6/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs` (7.06 kB)<br>`node_modules/.pnpm/@floating-ui+core@1.7.5/node_modules/@floating-ui/core/dist/floating-ui.core.mjs` (7.00 kB) |
| 8 | `chunk-KBPGFCJV.js` | 22.22 kB | Docs theme filter select shell | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-select.mjs` (10.77 kB)<br>`dist/hell/fesm2022/hell-ui-angular-select.mjs` (10.70 kB) |
| 9 | `main-ULCM7NSN.js` | 21.49 kB | Docs app shell bootstrap | `projects/hell-docs/src/app/app.ts` (19.62 kB)<br>`projects/hell-docs/src/app/app.config.ts` (74 B)<br>`projects/hell-docs/src/main.ts` (35 B) |
| 10 | `chunk-TVFSZBKZ.js` | 20.69 kB | Docs shell primitive dependencies | `node_modules/.pnpm/@angular+forms@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@_e663037e195188727d713988f22a1e9a/node_modules/@angular/forms/fesm2022/forms.mjs` (20.36 kB) |
| 11 | `chunk-43ZYXX4B.js` | 18.43 kB | Docs menu shell | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-menu.mjs` (12.11 kB)<br>`dist/hell/fesm2022/hell-ui-angular-menu.mjs` (5.72 kB) |
| 12 | `chunk-QGNO45YU.js` | 16.29 kB | Docs app-shell layout | `dist/hell/fesm2022/hell-ui-angular-app-shell.mjs` (15.91 kB)<br>`node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/layout.mjs` (0 B) |

Initial owner summary: the overage is mostly the docs shell, not a single routed page. The shell eagerly owns Angular runtime/router, global Tailwind + Hell composite CSS, the app-shell/omnibar/menu/select controls used for navigation/search/theme UI, and the top-level Font Awesome icon registry.

## Largest lazy chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-RAIQFFML.js` | 406.72 kB | PDF viewer feature (`pdfjs-dist`) | `node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/build/pdf.mjs` (405.44 kB) |
| 2 | `chunk-DXDS2YC5.js` | 359.96 kB | Table utilities docs page (`/components/data-table`) | `dist/hell/fesm2022/hell-ui-angular-data-table.mjs` (55.14 kB)<br>`node_modules/.pnpm/@tanstack+table-core@8.21.3/node_modules/@tanstack/table-core/build/lib/index.mjs` (49.87 kB)<br>`projects/hell-docs/src/app/pages/components/data-table/examples/example.example.ts?raw` (41.08 kB) |
| 3 | `chunk-4GW5HL5Y.js` | 301.63 kB | Code Editor docs page (`/components/code-editor`)<br>Omnibar docs page (`/components/omnibar`)<br>Getting Started guide page | `node_modules/.pnpm/@codemirror+view@6.41.1/node_modules/@codemirror/view/dist/index.js` (164.86 kB)<br>`node_modules/.pnpm/@codemirror+state@6.6.0/node_modules/@codemirror/state/dist/index.js` (46.36 kB)<br>`node_modules/.pnpm/@codemirror+language@6.12.3/node_modules/@codemirror/language/dist/index.js` (23.36 kB) |
| 4 | `chunk-4I3JISD5.js` | 163.92 kB | PDF viewer feature (`pdfjs-dist`) | `node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/web/pdf_viewer.mjs` (163.41 kB) |
| 5 | `chunk-R2574F33.js` | 128.03 kB | Code Editor docs page (`/components/code-editor`) | `node_modules/.pnpm/@lezer+javascript@1.5.4/node_modules/@lezer/javascript/dist/index.js` (77.72 kB)<br>`node_modules/.pnpm/@lezer+lr@1.4.10/node_modules/@lezer/lr/dist/index.js` (26.49 kB)<br>`node_modules/.pnpm/@codemirror+autocomplete@6.20.1/node_modules/@codemirror/autocomplete/dist/index.js` (7.54 kB) |
| 6 | `chunk-AWCGXQHQ.js` | 46.15 kB | Audio Player docs page (`/components/audio-player`) | `dist/hell/fesm2022/hell-ui-angular-audio-player.mjs` (31.96 kB)<br>`projects/hell-docs/src/app/pages/components/audio-player/audio-player.page.ts` (7.13 kB)<br>`dist/hell/fesm2022/hell-ui-angular-features-audio-transcript.mjs` (2.83 kB) |
| 7 | `chunk-JZWWYR4U.js` | 40.73 kB | Combobox docs page (`/components/combobox`) | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-combobox.mjs` (16.69 kB)<br>`dist/hell/fesm2022/hell-ui-angular-combobox.mjs` (10.85 kB)<br>`projects/hell-docs/src/app/pages/components/combobox/combobox.page.ts` (3.90 kB) |
| 8 | `chunk-65VSIOXV.js` | 40.45 kB | Table utilities docs page (`/components/data-table`)<br>Accessibility guide page | `dist/hell/fesm2022/hell-ui-angular-table.mjs` (39.84 kB)<br>`dist/hell/styles/table.css` (0 B) |
| 9 | `chunk-THCBCPB3.js` | 38.89 kB | Docs search index (loaded on search open) | `projects/hell-docs/src/app/docs-search-index.ts` (38.66 kB) |
| 10 | `chunk-HMUA723M.js` | 36.08 kB | Time Input docs page (`/components/time-input`) | `dist/hell/fesm2022/hell-ui-angular-time-input.mjs` (21.94 kB)<br>`projects/hell-docs/src/app/pages/components/time-input/time-input.page.ts` (4.42 kB)<br>`projects/hell-docs/src/app/pages/components/time-input/examples/examples.example.ts?raw` (1.91 kB) |
| 11 | `chunk-P4CNMKDR.js` | 31.49 kB | Dialog docs page (`/components/dialog`) | `node_modules/.pnpm/ng-primitives@0.117.2_@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.1_299399a25444f37ea31a0eb7bc8bafde/node_modules/ng-primitives/fesm2022/ng-primitives-dialog.mjs` (9.48 kB)<br>`dist/hell/fesm2022/hell-ui-angular-dialog.mjs` (7.23 kB)<br>`projects/hell-docs/src/app/pages/components/dialog/dialog.page.ts` (4.38 kB) |
| 12 | `chunk-5S3MVAGC.js` | 29.32 kB | Resizable docs page (`/components/resizable`) | `dist/hell/fesm2022/hell-ui-angular-resizable.mjs` (15.97 kB)<br>`projects/hell-docs/src/app/pages/components/resizable/resizable.page.ts` (3.55 kB)<br>`projects/hell-docs/src/app/pages/components/resizable/resizable-contract-harness.page.ts` (2.16 kB) |

Lazy owner summary: the largest lazy chunks are correctly behind feature/page boundaries. The expensive lazy owners are Code editor (CodeMirror/Lezer), PDF viewer (pdf.js core/viewer/runtime), Table utilities (demo code/raw examples + table utilities), and Audio player (Hell audio runtime).

## Component style budget contributors

| Rank | Style chunk | Size | Owner | Status |
| ---: | --- | ---: | --- | --- |
| 1 | `accessibility.page-U3EO6PVP.css` | 1.29 kB | Accessibility guide page | within warning |
| 2 | `docs-code-viewer-RNDQ5VH3.css` | 1.27 kB | `projects/hell-docs/src/app/shared/docs-code-viewer.ts` | within warning |
| 3 | `code-editor.page-LS2UQFVC.css` | 994 B | Code Editor docs page (`/components/code-editor`) | within warning |
| 4 | `example-boundary-keeps-siblings-interactive.example-TQC5YXT6.css` | 531 B | Flyout docs page (`/components/flyout`) | within warning |
| 5 | `floating-dismissal-harness.page-ZY5KPT2D.css` | 364 B | Testing guide page | within warning |

## Root causes and follow-up fixes

| Warning / risk | Root cause from stats | Owner | Follow-up fix |
| --- | --- | --- | --- |
| Initial bundle exceeds 500 kB by 305.06 kB | Static imports from `main` pull router/runtime plus docs-shell controls; `styles.css` globally imports Tailwind, `@hell-ui/angular/styles/composites`, and the intentional HELL-120 table stylesheet. Top chunks: `chunk-GFDEGWDO.js`, `styles-N4CYBOYN.css`, `chunk-R4KRB32A.js`, `chunk-7QE2LEZ5.js`, `chunk-UVKHLKUU.js`. | Docs shell / global styles | Accepted by the docs budget policy (HELL-050 static guard + HELL-120 table CSS guard); HELL-050 guards future eager imports across docs route boundaries, HELL-120 blocks route TypeScript table CSS imports that produced unstyled production tables, and any undocumented new warning is a regression. |
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
