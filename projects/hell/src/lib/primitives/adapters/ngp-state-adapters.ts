import type { State } from 'ng-primitives/state';
import type { NgpCombobox } from 'ng-primitives/combobox';
import type { NgpRadioGroup } from 'ng-primitives/radio';
import type { NgpSelect } from 'ng-primitives/select';

/**
 * Internal compatibility seam for ng-primitives form-control state sync.
 *
 * HELL-035 decision: this is a deliberate version-bound State-channel seam for
 * `ng-primitives@0.117.2`, not an ad hoc primitive-instance state escape hatch.
 * Context7 documents state providers as the programmatic-control seam, and the
 * installed `ng-primitives@0.117.2` typings/source expose select, combobox, and
 * radio-group value/disabled state as typed public `State<T>` channels while the
 * primitives still do not expose complete CVA-safe `setValue` / `setDisabled`
 * APIs.
 *
 * Keep `ng-primitives` pinned while this fallback exists. Upgrade/removal path:
 * rerun `docs/adr/ng-primitives-state-adapter.md` for the target version, keep
 * preferring public setters when they exist, and remove the State-channel
 * fallback in a follow-up slice once select, combobox, and radio group all have
 * public value + disabled setters that support silent CVA writes.
 *
 * If ng-primitives changes these writable channels before adding setters, fail
 * loudly here instead of silently dropping form writes across select, combobox,
 * and radio.
 *
 * @internal
 */

export const HELL_NGP_STATE_WRITER_VERSION = 'ng-primitives@0.117.2';
export const HELL_NGP_STATE_WRITER_UPGRADE_PATH =
  'Upgrade/removal path: rerun docs/adr/ng-primitives-state-adapter.md for the target ng-primitives version; keep the package pin while this State<T> fallback is needed; remove the fallback once public value+disabled setters support silent CVA writes.';

type WritableStateChannel<T> = { set: (value: T) => void };
type StateSetterOptions = { emit?: boolean };
type StateWithValueChannel<T> = { value: WritableStateChannel<T> };
type StateWithDisabledChannel = { disabled: WritableStateChannel<boolean> };
type StateWithValueSetter<T> = { setValue?: (value: T, options?: StateSetterOptions) => void };
type StateWithDisabledSetter = { setDisabled?: (isDisabled: boolean) => void };

type SelectStateWriter = State<NgpSelect> &
  StateWithValueChannel<unknown> &
  StateWithDisabledChannel &
  StateWithValueSetter<unknown> &
  StateWithDisabledSetter;
type ComboboxStateWriter = State<NgpCombobox> &
  StateWithValueChannel<unknown> &
  StateWithDisabledChannel &
  StateWithValueSetter<unknown> &
  StateWithDisabledSetter;
type RadioGroupStateWriter<T> = State<NgpRadioGroup<T>> &
  StateWithValueChannel<T | null> &
  StateWithDisabledChannel &
  StateWithValueSetter<T | null> &
  StateWithDisabledSetter;

function assertObjectState(state: unknown, operation: string, channel: string): asserts state is object {
  if (!state || typeof state !== 'object') {
    throw new Error(
      `[hell-ngp-state-writer ${HELL_NGP_STATE_WRITER_VERSION}] ${operation} requires state.${channel}.set from ng-primitives State<T>, received ${String(state)}. ${HELL_NGP_STATE_WRITER_UPGRADE_PATH}`,
    );
  }
}

function isWritableSignalLike<T>(value: unknown): value is WritableStateChannel<T> {
  return (
    !!value &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { set?: unknown }).set === 'function'
  );
}

function assertWritableValueSignal<T>(
  state: unknown,
  operation: string,
): asserts state is StateWithValueChannel<T> {
  assertObjectState(state, operation, 'value');

  const value = (state as { value?: unknown }).value;
  if (!isWritableSignalLike<T>(value)) {
    throw new Error(
      `[hell-ngp-state-writer ${HELL_NGP_STATE_WRITER_VERSION}] ${operation} requires state.value.set to be callable. ` +
        `Expected ng-primitives ${HELL_NGP_STATE_WRITER_VERSION} writable State<T> signal for channel "value", received ${typeof value}. ${HELL_NGP_STATE_WRITER_UPGRADE_PATH}`,
    );
  }
}

function assertWritableDisabledSignal(
  state: unknown,
  operation: string,
): asserts state is StateWithDisabledChannel {
  assertObjectState(state, operation, 'disabled');

  const disabled = (state as { disabled?: unknown }).disabled;
  if (!isWritableSignalLike<boolean>(disabled)) {
    throw new Error(
      `[hell-ngp-state-writer ${HELL_NGP_STATE_WRITER_VERSION}] ${operation} requires state.disabled.set to be callable. ` +
        `Expected ng-primitives ${HELL_NGP_STATE_WRITER_VERSION} writable State<T> signal for channel "disabled", received ${typeof disabled}. ${HELL_NGP_STATE_WRITER_UPGRADE_PATH}`,
    );
  }
}

function hasValueSetter<T>(state: StateWithValueSetter<T>): state is { setValue: (value: T, options?: StateSetterOptions) => void } {
  return typeof state.setValue === 'function';
}

function hasDisabledSetter(state: StateWithDisabledSetter): state is { setDisabled: (isDisabled: boolean) => void } {
  return typeof state.setDisabled === 'function';
}

function writeStateValue<T>(
  state: StateWithValueSetter<T> & StateWithValueChannel<T>,
  value: T,
  operation: string,
): void {
  if (hasValueSetter(state)) {
    state.setValue(value, { emit: false });
    return;
  }

  assertWritableValueSignal<T>(state, operation);
  state.value.set(value);
}

function writeStateDisabled(
  state: StateWithDisabledSetter & StateWithDisabledChannel,
  isDisabled: boolean,
  operation: string,
): void {
  if (hasDisabledSetter(state)) {
    state.setDisabled(isDisabled);
    return;
  }

  assertWritableDisabledSignal(state, operation);
  state.disabled.set(isDisabled);
}

/**
 * Internal ng-primitives form-state sync for select CVA writes. Replace this
 * with public ng-primitives setters when NgpSelect exposes them.
 */
export function writeSelectStateValue(state: SelectStateWriter, value: unknown): void {
  writeStateValue(state, value, 'writeSelectStateValue');
}

/**
 * Internal ng-primitives form-state sync for select CVA disabled sync. Replace
 * this with public ng-primitives setters when NgpSelect exposes them.
 */
export function writeSelectStateDisabled(state: SelectStateWriter, isDisabled: boolean): void {
  writeStateDisabled(state, isDisabled, 'writeSelectStateDisabled');
}

/**
 * Internal ng-primitives form-state sync for combobox CVA writes. Replace this
 * with public ng-primitives setters when NgpCombobox exposes them.
 */
export function writeComboboxStateValue(state: ComboboxStateWriter, value: unknown): void {
  writeStateValue(state, value, 'writeComboboxStateValue');
}

/**
 * Internal ng-primitives form-state sync for combobox CVA disabled sync.
 * Replace this with public ng-primitives setters when NgpCombobox exposes them.
 */
export function writeComboboxStateDisabled(state: ComboboxStateWriter, isDisabled: boolean): void {
  writeStateDisabled(state, isDisabled, 'writeComboboxStateDisabled');
}

/**
 * Internal ng-primitives form-state sync for radio group CVA writes. Replace
 * this with public ng-primitives setters when NgpRadioGroup exposes them.
 */
export function writeRadioGroupStateValue<T>(state: RadioGroupStateWriter<T>, value: T | null): void {
  writeStateValue(state, value, 'writeRadioGroupStateValue');
}

/**
 * Internal ng-primitives form-state sync for radio group CVA disabled sync.
 * Replace this with public ng-primitives setters when NgpRadioGroup exposes them.
 */
export function writeRadioGroupStateDisabled<T>(state: RadioGroupStateWriter<T>, isDisabled: boolean): void {
  writeStateDisabled(state, isDisabled, 'writeRadioGroupStateDisabled');
}
