# Angular Aria parity audit: owned interaction state

- Date: 2026-07-19
- Scope: the owned keyboard/focus/dismissal machinery of app shell, toolbar,
  omnibar, and the floating/dismissal runtime, audited against **stable**
  Angular Aria (`@angular/aria`, stable since Angular v22, 2026-06-03).
- Evidence sources: `angular.dev/guide/aria/{overview,toolbar,combobox,listbox,menu}`
  checked 2026-07-19; owned sources cited per row under `packages/angular/`;
  `docs/architecture/manual-runtime-ownership.md`;
  `docs/adr/floating-dismissal.md`; `docs/adr/ng-primitives-state-adapter.md`;
  `docs/adr/projection-first-interactions.md`.
- Version context: `packages/angular/package.json` already peers on
  `@angular/core`/`@angular/cdk` `^22.0.0`, so stable Angular Aria has no
  framework-version gate. `ng-primitives` remains intentionally pinned at
  `0.123.0` per the ng-primitives state-adapter ADR.

## Angular Aria stable surface (as checked)

Angular Aria ships twelve stable headless patterns: Accordion, Autocomplete,
Combobox, Grid, Listbox, Menu, Menubar, Multiselect, Select, Tabs, Toolbar,
and Tree. Facts that drive the verdicts below:

- **Toolbar** (`ngToolbar`, `ngToolbarWidget`, `ngToolbarWidgetGroup`): roving
  tabindex with orientation-aware arrows and RTL reversal, `wrap`,
  `softDisabled` (default `true`: disabled widgets stay focusable), and a
  selection `value: V[]` model; `ngToolbarWidget` requires a `value`
  identifier. The docs do not address dynamic membership changes or overflow
  menus.
- **Combobox** (`ngCombobox`, `ngComboboxPopup`, `ngComboboxWidget`):
  coordinates a trigger input with a Listbox/Tree/Grid popup over CDK
  `cdkConnectedOverlay`, exposes `[(expanded)]`/`[(value)]`, and leaves
  filtering "in user space" via signals — dynamic, async option lists are the
  documented model.
- **Listbox** (`ngListbox`, `ngOption`): `focusMode` supports
  `'activedescendant'` (DOM focus stays on the combobox input while
  `aria-activedescendant` tracks the active option), `selectionMode`
  `'follow' | 'explicit'`, `typeaheadDelay`, `softDisabled`, `wrap`, `multi`.
- **Menu** (`ngMenu`, `ngMenuContent`, `ngMenuItem`, `ngMenuTrigger`):
  submenus, character-search typeahead, close on select/Escape/outside click,
  focus restore to the trigger, CDK Overlay integration.
- **Not present in stable Angular Aria**: a dialog pattern, a focus-trap
  primitive, a breakpoint/layout primitive, a global-hotkey service, or a
  generic outside-interaction/dismissible-layer primitive. Overlay lifecycle,
  positioning, and outside-click ownership stay with CDK Overlay; focus traps
  stay with CDK A11y.

## Decision rule

Same as `manual-runtime-ownership.md`: prefer a stable framework primitive
when it owns the behavior at least as well as Hell, especially where Hell
currently relies on private or version-pinned third-party surfaces. Keep Hell
runtime only where the row names a differentiated capability with tests.

## Verdict table

Verdicts: **adopt** (a stable Angular Aria primitive should own this; follow-up
proposed), **keep custom** (differentiated capability named), **watch**
(current decision stands; recheck on Angular Aria releases).

| # | Owned interaction model | Evidence | Angular Aria stable equivalent | Parity assessment | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | App shell responsive layout state: breakpoint-driven mobile/desktop switch, controlled/uncontrolled `sidenavCollapsed`/`secondaryHidden`, data-attribute reflection | `packages/angular/app-shell/app-shell.ts` (`BreakpointObserver` subscribe, `getAppShellCoordination`, `nullableBooleanAttribute` inputs); `e2e/app-shell-contracts.spec.ts` | None. No layout, breakpoint, or panel-shell pattern exists in the twelve. | No overlap. Breakpoint observation is already delegated to stable CDK Layout; the dual controlled/uncontrolled state model is a Hell Component Contract concern. | **Keep custom** — differentiated: controlled/uncontrolled dual-mode shell state over a CDK-delegated breakpoint seam. |
| 2 | App shell mobile panel modality: focus trap, initial-focus arbitration, `inert`/`aria-hidden` on hidden panels, focus restore with retry scheduling | `packages/angular/app-shell/app-shell.ts` (`enableMobileFocusTrap`, `ensureMobilePanelFocus`, `restoreMobileFocusTarget`, `scheduleMobileFocusRestore`; `HellAppSidenav`/`HellAppSecondaryBody` inert bindings) | None. Stable Angular Aria has no dialog pattern or focus-trap primitive; a dialog appears only as a Combobox popup container. | The trap itself is already delegated to stable CDK A11y (`FocusTrapFactory`, `InteractivityChecker`). Hell owns only restore-target arbitration and transition-aware retry timing, which no Aria pattern models. | **Keep custom** — differentiated: restore-target redirection across consumer navigation and transition-settled focus retries on top of a CDK-owned trap. |
| 3 | App shell mobile panel dismissal: outside pointer/click with deferred action completion, Escape close, toggle/panel inside-set | `packages/angular/app-shell/app-shell.ts` (`dismissMobilePanels`, `completeMobilePanelDismissal`, `captureDocumentAction`, `stagePendingCloseAction`, `dismissMobilePanelsOnEscape`) | None. No outside-interaction or light-dismiss primitive in stable Angular Aria. | The differentiating requirement is sequencing: an outside activation (nav link, toolbar button) must run its consumer handler first, then close the panel and redirect focus restore to the activated control. Aria patterns dismiss their own popups only. | **Keep custom** — differentiated: action-completion-ordered outside dismissal with focus-restore redirection. |
| 4 | Plain toolbar roving focus: `hellToolbar`/`hellToolbarItem` delegate the single-tab-stop group to ng-primitives | `packages/angular/toolbar/toolbar.ts` (`HellToolbar` hostDirective `NgpToolbar`, `HellToolbarItem` hostDirective `NgpRovingFocusItem`); `e2e/toolbar-contracts.spec.ts` | `ngToolbar` + `ngToolbarWidget` (+ `ngToolbarWidgetGroup`): stable, framework-owned roving tabindex with orientation and RTL. | Direct pattern match. Today this behavior rides the version-pinned `ng-primitives@0.123.0` surface; Angular Aria is the stable framework primitive that can replace that pin for this entry point. Gates: Hell's contract skips disabled items (Aria `softDisabled` defaults to focusable-disabled, so it must be set `false` or the browser contract renegotiated); `ngToolbarWidget` requires a `value` identifier Hell's item directive would have to synthesize; `ngToolbar` carries a selection `value: V[]` model Hell must leave unused; orientation/RTL parity must be pinned in `e2e/toolbar-contracts.spec.ts` before swap. | **Adopt** — follow-up ticket 1 below. |
| 5 | Overflow toolbar interaction runtime: measured group-aware overflow, manual roving tabindex across changing membership, collapse-time focus rescue, editable-widget key exclusion | `packages/angular/toolbar/toolbar.ts` (`HellOverflowToolbarRenderer.syncRovingTabindex`, `handleKeydown`, `restoreFocusAfterCollapse`, `measure`/`cacheWidths`); `packages/angular/toolbar/toolbar-overflow.ts` (`hellResolveToolbarOverflow`) | `ngToolbar` covers only the static roving-focus part. Nothing in stable Angular Aria measures widths, resolves overflow membership, or rescues focus when the focused control leaves the DOM. | The roving tabindex here is deliberately manual because membership changes per resize frame and the tab stop must follow real focus through re-renders, then land on the overflow trigger when the focused action collapses away. Layering `ngToolbar` under that would reintroduce the two-key-manager conflict `manual-runtime-ownership.md` bans for menus. | **Keep custom** — differentiated: width-measured, group-aware overflow with focus rescue across membership changes. Watch note: revisit the roving layer only if Angular Aria Toolbar documents dynamic-membership support. |
| 6 | Omnibar open/query + active-descendant list model: combobox-pattern input, wrapping active-item movement over an async re-registering item set, disabled skip, `aria-activedescendant` | `packages/angular/omnibar/omnibar.ts` (`onKeyDown`, input `role="combobox"` bindings); `packages/angular/omnibar/omnibar.runtime.ts`; `packages/angular/omnibar/omnibar.active-item.ts`; `e2e/omnibar-a11y-contracts.spec.ts` | `ngCombobox` + `ngListbox focusMode="activedescendant"` + `ngOption`: stable, supports dynamic signal-driven option lists with user-space filtering — the exact model the omnibar needs. | `omnibar.active-item.ts` states its own retirement condition: the policy stays local "until ng-primitives ships an active-descendant list model that tolerates async registration". Stable Angular Aria now provides that model from the framework instead. Remaining gates for a spike: async re-registration under `@for` churn, disabled-skip vs `softDisabled`, wrap parity, `scrollIntoView` anchoring, stable option ids for `aria-activedescendant`, and coexistence with the CDK connected-overlay geometry the omnibar keeps. | **Adopt** (spike-gated) — follow-up ticket 2 below. |
| 7 | Omnibar actions strip: F6 enter/leave between input and strip, arrow cycling, Escape-to-input, open-state tabindex parking | `packages/angular/omnibar/omnibar.ts` (`focusPopupAction`, `HellOmnibarAction.onKeyDown`, `controlTabIndex`); `packages/angular/omnibar/omnibar.runtime.ts` (`focusAdjacentAction`) | `ngToolbar` could own arrow cycling inside the strip at most. No Aria pattern models F6 pane handoff between a combobox input and a popup-internal toolbar. | The differentiated part is the cross-pane contract: F6/Shift+F6 moves between input and strip without adding tab stops while the panel is open, and Escape returns focus then closes. Swapping only the arrow keys for `ngToolbar` would split one interaction across two key owners. | **Keep custom** — differentiated: F6 pane handoff with open-state tab-order parking. |
| 8 | Omnibar outside-focus dismissal over the registered floating scope | `packages/angular/omnibar/omnibar.ts` (`floatingFocusDismissal` with `hellOutsideFocus`, `onBlur`, `onOverlayOutsideClick`); `packages/angular/internal/core/floating-scope.ts` (`HellFloatingScopeRegistry`) | None. Aria comboboxes handle their own focusout in user space; no primitive understands "focus moved into a nested portaled surface registered with this composite". | Already the narrow composite-owned rule the floating-dismissal ADR pins: outside clicks are CDK-delegated (`overlayOutsideClick`); Hell keeps only the focus-only rule that consults the registered scope. | **Keep custom** — differentiated: registered-scope-aware outside-focus rule (ADR-pinned). |
| 9 | Omnibar global hotkey (`mod+k`-style focus/open) | `packages/angular/omnibar/omnibar.ts` (`installHotkey`); `packages/angular/internal/hotkeys/hotkeys.ts` | None. Global shortcuts are outside Angular Aria's problem space. | No overlap; the hotkeys row in `manual-runtime-ownership.md` (keep tiny and opt-in) is unaffected by Angular Aria. | **Keep custom** — differentiated: library-safe opt-in listener ownership with editable-target exclusion. |
| 10 | Floating dismissal rule engine: composed pure matcher rules, inside-pointer timing, deferred focus-exit validation, safe focus restore | `packages/angular/internal/core/floating-dismissal.ts` (`HellFloatingDismissController`, `hellDismissOn`/`hellGuardDismiss`/`hellWithDismissEffect`, `handleFocusExit`) | None. Each Aria pattern owns its own popup dismissal internally; there is no generic dismissible-layer or outside-interaction primitive to compose. | Internal-only runtime with exactly two consumers (omnibar focus rule, audio-player captions exception). The floating-dismissal ADR already commits to reopening when a framework ships an inline dismissible-layer primitive with custom inside-boundary support — Angular Aria stable is not that release. | **Watch** — remains internal, not promoted; recheck each Angular Aria release for a dismissible-layer/outside-interaction primitive. |
| 11 | Floating scope containment: transitive nested-surface registry across portals, scoped inset CSS-variable geometry | `packages/angular/internal/core/floating-scope.ts` (`HellFloatingScopeRegistry.adoptChildScope`, `HellFloatingScopedInsetsRuntime`); `packages/angular/popover/popover.ts` (panel-scope adoption); `e2e/floating-dismissal.spec.ts` | None. Aria menus/comboboxes portal through CDK Overlay but expose no cross-overlay logical-containment registry; the floating-dismissal ADR records that the ngp overlay registry also does not link portaled child overlays. | Genuinely differentiated: "inside" for one Floating Interaction must include arbitrary-depth nested portaled surfaces (popover-in-omnibar, menu-in-popover). No stable framework primitive owns this. | **Keep custom** — differentiated: transitive cross-portal containment behind `HELL_FLOATING_SCOPE`. |
| 12 | Popover non-modal outside-focus rule: trigger-owned document `focusin` close for `trapFocus=false` panels | `packages/angular/popover/popover.ts` (document `focusin` listener, guard-policy evaluation) | None. The delegated ng-primitives popover engine owns outside-click/Escape; no stable primitive (Aria or ngp) emits an outside-focus stream for non-modal anchored panels. | Narrow ADR-named manual rule mirroring row 8. It disappears wholesale when a delegated engine gains non-modal outside-focus dismissal, which is a plausible upstream addition. | **Watch** — recheck ng-primitives and Angular Aria releases for non-modal outside-focus dismissal; delete the listener when one owns it. |
| 13 | Audio-player captions strip: full manual interaction lifecycle (outside click/focus, Escape with restore) for an inline docked panel | `packages/angular/audio-player/audio-player.ts` (`captionsInteraction` composing `hellOutsideClick`, `hellOutsideFocus`, `hellEscapeKey`) | None. The panel is consumer-rendered inline DOM anchored by its recipe; every Aria popup pattern assumes an overlay-projected surface. | This is the retired flyout's named manual exception, transferred by ADR amendment; copying it elsewhere requires reopening that ADR. | **Keep custom** — differentiated: inline non-overlay light dismiss for a docked disclosure (ADR-named exception). |

**Verdict counts**: 2 adopt, 9 keep custom, 2 watch.

## Adjacent version-sensitive seams (noted, out of scope)

The ticket's third question — which private or version-sensitive adapters a
stable framework primitive could replace — also implicates surfaces outside
this audit's four areas. Recorded here for triage, not decided here:

- **ng-primitives state adapter** (`docs/adr/ng-primitives-state-adapter.md`):
  the combobox/radio `State<T>` channel writes are the repo's canonical
  version-bound seam and the reason for the `0.123.0` pin. Angular Aria's
  Combobox/Listbox/Select now cover the same patterns with signal-forms
  integration, making an Aria-backed rich Select/Combobox a credible pin-free
  path — but that is a delegated-engine swap for public form controls, a far
  larger decision than this audit's owned-state scope.
- **Menu typeahead and combobox boundary clamp**
  (`manual-runtime-ownership.md` rows): both exist because ng-primitives 0.123
  lacks a public equivalent. Angular Aria Menu ships character-search
  typeahead and Listbox exposes `wrap`; these become moot only under the same
  engine-swap decision above.

Adopting row 4 removes the last `ng-primitives` dependency of the toolbar
entry point, shrinking the pinned surface without touching the form-control
seams.

## Proposed follow-up tickets (for maintainer triage — not yet filed)

1. **Adopt Angular Aria Toolbar for plain `hellToolbar` roving focus.**
   Replace the `NgpToolbar`/`NgpRovingFocusItem` hostDirectives in
   `packages/angular/toolbar/toolbar.ts` with `ngToolbar`/`ngToolbarWidget`,
   preserving the public `hellToolbar`/`hellToolbarItem` API (label,
   labelledBy, orientation, disabled). Gates: disabled items must stay skipped
   (`softDisabled=false`) or the browser contract must be consciously
   renegotiated toward APG focusable-disabled; synthesize the required widget
   `value`; leave the Aria selection model unused; keep
   `e2e/toolbar-contracts.spec.ts` green and extend it with orientation and
   RTL assertions before the swap. `HellOverflowToolbar` is explicitly out of
   scope (row 5).
2. **Spike: Angular Aria Combobox/Listbox active-descendant model behind the
   omnibar runtime.** Behind `HellOmnibarRuntime`, evaluate replacing
   `HellOmnibarActiveItemController` with `ngCombobox` +
   `ngListbox focusMode="activedescendant"` + `ngOption`. Prove: async item
   re-registration under `@for` churn, disabled-skip parity, wrap parity,
   `scrollIntoView` anchoring, stable ids for `aria-activedescendant`, and
   coexistence with the retained CDK connected overlay, F6 actions strip
   (row 7), outside-focus scope rule (row 8), and hotkey (row 9). No public
   API or behavior change; `omnibar.spec.ts`, `omnibar.runtime.spec.ts`, and
   `e2e/omnibar-a11y-contracts.spec.ts` are the acceptance gate. Outcome is a
   go/no-go decision recorded against this audit and
   `manual-runtime-ownership.md`.

## Review usage

Architecture reviewers should read this audit alongside
`manual-runtime-ownership.md`: that matrix owns keep/delete/delegate for
manual browser runtime generally; this audit owns the Angular Aria parity
question specifically. A finding that Hell should adopt an Angular Aria
primitive must name the row here and explain which gate has been cleared or
which differentiated capability has lapsed. Watch rows (10, 12) should be
rechecked on each Angular Aria minor release.
