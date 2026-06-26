# ADR: apps and packages source layout

- Status: Accepted
- Date: 2026-06-25

## Context

Hell previously kept the docs app, main Angular package, and split PDF viewer
package under `projects/*`, with a single root Angular CLI workspace file and
root TypeScript path aliases for local source consumption. The target frontend
build architecture moves project ownership into app/package workspaces instead:
the root package orchestrates, while each runnable Angular project owns its
local Angular CLI configuration and package manifest.

## Decision

Migrate source ownership to `apps/docs`, `packages/angular`, and
`packages/pdf-viewer`.

Keep the existing Angular project names (`hell`, `hell-docs`, and
`hell-pdf-viewer`) and existing artifact output directories (`dist/hell`,
`dist/hell-docs`, and `dist/hell-pdf-viewer`). The folder layout changes, but
project names and package artifact identities remain stable for release,
consumer, Vercel, and package-audit tooling.

Remove the root Angular CLI workspace as the source of project configuration.
Each app or package owns its own local `angular.json`; the root package remains
an orchestration package.

Use pnpm workspace catalogs as the source of truth for shared framework and
toolchain versions. Local app and package manifests reference cataloged versions
rather than duplicating semver ranges.

Replace root TypeScript package path aliases for Hell package imports with
package `exports` entries that include the private source condition
`@heinrich/source`. Local app builds use that condition to resolve package
imports to source public API files, while normal package consumers resolve built
Angular Package Format artifacts.

## Consequences

- Package and app scripts should run from the owning workspace package, with
  root scripts delegating through pnpm filters.
- Architecture, CI-contract, package-consumer, release, and docs tooling must
  stop assuming `projects/*` source roots.
- `@hell-ui/angular` entrypoint metadata now lives with each entrypoint under
  `packages/angular` as `hell-entrypoint.json`; generated manifests are derived
  from those sidecars.
- The split PDF package remains first-class as `packages/pdf-viewer`; it is not
  folded back into `@hell-ui/angular`.
