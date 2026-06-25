# ADR: ng-primitives form-state adapter seam

- Status: Accepted
- Date: 2026-05-29

## Context

Hell wraps Angular Primitives/ng-primitives select, combobox, and radio group
primitives as Angular form controls. The wrapper `ControlValueAccessor`
implementations need to sync `writeValue` and disabled state without pretending
that private primitive instance fields are a public API.

The recheck had to answer one narrow question: can Hell now remove that adapter and call public value/disabled setters, or does it still need a guarded state-provider seam?

## Sources consulted

- Angular Primitives MCP was attempted first because it is the preferred configured source, but the local MCP gateway failed to connect with `spawn node ENOENT`.
- Context7 resolved Angular Primitives as `/ng-primitives/ng-primitives`. Context7 documentation for Usage > State Providers says directives offer state providers for programmatic control and that directive inputs are converted into writable linked signals. Context7 Select/Combobox/Radio API pages documented the primitives and data attributes but did not expose `setValue`, `setDisabled`, `writeValue`, or `setDisabledState` for `NgpSelect`, `NgpCombobox`, or `NgpRadioGroup`. Sources returned by Context7:
  - `https://github.com/ng-primitives/ng-primitives/blob/next/apps/documentation/src/app/pages/(documentation)/getting-started/usage.md`
  - `https://github.com/ng-primitives/ng-primitives/blob/next/apps/documentation/src/app/pages/(documentation)/primitives/select.md`
  - `https://github.com/ng-primitives/ng-primitives/blob/next/apps/documentation/src/app/pages/(documentation)/primitives/combobox.md`
  - `https://github.com/ng-primitives/ng-primitives/blob/next/apps/documentation/src/app/pages/(documentation)/primitives/radio.md`
- Local installed typings after `pnpm install` are `ng-primitives@0.117.2`, matching the workspace dependency and published peer dependency.
- The npm latest tarball was also checked with `npm pack ng-primitives@0.120.4`; its select/combobox/radio typings have the same public form-state shape for this decision. The check `rg -n "ControlValueAccessor|writeValue|setDisabledState|registerOnChange|registerOnTouched|setValue|setDisabled\\(|select\\(value" package/{select,combobox,radio,state}/index.d.ts` returned only `radio/index.d.ts:56 select(value: T): void` and the generic `state/index.d.ts:115` `writeValue` comment.

## Public API findings

| Primitive | Public value API | Public disabled API | Public CVA-sync hook? | Finding |
| --- | --- | --- | --- | --- |
| `NgpSelect` | `readonly value: InputSignal<any>` and `ngpSelectValueChange`; `injectSelectState()` returns `Signal<State<NgpSelect>>`. Local evidence: `node_modules/ng-primitives/select/index.d.ts:199-207`, `:367-377`. | `readonly disabled: InputSignalWithTransform<boolean, BooleanInput>`; no `setDisabled`. Local evidence: `node_modules/ng-primitives/select/index.d.ts:206-207`, `:367-377`. | No. `rg` over select typings found no `ControlValueAccessor`, `writeValue`, `setDisabledState`, `setValue`, or `setDisabled`. | Do not remove the adapter for select. The public state-provider channel remains the only sync seam. |
| `NgpCombobox` | `readonly value: InputSignal<any>` and `ngpComboboxValueChange`; `injectComboboxState()` returns `Signal<State<NgpCombobox>>`. Local evidence: `node_modules/ng-primitives/combobox/index.d.ts:224-231`, `:439-450`. | `readonly disabled: InputSignalWithTransform<boolean, BooleanInput>`; no `setDisabled`. Local evidence: `node_modules/ng-primitives/combobox/index.d.ts:228-231`, `:439-450`. | No. `rg` over combobox typings found no `ControlValueAccessor`, `writeValue`, `setDisabledState`, `setValue`, or `setDisabled`. | Do not remove the adapter for combobox. The public state-provider channel remains the only sync seam. |
| `NgpRadioGroup` | `readonly value: InputSignal<T | null>`, `ngpRadioGroupValueChange`, and public `select(value: T): void`. Local evidence: `node_modules/ng-primitives/radio/index.d.ts:22-30`, `:52-58`. | `readonly disabled: InputSignalWithTransform<boolean, BooleanInput>`; no public disabled setter. Local evidence: `node_modules/ng-primitives/radio/index.d.ts:31-34`, `:52-58`. | Not enough. `select(value)` emits `valueChange` in the installed runtime (`node_modules/ng-primitives/fesm2022/ng-primitives-radio.mjs:88-94`), so it is not an equivalent `writeValue` hook. | Do not replace radio CVA writes with `select(value)`. Keep the state-provider seam for value and disabled sync. |

The general `ng-primitives/state` API supports the adapter model: `State<T>` maps `InputSignal` / `InputSignalWithTransform` fields to `WritableSignal` fields (`node_modules/ng-primitives/state/index.d.ts:4-18`), and `createStateInjector` returns `Signal<State<U>>` (`:45-50`). `SetterOptions.emit` exists for `controlledState` (`:112-123`), and is evidence that ng-primitives knows about silent form `writeValue` sync, but select/combobox/radio do not expose a public setter using those options.

## Decision

Keep the adapter with guard.

This ADR accepts the version-bound `State<T>` channel seam for
`ng-primitives@0.117.2`. This is not a claim that select, combobox, or radio
group have complete public CVA setters; it is a deliberate internal
compatibility seam over the documented state-provider API until those setters
exist.

Hell will not remove `ngp-state-adapters.ts` now because current public APIs still do not provide complete value + disabled setters or equivalent CVA sync hooks for all three primitives. The adapter may continue to prefer future `setValue(value, { emit: false })` and `setDisabled(boolean)` methods if ng-primitives adds them, but the current supported path remains the injected `State<T>.value` and `State<T>.disabled` writable channels.

The package pin remains intentional: both the workspace dependency and published
peer dependency stay pinned to `ng-primitives@0.117.2` while Hell depends on this
channel shape. The documented state-provider seam is public enough for guarded
internal use, and the version-bound reliance is explicit, tested, and
architecture-guarded.

## Guardrails

- `ngp-state-adapters.ts` owns the only production writes to the version-bound `State<T>.value` and `State<T>.disabled` channels.
- `tools/check-architecture.mjs` fails if the adapter version constant drifts from the installed `ng-primitives` package, or if workspace/package peer pins stop matching that installed version.
- The architecture guard rejects direct `State<T>.value.set(...)`, `State<T>.disabled.set(...)`, indexed state-channel writes, retired private bridge tokens, and direct primitive-instance `.state` access outside the adapter seam.
- The adapter is internal-only and must not be re-exported from the adapters barrel.

## Consequences

- `ng-primitives@0.117.2` stays intentionally pinned while Hell depends on the `State<T>` channel shape.
- Any ng-primitives upgrade must rerun this ADR check against the upgraded typings/docs before changing the pin.
- The architecture guard must continue to reject ad hoc ng-primitives state writes outside the adapter, including typed direct channel writes.
- If a future ng-primitives release adds public select/combobox/radio value and
  disabled setters with a silent-update option, Hell should remove the fallback
  state-channel writes.
