# hell Context

hell is a compact Angular component system for dense business applications. It favors primitives, composites, and heavier features that keep consumer markup flexible while concentrating behavior, accessibility, styling, and documentation contracts inside the library.

## Domain Terms

**Behavior Primitive**
A directive-first module whose Interface is behavior, accessibility, and state attributes while consumers own DOM structure and visual styling.

**Styled Primitive**
A Behavior Primitive plus default Tailwind part classes, data attributes, and public CSS variables. Consumers can use a Part Style Map to refine named public parts while preserving behavior.

**Composite**
A module that combines multiple primitives into a higher-level experience. A Composite may own some DOM structure when that structure is part of the leverage it provides, but its docs should name the owned parts and the escape hatches.

**Multi-Select Menu Button**
A general Composite that opens a menu of checkable options from a button and reflects the selected count through button text, an icon, or a badge. It is domain-agnostic; table column visibility is only one possible consumer-owned use case.
_Avoid_: Column visibility selector, table column picker.

**Feature**
A heavier module with optional dependencies, runtime setup, or large styling. Features stay behind feature-specific Package Entry Points and feature-specific CSS imports.

**Component Contract**
The shared Interface expected from public Hell modules: behavior directives, stable public parts for owned structure, data-state/data-size/data-variant attributes for stateful styling, public CSS variables for supported visual values, and a Part Style Map for visual customization.

**Style Opt-Out**
The legacy all-or-nothing contract that lets consumers keep a Hell module's behavior and accessibility while removing its default host styling.
_Avoid_: Future customization surface, part style map.

**Public Part**
A named, stable element or region in a Hell module's owned structure that consumers may refine through the module's Part Style Map. Public Parts are represented in DOM with `data-slot`, and the `data-slot` value should match the public part name unless a component documents an exception; unknown internal DOM is not part of the component contract.
_Avoid_: Private element, arbitrary descendant.

**Part Style Map**
The shared contract that lets consumers refine a Hell module's named Public Parts with Tailwind classes. In code, this is the `HellUiInput<Part>` shape: either a shorthand class string for the module's default Public Part or a `HellUi<Part>` map from component-local Public Part names to class strings.
_Avoid_: Style Opt-Out, unstyled mode, class override object, omit map, visual layers, template class override path.

**Part Recipe**
The component-owned default Tailwind class map for its Public Parts. It is the default half of the Part-Class Pipeline and is not a consumer schema.
_Avoid_: Legacy `.hell-*` CSS styling model, global recipe taxonomy.

**Part-Class Pipeline**
The single class computation path for one Public Part: default recipe classes plus the consumer's matching Part Style Map entry, merged deterministically by Hell's configured Tailwind merge.
_Avoid_: Multiple late class override channels.

**Semantic Theme Token**
A public Hell CSS/Tailwind variable that represents a reusable design value such as primary color, border, foreground, or elevated surface. Runtime themes should override Semantic Theme Tokens rather than component-specific variable families.
_Avoid_: Button-only theme variable, component-specific public color variable.

**Additive Class Hook**
Template `class` values used for layout hooks, test hooks, and non-conflicting classes outside the Part-Class Pipeline. It is not the deterministic override path for conflicting Tailwind recipe utilities.
_Avoid_: Part Style Map, class override API.

**Customization Surface**
The consumer-facing Interface for changing a hell module's behavior, styling, and policy without forking or fighting the library. A good Customization Surface exposes the underlying settings consumers naturally want to adjust rather than mode switches or booleans that apply bundled presets.

**Label Contract**
The injectable text Interface for built-in accessibility labels and status strings. Defaults remain English, but consumers can replace labels through `provideHellLabels` instead of forking components or accepting hardcoded ARIA text.

**Floating Interaction**
Any interaction involving content rendered outside, beside, or above its logical host: menus, popovers, tooltips, dialogs, flyouts, selects, comboboxes, and omnibar child overlays.

**Floating Scope**
The set of DOM targets that count as "inside" one floating interaction, even when a floating surface is rendered outside the logical host.

**Dialog Scope**
The content region that a scoped dialog should cover while leaving surrounding app shell chrome interactive. Each Dialog Scope root owns independent scoped inset state; scoped dialog overlays receive copied vars from their owning root through an overlay Adapter so simultaneous scoped dialogs do not override each other.

**Resize Behavior**
The pointer, keyboard, sizing, and minimum-size rules shared by resizable panes and table column resizing, independent of the layout adapter that renders it.

**PDF Runtime**
The pdf.js lifecycle behind the PDF viewer: bootstrapping, worker ownership, document loading, viewer events, find state, thumbnails, printing, and cleanup.

**Docs Catalog**
The docs app source of truth for pages, navigation, routes, icons, sections, and searchable entries.

**Docs Example**
A live Angular example plus its raw source code, preview options, and search metadata.

**Package Entry Point**
A public import path exposed by the `hell` package, including the root entry point and secondary entry points such as primitives, composites, core, and feature-specific imports.

**Light Root Entry Point**
The Package Entry Point policy where the root `@hell-ui/angular` export stays constrained to stable core only; primitives stay behind `/primitives` and narrow primitive entry points, while composites, features, and heavier runtime surfaces stay behind secondary entry points.

**Floating Dismissal**
The listener-driven part of a Floating Interaction that decides when outside pointer, outside focus, Escape, or caller-defined events should close a surface. The low-level module has no hidden default and does not depend on a closed reason enum. Each primitive or Composite composes explicit pure matcher dismissal rules such as library-provided `hellOutsideClick` rules or caller-defined rules. A rule returns a fixed dismiss decision or no match; composition functions such as `hellDismissOn`, `hellGuardDismiss`, and `hellWithDismissEffect` return the same rule type. The core module consumes only fixed decision effects such as preventDefault, stopPropagation, or focus restoration; it does not consume generic caller-defined cause shapes.

**Resize Transaction**
The layout-agnostic pointer or keyboard resize operation that tracks start sizes, deltas, minimums, commits, and cancellation separately from the Adapter that reads or writes DOM layout.

**PDF Adapter**
A swappable Adapter behind the PDF Runtime seam for browser, pdf.js, worker, print, and download concerns that may change during pdf.js upgrades.

**Toast Stack**
The lifetime, pause/resume, collapse, exit animation, measuring, ordering, and layout policy behind rendered toasts, separate from the visual Adapter that writes DOM and CSS variables.

**Code Editor Runtime**
The editor lifecycle behind the code editor Feature: bootstrapping, value synchronization, extension updates, read-only policy, selection/history preservation, theme ownership, and cleanup.

**Audio Runtime**
The media element, playback state, seek/volume policy, best-effort browser live-caption session, transcript state, and browser speech lifecycle behind the audio player Composite. Captions are optional and browser-backed only, reset on seek/playback restart, and stay behind an internal Adapter; playback controls expose structured state/events while clipboard copy remains a small UI helper outside the runtime.

**Table Primitives**
Hell-owned table building blocks for table semantics, accessibility, styling hooks, and narrow interaction affordances. They do not own data sourcing, row models, filtering, pagination, virtualization, or a first-party data-table renderer.
They may expose semantic native-table directives, row/cell styling hooks, sort and resize affordances, row action hooks, selection-control hooks, and primitive-level measurement hooks. They may reflect app-owned or TanStack-owned state through inputs/data attributes, but they do not own selection state, active-row state, grid semantics, or composite grid keyboard navigation.
_Avoid_: Data table library, data grid, simple data-table renderer, normalized table model, table state channels, column definition DSL, row draft controller, column visibility panel, column visibility selector, grid mode.

**Table Engine**
TanStack-owned table logic that owns row and column models, sorting, filtering, pagination, grouping, selection state, virtualization, or data querying. Hell does not define a parallel table model or state abstraction.
_Avoid_: HellDataTable, first-party data-table renderer, HellTableModel, table state channels.

**TanStack Table Adapter**
The supported high-level Adapter path for rendering TanStack-owned table and virtual-row behavior with Hell Table Primitives. It should make common TanStack table experiences simple and consistent in Hell UI, including styled pagination, filtering controls, sticky headers, pinned columns, and table layout states, while preserving TanStack's table instance, state, row-model, and feature API as the engine. It is the only first-class higher-level table engine path and must not translate TanStack into a competing Hell table engine.
_Avoid_: CDK table adapter, custom data-table component, separate virtual-table entry point.

**TanStack Table Shell**
A reusable Hell-styled shell that renders a caller-owned TanStack Table instance with standard Hell table chrome, styling, controls, and renderer integration. It improves ergonomics around TanStack rather than accepting raw data or defining a parallel table model.
TanStack column definitions are the primary source of truth for header, cell, and footer renderers; projected Hell templates fill only otherwise undefined one-off slots.
Sticky headers are shell-owned chrome; column pinning comes from TanStack column pinning state and is reflected through stable Hell classes and data attributes without parallel pinning inputs.
Virtualization is an optional body strategy inside this shell, not a separate table engine or root component; the base shell must remain usable without the virtual strategy.
_Avoid_: HellDataTable, data-table shell, raw rows-and-columns table component.

**Table Body Strategy**
A shell-internal rendering policy for the TanStack Table Shell body. The normal strategy renders TanStack rows directly; the virtual strategy uses TanStack Virtual while preserving the same shell chrome, projection, status rendering, and styling contract.
_Avoid_: Separate virtual table, virtual table engine, virtual root component.

**Table Shell Status**
The shell-owned external display state for ready, loading, and error chrome around a TanStack Table. Empty chrome is inferred from the rendered TanStack row model when the status is ready; error payload belongs to the error status rather than a parallel input.
_Avoid_: Separate loading input, separate error input, empty status, separate empty input.

**Table Shell Region**
A repeatable projected region marker inside the TanStack Table Shell. Region children render in template order and are not shorthand props or singleton slots.
Names should describe table-shell chrome, such as `hellTableShellToolbar` and `hellTableShellFooter`, rather than semantic table structure or TanStack-specific ownership.
_Avoid_: Pagination input, toolbar mode, singleton footer slot, hellTableFooter, hellTanStackTableFooter.

**Expanded Row**
A TanStack-owned row expansion state rendered by the TanStack Table Shell as additional row chrome. Hell may project native TanStack `Row<T>` context into the expanded-row template, but it does not own active-row state or a master/detail feature.
_Avoid_: Detail panel, active row editor, master/detail API.

**TanStack Pagination Control**
A reusable Hell-styled control that reads and mutates pagination through a caller-owned TanStack Table instance. Consumers place it in a Table Shell Region instead of enabling pagination through a shell shorthand.
_Avoid_: Pagination shorthand, shell-owned pagination mode.

**TanStack Filter Control**
A reusable Hell-styled control that reads and mutates filtering through a caller-owned TanStack Table instance or column. Consumers place filter controls in Table Shell Regions instead of enabling filtering through shell shorthand props.
_Avoid_: Filtering shorthand, search shorthand, shell-owned filter mode.

**Unsupported Table Path**
A table integration route that Hell deliberately does not expose, document, or test as a supported product surface. CDK table skinning, first-party data-table rendering, and separate virtual-table entry points are Unsupported Table Paths.
_Avoid_: Experimental table adapter, compatibility table route, grid mode.

**Table Column Resize Runtime**
The table-specific column pair lookup, measurement, live width, minimum-width, total-width-preserving resize transaction, and commit policy that adapts table primitive header cells to Resize Behavior. Initial column sizing, persisted sizing state, and table-engine sizing policy belong to the app or TanStack. The runtime may measure rendered columns and emit primitive resize events, but it must not become a table sizing model. Resize Behavior remains layout-agnostic.

**Omnibar Runtime**
The query state, open state, search orchestration, projected item registry, keyboard navigation, delegated Floating Dismissal, anchor positioning, and hotkey policy behind the omnibar Composite. Dynamic positioning is exposed to CSS through CSS custom properties written by a visual Adapter; concrete layout remains in CSS.

**Typed Value Input**
The draft, parse, stable business formatting, validation, invalid draft state, nullable clear commits, external-value synchronization, and picker coordination shared by text-backed value Composites such as date input and time input. Time values use a structured value inside the module instead of leaking string parsing across callers.
