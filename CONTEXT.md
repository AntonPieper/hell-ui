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

**Table Column Resize Runtime**
The table-specific column pair lookup, measurement, live width, minimum-width, total-width-preserving resize transaction, and commit policy that adapts table utility header cells to Resize Behavior. Initial column sizing belongs to consumer CSS/Tailwind rather than caller-controlled pixel inputs. The runtime measures rendered columns, owns internal resize state, and exposes sizing through CSS custom properties rather than direct concrete CSS properties such as `width` or `flex-basis`. It emits one resize transaction event for both affected columns using column ids and relative resize intent rather than making pixel widths the public Customization Surface. Resize Behavior remains layout-agnostic.

**Omnibar Runtime**
The query state, open state, search orchestration, projected item registry, keyboard navigation, delegated Floating Dismissal, anchor positioning, and hotkey policy behind the omnibar Composite. Dynamic positioning is exposed to CSS through CSS custom properties written by a visual Adapter; concrete layout remains in CSS.

**Typed Value Input**
The draft, parse, stable business formatting, validation, invalid draft state, nullable clear commits, external-value synchronization, and picker coordination shared by text-backed value Composites such as date input and time input. Time values use a structured value inside the module instead of leaking string parsing across callers.

**Validation Evidence**
Proof that a product claim is true, produced by the narrowest reliable validation method: unit test, integration/build check, browser/e2e test, visual review, package-consumer install, API report, release evidence, or a narrow Static Contract Check for stable source/package/metadata boundaries.
_Avoid_: Static check, gate, sentinel

**Evidence Class**
The declared kind of Validation Evidence a Specification Slice needs: unit, integration/build, browser/e2e, visual, package-consumer, api-report, static-contract, or release-evidence.
_Avoid_: Generic validation, check bucket

**Static Contract Check**
A static analysis rule that enforces a structural invariant better proven from source or package metadata than by executing the UI.
_Avoid_: Architecture test, quality gate

**Brittle Static Sentinel**
A Static Contract Check smell where the rule hardcodes volatile files, strings, examples, or implementation details so normal feature work must patch the check instead of violating a real boundary.
_Avoid_: Architecture protection, policy guard

**Static Contract Manifest**
A machine-readable source of truth for stable boundaries that a Static Contract Check can validate without hardcoding volatile implementation details.
_Avoid_: String allowlist, hidden policy

**Release Evidence Gate**
A release-only check that verifies fresh Validation Evidence exists for a release or production-readiness claim, without replacing the commands that produce that evidence.
_Avoid_: Development gate, architecture check

**Specification Slice**
A bounded unit of planned Hell UI work with explicit acceptance criteria, required Validation Evidence, and fresh-context review before commit.
_Avoid_: Task, ticket

**Evidence-Based Review**
A review that judges a Specification Slice from concrete Validation Evidence and inspected code behavior instead of accepting an agent's summary or a Static Contract Check as proof of product quality.
_Avoid_: Trust-me review, summary review

## Relationships

- A **Specification Slice** must name the **Validation Evidence** needed to prove its acceptance criteria.
- A **Specification Slice** should declare one or more **Evidence Classes** before implementation starts.
- A **Static Contract Check** may support **Validation Evidence**, but it is not proof of behavior, accessibility, visual quality, or user workflow by itself.
- A **Static Contract Check** should encode a stable boundary or machine-readable manifest rule; a **Brittle Static Sentinel** should be deleted or replaced with better Validation Evidence.
- A **Static Contract Manifest** is appropriate for stable entrypoints, peer tiers, API-report expectations, docs lazy-route boundaries, and accepted browser-global seams, but not for volatile component internals or docs prose.
- A **Release Evidence Gate** verifies that required **Validation Evidence** exists and is fresh; it must not replace the commands or reviews that produce that evidence.
- An **Evidence-Based Review** may use **Static Contract Checks** as one signal, but it must reject claims that are only supported by patchable sentinels or agent assertions.
