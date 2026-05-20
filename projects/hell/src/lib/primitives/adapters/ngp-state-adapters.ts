import type { State } from 'ng-primitives/state';
import type { NgpCombobox } from 'ng-primitives/combobox';
import type { NgpRadioGroup } from 'ng-primitives/radio';
import type { NgpSelect } from 'ng-primitives/select';

/**
 * Internal compatibility seam for ng-primitives state writes.
 *
 * HELL-002 decision: use a narrow adapter over ng-primitives' public
 * inject-state APIs instead of reading a primitive instance's private `state`
 * field. Context7/ng-primitives usage docs describe state providers as the
 * programmatic-control seam, and local 0.117.2 typings expose `State<T>` as
 * writable input channels. Select, Combobox, and RadioGroup still do not expose
 * public `setValue` / `setDisabled` methods, so Hell prefers those future
 * setters when present and otherwise writes only the public injected `State<T>`
 * `value` / `disabled` channels here.
 *
 * The dependency is pinned while this adapter exists. If ng-primitives changes
 * those writable channels before adding setters, fail loudly here instead of
 * silently dropping form writes across select, combobox, and radio.
 *
 * @internal
 */

export const HELL_NGP_STATE_WRITER_VERSION = 'ng-primitives@0.117.2';

type WritableStateChannel<T> = { set: (value: T) => void };
type StateSetterOptions = { emit?: boolean };
type StateWithValueSetter<T> = { setValue?: (value: T, options?: StateSetterOptions) => void };
type StateWithDisabledSetter = { setDisabled?: (isDisabled: boolean) => void };

type SelectStateWriter = State<NgpSelect> & StateWithValueSetter<unknown> & StateWithDisabledSetter;
type ComboboxStateWriter = State<NgpCombobox> & StateWithValueSetter<unknown> & StateWithDisabledSetter;
type RadioGroupStateWriter<T> = State<NgpRadioGroup<T>> & StateWithValueSetter<T | null> & StateWithDisabledSetter;

/**
 * Internal helper for asserting that the version-bound writable ng-primitives
 * State<T> fallback channel is present.
 */
function assertWritableSignal<T>(state: unknown, operation: string, channel: string): asserts state is Record<string, WritableStateChannel<T>> {
  if (!state || typeof state !== 'object') {
    throw new Error(
      `[hell-ngp-state-writer ${HELL_NGP_STATE_WRITER_VERSION}] ${operation} requires state.${channel}.set from ng-primitives State<T>, received ${String(state)}.`,
    );
  }

  const stateRecord = state as Record<string, unknown>;
  const value = stateRecord[channel];
  const isWritableSignalLike =
    !!value &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { set?: unknown }).set === 'function';

  if (!isWritableSignalLike) {
    throw new Error(
      `[hell-ngp-state-writer ${HELL_NGP_STATE_WRITER_VERSION}] ${operation} requires state.${channel}.set to be callable. ` +
        `Expected ng-primitives ${HELL_NGP_STATE_WRITER_VERSION} writable State<T> signal fallback for channel "${channel}", received ${typeof value}.`,
    );
  }
}

function hasValueSetter<T>(state: StateWithValueSetter<T>): state is { setValue: (value: T, options?: StateSetterOptions) => void } {
  return typeof state.setValue === 'function';
}

function hasDisabledSetter(state: StateWithDisabledSetter): state is { setDisabled: (isDisabled: boolean) => void } {
  return typeof state.setDisabled === 'function';
}

function writeStateValue<T>(state: StateWithValueSetter<T>, value: T, operation: string): void {
  if (hasValueSetter(state)) {
    state.setValue(value, { emit: false });
    return;
  }

  assertWritableSignal<T>(state, operation, 'value');
  state['value'].set(value);
}

function writeStateDisabled(state: StateWithDisabledSetter, isDisabled: boolean, operation: string): void {
  if (hasDisabledSetter(state)) {
    state.setDisabled(isDisabled);
    return;
  }

  assertWritableSignal<boolean>(state, operation, 'disabled');
  state['disabled'].set(isDisabled);
}

/**
 * Internal ng-primitives state-writer for select CVA writes. Remove the
 * fallback when NgpSelect exposes public value/disabled setters.
 */
export function writeSelectStateValue(state: SelectStateWriter, value: unknown): void {
  writeStateValue(state, value, 'writeSelectStateValue');
}

/**
 * Internal ng-primitives state-writer for select CVA disabled sync. Remove the
 * fallback when NgpSelect exposes public value/disabled setters.
 */
export function writeSelectStateDisabled(state: SelectStateWriter, isDisabled: boolean): void {
  writeStateDisabled(state, isDisabled, 'writeSelectStateDisabled');
}

/**
 * Internal ng-primitives state-writer for combobox CVA writes. Remove the
 * fallback when NgpCombobox exposes public value/disabled setters.
 */
export function writeComboboxStateValue(state: ComboboxStateWriter, value: unknown): void {
  writeStateValue(state, value, 'writeComboboxStateValue');
}

/**
 * Internal ng-primitives state-writer for combobox CVA disabled sync. Remove
 * the fallback when NgpCombobox exposes public value/disabled setters.
 */
export function writeComboboxStateDisabled(state: ComboboxStateWriter, isDisabled: boolean): void {
  writeStateDisabled(state, isDisabled, 'writeComboboxStateDisabled');
}

/**
 * Internal ng-primitives state-writer for radio group CVA writes. Remove the
 * fallback when NgpRadioGroup exposes public value/disabled setters.
 */
export function writeRadioGroupStateValue<T>(state: RadioGroupStateWriter<T>, value: T | null): void {
  writeStateValue(state, value, 'writeRadioGroupStateValue');
}

/**
 * Internal ng-primitives state-writer for radio group CVA disabled sync. Remove
 * the fallback when NgpRadioGroup exposes public value/disabled setters.
 */
export function writeRadioGroupStateDisabled<T>(state: RadioGroupStateWriter<T>, isDisabled: boolean): void {
  writeStateDisabled(state, isDisabled, 'writeRadioGroupStateDisabled');
}
