# Docs bundle budget diagnosis

- Source stats: `dist/hell-docs/stats.json`
- Budget policy: `docs/release/docs-budget-policy.md`
- Report generator: `tools/docs-bundle-budget-report.mjs`
- Scope: diagnosis plus current remediation status for docs budgets, lazy route imports, shared docs code previews, and feature split boundaries.

## Budget status

| Budget | Current | Warning | Error | Status |
| --- | ---: | ---: | ---: | --- |
| Initial bundle | 925.57 kB | 500.00 kB | 1050.00 kB | accepted warning: 425.57 kB over; accepted ceiling: 930.00 kB; owner: Docs shell / global styles; follow-up: lazy-route import graph guard |
| Any component style | 1.41 kB largest | 4.00 kB | 8.00 kB | within warning budget |

## Budget policy

- Policy source: `docs/release/docs-budget-policy.md`
- Policy check: ok
- Accepted current warnings: Initial bundle (lazy-route import graph guard)
- Regression budget warnings: none

## Accepted warning details

| Budget | Current | Accepted ceiling | Owner | Rationale | Evidence | Follow-up | Expiry |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
| Initial bundle | 925.57 kB | 930.00 kB | Docs shell / global styles | The current warning is the accepted Angular 22 and TypeScript 6 internal-beta docs-shell baseline: Angular runtime/router, global Tailwind, Hell composite/table/toast CSS imported from public stylesheet entry points exactly as an external consumer would, app-shell/search/menu/select navigation UI, the full sidebar icon registry, shared docs page-header chrome, and tailwind-merge. Heavy feature examples and raw source previews stay behind lazy docs route boundaries. This acceptance is not permission for unrelated eager imports. | `docs/release/docs-bundle-budget-diagnosis.md` | lazy-route import graph guard | Any build that exceeds the accepted ceiling, reaches the initial maximumError threshold, or reopens the production-readiness budget decision. |

## Largest initial chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `main-QCBY3MEL.js` | 704.93 kB | Docs app shell bootstrap | `../../node_modules/.pnpm/@angular+core@22.0.5_@angular+compiler@22.0.5_rxjs@7.8.2/node_modules/@angular/core/fesm2022/_debug_node-chunk.mjs` (106.92 kB)<br>`../../node_modules/.pnpm/@angular+router@22.0.5_@angular+common@22.0.5_@angular+core@22.0.5_@angular+compiler@22_cf52b306686970b4d8f4ed611e0cf122/node_modules/@angular/router/fesm2022/_router-chunk.mjs` (69.21 kB)<br>`../../node_modules/.pnpm/@angular+cdk@22.0.3_@angular+common@22.0.5_@angular+core@22.0.5_@angular+compiler@22.0._1f6d74af5964d06576694baa3f3deccf/node_modules/@angular/cdk/fesm2022/_overlay-module-chunk.mjs` (45.89 kB) |
| 2 | `styles-D6T5XUJD.css` | 220.64 kB | Docs global stylesheet (`styles.css`) | `src/styles.css` (220.64 kB)<br>`angular:styles/global:styles` (0 B) |

Initial owner summary: the overage is mostly the docs shell, not a single routed page. The shell eagerly owns Angular runtime/router, global Tailwind + Hell composite CSS, the app-shell/omnibar/menu/select controls used for navigation/search/theme UI, and the top-level Font Awesome icon registry.

## Largest lazy chunks

| Rank | Chunk | Size | Owner | Largest inputs |
| ---: | --- | ---: | --- | --- |
| 1 | `chunk-XmL4hDVZ.js` | 423.20 kB | Code Editor docs page (`/components/code-editor`)<br>Getting Started guide page<br>Guide guide page | `../../node_modules/.pnpm/@codemirror+view@6.41.1/node_modules/@codemirror/view/dist/index.js` (166.13 kB)<br>`../../node_modules/.pnpm/@lezer+javascript@1.5.4/node_modules/@lezer/javascript/dist/index.js` (78.32 kB)<br>`../../node_modules/.pnpm/@codemirror+state@6.6.0/node_modules/@codemirror/state/dist/index.js` (46.72 kB) |
| 2 | `chunk-BgMJvd5_.js` | 410.61 kB | PDF viewer feature (`pdfjs-dist`) | `../../node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/build/pdf.mjs` (409.32 kB) |
| 3 | `chunk-Dem-jM9M.js` | 197.93 kB | Table docs page (`/components/table`) | `../../node_modules/.pnpm/@tanstack+table-core@8.21.3/node_modules/@tanstack/table-core/build/lib/index.mjs` (53.02 kB)<br>`src/app/pages/components/table/examples/tanstack-shell.example.ts?raw` (22.94 kB)<br>`../../node_modules/.pnpm/@tanstack+virtual-core@3.17.0/node_modules/@tanstack/virtual-core/dist/esm/index.js` (20.95 kB) |
| 4 | `chunk-BRX8rfwM.js` | 165.48 kB | PDF viewer feature (`pdfjs-dist`) | `../../node_modules/.pnpm/pdfjs-dist@5.6.205/node_modules/pdfjs-dist/web/pdf_viewer.mjs` (164.97 kB) |
| 5 | `chunk-HBoqcECJ.js` | 51.67 kB | Docs search index (loaded on search open) | `src/app/docs-search-index.ts` (51.54 kB) |
| 6 | `chunk-DgiG55kf.js` | 45.85 kB | Combobox docs page (`/components/combobox`) | `../../node_modules/.pnpm/ng-primitives@0.117.2_2d92e22ef8f64707773e19771a48aacc/node_modules/ng-primitives/fesm2022/ng-primitives-combobox.mjs` (16.95 kB)<br>`../../packages/angular/combobox/combobox.ts` (11.47 kB)<br>`src/app/pages/components/combobox/combobox.page.ts` (6.38 kB) |
| 7 | `chunk-ik4RG8hY.js` | 43.23 kB | Pdf Viewer docs page (`/components/pdf-viewer`) | `../../packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.ts` (13.34 kB)<br>`../../packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.runtime.ts` (9.45 kB)<br>`src/app/pages/components/pdf-viewer/pdf-viewer.page.ts` (6.22 kB) |
| 8 | `chunk-w3vHahn2.js` | 35.76 kB | Audio Player docs page (`/components/audio-player`) | `../../packages/angular/audio-player/audio-player.ts` (16.19 kB)<br>`src/app/pages/components/audio-player/audio-player.page.ts` (8.96 kB)<br>`../../packages/angular/features/audio-transcript/audio-transcript.ts` (2.73 kB) |
| 9 | `chunk-BOtJJLJJ.js` | 32.79 kB | Time Input docs page (`/components/time-input`) | `../../packages/angular/time-input/time-input.ts` (14.94 kB)<br>`src/app/pages/components/time-input/time-input.page.ts` (6.44 kB)<br>`src/app/pages/components/time-input/examples/examples.example.ts?raw` (2.13 kB) |
| 10 | `chunk-qdgfIien.js` | 32.53 kB | Field docs page (`/components/field`)<br>Date Input docs page (`/components/date-input`)<br>Date Picker docs page (`/components/date-picker`) | `../../node_modules/.pnpm/ng-primitives@0.117.2_2d92e22ef8f64707773e19771a48aacc/node_modules/ng-primitives/fesm2022/ng-primitives-date-picker.mjs` (18.25 kB)<br>`../../packages/angular/date-picker/date-picker.ts` (11.72 kB)<br>`../../node_modules/.pnpm/ng-primitives@0.117.2_2d92e22ef8f64707773e19771a48aacc/node_modules/ng-primitives/fesm2022/ng-primitives-date-time.mjs` (2.03 kB) |
| 11 | `chunk-nqJHIQ1t.js` | 30.77 kB | Accessibility guide page | `src/app/pages/accessibility/accessibility.page.ts` (30.47 kB) |
| 12 | `chunk-BOby5cR4.js` | 30.31 kB | Dialog docs page (`/components/dialog`) | `../../node_modules/.pnpm/ng-primitives@0.117.2_2d92e22ef8f64707773e19771a48aacc/node_modules/ng-primitives/fesm2022/ng-primitives-dialog.mjs` (9.65 kB)<br>`src/app/pages/components/dialog/dialog.page.ts` (5.73 kB)<br>`../../packages/angular/dialog/dialog.ts` (5.64 kB) |

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
| Initial bundle exceeds 500 kB by 425.57 kB | Static imports from `main` pull router/runtime plus docs-shell controls; `styles.css` globally imports Tailwind and explicit Hell entrypoint styles. Top chunks: `main-QCBY3MEL.js`, `styles-D6T5XUJD.css`. | Docs shell / global styles | Accepted by the docs budget policy (lazy-route import graph guard; expires when: Any build that exceeds the accepted ceiling, reaches the initial maximumError threshold, or reopens the production-readiness budget decision.); the architecture guard blocks future eager imports across docs route boundaries, and any undocumented new warning is a regression. |
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
