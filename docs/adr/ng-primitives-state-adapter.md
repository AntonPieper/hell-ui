# ADR: ng-primitives form-state adapter seam

- Status: Accepted
- Date: 2026-05-29
- Updated: 2026-07-03

## Context

Hell wraps Angular Primitives/ng-primitives select, combobox, and radio group
primitives as Angular form controls. The wrapper `ControlValueAccessor`
implementations need to sync `writeValue` and disabled state without pretending
that private primitive instance fields are a public API.

The recheck had to answer one narrow question: can Hell now remove the internal
adapter and call public value/disabled setters, or does it still need a guarded
state-provider seam?

## Sources consulted

- `pnpm view ng-primitives version peerDependencies dist-tags time --json`
  confirmed `0.123.0` as the npm `latest` dist-tag, published on
  2026-07-02, with Angular peer range `^21.0.0 || ^22.0.0`.
- The official npm package metadata and Angular Primitives docs were checked
  after no configured Angular Primitives MCP tool was exposed in this session.
- Local installed typings after `CI=true corepack pnpm install
  --no-frozen-lockfile` are `ng-primitives@0.123.0`, matching the workspace
  catalog and the published `@hell-ui/angular` peer dependency.
- The public API check was rerun against installed typings and runtime:
  `rg -n "ControlValueAccessor|writeValue|setDisabledState|registerOnChange|registerOnTouched|setValue|setDisabled|select\\(|activeItem|onClose|openChange" packages/angular/node_modules/ng-primitives/types/ng-primitives-{select,combobox,radio,roving-focus,popover,state}.d.ts packages/angular/node_modules/ng-primitives/fesm2022/ng-primitives-{select,combobox,radio,roving-focus,popover,state}.mjs`.

## Public API findings

| Primitive | Public value API | Public disabled API | Finding |
| --- | --- | --- | --- |
| `NgpSelect` | `injectSelectState<T>()` returns select state with `setValue(value, { emit: false })`. Evidence: `packages/angular/node_modules/ng-primitives/types/ng-primitives-select.d.ts:376-378`. | `setDisabled(disabled: boolean)`. Evidence: `packages/angular/node_modules/ng-primitives/types/ng-primitives-select.d.ts:381-383`. | Remove select from the internal state-writer adapter. `HellSelect` calls public setters directly. |
| `NgpCombobox` | No `setValue`, `writeValue`, or silent setter is exposed on combobox state. The runtime still writes through internal selection helpers and emits from primitive-owned paths. | No public `setDisabled` is exposed. | Keep the guarded state-provider fallback for combobox CVA value and disabled sync. |
| `NgpRadioGroup` | Public `select(value: T): void` still exists, but it emits `valueChange` and does not accept `null` as a CVA write equivalent. Evidence: `packages/angular/node_modules/ng-primitives/types/ng-primitives-radio.d.ts:56`. | No public `setDisabled` is exposed. | Keep the guarded state-provider fallback for radio group CVA value and disabled sync. |
| `NgpRovingFocusGroupState` | `setActiveItem(id, origin?)` exists. Evidence: `packages/angular/node_modules/ng-primitives/types/ng-primitives-roving-focus.d.ts:133-138`. | Not applicable. | Keep the active-item fallback for now because runtime `setActiveItem` focuses the registered item; Hell's radio sync needs to repair tab stops without moving focus. |

The general `ng-primitives/state` API still supports the fallback model:
`State<T>` maps directive inputs to writable signals, and `SetterOptions.emit`
exists for silent `controlledState` writes. The remaining fallback is therefore
centralized, version-bound, and tested rather than spread through component code.

## Decision

Partially remove the adapter.

`HellSelect` no longer uses `ngp-state-adapters.ts`; it calls
`selectState().setValue(value, { emit: false })` and
`selectState().setDisabled(isDisabled)` directly.

Keep the adapter for combobox, radio group, and radio roving-focus tab-stop
sync. Current public APIs still do not provide complete value + disabled setters
or equivalent CVA sync hooks for combobox and radio group, and the roving focus
setter is not a non-focusing active-item setter.

The workspace catalog and published peer dependency remain pinned to
`ng-primitives@0.123.0` while Hell depends on the remaining channel shape.

## Guardrails

- `ngp-state-adapters.ts` owns the only production writes to remaining
  version-bound `State<T>.value`, `State<T>.disabled`, and
  `State<T>.activeItem` channels.
- `tools/check-architecture.mjs` fails if the adapter version constant drifts
  from the installed `ng-primitives` package, or if workspace/package peer pins
  stop matching that installed version.
- The architecture guard rejects direct state-channel writes, indexed
  state-channel writes, retired private bridge tokens, and direct primitive
  instance `.state` access outside the adapter seam.
- The adapter is internal-only and must not be re-exported from the adapters
  barrel.

## Consequences

- `ng-primitives@0.123.0` is the current pinned package version.
- Any ng-primitives upgrade must rerun this ADR check against the upgraded
  typings/docs before changing the pin.
- If a future ng-primitives release adds public combobox/radio value and
  disabled setters with a silent-update option, and a non-focusing roving-focus
  active-item setter or radio-managed replacement, Hell should remove the
  remaining fallback state-channel writes.
