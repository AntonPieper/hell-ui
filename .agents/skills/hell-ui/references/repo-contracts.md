# Repo Contracts

Read this for architecture, public surface, package boundary, or broad component
work.

## Architecture

- Workspace shape: `packages/angular` is the Angular library and `apps/docs`
  is the docs app. The root package orchestrates through pnpm filters;
  app/package workspaces own their local `angular.json` files.
- Root `hell-ui` stays light and core-only. Primitives, composites,
  table primitives, TanStack shell, optional features, and PDF use narrow
  entrypoints.
- Public entrypoints are entrypoint-sidecar-driven. Edit the entrypoint's local
  `hell-entrypoint.json`, regenerate manifests, and let
  `pnpm run test:architecture` catch stale public API files, `ng-package.json`,
  missing sidecars, light-root drift, and removed legacy table aliases.
- Package peer metadata is package-wide. Optional peers in
  `packages/angular/package.json` are not runtime-leak evidence; peer isolation
  claims need package-consumer proof.
- API reports are a stability policy, not every entrypoint by default. Check
  `tools/check-api-reports.mjs` before adding or updating baselines.

## Component Patterns

- Prefer directives when consumers should own markup: buttons, tabs, menus,
  fields, Date Input, Time Input, Number Input, native-table primitives, and
  master-detail controllers.
- Use components when intrinsic structure matters: Date Picker, Time Picker,
  app shell, toaster, audio player, and other owned anatomy.
- Use Angular standalone APIs: `input()`, `output()`, `signal()`, `computed()`,
  `booleanAttribute`, and `numberAttribute`.
- Wrap ng-primitives with `hostDirectives`; alias ngp inputs/outputs to Hell
  names.
- Reuse Hell primitives inside composites and features: `HellButton`,
  `HellIcon`, `HellInput`, `HellPopover`, directive arrays, search service, and
  label providers.
- Built-in accessibility labels and status strings use the Label Contract:
  defaults may be English, but consumers replace them through each entry
  point's own `provideHell<Module>Labels` function.

## Heavy Feature Boundary

- CodeMirror stays behind `hell-ui/features/code-editor`.
- TanStack Table stays behind `hell-ui/table-tanstack`.
- TanStack Virtual stays behind `hell-ui/table-tanstack/virtual`.
- pdf.js stays behind `hell-ui/features/pdf-viewer`.
- Consumer docs and README claims should match the consumer fixtures and
  pack-audit evidence, not workspace intuition.
