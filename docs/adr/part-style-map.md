# ADR: Part style map replaces unstyled

- Status: Accepted
- Date: 2026-06-24

## Context

Hell currently exposes `unstyled` as the Style Opt-Out contract: consumers keep behavior and accessibility while removing a module's default host class. The design-system overhaul needs a single canonical path for refining component-owned structure without making consumers recreate that structure or style unknown internal DOM.

The earlier slot/layer proposal is rejected. Public `omit`, `[ui].class`, and abstract visual layers such as `surface`, `spacing`, or `motion` are too schema-heavy and invite a global taxonomy that will not mean the same thing across components.

## Decision

Adopt a component-local Part Style Map as the canonical future styling API. Each public component that owns structure should expose named Public Parts and a typed `Hell<Component>Ui` map from those part names to Tailwind class strings. The component owns its default part recipe, and each rendered public part computes classes through one part-class pipeline:

```txt
default part classes + consumer part classes = final class
```

The shared core contract is intentionally small:

```ts
export type HellUi<Part extends string> = Partial<Record<Part, string>>;
export type HellUiInput<Part extends string> = string | HellUi<Part> | null | undefined;
export type HellRecipe<Part extends string> = Readonly<Record<Part, string>>;
```

Every public component that exposes `[ui]` should export its part union and concrete UI type, for example `HellDialpadPart` and `HellDialpadUi = HellUi<HellDialpadPart>`. Migrated components should extend a shared `HellPartStyleable<Part>` base that owns the `[ui]` input, the abstract recipe contract, and the `part()` merge pipeline. `HellPartStyleable` owns the default Public Part for string shorthand, so single-root directives can use `ui="px-0"` while multi-part components can use `[ui]="{ header: 'px-6' }"`.

The part-class pipeline should call one configured `hellTwMerge`, built with `tailwind-merge` and extended for Hell theme token groups. Individual components should not hand-roll the input, a local merge callback, a `tailwind-merge` call, `clsx`, `cva`, `tailwind-variants`, or a custom `cn` helper for migrated part styling.

Do not expose `[ui].class`, `omit`, or public visual layers. Do not preserve multiple public class override paths that merge late at a lower level.

Template `class` remains valid as an additive hook for layout classes, test hooks, and non-conflicting classes, but it is not the deterministic Tailwind override path. Consumers should use `ui` for recipe utility conflicts because Angular combines template classes and directive host classes outside the part-class pipeline.

Keep `data-slot` as the stable DOM marker for Public Parts. The TypeScript/domain language may call them Public Parts, but templates, tests, docs examples, and consumer selectors should continue to use `data-slot` rather than introducing `data-part`.

`unstyled` will be replaced, not carried forward as the destination API or compatibility alias. Because Hell is still internal beta, the overhaul may hard-break the existing `unstyled` public API when the Part Style Map is implemented, but the removal must land with API report updates, package-consumer coverage, docs migration guidance, and accessibility/browser tests that prove behavior remains intact.

Default component visuals for migrated modules should move into Tailwind-based part recipes made of complete utility class strings. Hell should not preserve a parallel legacy `.hell-*` default styling model for migrated modules. CSS remains for Tailwind theme variables, token definitions, keyframes, and the narrow structural rules that cannot sensibly live as utility classes.

Runtime theming should flow through semantic Hell theme tokens such as `--color-hell-primary`, `--color-hell-border`, and `--color-hell-surface-elevated`. Component-specific public variables such as `--hell-button-background` should not be introduced unless a concrete scoped-theming need is documented; otherwise they create a second public theming API with unclear precedence against variants, `ui`, and global tokens.

Hell will ship compiled CSS for migrated component defaults. Consumer apps should not be required to add Tailwind `@source` scanning for `node_modules/@hell-ui/angular` just to receive Hell's default visuals. Library build and package-consumer gates must prove that recipe classes are present in the shipped CSS entrypoints.

Required behavior, accessibility, state attributes, geometry, measurement, portal registration, and lifecycle wiring remain internal requirements. They are not removable through the Part Style Map.

For tables, do not add callback-valued entries to generic `HellUi` v1. Start with static part maps plus stable `data-slot` and `data-*` state selectors; add table-specific callback-valued entries only later if state attributes cannot express the required styling without turning Hell into a table DSL.

Use `HellDialpad` as the first implementation slice for the Part Style Map model. It has meaningful component-owned structure and enough Public Parts to test the model without taking on the higher-risk table, PDF viewer, toast, or omnibar surfaces first.

For the Dialpad slice, the exported `HellDialpadPart` names are the source of truth for the public anatomy, and rendered `data-slot` values should match those names. Prefer ergonomic camelCase public names such as `numberInput`, `clearButton`, `backspaceButton`, and `callButton` over preserving terse historical slot values such as `number`, `clear`, `back`, or `call`.

Keep the first Dialpad slice focused on proving the component model: introduce `HellPartStyleable`, migrate Dialpad to part recipes and `[ui]`, rename Dialpad public slots, update Dialpad tests/docs, and run narrow validation. Do not require package-consumer, global architecture guard, API-report expansion, or full `unstyled` removal gates in that prototype slice; create follow-up slices for those global enforcement paths.

Migrated components should drop `unstyled` immediately. The Dialpad slice should not keep an `unstyled` compatibility input on `HellDialpad`. Do not migrate `HellButton` or `HellInput` in the first Dialpad prototype slice; they are central primitives and need their own focused migrations. Dialpad should prove its own Part Style Map without pulling those shared primitives into the same slice.

For the Dialpad prototype, internal controls may use native `<button>` and `<input>` elements styled through Dialpad-owned Public Parts instead of `HellButton` and `HellInput`. This is a temporary bridge, not a new permanent primitive boundary. The implementation must mark the native-control bridge with code comments and docs notes saying it must be revisited once `HellButton` and `HellInput` migrate to `HellPartStyleable`.

After the Dialpad, Button, and Input migration slices, the global gate slice should wait for a follow-up cleanup slice that resolves implementation feedback: remove or allowlist remaining `HellStyleable` use, add `HellUiInput` shorthand, replace per-component merge callbacks with direct `hellTwMerge` use in `HellPartStyleable`, remove button-specific variable fallbacks unless justified, and document the `class` caveat. That cleanup is a prerequisite for enforcing global architecture gates.

## Consequences

- Do not design new component APIs around `unstyled`.
- Existing `unstyled` docs, API reports, component-contract checks, release scenarios, and package-consumer gates must be rewritten around Part Style Maps.
- The migration must prove behavior-only usage through `[ui]` rather than a legacy boolean.
- Every public `[ui]` component should export its part union type and `Hell<Component>Ui` type, backed by shared `HellUi`, `HellUiInput`, and `HellRecipe` core types.
- `HellPartStyleable<Part>` is the migration base for components adopting `[ui]`; do not duplicate part-class merge code per component.
- `ui` string shorthand belongs to a component's documented default Public Part; object-form `ui` remains the explicit multi-part map.
- `class` is additive and not the deterministic Tailwind conflict override contract.
- Public Parts should render with stable `data-slot` values; do not rename the DOM marker to `data-part`.
- Migrated component defaults must be represented as complete Tailwind utility strings so configured `hellTwMerge` can resolve conflicts deterministically in the single part-class pipeline.
- Runtime theme changes should target semantic Hell theme tokens rather than component-specific public variable families.
- The packaging plan must prove those recipe classes are available through shipped CSS entrypoints without relying on removed legacy CSS classes or consumer-side source scanning.
- Complex components should expose enough Public Parts that consumers can refine styling without rebuilding component-owned structure.
- `HellUi` v1 remains a string map. Dynamic row/cell styling belongs to stable state attributes first, and table-specific extensions only if evidence requires them.
- The first implementation slice should prototype the full model on `HellDialpad` before broader migration.
- The Dialpad slice should rename its public `data-slot` values to match `HellDialpadPart`; existing tests/docs should migrate to the new names rather than preserve legacy slot aliases.
- The Dialpad slice should stay local to implementation, Dialpad docs/tests, and narrow validation; global gates belong to follow-up slices.
- Migrated components drop `unstyled`; the Dialpad slice should not migrate central primitives such as `HellButton` and `HellInput`.
- Dialpad's native internal button/input bridge must be explicitly marked temporary in code and docs, with follow-up replacement when Button/Input migrate.
- Global gates should run only after the post-migration cleanup proves the Part Style Map API is the stable shape to enforce.
