# ADR: One public state machine per interaction

- Status: Accepted
- Date: 2026-07-15

## Context

Hell deliberately offers narrow Package Entry Points and semantically distinct
interaction patterns. That breadth becomes expensive when one interaction also
ships a projection-first primitive, an owned data renderer with a second value
model, and a larger Composite that repeats search or token state. Consumers then
learn several Interfaces for the same behavior while maintainers preserve the
same forms, focus, keyboard, and accessibility guarantees more than once.

The owned Select and Combobox renderers introduced by #147 and #162 made this
cost concrete. The shared picker and Search Orchestration work in #182 reduced
implementation duplication, but it did not remove the parallel public models.

## Decision

Hell exposes **one Interaction State Machine per semantic interaction**.

- Presentation is projection onto that state machine. Consumers render their
  domain objects instead of mapping them into a renderer-owned option schema.
- Repeated asynchronous state is a consumer-facing Search Resource backed by
  one Search Orchestration implementation.
- Fixed assemblies are documented recipes over primitives.
- Owned-anatomy Composites remain only when Hell contributes difficult runtime
  coordination that consumers cannot cheaply compose: focus restoration,
  responsive transitions, measurement, timing, hotkeys, dismissal, or
  accessibility announcements.
- Renderer registration, stores, and template helpers are internal seams, not
  consumer extension Interfaces.

This decision revises the owned-renderer direction from #147/#162. It does not
reverse the Selector Convention, collapse native and rich controls, or merge
semantically different ARIA patterns into a mode-driven mega-control.

## Target dispositions

| Surface | Target Interface |
| --- | --- |
| Select | One projection-first rich Select directive suite; Native Select remains a separate platform-owned product. |
| Combobox | One projection-first Combobox suite; selected chips and search results are consumer-rendered. |
| Menu | Semantic Menu primitives stay; the data-driven checkbox renderer becomes a recipe loop. |
| Search | Core exposes a UI-independent Search Resource; renderers do not own data retrieval. |
| Field-like controls | A Control Group composes shared visuals; Chip Input connects editable token fields to Chip Set behavior. |
| Date, Time, Number Input | Typed Value Input behavior lives on real inputs; pickers, steppers, and adornments compose separately. |
| File acquisition | File Picker owns acquisition and validation; upload queues and server workflows are recipes. |
| Confirmation | One Prompt Interface owns modal and anchored choice behavior. |
| Omnibar | Keeps command, hotkey, keyboard, dismissal, and focus runtime; search and tokens compose externally. |
| Toolbar | Plain Toolbar is a primitive; Overflow Toolbar owns measurement and duplicate rendering. |
| App Shell | Keeps layout, responsive panel, and focus coordination; navigation presentation is a recipe. |
| Master/detail | Keeps only responsive detail state, back, and focus policy; resizing and item navigation compose externally. |
| Filter building | An optional projected-editor Feature owns token/focus runtime without a closed field schema. |
| Toast | Toast references are public; the Toast Stack store and renderer records are private. |

## Semantic separations

The following remain separate public concepts even when they share internal
adapters, styling, or resources:

- Menu, Listbox, Select, and Combobox;
- native and rich form controls;
- Dialog, Popover, and Tooltip;
- single-date and date-range pickers;
- Omnibar and Combobox;
- Date, Time, and Number Input behavior.

Hell must not replace those distinctions with a generic mode-driven collection
control. Fewer names do not justify conditional accessibility semantics or
invalid mode combinations.

## Consequences

- Breaking contractions include migration recipes, API-report updates, packed
  consumer proof, and keyboard/focus/announcement contract tests.
- Package Entry Points may remain numerous because semantic import paths are
  intentional; conceptual breadth is measured by independent state machines,
  value models, and rendering policies instead.
- Part Style Maps continue to style owned DOM. Projection-first directives each
  expose their own root map, while the remaining owned Composites expose only
  durable Public Parts.
