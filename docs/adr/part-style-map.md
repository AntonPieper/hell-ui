# ADR: Part style map replaces unstyled

- Status: Accepted (amended)
- Date: 2026-06-24
- Amended: 2026-07-03 — the shared `HellPartStyleable<Part>` inheritance base is
  replaced by the `hellPartStyler` composition contract. The consumer-facing
  `[ui]` API, part unions, `Hell<Component>Ui` types, recipes, and `data-slot`
  rules are unchanged; only the library-internal wiring and the public core
  seam changed. Rationale: an abstract base class with protected abstract
  members is itself public API surface — every component d.ts inherits it, and
  base evolution ripples through all component declarations. Composition keeps
  one shared Part-Class Pipeline without an inheritance contract.
- Amended: 2026-07-10 — entrypoint styles use Tailwind v4 `@source` directives
  that point at shipped recipe source files. Consumers import Tailwind once and
  the narrow entrypoint stylesheet; they do not maintain a separate
  `node_modules` scan list.
- Amended: 2026-07-15 — selector examples no longer imply that a headless
  behavior suite also needs an owned renderer with a parallel Interaction State
  Machine. The Selector Convention still describes DOM ownership; the
  projection-first interaction decision governs behavioral ownership.
- Amended: 2026-07-20 — composite recipes move into shipped recipe modules. A
  composite's Part Recipes and private structural class strings live in a
  sibling `<entrypoint>.recipes.ts` module; the entrypoint stylesheet
  `@source`s that module and the package ships it instead of the whole
  component implementation file. Page-header is the tracer; the remaining
  composites follow the same split.
- Amended: 2026-07-20 — the public styling surface is narrowed by
  `0002-public-package-and-stylesheet-surface.md`. Consumer-facing `HellUi` and
  `HellUiInput` types, informative component part unions, and concrete
  component UI types remain public. `HellRecipe`, `hellPartStyler`,
  `HellPartStyler`, `hellTwMerge`, merge configuration, and other Part-Class
  Pipeline plumbing are package internals. The `[ui]` input name remains
  unchanged. `data-slot="root"` is reserved for a genuine single-host Public
  Part and is omitted from behavior-only or no-public-root hosts.

## Context

Hell currently exposes `unstyled` as the Style Opt-Out contract: consumers keep behavior and accessibility while removing a module's default host class. The design-system overhaul needs a single canonical path for refining component-owned structure without making consumers recreate that structure or style unknown internal DOM.

The earlier slot/layer proposal is rejected. Public `omit`, `[ui].class`, and abstract visual layers such as `surface`, `spacing`, or `motion` are too schema-heavy and invite a global taxonomy that will not mean the same thing across components.

## Decision

Adopt a component-local Part Style Map as the canonical future styling API. Each public component that owns structure should expose named Public Parts and a typed `Hell<Component>Ui` map from those part names to Tailwind class strings. The component owns its default part recipe, and each rendered public part computes classes through one part-class pipeline:

```txt
default part classes + consumer part classes = final class
```

The public shared core contract is intentionally small:

```ts
export type HellUi<Part extends string> = Partial<Record<Part, string>>;
export type HellUiInput<Part extends string> = string | HellUi<Part> | null | undefined;
```

Multi-part components export their part union and concrete UI type, for example `HellDialpadPart` and `HellDialpadUi = HellUi<HellDialpadPart>`. Single-part modules do not export `Part`/`Ui` aliases; their `ui` input is typed `HellUiInput<'root'>` directly, since the aliases carried no information beyond the shared core types. Migrated components declare their own typed `[ui]` signal input and compose the shared package-internal `hellPartStyler<Part>` factory, which owns the single part-class merge pipeline and the default Public Part for string shorthand, so single-root directives can use `ui="px-0"` while multi-part components can use `[ui]="{ header: 'px-6' }"`:

```ts
readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

protected readonly part = hellPartStyler<'root'>(this.ui, {
  defaultPart: 'root',
  recipe: () => ({ root: this.rootRecipe() }),
});
```

`HellRecipe<Part>` and `hellPartStyler<Part>` describe the package-internal
Part Recipe and Part-Class Pipeline. Components share them inside the package,
but consumers do not import them from the Light Root Entry Point or a secondary
Package Entry Point.

Do not reintroduce an inheritance base for this contract; the pipeline is a composition seam.

The `ui` input is a signal input declared per component. The public Angular
binding remains `[ui]`, and the styler reads it lazily. Do not carry a
class-property compatibility layer such as a setter, `uiSignal`, or a parallel
legacy field; the migration point is the switch to the signal-native contract.

A Part Style Map describes only the DOM owned by the directive or component
that exposes it. For directive suites and Composites with projected children,
the root `[ui]` map must not style child directives remotely; each projected
public child directive exposes its own narrow `[ui]` contract. Owned-anatomy
components such as Dialpad may expose multiple Public Parts from the root
because those parts are rendered by the root component itself.

The selector convention makes DOM ownership legible: attribute selectors are
headless behavior suites on consumer-owned elements, element selectors are
owned-anatomy components with named Public Parts (e.g. `[hellCombobox]` styles
a consumer-owned root while `hell-toaster` owns its rendered stack anatomy).
The convention does not justify exposing both forms for one Interaction State
Machine.

Single-host public directives use `root` as their sole Public Part. Semantic
identity belongs to the directive name, while the local part remains `root`.
Semantic part names such as `item`, `option`, or `header` belong inside
multi-part owned-anatomy component maps where one root exposes several Public
Parts.

Behavior-only directives and components without a genuine public root part do
not render `data-slot="root"`. A host marker is evidence of an accepted Public
Part, not a selector convention applied to every directive or component.

Owned-anatomy Composites expose a flat component-owned Part Style Map rather
than nested passthrough maps for internal primitives. A Composite may render
`HellButton`, `HellInput`, native elements, or ng-primitives internally, but its
consumer styling contract is named after the Composite's own anatomy, such as
`trigger`, `input`, `panel`, `clearButton`, `item`, or `captionToggle`, not
`buttonUi`, `inputUi`, or `popoverUi`.

The package-internal part-class pipeline should call one configured
`hellTwMerge`, built with `tailwind-merge` and extended for Hell theme token
groups. Individual components should not hand-roll the input, a local merge
callback, a `tailwind-merge` call, `clsx`, `cva`, `tailwind-variants`, or a
custom `cn` helper for migrated part styling. Neither the merge helper nor its
configuration is a consumer API.

Do not expose `[ui].class`, `omit`, or public visual layers. Do not preserve multiple public class override paths that merge late at a lower level.

Template `class` remains valid as an additive hook for layout classes, test hooks, and non-conflicting classes, but it is not the deterministic Tailwind override path. Consumers should use `ui` for recipe utility conflicts because Angular combines template classes and directive host classes outside the part-class pipeline.

Keep `data-slot` as the stable DOM marker for Public Parts. The TypeScript/domain language may call them Public Parts, but templates, tests, docs examples, and consumer selectors should continue to use `data-slot` rather than introducing `data-part`. For owned-anatomy composites, public part names are canonical camelCase names and rendered `data-slot` values should match those names, such as `inputWrap`, `ccToggle`, `dismissAll`, or `compactHeader`, instead of maintaining a parallel kebab-case DOM vocabulary.

Do not expose every internal element as a Public Part. Public Parts are durable
styling surfaces: roots, containers, panels, controls, content regions,
repeated item surfaces, first-class icons or glyphs, and loading, empty, error,
or status regions. Incidental wrappers for Angular control flow, measurement,
overlay anchors, focus sentinels, or layout mechanics remain private unless
there is a concrete consumer styling need.

`unstyled` will be replaced, not carried forward as the destination API or compatibility alias. Because Hell is still internal beta, the overhaul may hard-break the existing `unstyled` public API when the Part Style Map is implemented, but the removal must land with API report updates, package-consumer coverage, docs migration guidance, and accessibility/browser tests that prove behavior remains intact.

Default component visuals for migrated modules should move into Tailwind-based part recipes made of complete utility class strings. Hell should not preserve a parallel legacy `.hell-*` default styling model for migrated modules. CSS remains for Tailwind theme variables, token definitions, keyframes, and the narrow structural rules that cannot sensibly live as utility classes.

For complex multi-part Composites, recipe strings and component CSS split
responsibilities deliberately. Per-part default utility classes and
consumer-overridable Tailwind conflicts belong in Part Recipes. Structural
machinery and cross-part behavior may remain in component CSS, including
pseudo-elements, keyframes, relational selectors, overlay pane hooks, CSS
variable plumbing, measurement geometry, responsive structural rules, and
browser-specific selectors. CSS for migrated modules should target stable
`data-slot` and `data-*` attributes rather than legacy `.hell-*` class contracts
where practical.

Migrated modules should not keep legacy `.hell-*` classes as CSS scope hooks.
When a migrated surface still needs component CSS, scope it through the
component selector, directive attribute selector, stable `data-slot`, and
`data-*` state attributes. Portaled surfaces may use a documented overlay pane
hook when the pane itself is part of the rendered surface. Keeping `.hell-*` as
"just CSS hooks" preserves the old styling contract in disguise and weakens
`ui` as the canonical override path.

Portaled owned DOM remains part of the owning component's Part Style Map.
Portaling changes DOM location, not ownership. A portaled Public Part must still
render through the owner recipe pipeline, for example `part('panel')`, and its
`data-slot` value must match the exported part name. Overlay pane hooks remain
allowed for CDK positioning or surface scoping, but they are not the consumer
customization API.

Runtime theming should flow through semantic Hell theme tokens such as `--color-hell-primary`, `--color-hell-border`, and `--color-hell-surface-elevated`. Component-specific public variables such as `--hell-button-background` should not be introduced unless a concrete scoped-theming need is documented; otherwise they create a second public theming API with unclear precedence against variants, `ui`, and global tokens.

Hell ships each migrated module's complete recipe source next to its
entrypoint stylesheet. That stylesheet registers the recipe through Tailwind
v4 `@source`, so a consumer imports Tailwind once plus the narrow Hell
stylesheet and does not maintain a parallel scan list. Library build, pack, and
package-consumer gates must prove that every source target ships and generates
the recipe classes.

Composites split their recipe source from their implementation so the
component file itself does not ship. The default class strings live in a
sibling recipe module named `<entrypoint>.recipes.ts` (for example
`page-header/page-header.recipes.ts`) that exports the `HELL_<MODULE>_RECIPE`
Part Recipes plus constants for private structural wrapper classes that the
templates render outside the Part Style Map. The component imports those
constants and binds them (`[class]="layout.body"`); template literals must not
carry Tailwind classes that live outside the recipe module, or consumer builds
silently lose them. Part unions stay declared in the component module — the
architecture guard keys the part/data-slot contract to the component file —
and the recipe module imports them type-only, keeping the runtime dependency
one-directional (component → recipes). The split is wired through four points:
the entrypoint stylesheet registers `@source "./<entrypoint>.recipes.ts"`
instead of the component file, the ng-package assets copy the recipe module,
the package `files` list ships it, and the pack audit derives the shipped
recipe source set from those assets. Page-header is the tracer for this split;
the larger composites (app-shell, omnibar, toolbar, audio-player, confirm, and
the rest) adopt the same pattern when their files split.

Required behavior, accessibility, state attributes, geometry, measurement, portal registration, and lifecycle wiring remain internal requirements. They are not removable through the Part Style Map.

For tables, do not add callback-valued entries to generic `HellUi` v1. Start with static part maps plus stable `data-slot` and `data-*` state selectors; add table-specific callback-valued entries only later if state attributes cannot express the required styling without turning Hell into a table DSL.

Repeated owned elements share one static Public Part name in `HellUi` v1, such
as `toast`, `item`, `keyButton`, or `option`. Do not add indexed keys,
variant-suffixed keys, or callback-valued entries such as `item:3`,
`toast:success`, or `(item) => string` to generic `HellUi`. Per-item styling
should flow through stable `data-*` attributes, including existing state
attributes and component-specific semantic state when needed.

`HellDialpad` was the first implementation target for the Part Style Map model.
`HellButton` and `HellInput` have also migrated. Larger surfaces such as table,
PDF viewer, toast, and omnibar still need separate evidence before adopting the
same API.

For Dialpad, the exported `HellDialpadPart` names are the source of truth for
the public anatomy, and rendered `data-slot` values should match those names.
Prefer ergonomic camelCase public names such as `numberInput`, `clearButton`,
`backspaceButton`, and `callButton` over terse slot values such as `number`,
`clear`, `back`, or `call`.

Keep each migration focused on its component model: part recipes, `[ui]`, public
slot names, tests/docs, and narrow validation. Package-consumer, global
architecture guard, API-report expansion, and full `unstyled` removal gates
belong to broader enforcement work.

Tests should prove the new public contract instead of memorializing the old
one. Component-level tests for migrated modules should read as future-facing
behavior: `[ui]` string shorthand, object maps, Tailwind conflict merging,
state attributes, accessibility, and behavior stay intact. Do not add
per-component tests whose main assertion is that `unstyled` is absent. Removal
of the old Style Opt-Out contract is enforced once at package boundaries:
contract/API checks for exported part and UI types plus signal-input `ui`,
architecture guards that migrated modules do not extend `HellStyleable` or
expose `unstyled`, and docs/package-consumer checks that consumers use `ui`.

Organize larger migration batches by anatomy pattern, not by grabbing unrelated
entrypoints together. Directive-suite Composites with single-host child
directives should migrate separately from floating/list directive suites, and
both should migrate separately from owned-anatomy Composites with real
multi-part root maps. This keeps each implementation goal focused on one
architecture rule and one validation shape.

After the signal-input foundation lands, migrate the
directive-suite batch first: Card, Field, Tabs, and Accordion. This batch proves
the projected-child and single-host directive rules before taking on floating
surfaces or owned-anatomy Composites with portaled DOM, runtime state, and
multi-part root maps.

Migrated components should drop `unstyled` immediately. Dialpad, Button, and
Input do not keep `unstyled` compatibility inputs.

Dialpad internal controls may use native `<button>` and `<input>` elements
styled through Dialpad-owned Public Parts instead of `HellButton` and
`HellInput`. This is an intentional anatomy choice so Dialpad can expose
multiple dialpad-specific parts without inheriting Button or Input's single-root
part contract.

Before enforcing global Part Style Map gates, resolve implementation feedback:
remove or allowlist remaining `HellStyleable` use, add `HellUiInput` shorthand,
replace per-component merge callbacks with the shared `hellPartStyler` pipeline,
remove button-specific variable fallbacks unless justified,
and document the `class` caveat.

## Consequences

- Do not design new component APIs around `unstyled`.
- Existing `unstyled` docs, API reports, component-contract checks, release scenarios, and package-consumer gates must be rewritten around Part Style Maps.
- The migration must prove behavior-only usage through `[ui]` rather than a legacy boolean.
- Every public `[ui]` component should export its informative part union type
  and `Hell<Component>Ui` type, backed by public `HellUi` and `HellUiInput`
  core types. Single-root aliases that add no information remain unnecessary.
- `HellRecipe`, `hellPartStyler<Part>`, `HellPartStyler`, `hellTwMerge`, and
  merge configuration are shared package-internal Part-Class Pipeline
  contracts, not public exports. Do not duplicate their behavior per component
  or reintroduce an inheritance base.
- Each migrated component declares `readonly ui = input<HellUiInput<Part>>(undefined, { alias: 'ui' })`; there is no compatibility class-property path.
- `ui` string shorthand belongs to a component's documented default Public Part; object-form `ui` remains the explicit multi-part map.
- `class` is additive and not the deterministic Tailwind conflict override contract.
- Public Parts should render with stable `data-slot` values; do not rename the DOM marker to `data-part`.
- Owned-anatomy composite Public Parts should use canonical camelCase names in both exported TypeScript unions and rendered `data-slot` values.
- Single-host public directives should use `root` as their sole part; semantic names belong to the directive/component type, not the lone part.
- Behavior-only directives and hosts without a public root part should omit
  `data-slot="root"`.
- Owned-anatomy Composites should expose flat, Composite-owned Part Style Maps instead of nested `*Ui` passthroughs for internal primitives.
- Public Parts should cover durable consumer styling surfaces, not every internal wrapper or measurement node.
- Migrated component defaults must be represented as complete Tailwind utility strings so configured `hellTwMerge` can resolve conflicts deterministically in the single part-class pipeline.
- Complex migrated Composites may keep structural and cross-part CSS; recipes own consumer-overridable per-part utility classes.
- Migrated modules should not keep legacy `.hell-*` classes as CSS scope hooks;
  component CSS should scope through selectors, `data-slot`, `data-*`, and
  documented overlay pane hooks where needed.
- Portaled owned DOM may be a Public Part of the owning component; overlay pane
  hooks do not replace the Part-Class Pipeline.
- Runtime theme changes should target semantic Hell theme tokens rather than component-specific public variable families.
- The packaging plan must prove that shipped CSS entrypoints resolve their
  packaged `@source` recipe files without relying on removed legacy CSS classes
  or consumer-maintained scan configuration.
- Composite entry points ship a `<entrypoint>.recipes.ts` recipe module instead
  of the component implementation; every Tailwind class the composite renders —
  Part Recipes and private structural wrappers alike — must live in that
  module, and the stylesheet `@source`, ng-package assets, package `files`
  list, and pack audit stay wired to it.
- Complex components should expose enough Public Parts that consumers can refine styling without rebuilding component-owned structure.
- `HellUi` v1 remains a string map. Dynamic row/cell styling belongs to stable state attributes first, and table-specific extensions only if evidence requires them.
- Repeated owned elements share static Public Part names; indexed, variant-keyed,
  or callback-valued generic `HellUi` entries are out of scope for v1.
- Dialpad, Button, and Input are migrated examples of the model.
- Dialpad should rename its public `data-slot` values to match
  `HellDialpadPart`; existing tests/docs should migrate to the new names rather
  than preserve legacy slot aliases.
- Component migration should stay local to implementation, docs/tests, and
  narrow validation; global gates belong to broader enforcement work.
- Component tests for migrated modules should prove the new `[ui]` public
  contract; absence of `unstyled` belongs in architecture/API/docs and
  package-consumer gates.
- Migrated components drop `unstyled`; do not add compatibility inputs for new
  Part Style Map surfaces.
- Dialpad's native internal button/input controls are a component-specific public
  anatomy choice, independent of Button/Input migration status.
- Global gates should run only after the post-migration cleanup proves the Part Style Map API is the stable shape to enforce.
- Larger migration batches should be grouped by anatomy pattern: directive-suite
  Composites, floating/list directive suites, and owned-anatomy Composites.
- After the signal-input foundation, migrate Card, Field, Tabs, and Accordion
  first to prove the directive-suite anatomy rules.
