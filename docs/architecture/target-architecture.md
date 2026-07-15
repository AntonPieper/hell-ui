# Target architecture for production-ready hell-ui

Date: 2026-05-27
Scope: product work in this repository. This document tells agents what "production ready" should mean before they touch code.

## Desired architecture

Hell should be a compact Angular design-system package, not a grab bag of app features.

The ideal shape is:

1. **Core contracts** — stable utilities, labels, Part Style Maps, shared types, and tiny interaction adapters.
2. **Headless behavior primitives** — directives/components that own semantics, keyboard behavior, ARIA, focus, and state, preferably by delegating to Angular CDK, Angular Aria, or Angular Primitives/ng-primitives where those libraries already own the hard behavior.
3. **Styled primitives** — default Hell classes, data attributes, CSS variables, tokens, and Part Style Maps layered over headless behavior.
4. **Composites** — opinionated business-app compositions that should remain optional and narrow-entrypointed, and that earn owned anatomy through difficult runtime coordination rather than a duplicate renderer model.
5. **Features** — heavy integrations such as PDF viewer, CodeMirror editor, the TanStack table shell, and audio/transcript features. These must be optional, isolated, and consumer-tested as feature entrypoints. If their peer-dependency cost or lifecycle complexity dominates the package, split them into separate packages.

## Industry standards used as yardstick

- Angular libraries published to npm should ship Angular Package Format output and partial Ivy compilation so consuming apps link the library with their Angular compiler version. Source: https://angular.dev/tools/libraries/angular-package-format and https://angular.dev/tools/libraries/creating-libraries
- Angular CDK/A11y exists for focus management, focus traps, live announcements, overlays, and other behavior infrastructure. Hell should delegate there unless it has a very specific domain reason to own code. Source: https://angular.dev/best-practices/a11y
- Angular Aria is the Angular team’s newer headless directive layer for common WAI-ARIA patterns; it handles keyboard interactions, ARIA attributes, focus management, and screen reader support while the application supplies HTML/CSS/business logic. Source: https://angular.dev/guide/aria/overview
- Angular Primitives/ng-primitives positions itself as a low-level headless UI library focused on accessibility, customization, and developer experience. Hell should not fork those behaviors accidentally. Source: https://angularprimitives.com/
- Radix Primitives and Headless UI set the non-Angular benchmark: low-level/headless primitives, accessibility, customization, and strong TypeScript/docs. Sources: https://www.radix-ui.com/primitives/docs and https://headlessui.com/
- API Extractor is a common TypeScript-library tool for validating and reviewing exported API surfaces. Source: https://api-extractor.com/ and https://heft.rushstack.io/pages/tasks/api-extractor/
- Browser accessibility testing should include functional keyboard/focus tests plus automated checks such as Playwright + axe; automated checks are a first line, not a full accessibility proof. Sources: https://playwright.dev/docs/accessibility-testing and https://storybook.js.org/docs/writing-tests/accessibility-testing

## Architectural rules

### Package boundary

- Root entrypoint stays light. No composites or heavy features from root.
- Narrow entrypoints remain the default import path for real consumers.
- Feature entrypoints must have explicit peer-dependency docs, package-consumer scenarios, and style import examples.
- Any new package export must include an entrypoint-local `hell-entrypoint.json`
  sidecar and be generated/guarded by the entrypoint tooling.

### Third-party behavior boundary

- Prefer Angular CDK/A11y, Angular Aria, and Angular Primitives/ng-primitives for focus, overlay, roving focus, aria-activedescendant, dismissable layers, and form-control state when public APIs exist.
- Hell-owned behavior is acceptable only when documented as a contract with tests and an explicit reason not to delegate.
- Version-bound adapter seams must be centralized, guarded, and paired with a clear removal condition.

### Public API boundary

- Stable exports need an API report/baseline.
- Experimental features must be explicitly marked and not accidentally promoted by aggregate exports.
- Breaking changes require a recorded semver/changelog decision.

### Interaction boundary

`docs/adr/projection-first-interactions.md` defines the interaction model:

- expose one public Interaction State Machine per semantic interaction;
- let consumers project presentation and domain objects onto behavior
  primitives instead of mapping into renderer-owned schemas;
- put reusable asynchronous state in a Search Resource and fixed assemblies in
  recipes;
- keep owned Composites only for difficult coordination such as focus,
  responsive transitions, measurement, timing, hotkeys, dismissal, and
  announcements;
- keep renderer registration, stores, and template helpers internal;
- preserve distinct Menu, Listbox, Select, Combobox, native-control, floating,
  picker, Omnibar, and typed-input semantics instead of merging them behind
  mode switches.

### Table platform boundary

- Table work follows `docs/adr/tanstack-table-shell.md`, not the superseded composable-table-layer ADR.
- Hell supports exactly two table paths: `/table` for native-table primitives and `/table-tanstack` for the Hell-styled TanStack Table Shell.
- TanStack is the table engine for rows, columns, sorting, filtering, pagination, selection, pinning, sizing, expansion, virtualization, and state.
- Hell table primitives remain native-table semantic/styling affordances. They do not expose a normalized table model, table state channels, grid mode, row draft controller, column definition DSL, column visibility panel, or first-party data-table renderer.
- `/table-tanstack` may provide reusable shell chrome, projected shell regions, TanStack-aware controls, and an optional TanStack Virtual body strategy, but it must require a caller-owned TanStack `Table<T>` instance.
- Legacy feature aliases, clickable-row APIs, `/data-table`, `/table-virtual`, and `/table-cdk` should be removed before beta because there are no consumers yet.

### Testing boundary

A production-ready release needs all of these to be boring:

1. lint + architecture + CI contract;
2. unit tests, serial in constrained environments and parallel in CI;
3. library build;
4. docs build with no meaningless permanent warnings;
5. package-consumer install/build scenarios for root, narrow primitive, aggregate primitive CSS, composite, and at least one heavy feature;
6. browser accessibility tests for focus/keyboard/dismissal behaviors;
7. API report checks;
8. npm pack contents/APF audit;
9. release dry-run.

## Non-goals

- Do not rewrite the library into Angular Material.
- Do not delete the Hell design language.
- Do not add new mega-framework abstractions to prove the old ones were bad.
- Do not broaden a targeted architecture change into unrelated component cleanup.

## Table layers

`docs/adr/tanstack-table-shell.md` defines the table boundary. The root architecture expectation is:

- native semantic table behavior by default;
- no Hell-owned grid mode, row model, active-row state, row selection state, or column visibility state;
- dynamic business tables use `/table-tanstack`, where TanStack owns table behavior and Hell owns shell/styling ergonomics;
- optional virtualization is a `/table-tanstack` body strategy, not a separate table engine or root component;
- package-consumer and architecture checks reject removed table paths and prevent TanStack/Virtual imports from leaking into `/table` primitives.
