# ADR: One Control Value Authority per stateful control

- Status: Accepted
- Date: 2026-07-19

## Context

Hell's custom form controls have grown several public value shapes. Most expose
an input/output pair and implement `ControlValueAccessor`; a few already expose
an Angular `model()`. The form bridge can also maintain a separate value or mode
alongside the public input, so a control may have more than one plausible source
of truth for the same committed value.

Angular 22 provides stable model inputs and stable Signal Forms custom-control
contracts. A model input supplies the ordinary property and two-way-binding
surface, while `FormValueControl` and `FormCheckboxControl` let that same model
participate in Signal Forms. Angular's migration guidance also supports those
contracts from Reactive Forms and Template-driven Forms, and explicitly warns
custom controls not to implement a Control Value Accessor and a Signal Forms
control contract on the same class.

A hybrid `model()` plus `ControlValueAccessor` design was rejected. Calling
`set()` or `update()` on a model emits its implicit change output. Preserving the
accessor's silent external-write behavior would therefore require a second
silent value or another write path, recreating the dual authority this decision
is meant to remove.

This decision must remain consistent with two existing ownership boundaries:

- Native/styled control pairs remain separate products. A native element keeps
  platform-owned form state; the rich control owns a Hell value contract.
- Delegated ng-primitives controls keep one Interaction State Machine. The Hell
  value model is the consumer-facing authority, while the primitive is synced
  through its public silent setter or the existing guarded, version-bound state
  adapter where no public setter exists.

Sources:

- [Angular model inputs](https://angular.dev/guide/components/inputs#model-inputs)
- [Migrating custom controls to Signal Forms](https://angular.dev/guide/forms/signals/migration#custom-controls)
- [Angular `transformedValue`](https://angular.dev/api/forms/signals/transformedValue)

## Decision

### One committed-value model

Every Hell-owned custom form control has exactly one **Control Value
Authority** for its committed primary value:

- value controls expose a `value` `ModelSignal` and implement
  `FormValueControl`;
- checkbox-like controls expose a `checked` `ModelSignal` and implement
  `FormCheckboxControl`.

The same model is the public property-binding, two-way-binding, and forms
contract. User commits write it. External value changes flow into it without a
second form-owned or controlled-mode value.

A class implements exactly one Angular forms control contract. Migrated custom
controls remove `ControlValueAccessor`, `NG_VALUE_ACCESSOR`, and any parallel
form-value authority; they do not implement both contract families. Reactive
Forms and Template-driven Forms compatibility uses Angular's interoperability
for Signal Forms controls rather than a Hell-owned compatibility bridge.

### Typed Value Inputs

Date, Time, and Number Input keep draft text and display formatting because an
incomplete or invalid string is not yet a committed typed value. Their committed
typed `value` is still the sole Control Value Authority. They use Angular's
`transformedValue` contract to parse raw UI values and report parse errors to the
nearest Signal Forms field. Draft text is interaction state, not a second
committed-value model.

### Delegated interaction engines

Select, Combobox, Radio Group, Checkbox, Switch, Slider, and Toggle Group keep
delegating keyboard, focus, ARIA, and option/item behavior to ng-primitives.
Their Hell model is the consumer-facing Control Value Authority; the delegated
engine is an implementation seam, not a second public authority. Synchronization
uses public non-emitting setters when available and the guarded adapter accepted
by `ng-primitives-state-adapter.md` otherwise. This ADR does not permit new
private primitive writes.

### Input coercion

Angular model inputs do not support input transforms. Migrating `value` or
`checked` therefore establishes the exact model type as the property-binding
contract and removes transform-based static-attribute coercion from that same
property. Disabled and configuration inputs may retain their transforms.
Migration documentation must call out any affected template syntax rather than
preserving it through a parallel value input.

### Applicability

| Surface | Decision |
| --- | --- |
| `HellCheckbox`, `HellSwitch` | Migrate `checked` to `FormCheckboxControl`. |
| `HellSlider` | Migrate `value` to `FormValueControl`; this is the tracer control. |
| `HellDateInput`, `HellTimeInput`, `HellNumberInput` | Migrate the committed typed `value` to `FormValueControl`; retain draft text through the Typed Value Input contract. |
| `HellSelect`, `HellCombobox` | Migrate their shared Pick Value contract to `FormValueControl`; keep delegated synchronization behind the accepted primitive seam. |
| `HellRadioGroup` | Migrate `value` to `FormValueControl`; keep the guarded primitive adapter until a public silent setter exists. |
| `HellToggleGroup` | Migrate to `FormValueControl` and make its canonical model type explicit: `string \| null` in single mode and `readonly string[]` in multiple mode. |
| `HellCodeEditor` | Migrate the committed document `value` to `FormValueControl`; editor runtime state stays derived from it. |
| `HellTimePicker`, `HellMasterDetail`, `HellOmnibar` | Their owned primary state already uses model inputs. This ADR does not add an Angular forms contract where none currently exists. |
| `HellNativeCheckbox`, `HellNativeSwitch`, `HellNativeRadio`, `HellNativeRadioGroup`, `HellNativeSelect` | Stay platform-owned native controls under `native-styled-control-pairs.md`; do not add a Hell value model. |
| `HellAccordion`, `HellListbox`, `HellMenuItemCheckbox`, `HellMenuItemRadioGroup`, `HellTabset`, `HellToggle`, `HellPagination`, `HellPaginationStrip` | Stay delegated or consumer-owned non-form interaction surfaces. Adding a Hell value model would duplicate their existing Interaction State Machine. |
| `HellDialpad`, `HellFilterBuilder`, App Shell layout state, PDF Viewer runtime state | Require separate state-authority decisions. Their controlled/uncontrolled, collection, initial-state, or runtime semantics are not existing Angular form-control contracts and are not mechanically changed by this ADR. |

Open-state models, focus state, selection highlights, validation messages,
disabled policy, and touched state are not additional Control Value Authorities.
Each migration must nevertheless preserve the documented disabled, touched,
validation, and accessibility behavior for its control.

## Migration pattern (established by the Slider tracer, #277)

Each remaining migration (#283–#290) repeats the slice below; none of it
introduces a new state seam. `packages/angular/slider/slider.ts` is the
reference implementation.

1. **Swap the contract.** Replace the `value`/`checked` `input(...)` +
   `output(...)` pair with one `model(...)` and declare
   `implements FormValueControl<T>` (or `FormCheckboxControl`) on the class.
   The model supplies `[value]`, `[(value)]`, and `(valueChange)` (or the
   `checked` equivalents); do not keep a separate change output.
2. **Delete the legacy authority.** Remove `ControlValueAccessor` from the
   implements clause, the `NG_VALUE_ACCESSOR` provider, the
   `writeValue`/`registerOnChange`/`registerOnTouched`/`setDisabledState`
   methods, and every `HellControlledValueState`/`HellControlValueAccessorBridge`
   use in the class. Reactive Forms and Template-driven Forms need no
   replacement code: Angular binds `formControl`/`ngModel` to Signal Forms
   custom controls through built-in interoperability.
3. **Route user commits through the model once.** The delegated engine's
   change callback (for Slider: `ngpSlider`'s `onValueChange`) calls
   `this.value.set(next)` and nothing else. External property, two-way, and
   form writes flow into the same model; the engine consumes it reactively
   (pass the model — or a derived `computed` — as the engine's value signal,
   or use the public non-emitting setter / guarded adapter per
   `ng-primitives-state-adapter.md`), so external sync never re-emits a
   commit.
4. **Emit touched.** Add `readonly touch = output<void>()` and emit it at the
   control's documented interaction boundary (Slider: host `focusout` and
   track-drag start). The `FormField` directive and the interop layers listen
   to it; there is no `markTouched` bridge anymore.
5. **Accept forms-driven UI state through the reserved optional inputs.**
   `disabled` (keep its `booleanAttribute` transform) is read directly —
   there is no separate form-owned disabled state. Where the control has
   matching semantics, type the reserved inputs as the contract requires,
   e.g. Slider widens `min`/`max` to `number | undefined` (with an
   undefined-preserving `numberAttribute` transform and internal defaults) so
   a field's `min()`/`max()` validator metadata can drive and clear them.
6. **Accept the coercion break.** The model input drops transform-based
   static-attribute coercion for `value`/`checked`; document the exact typed
   binding in the docs page and the CHANGELOG breaking entry. Configuration
   inputs keep their transforms.
7. **Verify at the seams.** Focused unit specs cover: two-way binding with no
   echo on external writes and exactly one commit per user interaction;
   `[formField]` (value both directions, dirty, touched, disabled, reserved
   validator-metadata inputs); `formControl` and `ngModel` interop including
   touched and disabled. The styled-controls consumer fixture binds the
   packed control through direct, two-way, `formField`, `formControl`, and
   `ngModel` paths at once (`tools/consumer-fixtures/styled-controls`).
   Update the API report, docs page + example, and CHANGELOG; the permanent
   `one-forms-contract` architecture guard (`tools/check-architecture.mjs`)
   rejects any class that mixes the contract families.

## Consequences

- Consumers get one ordinary `[(value)]` or `[(checked)]` contract that also
  participates in Signal Forms, Reactive Forms, and Template-driven Forms.
- The migration is intentionally breaking where a value/checked input depended
  on transform-based attribute coercion or a CVA-only normalized value shape.
- Toggle Group needs an explicit public type decision instead of keeping an
  array-shaped primitive value and a scalar-shaped form value in parallel.
- Typed Value Inputs gain a framework-owned parse-error path while keeping their
  necessary draft state.
- The shared controlled-value/CVA helpers can be removed only after every listed
  custom form control has migrated.
- Each control migration must verify direct property/two-way binding,
  `[formField]`, Reactive Forms, and Template-driven Forms at public package
  seams, plus user commits, external writes, disabled/touched behavior, and any
  parsing or validation behavior it owns.
- Architecture checks must reject a class that implements both forms contract
  families or reintroduces a second committed-value authority.
