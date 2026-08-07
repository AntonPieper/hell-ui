import type { State } from 'ng-primitives/state';
import type { NgpCombobox } from 'ng-primitives/combobox';

/**
 * Internal compatibility seam for ng-primitives form-control state sync.
 *
 * Deliberate version-bound State-channel seam for `ng-primitives@0.128.8`, not
 * an ad hoc primitive-instance state escape hatch.
 * Select gained public CVA-safe `setValue(value, { emit: false })` /
 * `setDisabled(disabled)` in the 0.123 line; radio group gained the same pair
 * and roving focus gained the non-focusing `setTabStop(id)` in the 0.128 line —
 * none of them go through this adapter any more. Combobox is the only primitive
 * left that exposes value/disabled only as a typed public `State<T>` channel,
 * with no setter that supports silent CVA writes.
 *
 * Keep `ng-primitives` pinned while this fallback exists. Upgrade/removal path:
 * rerun `docs/adr/ng-primitives-state-adapter.md` for the target version and
 * delete this file once combobox exposes public value + disabled setters that
 * support silent CVA writes.
 *
 * If ng-primitives changes these writable channels before adding setters, fail
 * loudly here instead of silently dropping form writes across combobox.
 *
 * @internal
 */

export const HELL_NGP_STATE_WRITER_VERSION = 'ng-primitives@0.128.8';
export const HELL_NGP_STATE_WRITER_UPGRADE_PATH =
  'Upgrade/removal path: rerun docs/adr/ng-primitives-state-adapter.md for the target ng-primitives version; keep the package pin while this State<T> fallback is needed; remove the fallback once public combobox value+disabled setters support silent CVA writes.';

type WritableStateChannel<T> = { set: (value: T) => void };
type StateWithValueChannel<T> = { value: WritableStateChannel<T> };
type StateWithDisabledChannel = { disabled: WritableStateChannel<boolean> };

type ComboboxStateWriter = State<NgpCombobox> &
  StateWithValueChannel<unknown> &
  StateWithDisabledChannel;

function assertObjectState(
  state: unknown,
  operation: string,
  channel: string,
): asserts state is object {
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

function writeStateValue<T>(state: StateWithValueChannel<T>, value: T, operation: string): void {
  assertWritableValueSignal<T>(state, operation);
  state.value.set(value);
}

function writeStateDisabled(
  state: StateWithDisabledChannel,
  isDisabled: boolean,
  operation: string,
): void {
  assertWritableDisabledSignal(state, operation);
  state.disabled.set(isDisabled);
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
