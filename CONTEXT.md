# hell Context

hell is a compact Angular component system for dense business applications. It favors primitives, composites, and heavier features that keep consumer markup flexible while concentrating behavior, accessibility, styling, and documentation contracts inside the library.

## Domain Terms

**Behavior Primitive**
A directive-first module whose Interface is behavior, accessibility, and state attributes while consumers own DOM structure and visual styling.

**Styled Primitive**
A Behavior Primitive plus optional Hell host classes, data attributes, and public CSS variables. Consumers can use Style Opt-Out to keep behavior while removing the default visual implementation.

**Composite**
A module that combines multiple primitives into a higher-level experience. A Composite may own some DOM structure when that structure is part of the leverage it provides, but its docs should name the owned parts and the escape hatches.

**Feature**
A heavier module with optional dependencies, runtime setup, or large styling. Features stay behind feature-specific Package Entry Points and feature-specific CSS imports.

**Component Contract**
The shared Interface expected from public Hell modules: behavior directives, optional default class, data-slot attributes for owned parts, data-state/data-size/data-variant attributes for stateful styling, public CSS variables for supported visual overrides, and Style Opt-Out for full visual opt-out.

**Style Opt-Out**
The shared contract that lets consumers keep a hell module's behavior and accessibility while removing its default host styling with `unstyled`.

**Customization Surface**
The consumer-facing Interface for changing a hell module's behavior, styling, and policy without forking or fighting the library. A good Customization Surface exposes the underlying settings consumers naturally want to adjust rather than mode switches or booleans that apply bundled presets.

**Floating Interaction**
Any interaction involving content rendered outside, beside, or above its logical host: menus, popovers, tooltips, dialogs, flyouts, selects, comboboxes, and omnibar child overlays.

**Floating Scope**
The set of DOM targets that count as "inside" one floating interaction, even when a floating surface is rendered outside the logical host.

**Dialog Scope**
The content region that a scoped dialog should cover while leaving surrounding app shell chrome interactive.

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
The Package Entry Point policy where the root `hell` import stays convenient for core, primitives, and composites, while heavier features stay behind feature-specific Package Entry Points.

**Floating Dismissal**
The listener-driven part of a Floating Interaction that decides when outside pointer, outside focus, or Escape should close a surface, while preserving consumer control over those rules.

**Resize Transaction**
The layout-agnostic pointer or keyboard resize operation that tracks start sizes, deltas, minimums, commits, and cancellation separately from the Adapter that reads or writes DOM layout.

**PDF Adapter**
A swappable Adapter behind the PDF Runtime seam for browser, pdf.js, worker, print, and download concerns that may change during pdf.js upgrades.
