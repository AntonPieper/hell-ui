# ADR: ng-primitives form-state adapter seam

- Status: Accepted
- Date: 2026-05-29
- Rechecked: 2026-07-03 for `ng-primitives@0.123.0`

## Context

Hell wraps Angular Primitives/ng-primitives select, combobox, and radio group
primitives as Angular form controls. The wrapper `ControlValueAccessor`
implementations need to sync `writeValue` and disabled state without pretending
that private primitive instance fields are a public API.

The 2026-07-03 recheck answered the same narrow question against
`ng-primitives@0.123.0`: can Hell now remove the adapter and call public
value/disabled setters, or does it still need a guarded state-provider seam?

## Sources consulted (2026-07-03 recheck)

- The published `ng-primitives@0.123.0` tarball (`npm pack ng-primitives@0.123.0`) typings and fesm2022 sources.
- `types/ng-primitives-select.d.ts` documents the rearchitected select state: `injectSelectState<T>()` returns `Signal<NgpSelectState<T>>` with public `setValue(value: T | undefined, options?: SetterOptions): void` (documented for "form `writeValue` where the internal state should sync without notifying", `{ emit: false }`) and `setDisabled(disabled: boolean): void` (documented for "form `setDisabledState` integration").
- `types/ng-primitives-combobox.d.ts` still exposes `injectComboboxState<U = NgpCombobox>(): Signal<State<U>>` with `value: InputSignal<any>` / `disabled: InputSignalWithTransform<boolean, BooleanInput>` and no `setValue` / `setDisabled` / CVA hooks (`rg "setValue|setDisabled|writeValue|ControlValueAccessor"` returns no setter API).
- `types/ng-primitives-radio.d.ts` still exposes `injectRadioGroupState<T>(): InjectedState<NgpRadioGroup<T>>`; the only public mutator remains `select(value: T): void`, which emits `valueChange` (fesm2022 radio source), so it is not a `writeValue` equivalent.
- `types/ng-primitives-roving-focus.d.ts` adds a public `setActiveItem(id: string | null, origin?: FocusOrigin): void` on `NgpRovingFocusGroupState`, but the fesm implementation calls `item.focus(origin)` (`focusMonitor.focusVia`), so it steals DOM focus and cannot be used for silent tab-stop sync. The state object still returns the raw writable `activeItem` signal at runtime (typed readonly `Signal<string | null>`), and radio still does not map checked-item state into roving focus.

## Public API findings (`ng-primitives@0.123.0`)

| Primitive | Public value API | Public disabled API | Public CVA-sync hook? | Finding |
| --- | --- | --- | --- | --- |
| `NgpSelect` | `NgpSelectState.setValue(value, { emit: false })` | `NgpSelectState.setDisabled(disabled)` | Yes — both setters are documented for CVA `writeValue` / `setDisabledState` integration. | **Adapter removed for select.** `HellSelect` calls the public setters directly. |
| `NgpCombobox` | `readonly value: InputSignal<any>` and `ngpComboboxValueChange` only; `injectComboboxState()` returns `Signal<State<NgpCombobox>>`. | `readonly disabled: InputSignalWithTransform<boolean, BooleanInput>`; no `setDisabled`. | No. | Keep the adapter for combobox. The state-provider channel remains the only sync seam. |
| `NgpRadioGroup` | `readonly value: InputSignal<T \| null>`, `ngpRadioGroupValueChange`, and `select(value)` which emits `valueChange`. | `readonly disabled: InputSignalWithTransform<boolean, BooleanInput>`; no public disabled setter. | Not enough — `select(value)` emits, so it is not a `writeValue` hook. | Keep the adapter for radio value and disabled sync. |
| Roving focus group | `setActiveItem(id, origin)` exists but DOM-focuses the item via `focusMonitor.focusVia`. | n/a | No non-focusing setter. | Keep the non-focusing `activeItem` channel write for radio checked-item tab stops. |

## Decision

Keep the adapter with guard for **combobox and radio group only**; select now
uses the public `NgpSelectState.setValue` / `setDisabled` API and is banned
from the adapter by the architecture guard.

This ADR accepts the version-bound `State<T>` channel seam for
`ng-primitives@0.123.0`. This is not a claim that combobox or radio group have
complete public CVA setters; it is a deliberate internal compatibility seam
over the documented state-provider API until those setters exist.

The retired popover close adapter is related evidence that upstream converges
on Hell's needs: ng-primitives now destroys overlays from the trigger's
`ngOnDestroy` (while output bindings are still attached) and guards double
`onClose` emission, so Hell's NG0953 teardown adapter was deleted outright in
this recheck.

The package pin remains intentional: both the workspace dependency and published
peer dependency stay pinned to `ng-primitives@0.123.0` while Hell depends on
the remaining channel shape. The documented state-provider seam is public
enough for guarded internal use, and the version-bound reliance is explicit,
tested, and architecture-guarded.

## Guardrails

- `ngp-state-adapters.ts` owns the only production writes to the version-bound `State<T>.value` and `State<T>.disabled` channels.
- `tools/check-architecture.mjs` fails if the adapter version constant drifts from the installed `ng-primitives` package, or if workspace/package peer pins stop matching that installed version.
- The architecture guard rejects direct `State<T>.value.set(...)`, `State<T>.disabled.set(...)`, indexed state-channel writes, retired private bridge tokens, and direct primitive-instance `.state` access outside the adapter seam.
- The architecture guard rejects select and toggle-group state-writer tokens in the adapter: primitives with public setters must use them.
- The adapter is internal-only and must not be re-exported from the adapters barrel.

## Consequences

- `ng-primitives@0.123.0` stays intentionally pinned while Hell depends on the `State<T>` channel shape for combobox and radio.
- Any ng-primitives upgrade must rerun this ADR check against the upgraded typings/docs before changing the pin.
- The architecture guard must continue to reject ad hoc ng-primitives state writes outside the adapter, including typed direct channel writes.
- When a future ng-primitives release adds public combobox and radio-group
  value + disabled setters with a silent-update option, remove those writes
  from the adapter (as done for select in 0.123.0); when roving focus gains a
  non-focusing active-item setter (or radio maps checked state into roving
  focus), remove `writeRovingFocusActiveItem` and delete the adapter entirely.
