# Docs bundle budget diagnosis

- Slice: HELL-030
- Source stats: `dist/hell-docs/stats.json`
- Report generator: `tools/docs-bundle-budget-report.mjs`
- Scope: diagnosis only; remediation remains in HELL-031, HELL-032, HELL-050, HELL-053, HELL-054, and HELL-056.

## Budget status

| Budget | Current | Warning | Error | Status |
| --- | ---: | ---: | ---: | --- |
| Initial bundle | 770.83 kB | 500.00 kB | 1050.00 kB | warning: 270.82 kB over |
| Any component style | 5.31 kB largest | 4.00 kB | 8.00 kB | warning: 1 style chunk over budget |

## Largest initial chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-ON3XXVFT.js` | 166.37 kB | Angular runtime baseline | `node_modules/@angular/core/fesm2022/_debug_node-chunk.mjs` (97.85 kB)<br>`node_modules/@angular/core/fesm2022/_effect-chunk2.mjs` (24.68 kB)<br>`node_modules/@angular/core/fesm2022/core.mjs` (5.65 kB) |
| 2 | `styles-T2VR77HI.css` | 165.95 kB | Docs global stylesheet (`styles.css`) | `projects/hell-docs/src/styles.css` (165.94 kB)<br>`angular:styles/global:styles` (0 B) |
| 3 | `chunk-OPWHYYTP.js` | 78.73 kB | Docs router shell | `node_modules/@angular/router/fesm2022/_router-chunk.mjs` (67.56 kB)<br>`node_modules/@angular/router/fesm2022/_router_module-chunk.mjs` (10.32 kB)<br>`node_modules/@angular/router/fesm2022/router.mjs` (0 B) |
| 4 | `chunk-P6LSAKWT.js` | 77.72 kB | Docs shell primitive dependencies | `node_modules/@angular/forms/fesm2022/forms.mjs` (20.46 kB)<br>`node_modules/@angular/platform-browser/fesm2022/_dom_renderer-chunk.mjs` (8.10 kB)<br>`node_modules/@angular/cdk/fesm2022/_a11y-module-chunk.mjs` (7.96 kB) |
| 5 | `chunk-HEYA5VSN.js` | 73.55 kB | Docs search / omnibar shell | `node_modules/@angular/cdk/fesm2022/_overlay-module-chunk.mjs` (39.50 kB)<br>`dist/hell/fesm2022/hell-ui-angular-omnibar.mjs` (32.92 kB)<br>`node_modules/@angular/cdk/fesm2022/_test-environment-chunk.mjs` (138 B) |
| 6 | `chunk-I54PM7J7.js` | 39.75 kB | Docs app icon registry | `node_modules/@ng-icons/font-awesome/fesm2022/ng-icons-font-awesome-solid.mjs` (34.78 kB)<br>`node_modules/@ng-icons/core/fesm2022/ng-icons-core.mjs` (4.15 kB) |
| 7 | `chunk-47UURYWX.js` | 39.19 kB | Docs shell primitive dependencies | `node_modules/ng-primitives/fesm2022/ng-primitives-portal.mjs` (20.79 kB)<br>`node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs` (7.06 kB)<br>`node_modules/@floating-ui/core/dist/floating-ui.core.mjs` (7.00 kB) |
| 8 | `chunk-CYQXDRJI.js` | 21.82 kB | Docs theme filter select shell | `node_modules/ng-primitives/fesm2022/ng-primitives-select.mjs` (10.77 kB)<br>`dist/hell/fesm2022/hell-ui-angular-select.mjs` (10.33 kB) |
| 9 | `main-RBAN6QVI.js` | 21.44 kB | Docs app shell bootstrap | `projects/hell-docs/src/app/app.ts` (19.60 kB)<br>`projects/hell-docs/src/app/app.config.ts` (74 B)<br>`projects/hell-docs/src/main.ts` (35 B) |
| 10 | `chunk-OQQMQHPL.js` | 18.43 kB | Docs menu shell | `node_modules/ng-primitives/fesm2022/ng-primitives-menu.mjs` (12.11 kB)<br>`dist/hell/fesm2022/hell-ui-angular-menu.mjs` (5.72 kB) |
| 11 | `chunk-DBVEBHOT.js` | 16.29 kB | Docs app-shell layout | `dist/hell/fesm2022/hell-ui-angular-app-shell.mjs` (15.91 kB)<br>`node_modules/@angular/cdk/fesm2022/layout.mjs` (0 B) |
| 12 | `chunk-CMIL2RBH.js` | 13.21 kB | Docs toast host | `dist/hell/fesm2022/hell-ui-angular-toast.mjs` (12.77 kB) |

Initial owner summary: the overage is mostly the docs shell, not a single routed page. The shell eagerly owns Angular runtime/router, global Tailwind + Hell composite CSS, the app-shell/omnibar/menu/select controls used for navigation/search/theme UI, and the top-level Font Awesome icon registry.

## Largest lazy chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-YHWBRUJG.js` | 426.96 kB | Code Editor docs page (`/components/code-editor`) | `node_modules/@codemirror/view/dist/index.js` (164.99 kB)<br>`node_modules/@lezer/javascript/dist/index.js` (77.73 kB)<br>`node_modules/@codemirror/state/dist/index.js` (46.38 kB) |
| 2 | `chunk-OTQYSJDP.js` | 406.72 kB | PDF viewer feature (`pdfjs-dist`) | `node_modules/pdfjs-dist/build/pdf.mjs` (405.44 kB) |
| 3 | `chunk-NDY7HXA3.js` | 163.92 kB | PDF viewer feature (`pdfjs-dist`) | `node_modules/pdfjs-dist/web/pdf_viewer.mjs` (163.41 kB) |
| 4 | `chunk-ZSLTVFRD.js` | 92.66 kB | Table utilities docs page (`/components/data-table`) | `projects/hell-docs/src/app/pages/components/data-table/examples/example.example.ts?raw` (31.09 kB)<br>`projects/hell-docs/src/app/pages/components/data-table/examples/example.example.ts` (21.13 kB)<br>`dist/hell/fesm2022/hell-ui-angular-features-table-utilities.mjs` (18.17 kB) |
| 5 | `chunk-B7US6WXL.js` | 44.02 kB | Audio Player docs page (`/components/audio-player`) | `dist/hell/fesm2022/hell-ui-angular-audio-player.mjs` (33.71 kB)<br>`projects/hell-docs/src/app/pages/components/audio-player/audio-player.page.ts` (6.27 kB)<br>`projects/hell-docs/src/app/pages/components/audio-player/examples/with-title-and-date.example.ts?raw` (626 B) |
| 6 | `chunk-IGACVTU6.js` | 40.13 kB | Combobox docs page (`/components/combobox`) | `node_modules/ng-primitives/fesm2022/ng-primitives-combobox.mjs` (16.69 kB)<br>`dist/hell/fesm2022/hell-ui-angular-combobox.mjs` (10.48 kB)<br>`projects/hell-docs/src/app/pages/components/combobox/combobox.page.ts` (3.90 kB) |
| 7 | `chunk-IPXM7Y36.js` | 36.04 kB | Time Input docs page (`/components/time-input`) | `dist/hell/fesm2022/hell-ui-angular-time-input.mjs` (21.94 kB)<br>`projects/hell-docs/src/app/pages/components/time-input/time-input.page.ts` (4.42 kB)<br>`projects/hell-docs/src/app/pages/components/time-input/examples/examples.example.ts?raw` (1.91 kB) |
| 8 | `chunk-MK5SAF7C.js` | 35.83 kB | Docs search index (loaded on search open) | `projects/hell-docs/src/app/docs-search-index.ts` (35.60 kB) |
| 9 | `chunk-QXVWERIP.js` | 33.54 kB | PDF viewer feature entrypoint<br>Pdf Viewer docs page (`/components/pdf-viewer`) | `dist/hell/fesm2022/hell-ui-angular-features-pdf-viewer.mjs` (32.82 kB) |
| 10 | `chunk-VVBLUWRH.js` | 26.91 kB | Dialog docs page (`/components/dialog`) | `node_modules/ng-primitives/fesm2022/ng-primitives-dialog.mjs` (9.48 kB)<br>`dist/hell/fesm2022/hell-ui-angular-dialog.mjs` (7.23 kB)<br>`projects/hell-docs/src/app/pages/components/dialog/dialog.page.ts` (4.03 kB) |
| 11 | `chunk-J4FG2ZOM.js` | 23.14 kB | Date Picker docs page (`/components/date-picker`) | `dist/hell/fesm2022/hell-ui-angular-date-picker.mjs` (11.76 kB)<br>`projects/hell-docs/src/app/pages/components/date-picker/date-picker.page.ts` (3.66 kB)<br>`projects/hell-docs/src/app/pages/components/date-picker/examples/range.example.ts?raw` (1.15 kB) |
| 12 | `chunk-SPE5A432.js` | 23.05 kB | Avatar Group docs page (`/components/avatar-group`) | `projects/hell-docs/src/app/pages/components/avatar-group/examples/overflow-menu.example.ts?raw` (4.85 kB)<br>`projects/hell-docs/src/app/pages/components/avatar-group/examples/overflow-menu.example.ts` (3.77 kB)<br>`projects/hell-docs/src/app/pages/components/avatar-group/examples/interaction-hooks.example.ts?raw` (3.29 kB) |

Lazy owner summary: the largest lazy chunks are correctly behind feature/page boundaries. The expensive lazy owners are Code editor (CodeMirror/Lezer), PDF viewer (pdf.js core/viewer/runtime), Table utilities (demo code/raw examples + table utilities), and Audio player (Hell audio runtime).

## Component style budget contributors

| Rank | Style chunk | Size | Owner | Status |
| ---: | --- | ---: | --- | --- |
| 1 | `pdf-viewer.page-EPEURSMI.css` | 5.31 kB | Pdf Viewer docs page (`/components/pdf-viewer`) | over by 1.31 kB |
| 2 | `data-table.page-FCQJVP2N.css` | 3.98 kB | Table utilities docs page (`/components/data-table`) | within warning |
| 3 | `code-editor.page-F4WQTVYL.css` | 994 B | Code Editor docs page (`/components/code-editor`) | within warning |
| 4 | `example-boundary-keeps-siblings-interactive.example-TQC5YXT6.css` | 531 B | Flyout docs page (`/components/flyout`) | within warning |

## Root causes and follow-up fixes

| Warning / risk | Root cause from stats | Owner | Follow-up fix |
| --- | --- | --- | --- |
| Initial bundle exceeds 500 kB by 270.82 kB | Static imports from `main` pull router/runtime plus docs-shell controls; `styles.css` globally imports Tailwind and `@hell-ui/angular/styles/composites`. Top chunks: `chunk-ON3XXVFT.js`, `styles-T2VR77HI.css`, `chunk-OPWHYYTP.js`, `chunk-P6LSAKWT.js`, `chunk-HEYA5VSN.js`. | Docs shell / global styles | HELL-032 must turn this into an explicit budget policy with owner/rationale; HELL-050 audits future eager imports across docs route boundaries. |
| `pdf-viewer.page.ts` component style exceeds 4 kB | `pdf-viewer.page.ts` inline component style imports `@hell-ui/angular/styles/features/pdf-viewer`; stats emits `pdf-viewer.page-EPEURSMI.css` at 5.31 kB. | PDF viewer docs page | HELL-031 reduces the PDF docs style cost, moves it behind a documented lazy/global boundary, or records an intentional budget raise. |
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
