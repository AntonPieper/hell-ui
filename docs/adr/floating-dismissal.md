# ADR: Floating dismissal delegation spike

- Status: Accepted
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
- Local `ng-primitives@0.117.2` typings confirm `NgpPopoverTrigger` owns overlay creation from a `TemplateRef`, exposes `closeOnOutsideClick` / `closeOnEscape`, and renders through the ng-primitives overlay registry rather than attaching behavior to an already-rendered inline element.
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

## Consequences

- `HellFloatingDismissController` remains internal runtime, not a promoted public abstraction.
- New floating primitives should prefer CDK Overlay, Angular Aria, or ng-primitives first; copying `HellFlyout` dismissal is not allowed without an ADR update.
- Direct `HellFloatingInteractionController` usage is limited to the named flyout exception; omnibar may use `HellFloatingDismissController` only for the documented focus-only registered-scope rule.
- If future browser contracts find focus/outside-click races, fix the tested race before attempting delegation.
- If a future ng-primitives or Angular Aria release exposes an inline dismissible-layer primitive with custom inside-boundary support, reopen this ADR and replace the manual flyout path in a bounded change.
