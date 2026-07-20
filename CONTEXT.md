# hell Context

hell is a compact Angular component system for dense business applications. It favors primitives, composites, and heavier features that keep consumer markup flexible while concentrating behavior, accessibility, styling, and documentation contracts inside the library.

## Domain Terms

**Behavior Primitive**
A directive-first module whose Interface is behavior, accessibility, and state attributes while consumers own DOM structure and visual styling.

**Styled Primitive**
A low-level UI module whose public value is behavior, accessibility, state attributes, optional default Tailwind part classes, and public CSS variables. It may be directive-first or own a small template when that template is still primitive infrastructure rather than a higher-level workflow. Consumers can use a Part Style Map to refine named public parts while preserving behavior.

**Mixed Entry Point**
A Package Entry Point whose public surface contains both primitive behavior and small convenience structure, but does not rise to a Composite workflow. Its convenience structure must not introduce a second Interaction State Machine for behavior already exposed by the primitive. Mixed Entry Points keep their import-path identity and are classified through manifest metadata rather than filesystem category folders.

**Composite**
A module that combines multiple primitives into a higher-level experience. A Composite may own DOM when difficult coordination such as focus restoration, responsive transitions, measurement, timing, or announcements is part of its leverage; it must not duplicate a primitive's Interaction State Machine merely to render fixed markup.

**Interaction State Machine**
The single consumer-facing value, open, focus, keyboard, and accessibility model for one semantic interaction. Projection may change its presentation, but a convenience renderer must not introduce a parallel model.
_Avoid_: Renderer-owned twin, convenience state machine.

**Control Value Authority**
The single consumer-facing writable model for one stateful control's committed value. Forms integration and delegated interaction engines adapt to it instead of owning parallel committed values; draft text and derived rendering state are not Control Value Authorities.
_Avoid_: CVA-owned value, form-mode value, controlled-value twin.

**Multi-Select Menu Button**
A documented recipe (formerly a Composite entry point) that opens a menu of consumer-rendered checkbox items from a button and reflects the selected count through consumer-owned markup. It is domain-agnostic; table column visibility is only one possible consumer-owned use case.
_Avoid_: Column visibility selector, table column picker.

**Feature**
A heavier module with optional dependencies, runtime setup, or large styling. Features stay behind feature-specific Package Entry Points and feature-specific CSS imports.

**Module Category**
Entrypoint-owned metadata describing a Package Entry Point's architectural role, stored in that entrypoint's `hell-entrypoint.json` sidecar. Examples include `styled-primitive`, `mixed-entrypoint`, `composite`, `feature`, `table-primitives`, `tanstack-table-shell`, or `tanstack-table-body-strategy`. Module Category is not a public import segment and must not create TypeScript or CSS category aggregates. The package-level Default Style Bundle is generated from explicit entrypoint style policy, not inferred from Module Category.

**Component Contract**
The shared Interface expected from public Hell modules: behavior directives, stable public parts for owned structure, data-state/data-size/data-variant attributes for stateful styling, public CSS variables for supported visual values, and a Part Style Map for visual customization.

**Selector Convention**
Attribute selectors mark headless behavior suites: the consumer owns the element and its DOM (`[hellCombobox]`, `[hellMenu]`, `[hellResizable]`). Element selectors mark owned-anatomy modules: the library owns the DOM and exposes named Public Parts (`hell-toaster`, `hell-date-picker`, `hell-save-bar`). The selector documents DOM ownership; it does not justify a second Interaction State Machine for the same behavior.
_Avoid_: "Basic" suffixes, wrapper component, preset (as a public name).

**Style Opt-Out**
The legacy all-or-nothing contract that lets consumers keep a Hell module's behavior and accessibility while removing its default host styling.
_Avoid_: Future customization surface, part style map.

**Public Part**
A named, stable element or region in a Hell module's owned structure that consumers may refine through the module's Part Style Map. Public Parts are represented in DOM with `data-slot`, and the `data-slot` value should match the public part name unless a component documents an exception. Owned-anatomy composites use canonical camelCase Public Part names in both TypeScript and `data-slot`, for example `inputWrap` rather than `input-wrap`. Unknown internal DOM is not part of the component contract.
Public Parts are reserved for meaningful styling surfaces such as roots, panels, controls, content regions, repeated item surfaces, first-class glyphs, and status regions; scaffolding for control flow, measurement, overlay anchoring, focus sentinels, or incidental layout is private unless consumers have a real styling need.
Single-host public directives use `root` as their sole Public Part; the directive name supplies semantic identity, while multi-part owned-anatomy components use semantic part names inside their root Part Style Map. Behavior-only directives and components without a genuine public root part omit `data-slot="root"`; a DOM marker does not create a Public Part by itself.
_Avoid_: Private element, arbitrary descendant.

**Projection Marker**
An exported attribute directive whose job is routing consumer content into an owned-anatomy component's region (`hellEmptyStateActions`, `hellAlertIcon`, `hellPageHeaderMeta`). Markers stay directive classes even when their bodies are empty: components detect projected regions through `contentChild` queries (Angular cannot query bare attributes), directive arrays keep imports uniform, and template type-checking catches marker typos that plain attributes would silently drop. Markers own content routing; the Public Part of the same region owns styling — they are complementary surfaces, not duplicates.
_Avoid_: Bare-attribute projection selector, slot input, marker deletion for symmetry.

**Part Style Map**
The shared contract that lets consumers refine a Hell module's named Public Parts with Tailwind classes. In code, this is the `HellUiInput<Part>` shape: either a shorthand class string for the module's default Public Part or a `HellUi<Part>` map from component-local Public Part names to class strings.
For directive suites and Composites with projected children, a Part Style Map only styles the DOM owned by the directive or component that exposes it; projected child directives expose their own Part Style Maps.
Consumer-facing Part Style Map types are public; Part Recipes, merge configuration, styler factories, and other Part-Class Pipeline plumbing are package internals.
_Avoid_: Style Opt-Out, unstyled mode, class override object, omit map, visual layers, template class override path.

**Part Recipe**
The package-internal component-owned default Tailwind class map for its Public Parts. It is the default half of the Part-Class Pipeline and is not a consumer schema or public type contract.
_Avoid_: Legacy `.hell-*` CSS styling model, global recipe taxonomy.

**Part-Class Pipeline**
The package-internal single class computation path for one Public Part: default recipe classes plus the consumer's matching Part Style Map entry, merged deterministically by Hell's configured Tailwind merge.
_Avoid_: Multiple late class override channels.

**Semantic Theme Token**
A public Hell CSS/Tailwind variable that represents a reusable design value such as primary color, border, foreground, or elevated surface. Runtime themes should override Semantic Theme Tokens rather than component-specific variable families.
_Avoid_: Button-only theme variable, component-specific public color variable.

**Theme Adapter Stylesheet**
An optional exported CSS file for one curated skin, imported after either the Default Style Bundle or the Shared Style Substrate plus relevant Entrypoint-Scoped Stylesheets, that maps a skin to explicit component visual decisions through stable Public Part selectors and `data-slot` values. It is not included in the Default Style Bundle. Adapter coverage is intentionally partial; components not selected by an adapter fall back to their default entrypoint styles.
_Avoid_: Global token registry of component selectors, category aggregate stylesheet, implicit default-bundle inclusion, hidden component theme ontology.

**Additive Class Hook**
Template `class` values used for layout hooks, test hooks, and non-conflicting classes outside the Part-Class Pipeline. It is not the deterministic override path for conflicting Tailwind recipe utilities.
_Avoid_: Part Style Map, class override API.

**Customization Surface**
The consumer-facing Interface for changing a hell module's behavior, styling, and policy without forking or fighting the library. A good Customization Surface exposes the underlying settings consumers naturally want to adjust rather than mode switches or booleans that apply bundled presets.

**Label Contract**
The injectable text Interface for built-in accessibility labels and status strings. Each Package Entry Point owns its label interface, English defaults, and injection token (built on core's `hellCreateLabels` factory); consumers override any subset per injector scope with core's token-scoped `provideHellLabels(token, overrides)` instead of forking components or accepting hardcoded ARIA text. Core owns no aggregate label bag; a consumer bundle carries only the label strings of the entry points it imports.
_Avoid_: Central `HellLabels` bag, per-module label string inputs, `provideHell<Module>Labels` wrapper functions, cross-entry-point label registries.

**Floating Interaction**
Any interaction involving content rendered outside, beside, or above its logical host: menus, popovers, tooltips, dialogs, selects, comboboxes, and omnibar child overlays.

**Tooltip**
A supplementary, non-interactive Floating Interaction that reveals a short hint from a trigger. It never supplies required content or the trigger's accessible name.

**Tooltip Surface**
The displayed hint region of a Tooltip. Plain text uses the library's default surface; custom markup or styling uses a consumer-authored surface with its own Part Style Map.
_Avoid_: Tooltip content (when referring to the surface), tooltip panel.

**Anchored Surface Contract**
The shared trigger Interface for Hell's anchored floating surfaces. Positioned triggers expose `placement`, `offset`, `flip`, `shift`, `container`, and `disabled` under those exact names; Tooltip is the explicit `disabled` exception because absent content disables and closes that supplementary interaction without coupling the host control's state. Dismissable surfaces expose `closeOnEscape` and `closeOnOutsideClick` (guard functions where the engine supports them — there is no other outside-dismiss input name); stateful triggers expose a reactive `open` signal, an `(openChange)` boolean output, `show()`/`hide()` methods, and an `exportAs` matching the directive name. Each surface implements the applicable subset: Tooltip omits dismissal inputs by design, is always hoverable, and always closes on Escape; menu closing stays engine-owned (item select, outside click, Escape — the menu trigger exposes `show()` but no `hide()`), and dialog replaces `openChange` with its result-carrying `(closed)` output.
_Avoid_: closeOnOutsideInteraction, per-surface trigger input dialects.

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

**Docs Theme Picker**
A docs app chrome control for choosing one of Hell's curated runtime theme variants, separate from the light/dark/system theme preference. It is not the public Select or Combobox component contract.
_Avoid_: Palette combobox, theme combobox.

**Docs Example**
A live Angular example plus its raw source code, preview options, and search metadata.

**Package Entry Point**
A public TypeScript import path exposed by the `hell-ui` package, including the Light Root Entry Point and secondary entry points such as `hell-ui/button`, `hell-ui/app-shell`, `hell-ui/table`, and `hell-ui/features/code-editor`.

**Internal Package Path**
A package-owned implementation path such as `hell-ui/internal/*` that is not a Package Entry Point. It may ship as a resolvable Angular Package Format subpath when package entrypoints need shared code, but its `internal` prefix, metadata, absence from consumer docs, and lack of public API stability reports make it explicitly unsupported for consumers. A stable consumer contract is promoted individually to a named non-internal Package Entry Point instead of making an Internal Package Path public.

**Entrypoint Source Directory**
The source directory that matches a Package Entry Point's import path. For example, `hell-ui/button` lives in `packages/angular/button`, while `hell-ui/features/code-editor` lives in `packages/angular/features/code-editor`. This import-path-first layout is the discoverability rule; Module Category stays in the entrypoint sidecar and does not create `primitives` or `composites` source buckets.

**Entrypoint-Scoped Stylesheet**
The CSS file exported for one Package Entry Point, always addressed as that entry point plus `/styles.css`, such as `hell-ui/button/styles.css` or `hell-ui/features/code-editor/styles.css`. Entrypoint-Scoped Stylesheets are the building blocks of Granular Style Mode and the generated Default Style Bundle. Category-level style paths are not public package contracts.

**Default Style Bundle**
The recommended package-level `hell-ui/styles.css` export, generated deterministically from explicit entrypoint style policy. It contains the Shared Style Substrate followed by standard component styles, while Heavy Feature Stylesheets and Theme Adapter Stylesheets remain explicit opt-ins. It is the deliberate CSS exception to import-path-first aggregation.

**Granular Style Mode**
The advanced standard-style consumption mode where a consumer imports the Shared Style Substrate and only the Entrypoint-Scoped Stylesheets it needs. A consumer chooses Granular Style Mode instead of the Default Style Bundle for standard component CSS; Heavy Feature Stylesheets and Theme Adapter Stylesheets may be added to either mode.

**Shared Style Substrate**
The package-level CSS substrate shared by entrypoint-scoped styles. In `hell-ui`, this is `hell-ui/tokens.css`; the Default Style Bundle includes it first, while Granular Style Mode imports it once before concrete entrypoint styles. It must not become a category aggregate.
The Shared Style Substrate owns base Semantic Theme Tokens, palettes, and skin-wide primitives; component-specific skin selectors belong in Theme Adapter Stylesheets.

**Light Root Entry Point**
The Package Entry Point policy where the root `hell-ui` export stays constrained to stable core only; UI surfaces stay behind narrow import-path entry points, while features and heavier runtime surfaces stay behind secondary entry points.

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
The query state, open state, projected item registry, keyboard navigation, delegated Floating Dismissal, anchor positioning, and hotkey policy behind the omnibar Composite. Search results arrive through a consumer-owned Search Resource. Dynamic positioning is exposed to CSS through CSS custom properties written by a visual Adapter; concrete layout remains in CSS.

**Search Resource**
The consumer-facing query, result, status, error, refresh, cancellation, and clearing Interface shared by search-driven experiences. It may rank local items or dispatch asynchronous searches without coupling the data lifecycle to a renderer.

**Search Orchestration**
The shared async lifecycle behind a Search Resource: debounced dispatch, newer-aborts-older cancellation, stale-result protection, and loading/error state. Renderers consume the resource and own only their interaction-specific behavior and projected chrome.
_Avoid_: Per-composite debounce/abort re-implementations.

**Typed Value Input**
The draft, parse, stable business formatting, validation, invalid draft state, nullable clear commits, and external-value synchronization shared by text-backed Date, Time, and Number Input behavior. Picker triggers, picker panels, steppers, and adornments compose around that behavior instead of becoming a second field model.

**Pick Value**
The value shape shared by Hell's option-driven pickers: `T | null` in single mode, `readonly T[]` in multiple mode, and their union, exported once from core as `HellPickSingleValue`, `HellPickMultipleValue`, and `HellPickValue`. Pickers such as select and combobox retype onto this family instead of exporting per-module value types.
_Avoid_: Per-module value twins, `HellSelectFormValue`, `HellComboboxValue`.
