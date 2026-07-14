# ADR: Native/styled control pairs stay two products

- Status: Accepted
- Date: 2026-07-14

## Context

Four form controls ship in two flavors: a delegated rich control
(`button[hellCheckbox]`, `button[hellSwitch]`, `button[hellRadio]`,
`hell-select` / `[hellSelectTrigger]`) built on ng-primitives, and a styled
native element (`input[type=checkbox][hellNativeCheckbox]`,
`input[type=checkbox][hellNativeSwitch]`,
`input[type=radio][hellNativeRadio]`, `select[hellNativeSelect]`). The
API-simplification audit (#181) asked whether the pairs should collapse to
one component each by rebuilding the styled controls on visually-hidden
native inputs (the shadcn approach).

## Decision

**Keep the pairs.** Each half is a distinct product, not duplication:

- The delegated rich controls exist for owned anatomy the native elements
  cannot render — an indeterminate indicator part, a switch thumb, a
  popover-based option dropdown with typeahead — with ng-primitives owning
  the ARIA and state machinery per the delegate-first policy
  (`docs/adr/ng-primitives-state-adapter.md`).
- The styled native elements exist for forms-first surfaces where platform
  semantics are the feature: native form submission and validation,
  autofill, `:checked`/`:indeterminate` CSS, OS-rendered select dropdowns,
  and zero-JS degradation. Hell's own composites reach for them where that
  is the right trade — the TanStack pagination control's rows-per-page
  `<select>` is a `hellNativeSelect`; table row selection uses
  `hellNativeCheckbox`/`hellNativeRadio` hooks.

Rebuilding the rich controls on visually-hidden native inputs was
rejected:

- It forfeits ng-primitives delegation for four battle-tested controls and
  re-owns focus/keyboard/ARIA behavior Hell deliberately does not own —
  the same reasoning that keeps floating dismissal delegate-first.
- It does not collapse the select pair at all: a styled native `<select>`
  (OS-owned dropdown) and a rich dropdown with Hell-styled options are
  irreducibly different components, so the library would still ship two
  select flavors and gain nothing but churn elsewhere.
- The Selector Convention already prices the choice into the name: the
  `hellNative*` attribute on a native element says "the platform owns the
  element, Hell styles it"; the plain selector says "Hell owns the
  behavior."

## Consequences

- No implementation tickets follow from #181; the pairs are a documented
  contract, not a consolidation backlog.
- Component docs should state when to reach for which half (forms-first →
  native; owned anatomy/rich interaction → delegated), mirroring the
  guidance above.
- A future flavor may be added only if it serves a niche neither half
  covers, and it must pick a side of this ADR's ownership split rather
  than introducing a third model.
