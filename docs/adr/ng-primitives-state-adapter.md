# ADR: ng-primitives form-state adapter seam

- Status: Accepted
- Date: 2026-05-29
- Rechecked: 2026-07-03 for `ng-primitives@0.123.0`
- Rechecked: 2026-08-05 for `ng-primitives@0.128.7` — see
  [2026-08-05 recheck](#2026-08-05-recheck-ng-primitives01287)
- Rechecked: 2026-08-06 for `ng-primitives@0.128.8` — identical for every
  surface this ADR covers (the 0.128.7→0.128.8 tarball diff touches only the
  date-picker bundle, adding range `setStart`/`setEnd`). The 0.128.7 verdict
  was executed with the 0.128.8 pin move: the radio and roving-focus writers
  are deleted and the seam is combobox-only.

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

## Decision (current — 2026-08-06, `ng-primitives@0.128.8`)

The seam is **combobox-only**. `writeComboboxStateValue` and
`writeComboboxStateDisabled` are the only guarded `State<T>` channel writes;
select (since 0.123.0), radio group, and roving focus (since 0.128.8) call
public ng-primitives setters directly — `setValue(value, { emit: false })` /
`setDisabled(disabled)` and the non-focusing `setTabStop(id)` — and are banned
from the adapter by the architecture guard.

This is not a claim that combobox has complete public CVA setters; it is a
deliberate internal compatibility seam over the documented state-provider API
until those setters exist. The package stays exact-pinned (workspace catalog
and published peer) while Hell depends on the combobox channel shape. The
adapter is deleted entirely once combobox gains public value + disabled
setters with a silent-update option.

## Guardrails

- `ngp-state-adapters.ts` owns the only production writes to the version-bound `State<T>.value` and `State<T>.disabled` channels, and combobox is its only client.
- `tools/architecture/check-architecture.mjs` fails if the adapter version constant drifts from the installed `ng-primitives` package, or if workspace/package peer pins stop matching that installed version.
- The architecture guard rejects direct `State<T>.value.set(...)`, `State<T>.disabled.set(...)`, indexed state-channel writes, retired private bridge tokens, and direct primitive-instance `.state` access outside the adapter seam.
- The guarded writer tokens are combobox-only; the retired select, radio-group, and roving-focus writers no longer exist, and reintroducing writer usage outside the reviewed bridge files fails the guard. Primitives with public setters must use them.
- The adapter is internal-only and must not be re-exported from the adapters barrel.

## Superseded decision (2026-07-03, `ng-primitives@0.123.0`)

> Superseded by the current decision above: the radio-group and roving-focus
> scope was retired by the
> [2026-08-05 recheck](#2026-08-05-recheck-ng-primitives01287), executed with
> the 0.128.8 pin move.

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

## 2026-08-05 recheck (`ng-primitives@0.128.7`)

Measured against the published `ng-primitives@0.128.7` tarball typings and
fesm2022 sources. **Two of the adapter's three channels now retire; combobox is
the only thing keeping the seam alive.**

### Radio group — retires

`NgpRadioGroupState` is now a real public state surface with real setters:

```ts
setValue(value: T | null, options?: SetterOptions): void;
setDisabled(value: boolean): void;
```

`SetterOptions.emit` is documented verbatim for the case this adapter exists to
serve — "Set to `false` for cases like form `writeValue` where the internal
state should sync without notifying listeners". That is the silent-update
option this ADR named as the exit condition, so `writeRadioGroupStateValue` and
`writeRadioGroupStateDisabled` should be replaced by
`state().setValue(value, { emit: false })` and `state().setDisabled(disabled)`.

This is no longer optional. The state object now exposes `value` as
`deprecatedSetter(value, 'setValue', …)`, a Proxy whose `set` trap logs
`"Deprecation warning: Use setValue() instead of setting the value directly."`
on every call. The adapter's `state.value.set(...)` therefore goes through a
deprecated path and warns on every CVA write.

### Roving focus — retires

`NgpRovingFocusGroupState` gained `setTabStop(id: string | null): void`,
documented as setting the tab stop "without stealing focus" — the
non-focusing active-item setter this ADR asked for. `setActiveItem` still calls
`item.focus(origin)` and still cannot be used for form writes, but
`writeRovingFocusActiveItem` can now be replaced by `setTabStop`.

### Combobox — does not retire

Unchanged from 0.123.0. There is still no `NgpComboboxState` interface;
`injectComboboxState<U = NgpCombobox>()` still returns the raw
`State<U>` directive-derived channel, and there is no `setValue` or
`setDisabled` anywhere in the combobox surface.

### Verdict

The seam survives, scoped to combobox alone. `writeComboboxStateValue` and
`writeComboboxStateDisabled` stay; the radio and roving-focus writers, their
runtime assertions, and the corresponding architecture-guard allowances should
go. Full deletion still waits on public combobox value/disabled setters with a
silent-update option.

**Executed with the 0.128.8 pin move:** radio uses
`setValue(value, { emit: false })` / `setDisabled(disabled)` and roving focus
uses `setTabStop(id)` directly; the retired writers, their assertions, and the
radio bridge allowance in the architecture guard are deleted.

## Consequences

- `ng-primitives` stays intentionally exact-pinned while Hell depends on the `State<T>` channel shape for combobox.
- Any ng-primitives upgrade must rerun this ADR check against the upgraded typings/docs before changing the pin.
- The architecture guard must continue to reject ad hoc ng-primitives state writes outside the adapter, including typed direct channel writes.
- The select (0.123.0), radio-group, and roving-focus (0.128.8) retirements
  are done: those primitives call public setters directly and are banned from
  the adapter by the architecture guard. One step remains — when a future
  ng-primitives release adds public combobox value + disabled setters with a
  silent-update option, move `HellCombobox` onto them and delete the adapter
  entirely.
