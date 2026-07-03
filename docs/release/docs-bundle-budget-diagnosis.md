# Docs bundle budget diagnosis

- Source stats: `dist/hell-docs/stats.json`
- Budget policy: `docs/release/docs-budget-policy.md`
- Report generator: `tools/docs-bundle-budget-report.mjs`
- Scope: diagnosis plus current remediation status for docs budgets, lazy route imports, shared docs code previews, and feature split boundaries.

## Budget status

| Budget | Current | Warning | Error | Status |
| --- | ---: | ---: | ---: | --- |
| Initial bundle | 905.78 kB | 500.00 kB | 1050.00 kB | accepted warning: 405.78 kB over; accepted ceiling: 910.00 kB; owner: Docs shell / global styles; follow-up: lazy-route import graph guard |
| Any component style | 1.41 kB largest | 4.00 kB | 8.00 kB | within warning budget |

## Budget policy

- Policy source: `docs/release/docs-budget-policy.md`
- Policy check: ok
- Accepted current warnings: Initial bundle (lazy-route import graph guard)
- Regression budget warnings: none

## Accepted warning details

| Budget | Current | Accepted ceiling | Owner | Rationale | Evidence | Follow-up | Expiry |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
| Initial bundle | 905.78 kB | 910.00 kB | Docs shell / global styles | The current warning is the accepted internal-beta docs-shell baseline: Angular runtime/router, global Tailwind, Hell composite/table/toast CSS imported from public stylesheet entry points exactly as an external consumer would, app-shell/search/menu/select navigation UI, the full sidebar icon registry, shared docs page-header chrome, and tailwind-merge. Heavy feature examples and raw source previews stay behind lazy docs route boundaries. This acceptance is not permission for unrelated eager imports. | `docs/release/docs-bundle-budget-diagnosis.md` | lazy-route import graph guard | Any build that exceeds the accepted ceiling, reaches the initial maximumError threshold, or reopens the production-readiness budget decision. |

## Largest initial chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `styles-D6T5XUJD.css` | 220.64 kB | Docs global stylesheet (`styles.css`) | `src/styles.css` (220.64 kB)<br>`angular:styles/global:styles` (0 B) |
| 2 | `chunk-CUNHFVUL.js` | 162.13 kB | Angular runtime baseline | `../../node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_debug_node-chunk.mjs` (97.75 kB)<br>`../../node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_effect-chunk2.mjs` (24.67 kB)<br>`../../node_modules/.pnpm/@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2/node_modules/@angular/core/fesm2022/core.mjs` (9.62 kB) |
| 3 | `chunk-XZZUKAY7.js` | 110.75 kB | Docs app icon registry | `../../node_modules/.pnpm/@ng-icons+font-awesome@33.2.2/node_modules/@ng-icons/font-awesome/fesm2022/ng-icons-font-awesome-solid.mjs` (43.89 kB)<br>`../../node_modules/.pnpm/@angular+platform-browser@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angula_a3fa5d93eb842c3383125d4df5d950df/node_modules/@angular/platform-browser/fesm2022/_dom_renderer-chunk.mjs` (8.10 kB)<br>`../../node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_a11y-module-chunk.mjs` (7.96 kB) |
| 4 | `chunk-MBWYQ2Q7.js` | 78.76 kB | Docs router shell | `../../node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/_router-chunk.mjs` (67.56 kB)<br>`../../node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/_router_module-chunk.mjs` (10.32 kB)<br>`../../node_modules/.pnpm/@angular+router@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler_3a63d3eb80a3a395ad0c90972845f556/node_modules/@angular/router/fesm2022/router.mjs` (0 B) |
| 5 | `chunk-FJSURILE.js` | 71.20 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/_overlay-module-chunk.mjs` (45.26 kB)<br>`../../packages/angular/omnibar/omnibar.ts` (21.06 kB)<br>`../../packages/angular/omnibar/omnibar.runtime.ts` (2.56 kB) |
| 6 | `chunk-O7ZUB63C.js` | 59.38 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/tailwind-merge@3.5.0/node_modules/tailwind-merge/dist/bundle-mjs.mjs` (27.06 kB)<br>`../../node_modules/.pnpm/@angular+forms@21.2.13_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@_e663037e195188727d713988f22a1e9a/node_modules/@angular/forms/fesm2022/forms.mjs` (20.47 kB)<br>`../../node_modules/.pnpm/@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21.2.13_rxjs@7.8.2__rxjs@7.8.2/node_modules/@angular/common/fesm2022/_location-chunk.mjs` (3.86 kB) |
| 7 | `chunk-G6IAWJAY.js` | 23.09 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-menu.mjs` (14.22 kB)<br>`../../packages/angular/menu/menu.ts` (8.08 kB) |
| 8 | `chunk-PSYX4PV7.js` | 22.11 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-select.mjs` (10.77 kB)<br>`../../packages/angular/select/select.ts` (10.36 kB) |
| 9 | `main-4HFV35CL.js` | 22.08 kB | Docs app shell bootstrap | `src/app/app.ts` (19.76 kB)<br>`src/app/app.config.ts` (74 B)<br>`src/main.ts` (35 B) |
| 10 | `chunk-JNRPGQVJ.js` | 21.40 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-portal.mjs` (20.72 kB)<br>`../../node_modules/.pnpm/@angular+cdk@21.2.11_@angular+common@21.2.13_@angular+core@21.2.13_@angular+compiler@21_04df65e2704088424dcd37e685ec6dc2/node_modules/@angular/cdk/fesm2022/cdk.mjs` (23 B) |
| 11 | `chunk-35VXOQWD.js` | 20.50 kB | Shared initial dependency | `../../packages/angular/toast/toast.ts` (18.55 kB)<br>`../../packages/angular/toast/toast-stack.runtime.ts` (1.44 kB) |
| 12 | `chunk-P3SEYM2X.js` | 17.93 kB | Docs shell primitive dependencies | `../../node_modules/.pnpm/@floating-ui+dom@1.7.6/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs` (7.06 kB)<br>`../../node_modules/.pnpm/@floating-ui+core@1.7.5/node_modules/@floating-ui/core/dist/floating-ui.core.mjs` (7.00 kB)<br>`../../node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs` (2.29 kB) |

Initial owner summary: the overage is mostly the docs shell, not a single routed page. The shell eagerly owns Angular runtime/router, global Tailwind + Hell composite CSS, the app-shell/omnibar/menu/select controls used for navigation/search/theme UI, and the top-level Font Awesome icon registry.

## Largest lazy chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-3OTN7OMK.js` | 420.05 kB | Code Editor docs page (`/components/code-editor`)<br>Toast docs page (`/components/toast`)<br>Omnibar docs page (`/components/omnibar`) | `../../node_modules/.pnpm/@codemirror+view@6.41.1/node_modules/@codemirror/view/dist/index.js` (164.88 kB)<br>`../../node_modules/.pnpm/@lezer+javascript@1.5.4/node_modules/@lezer/javascript/dist/index.js` (77.73 kB)<br>`../../node_modules/.pnpm/@codemirror+state@6.6.0/node_modules/@codemirror/state/dist/index.js` (46.36 kB) |
| 2 | `chunk-WLJNHYMH.js` | 406.72 kB | PDF viewer feature (`pdfjs-dist`) | `../../node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/build/pdf.mjs` (405.44 kB) |
| 3 | `chunk-CEY4JNTK.js` | 197.72 kB | Table docs page (`/components/table`) | `../../node_modules/.pnpm/@tanstack+table-core@8.21.3/node_modules/@tanstack/table-core/build/lib/index.mjs` (52.71 kB)<br>`src/app/pages/components/table/examples/tanstack-shell.example.ts?raw` (22.81 kB)<br>`../../node_modules/.pnpm/@tanstack+virtual-core@3.17.0/node_modules/@tanstack/virtual-core/dist/esm/index.js` (20.83 kB) |
| 4 | `chunk-VINDRPQJ.js` | 163.92 kB | PDF viewer feature (`pdfjs-dist`) | `../../node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/web/pdf_viewer.mjs` (163.41 kB) |
| 5 | `chunk-N4F2EM5E.js` | 51.76 kB | Docs search index (loaded on search open) | `src/app/docs-search-index.ts` (51.53 kB) |
| 6 | `chunk-V7WAD3ZS.js` | 45.69 kB | Combobox docs page (`/components/combobox`) | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-combobox.mjs` (16.68 kB)<br>`../../packages/angular/combobox/combobox.ts` (11.31 kB)<br>`src/app/pages/components/combobox/combobox.page.ts` (6.30 kB) |
| 7 | `chunk-KWHEYWK3.js` | 35.44 kB | Audio Player docs page (`/components/audio-player`) | `../../packages/angular/audio-player/audio-player.ts` (15.82 kB)<br>`src/app/pages/components/audio-player/audio-player.page.ts` (8.77 kB)<br>`../../packages/angular/features/audio-transcript/audio-transcript.ts` (2.67 kB) |
| 8 | `chunk-E3KYGPBR.js` | 32.80 kB | Time Input docs page (`/components/time-input`) | `../../packages/angular/time-input/time-input.ts` (14.69 kB)<br>`src/app/pages/components/time-input/time-input.page.ts` (6.34 kB)<br>`src/app/pages/components/time-input/examples/examples.example.ts?raw` (2.09 kB) |
| 9 | `chunk-IQIPD3H7.js` | 32.38 kB | Date Picker docs page (`/components/date-picker`)<br>Date Input docs page (`/components/date-input`)<br>Field docs page (`/components/field`) | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-date-picker.mjs` (18.10 kB)<br>`../../packages/angular/date-picker/date-picker.ts` (11.66 kB)<br>`../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-date-time.mjs` (2.01 kB) |
| 10 | `chunk-BRJYJOYA.js` | 31.30 kB | Pdf Viewer docs page (`/components/pdf-viewer`) | `../../packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts` (13.12 kB)<br>`../../packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.runtime.ts` (9.27 kB)<br>`../../packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.adapter.ts` (5.13 kB) |
| 11 | `chunk-NUTWVOMP.js` | 30.86 kB | Accessibility guide page | `src/app/pages/accessibility/accessibility.page.ts` (30.35 kB) |
| 12 | `chunk-BEUO7UXD.js` | 30.24 kB | Dialog docs page (`/components/dialog`) | `../../node_modules/.pnpm/ng-primitives@0.117.2_b3a3993826153d8d04b6cf59c44813bf/node_modules/ng-primitives/fesm2022/ng-primitives-dialog.mjs` (9.48 kB)<br>`src/app/pages/components/dialog/dialog.page.ts` (5.65 kB)<br>`../../packages/angular/dialog/dialog.ts` (5.54 kB) |

Lazy owner summary: the largest lazy chunks are correctly behind feature/page boundaries. The expensive lazy owners are Code editor (CodeMirror/Lezer), PDF viewer (pdf.js core/viewer/runtime), Table utilities (demo code/raw examples + table utilities), and Audio player (Hell audio runtime).

## Component style budget contributors

| Rank | Style chunk | Size | Owner | Status |
| ---: | --- | ---: | --- | --- |
| 1 | `docs-code-viewer-AUZACH5W.css` | 1.41 kB | `apps/docs/src/app/shared/docs-code-viewer.ts` | within warning |
| 2 | `accessibility.page-L6DPPVLS.css` | 1.39 kB | Accessibility guide page | within warning |
| 3 | `code-editor.page-226UBHIP.css` | 1.07 kB | Code Editor docs page (`/components/code-editor`) | within warning |
| 4 | `example-boundary-keeps-siblings-interactive.example-IQSHZN5V.css` | 456 B | Flyout docs page (`/components/flyout`) | within warning |
| 5 | `floating-dismissal-harness.page-ZX4M6KTZ.css` | 431 B | Testing guide page | within warning |

## Root causes and follow-up fixes

| Warning / risk | Root cause from stats | Owner | Follow-up fix |
| --- | --- | --- | --- |
| Initial bundle exceeds 500 kB by 405.78 kB | Static imports from `main` pull router/runtime plus docs-shell controls; `styles.css` globally imports Tailwind and explicit Hell entrypoint styles. Top chunks: `styles-D6T5XUJD.css`, `chunk-CUNHFVUL.js`, `chunk-XZZUKAY7.js`, `chunk-MBWYQ2Q7.js`, `chunk-FJSURILE.js`. | Docs shell / global styles | Accepted by the docs budget policy (lazy-route import graph guard; expires when: Any build that exceeds the accepted ceiling, reaches the initial maximumError threshold, or reopens the production-readiness budget decision.); the architecture guard blocks future eager imports across docs route boundaries, and any undocumented new warning is a regression. |
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
