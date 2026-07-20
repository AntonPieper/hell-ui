# ADR: Public package and stylesheet surface

- Status: Accepted
- Date: 2026-07-20
- Decision issue: [#260](https://github.com/AntonPieper/hell-ui/issues/260)
- Implementation spec: [#310](https://github.com/AntonPieper/hell-ui/issues/310)

## Context

Hell has one Angular library, currently published as `@hell-ui/angular`, with a
Light Root Entry Point, many logical secondary Package Entry Points, a Shared
Style Substrate, and Entrypoint-Scoped Stylesheets. Those entrypoints protect
more than bundle size: they preserve lazy-chunk ownership, Angular
development-build boundaries, optional-dependency isolation, and reviewable
public APIs.

The existing surface leaves four related questions unresolved:

1. whether the Angular-specific scoped package name should remain the product's
   public identity;
2. whether convenience should come from TypeScript barrels, CSS aggregation,
   or both;
3. whether published `/internal/*` paths and styling-pipeline helpers are
   consumer contracts; and
4. which owned hosts should expose a `root` Public Part in the DOM.

Granular TypeScript imports are useful because JavaScript has runtime and peer
dependency boundaries. Requiring every consumer to assemble the same long list
of standard stylesheets is a different trade-off. CSS needs one simple default
without turning Module Categories into public import paths or silently loading
heavy optional features.

The unscoped `hell-ui` npm name is already controlled by the project owner, so
the package can adopt the product name without acquiring a third-party name or
maintaining a second release train.

## Decision

### Publish one package identity

Rename the published package from `@hell-ui/angular` to `hell-ui`.

- Publish only `hell-ui`; do not publish a compatibility package, alias package,
  dual-name release, or package-name shim.
- Perform the rename as one atomic wide refactor across package metadata,
  repository consumers, generated manifests, API reports, documentation,
  checked-in consumer fixtures, CI, and release tooling.
- Treat historical references as history only when they are explicitly marked
  as such. Current consumer guidance and executable contracts use `hell-ui`.

### Keep TypeScript import-path-first

Logical Package Entry Points remain the canonical TypeScript API:
`hell-ui/button`, `hell-ui/dialog`, `hell-ui/table`, and feature-specific paths.

- Keep the root `hell-ui` entry point light and core-only.
- Do not add root or Module Category component barrels.
- Do not treat a barrel import as the primary tree-shaking mechanism. ESM and
  accurate `sideEffects` metadata provide code tree-shaking; narrow entrypoints
  additionally preserve lazy chunks, development builds, optional peers, and
  API ownership.
- Treat `hell-ui/internal/*` as private implementation paths, not Package Entry
  Points. They may ship as resolvable Angular Package Format subpaths when
  cross-entrypoint linking requires it, but the `internal` prefix, internal
  metadata, absence from consumer docs, and absence of public API stability
  reports make their status unmistakable. Promote a stable consumer contract
  individually to a named, non-internal entrypoint when evidence requires it.

### Make CSS simpler than TypeScript

Publish `hell-ui/styles.css` as the recommended **Default Style Bundle**.

- Generate it deterministically from entrypoint-owned metadata.
- Each entrypoint declares a style-bundle policy equivalent to `default`,
  `opt-in`, or `none`; inclusion is explicit and is not inferred from Module
  Category.
- Include the Shared Style Substrate first, followed by every standard
  component stylesheet exactly once in stable order.
- Keep `hell-ui/<entrypoint>/styles.css` as the advanced **Granular Style Mode**.
- Consumers choose either the Default Style Bundle or Granular Style Mode for
  standard component CSS. The package documents that importing both duplicates
  those styles; it does not add runtime mode detection.
- Keep Heavy Feature Stylesheets explicitly opt-in, including Code Editor, PDF
  Viewer, and TanStack integration styles. Future entrypoints with heavy or
  optional style cost also default to `opt-in`.
- Keep Theme Adapter Stylesheets explicitly opt-in. An adapter may be added
  after either standard-style mode and is not part of the Default Style Bundle.
- Keep category CSS paths prohibited. The one package-level Default Style
  Bundle is a deliberate exception to the import-path-first CSS rule, not a
  precedent for `primitives`, `composites`, `features`, or other category
  aggregates.

Shipped CSS remains listed as side-effectful package content so a bundler does
not discard an explicit stylesheet import.

### Keep implementation styling private

The Part Style Map is the consumer styling contract; its construction pipeline
is not.

- Keep the `ui` input name.
- Export consumer-facing Part Style Map types, component part unions, and
  concrete component UI types where they carry useful information.
- Keep Part Recipes, recipe types, merge configuration, styler factories, and
  Part-Class Pipeline plumbing private to the package.
- Use `data-slot="root"` only when the host is a genuine single-host Public Part.
  Behavior-only directives and components without a public root part omit it;
  selector consistency alone does not create a Public Part.

### Verify the installed consumer surface

Use the checked-in packed-tarball consumer fixture runner as the primary
implementation seam.

- Preserve the root/core fixture's light-peer and no-CSS contract under the new
  package identity.
- Add aggregate and granular consumers that pass through the supported
  Tailwind/PostCSS production path and assert representative rendered styles in
  a browser.
- Keep pack, architecture, generated-manifest, and API-report checks as
  supporting guards for exports and isolation.
- Benchmark the aggregate consumer's compiled/minified production stylesheet,
  report raw and gzip bytes, and record an explicit accepted budget before
  release.

## Options considered

### Keep `@hell-ui/angular`

This avoids a breaking rename, but preserves a framework-qualified identity for
a product that intentionally ships one Angular package. The project is still
pre-1.0, and the desired npm name is controlled by the owner, so the permanent
clarity is worth the migration.

### Publish a compatibility package

This softens the rename but creates two install identities, two documentation
paths, extra provenance and release work, and an expiry problem. It is rejected
in favor of one clean pre-1.0 break.

### Add TypeScript root or category barrels

This shortens imports but hides API ownership and weakens lazy-chunk,
development-build, and optional-peer boundaries. ESM tree-shaking does not
recover all of those contracts, so TypeScript aggregation is rejected.

### Keep CSS granular only

This maximizes theoretical CSS selectivity but makes the recommended setup
needlessly laborious and easy to misconfigure. Granular imports remain
available without making them the default experience.

### Publish CSS by Module Category

Category bundles expose an internal classification as a permanent public path
and create overlapping bundles whose composition is difficult to explain. One
package-level default plus entrypoint granularity has a clearer ownership model.

### Include every stylesheet in the default

This would make optional feature and adapter costs implicit. It is rejected:
the default covers standard component styles, while heavy features and theme
adapters remain explicit additions.

## Consequences

- The package rename is intentionally breaking and has no compatibility period.
- TypeScript imports remain verbose where that verbosity communicates a real
  runtime, peer, or API boundary.
- Most consumers need one standard CSS import; advanced consumers retain exact
  stylesheet control.
- The Default Style Bundle is larger than a narrow granular selection, so its
  compiled and gzip cost becomes a release artifact with an explicit budget.
- Entrypoint metadata becomes the single source of truth for aggregate style
  inclusion and must be complete before generation succeeds.
- Standard aggregate and granular styles are alternatives; Heavy Feature
  Stylesheets and Theme Adapter Stylesheets are additive opt-ins in either mode.
- Existing import-path, Part Style Map, heavy-feature, and theme-adapter ADRs are
  amended by this decision where their earlier wording conflicts.
- Follow-up implementation is tracked by
  [#311](https://github.com/AntonPieper/hell-ui/issues/311),
  [#271](https://github.com/AntonPieper/hell-ui/issues/271),
  [#272](https://github.com/AntonPieper/hell-ui/issues/272),
  [#312](https://github.com/AntonPieper/hell-ui/issues/312), and
  [#313](https://github.com/AntonPieper/hell-ui/issues/313).
- [#273](https://github.com/AntonPieper/hell-ui/issues/273) is closed without an
  input rename because `ui` remains the accepted contract.
