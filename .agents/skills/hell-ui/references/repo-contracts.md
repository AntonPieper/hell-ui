# Repo Contracts

Read this for architecture, public surface, package boundary, or broad component
work.

## Architecture

- Workspace shape: `packages/angular` is the Angular library,
  `apps/docs` is the docs app, and `packages/pdf-viewer` owns the split PDF
  package. The root package orchestrates through pnpm filters; app/package
  workspaces own their local `angular.json` files.
- Root `@hell-ui/angular` stays light and core-only. Primitives, composites,
  table primitives, TanStack shell, optional features, and PDF use narrow
  entrypoints.
- Public entrypoints are manifest-driven. Edit
  `tools/entrypoint-manifest.mjs`, regenerate manifests, and let
  `pnpm run test:architecture` catch stale public API files, `ng-package.json`,
  `tsconfig` paths, light-root drift, and removed legacy table aliases.
- Package peer metadata is package-wide. Optional peers in
  `packages/angular/package.json` are not runtime-leak evidence; peer isolation
  claims need package-consumer proof.
- API reports are a stability policy, not every entrypoint by default. Check
  `tools/check-api-reports.mjs` before adding or updating baselines.

## Component Patterns

- Prefer directives when consumers should own markup: buttons, tabs, menus,
  fields, and native-table primitives.
- Use components when intrinsic structure matters: date input, time input, split
  view, app shell, toaster, audio player, and other owned anatomy.
- Use Angular standalone APIs: `input()`, `output()`, `signal()`, `computed()`,
  `booleanAttribute`, and `numberAttribute`.
- Wrap ng-primitives with `hostDirectives`; alias ngp inputs/outputs to Hell
  names.
- Reuse Hell primitives inside composites and features: `HellButton`,
  `HellIcon`, `HellInput`, `HellPopover`, directive arrays, search service, and
  label providers.
- Built-in accessibility labels and status strings use the Label Contract:
  defaults may be English, but consumers replace them through
  `provideHellLabels`.

## Heavy Feature Boundary

- CodeMirror stays behind `@hell-ui/angular/features/code-editor`.
- TanStack Table stays behind `@hell-ui/angular/table-tanstack`.
- TanStack Virtual stays behind `@hell-ui/angular/table-tanstack/virtual`.
- `pdfjs-dist` belongs to `@hell-ui/pdf-viewer`, not `@hell-ui/angular`.
- Consumer docs and README claims should match package-consumer scenarios and
  pack-audit evidence, not workspace intuition.
