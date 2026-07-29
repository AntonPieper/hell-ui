# ADR: Floating dismissal delegation spike

- Status: Accepted (amended 2026-07-27, see "Amendment: scoped dialog modality")
- Date: 2026-05-29

## Context

Floating dismissal is a delegate-first runtime: Hell should shrink
document-level outside-click, outside-focus, Escape, and focus-restore code
whenever Angular CDK, Angular Aria, or ng-primitives can own the behavior.

`HellDialog` and `HellPopover` delegate close-on-outside-click and
close-on-Escape to ng-primitives. `HellOmnibar` delegates outside overlay clicks
to CDK and uses a lower-level focus-only Hell dismissal controller. `HellFlyout`
is the named manual exception because it is an inline, consumer-rendered,
non-modal surface with widened boundary semantics.

## Sources checked

- Angular CLI MCP and Angular Primitives MCP were attempted first, but both failed to connect in this environment with `spawn node ENOENT`.
- Context7 `/websites/angular_dev` confirmed Angular CDK connected overlays expose outside-click behavior through `cdkConnectedOverlay` / overlay outside-pointer APIs, and Angular A11y owns focus tools such as focus traps.
- Context7 `/websites/angular_dev` showed Angular Aria currently documents listbox/combobox popup patterns, including CDK Overlay integration, but not a general inline flyout/dismissible-layer primitive.
- Context7 `/ng-primitives/ng-primitives` documented popover/dialog `closeOnOutsideClick` and `closeOnEscape` dismiss guards.
- Local `ng-primitives@0.117.2` typings confirm `NgpPopoverTrigger` owns overlay creation from a `TemplateRef`, exposes `closeOnOutsideClick` / `closeOnEscape`, and renders through the ng-primitives overlay registry rather than attaching behavior to an already-rendered inline element. Re-verified unchanged against `ng-primitives@0.123.0` on 2026-07-03.
- Local Angular CDK 21.2 runtime confirms `CdkConnectedOverlay` emits `overlayOutsideClick` from the overlay ref outside-pointer stream and filters trigger-origin clicks.

## Decision

Do **not** migrate `HellFlyout` to CDK Overlay, Angular Aria, or ng-primitives.

Available delegate APIs own useful parts of the behavior, but none is a narrow
drop-in owner for the current `HellFlyout` contract:

| Candidate | What it can own | Why not used for `HellFlyout` now |
| --- | --- | --- |
| CDK Overlay / `CdkConnectedOverlay` | Portaled overlay lifecycle, positioning, outside-pointer events, Escape detach. | `HellFlyout` is an inline, consumer-rendered surface with a `boundary` input that treats sibling controls as inside. Moving it to an overlay/template primitive would be a public API and DOM-shape rewrite, not a spike. |
| Angular Aria | Listbox/combobox/menu/grid keyboard and ARIA patterns; popup examples integrate with CDK Overlay. | It does not currently provide a general inline non-modal flyout/dismissible-layer primitive that preserves HellFlyout's boundary and close-policy semantics. |
| ng-primitives popover/dialog | Overlay registry, dismiss guards, focus/overlay lifecycle for template-driven primitives. | `NgpPopoverTrigger` owns a `TemplateRef` overlay and dismisses against trigger/overlay/anchor. Adopting it would require converting the inline `hellFlyout` panel into an ng-primitives popover template and reconciling Hell's boundary/scope semantics. |

The manual path is backed by focused unit coverage in `packages/angular/flyout/flyout.spec.ts`:

- the configured `boundary` is inside for click and focus dismissal;
- disabled outside-interaction and Escape close policies do not dismiss.

Those tests name the behavior a future delegate must preserve before
`HellFlyout` can migrate. No broad floating rewrite is authorized by this ADR.

Evidence considered:

- Browser coverage exercises real docs-harness flyout and omnibar surfaces for pointerdown-inside/focusout/click ordering, delayed guard expiry, outside pointer dismissal, outside focus dismissal, Escape, nested flyouts, and portaled floating scopes. It asserts no double-close, no unsafe focus restore, and records event order on failure.
- Current Context7 `/websites/angular_dev` results on 2026-06-03 show CDK popup guidance centered on `cdkConnectedOverlay` / template-owned overlay content, including Angular Aria examples that pass `{origin, usePopover: 'inline'}` through CDK overlay. That remains useful for positioned popup primitives, but it is not a drop-in for the existing inline consumer-rendered `hellFlyout` element with a custom `boundary` inside region.
- Current Angular Aria docs on 2026-06-03 show developer-preview combobox/listbox/menu popup patterns, `ComboboxPopup`, and `ComboboxDialog` for native-dialog combobox popups. They do not expose a general inline non-modal dismissible-layer primitive that preserves `HellFlyout` close-policy and boundary semantics.
- Current Context7 `/ng-primitives/ng-primitives` results on 2026-06-03 show popover/dialog `closeOnOutsideClick` and `closeOnEscape` dismiss guards. Those APIs remain the right delegate for Hell popover/dialog, but adopting them for flyout would convert an inline panel into an ng-primitives template/overlay popover and would bring popover/dialog semantics rather than preserving flyout's non-modal, no-focus-trap contract.

Rationale:

- `HellFlyout` owns a distinct public contract: anchored non-modal light-dismiss, no focus trap, consumer-rendered inline panel, optional widened `boundary`, configurable outside/Escape close policy, scoped nested floating surfaces, and safe Escape focus restoration.
- Browser coverage makes that contract observable. The tested behavior is small
  enough to keep as a named manual adapter, and the available delegate APIs would
  require public DOM/API migration rather than a bounded replacement.
- Deprecating flyout in favor of popover/dialog is rejected for now because Hell already has delegated popover/dialog surfaces for trapped or overlay-owned interactions, while flyout covers sibling-control surfaces that must remain interactive while the panel is open.

Constraints for future work:

- `HellFloatingDismissController` remains internal runtime, not a promoted public abstraction.
- New floating surfaces must check CDK, Angular Aria, and ng-primitives first; copying the flyout manual path requires reopening this ADR.
- Any future flyout migration must preserve the browser contract and the
  `boundary` / scoped-inside semantics before product code changes.

## Omnibar focus dismissal

The remaining omnibar outside-focus dismissal is a composite-owned contract. Do
not migrate the omnibar to CDK, Angular Aria, or ng-primitives just to replace
this one focus rule; a command-palette/listbox rewrite is a different decision.

Evidence considered:

- Omnibar already delegates positioning, portaling, and outside overlay clicks to CDK `CdkConnectedOverlay` through `(overlayOutsideClick)`.
- Current Angular CDK / Angular Aria docs checked through Context7 show combobox/listbox/menu popup patterns on top of CDK Overlay, but not a drop-in outside-focus dismissal stream that understands Hell's registered floating scope.
- Current ng-primitives docs checked through Context7 show popover/dialog outside-click and Escape guards, and Hell menu surfaces can register into the nearest `HELL_FLOATING_SCOPE`, but ng-primitives does not own the parent omnibar's input/panel/nested-surface outside-focus rule.
- Browser coverage exercises the real docs harness for portaled omnibar panel
  focus staying inside and true outside focus closing.

Rationale:

- The kept contract is narrow: when focus leaves the input or CDK-rendered panel for a true outside target, close the omnibar; when focus moves into a nested Hell floating surface registered with the omnibar scope, keep it open.
- CDK is still the right delegate for outside pointer/click dismissal on the connected overlay. Angular Aria or ng-primitives would be candidates for a future command-palette/listbox rewrite, not for swapping this one focus rule.
- `HellOmnibar` must not use the full `HellFloatingInteractionController`.
  Omnibar may construct `HellFloatingDismissController` directly with
  `hellOutsideFocus`, the host root, the omnibar floating scope, and an owner
  document from the host element. The full interaction lifecycle remains a named
  flyout exception.

Tests naming this seam:

- `packages/angular/omnibar/omnibar.spec.ts` covers focus input → panel action, focus panel → nested registered menu surface, and focus nested surface → outside target close.
- `e2e/floating-dismissal.spec.ts` continues to cover the browser-level portaled omnibar panel focus path and true outside focus dismissal.

## Amendment: non-modal popover (2026-07-14)

This ADR's reopen clause has been exercised: `ng-primitives@0.123` dismiss
guards accept per-event guard functions, which is the custom inside-boundary
hook the original decision was waiting for. `HellPopover`/`HellPopoverTrigger`
now drive the ng-primitives popover engine through its primitive functions and
gain `trapFocus` (default `true`), `anchor`, `boundary`, and a reactive `open`
signal. With `trapFocus` false the popover reproduces the flyout contract on
the delegated overlay engine: non-modal, no focus trap, no focus steal,
widened `boundary` inside region, nested surfaces registered with the
surrounding `HELL_FLOATING_SCOPE` count as inside, and focus restores to the
trigger only on Escape (`restoreFocus` computed on the overlay's
`closeOrigin`).

One narrow manual rule remains: for non-modal panels the trigger listens for
document `focusin` and closes when focus lands outside the same inside region,
mirroring the omnibar's focus-only exception. It is trigger-owned, evaluates
the same guard policy, and is not a promoted public abstraction.

Consequence updates:

- The "sibling-control surfaces must remain interactive" niche is now covered
  by the delegated popover path; retiring `HellFlyout` no longer requires
  reopening this ADR provided the browser contract in
  `e2e/popover-contracts.spec.ts` (modal trap/restore, non-modal no-steal,
  boundary-inside, outside click/focus dismissal, Escape restore) stays green.
- The ngp overlay registry does not link portaled child overlays to their
  parent overlay across the embedded-view injector, so nested-surface
  containment is Hell-owned: each popover panel provides the owning trigger's
  panel scope to its descendants, registers itself with the surrounding scope,
  and the trigger's guards consult both. `e2e/floating-dismissal.spec.ts`
  pins the nested keep-open/close-one-layer contract.
- The flyout entry point is retired: its consumers migrated (the audio player
  captions strip inherits the manual exception below), its dismissal races are
  pinned by the popover-backed floating-dismissal harness, and the unit
  contracts formerly in the flyout spec live on as popover unit and browser
  contracts. Copying the manual path into new surfaces is still not allowed.

## Audio player captions exception (2026-07-14)

The retired flyout's named manual exception transfers to the audio player's
captions strip: a docked disclosure whose panel is consumer-rendered inline
DOM (its recipe owns anchoring below the player), so the delegated overlay
engine is the wrong shape. It composes `HellFloatingInteractionController`
directly with the same rule set the flyout used — outside click, outside
focus, and Escape with focus restore to the caption toggle — with the player
host as the inside boundary. No other surface may copy this without reopening
this ADR.

## Amendment: scoped dialog modality (2026-07-27)

A `scoped` dialog blocks one content region while the surrounding app shell
stays interactive. The delegate check for that capability was run against
`ng-primitives@0.123.0` and came out differently from the popover amendment
above: the dialog primitive is the one Hell surface ng-primitives has **not**
decomposed into primitive functions, so its modality decisions are not
reachable.

| Concern | Delegate available? |
| --- | --- |
| Portal lifecycle, dismiss guards, Escape routing through `NgpOverlayRegistry`, exit animations, focus restore to the opener, `closeOnNavigation` | Yes. `NgpDialogManager` / `NgpDialogRef` keep owning all of it; scoped modality changes none of it. |
| Backdrop geometry | Yes — Hell-owned already, through the shared `HellFloatingScopedInsetsRuntime`. |
| `aria-modal` | **Yes.** `NgpDialogConfig.modal` is public and `NgpDialog` exposes a public `modal` input, so the delegated value is readable. A scoped dialog renders `aria-modal="false"` — the blocked region is `inert` and therefore already absent from the accessibility tree, so `false` describes what is actually unavailable. Everything else mirrors `NgpDialog.modal()`. Because host-directive inputs are template-bound, `HellDialog` writes the attribute through its own host binding (declared after the `NgpDialog` host directive, so it is the one that lands) rather than binding the exposed input. |
| Focus trap scope | **No.** `NgpDialog` applies `NgpFocusTrap` as a host directive and exposes none of its inputs, and `ng-primitives/dialog` exports no `ngpDialog` primitive function — only `provideDialogState` / `injectDialogState`. The popover path (`ngpPopover({}) + ngpFocusTrap({ disabled })`, which is how `trapFocus` works) has no dialog equivalent. Angular's host-directive input exposure is template-bound, so the library cannot drive it either. |
| Page-wide `aria-hidden` | **No.** `NgpDialogManager.hideNonDialogContentFromAssistiveTechnology` runs unconditionally for the first open, its previous-value map is private, and `NgpDialogConfig` has no switch. Left alone it makes the still-focusable shell a descendant of `aria-hidden="true"`, which is the violation scoped modality exists to avoid. |
| Background scroll | Partly. `NgpDialogConfig.scrollStrategy` is public, but `BlockScrollStrategy` targets the document, and inside an app shell the document does not scroll — the Dialog Scope root is the real scroll container. |

Dialog modality is therefore only partly un-delegable: `aria-modal` is a public
input Hell drives, and only the focus trap and the assistive-technology pass
are closed.

Decision: keep every delegated concern delegated, and let `HellDialogOverlay`
own exactly the four decisions above that `scoped` changes. The runtime lives
in `packages/angular/dialog/dialog-scope.ts`:

- the Dialog Scope root gets `inert`, the single attribute that removes a
  region from the tab order, pointer input, and the accessibility tree at once
  — `aria-hidden` alone would leave focusable blocked content behind, and a
  focus guard would not block pointer input;
- the scope root's own scroll is locked, with the scrollbar width paid back as
  trailing padding so the blocked content does not reflow;
- the manager's page-wide `aria-hidden` pass is replayed from a baseline the
  first overlay in the document captures before that pass runs, so only values
  the machinery added are undone and a value the page owned beforehand is left
  alone;
- the owner document body is marked with ng-primitives' own `[data-focus-trap]`
  escape hatch, which `NgpFocusTrap.isAllowedExternalTarget` documents as
  "belongs to another focus trap … an intentional escape hatch", so the shell
  can really hold focus. The dialog panel's Tab cycle is unchanged, so keyboard
  focus still never walks into the blocked region.

Both the marker and the replay are document-wide, not dialog-scoped.
`isAllowedExternalTarget` is `target.closest('[data-focus-trap]')`, so a marker
on `body` makes the predicate universally true and releases **every**
`ngpFocusTrap` in the document — not just the scoped dialog's, and not just
dialogs: a `HellPopover` with the default `trapFocus` true loses its
pull-back too (see Constraints). The replay is equally global: it edits
`aria-hidden` on body children the whole page shares.

Both are therefore gated on the same condition — every open dialog is scoped —
and both are re-derived from the whole open set on every transition, in both
directions. `HellDialogOverlay` reference counts page-blocking dialogs (one
without `scoped`, a `scoped` one that found no scope root, or `hell-ui/confirm`
opened over a scoped dialog) separately from scoped ones, and the counts answer
one question with three cases:

| Open set | Page outside the dialogs | Focus-trap marker |
| --- | --- | --- |
| any page-blocking dialog | hidden from assistive technology | off; the delegated trap contains focus |
| scoped dialogs only | exposed | on; the shell can hold focus |
| empty | exactly as it was before the first dialog | off |

Re-deriving in **both** directions is what makes that hold, and each direction
has its own reason. Freeing on close: the manager restores its own
`aria-hidden` map only when its **last** dialog closes, so a page-blocking
dialog closing under a surviving scoped dialog restores nothing. Hiding on
open: the manager hides only for the **first** dialog of a stack, so a
page-blocking dialog opening over a scoped one hides nothing — and the scoped
dialog has already cleared what the first open hid.

Marking a narrower subtree than `body` does not avoid the breadth: the shell
sits inside whatever ancestor could be marked.

All of it is reference counted, so simultaneous scoped dialogs engage once and
the last release restores the exact prior values. A dialog without `scoped`, or
`scoped` without a scope root, keeps ng-primitives' page-wide modality
untouched.

This was originally written up as an upstream limitation — that a page-blocking
dialog stacked on a scoped one simply cannot re-hide the page, because
`hideNonDialogContentFromAssistiveTechnology` runs only for the first open in a
stack. **That was wrong, and it was measured wrong.** Two ordinary page
dialogs in a row keep the page hidden throughout (`P1 → P2 → close P2 → close
P1` was measured in-browser and never exposes the page), precisely because the
first dialog's hiding is never taken away. The gap appears only where scoped
modality took it away. Hell removed it, so Hell puts it back: the `blocked`
phase re-applies `aria-hidden="true"` to exactly the elements it cleared, and
nothing else. `aria-modal="true"` on the stacked panel is then a second signal
rather than the only one.

The general shape of that mistake is worth keeping: a one-directional
invariant. Round 3 fixed "becoming scoped-only must free the page" and left
"stopping being scoped-only must hide it again" unstated, which is how the
mirror defect shipped. The phase function exists so the question is always
"what does the current open set owe the page?", never "what did this dialog
just do?".

Constraints:

- The marker is a version-bound DOM seam like the `State<T>` channel in
  `ng-primitives-state-adapter.md`. `tools/check-architecture.mjs`
  (`dialog-scoped-modality-seam`) keeps it in that one file and keeps
  `HELL_DIALOG_SCOPED_MODALITY_VERSION` matching the installed package.
- When ng-primitives decomposes the dialog into primitive functions, or exposes
  a focus-trap disable and an assistive-technology-hiding opt-out on
  `NgpDialogConfig`, delete the marker and the replay and drive those inputs
  instead — the same way select left the state adapter.
- Scoped modality deliberately weakens document-wide focus containment while
  every open dialog is scoped. That is the contract, not a leak: nothing
  outside the scope root is blocked, so nothing outside it should be forcibly
  refocused. It must never extend to a dialog that does block the page — that
  is what the page-modal reference count is for, and
  `e2e/ui-behavior.spec.ts` pins it by measuring where focus actually lands.
- The weakening is not dialog-only, and naming it that way would understate it.
  `isAllowedExternalTarget` matches `closest('[data-focus-trap]')`, so while
  the marker is on the body **every** `ngpFocusTrap` in the document stops
  pulling focus back — including a `HellPopover` opened with the default
  `trapFocus` true, whose panel would otherwise reclaim focus that moved out of
  it. Such a popover keeps its Tab wrap (that is an element-level `keydown`
  handler, not the document listeners) and its own dismissal, so it stays
  usable; what it loses is the safety net that re-focuses the panel when focus
  lands outside. That is consistent with scoped modality's premise — the
  surrounding shell is deliberately live — but it is a real reduction for a
  modal popover, and it is the strongest reason to keep the marker's window as
  narrow as it is.
- The `aria-hidden` state is document-wide for the same reason and gets the
  same treatment: derived from the open set on every transition in both
  directions, never latched. The baseline it replays is captured once per
  document by the first overlay, before the manager's pass, so it always
  answers "what did the machinery change?" rather than "what did this open
  change?" — the per-open form silently skipped a value an already-open
  page-blocking dialog had set. Only elements the machinery hid are ever
  touched, and only elements scoped modality cleared are ever re-hidden.
- The transition matrix is the test contract, not an example. Both levels cover
  the same eleven sequences: each kind alone; two of the same kind closed in
  either order; both mixed orders opened and closed either way; and a
  page-blocking dialog arriving and leaving between two scoped ones. Each is
  asserted as the three-case rule above rather than as per-step expectations,
  each step settles the open-dialog count first — a close of one of two
  same-kind dialogs changes nothing observable, so the rule alone cannot tell
  a finished close from an unfinished one — and each is mutation-verified.
  Every defect this ADR records shipped because coverage pinned one order, so
  adding a case is cheaper than trusting a new one is symmetric.
- `scoped` is a public input and can flip on an open dialog, so a role change
  is applied as one transition rather than a release followed by a retain.
  Splitting it takes the document through an empty open set, which restores and
  forgets the hiding that the new role immediately owes back. Covered by unit
  test and mutation-verified; the browser matrix does not repeat it because no
  docs surface toggles the input mid-open.
- Known limit, verified as parity rather than assumed: a direct body child
  appended *after* the manager's hiding pass is in neither the baseline nor the
  cleared set, so it stays exposed to assistive technology while a
  page-blocking dialog is open. ng-primitives behaves the same way on its own —
  measured with `P1` open, a body child appended, then `P2` opened: the late
  child stays exposed there too, because the manager does not rerun its pass
  for a second dialog. Closing that gap means owning the hiding pass outright,
  which is a bigger decision than this ADR makes; tracked in #427 with the
  measurement attached.

## Consequences

- `HellFloatingDismissController` remains internal runtime, not a promoted public abstraction.
- New floating primitives should prefer CDK Overlay, Angular Aria, or ng-primitives first; copying `HellFlyout` dismissal is not allowed without an ADR update.
- Scoped dialog modality is Hell-owned only for the four decisions listed in its amendment; every other dialog concern stays delegated.
- Direct `HellFloatingInteractionController` usage is limited to the named flyout exception; omnibar may use `HellFloatingDismissController` only for the documented focus-only registered-scope rule.
- If future browser contracts find focus/outside-click races, fix the tested race before attempting delegation.
- If a future ng-primitives or Angular Aria release exposes an inline dismissible-layer primitive with custom inside-boundary support, reopen this ADR and replace the manual flyout path in a bounded change.
