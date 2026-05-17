/**
 * Private compatibility seam for ng-primitives state mutation.
 *
 * Hell uses public ng-primitives APIs whenever they can perform CVA writes.
 * Select, combobox, and radio group do not expose public value/disabled setters
 * in ng-primitives 0.117.2, so their CVA writes are isolated here until
 * upstream setters exist.
 *
 * If ng-primitives changes this private state shape, fail loudly here instead
 * of silently dropping form writes.
 *
 * @internal
 */

export const HELL_NGP_PRIVATE_STATE_BRIDGE_VERSION = 'ng-primitives@0.117.2';

/**
 * Internal helper for asserting that a writable ng-primitives state channel is
 * present.
 */
function assertWritableSignal(state: unknown, operation: string, channel: string): void {
  if (!state || typeof state !== 'object') {
    throw new Error(
      `[hell-ngp-private-state-bridge ${HELL_NGP_PRIVATE_STATE_BRIDGE_VERSION}] ${operation} requires state.${channel}.set from ng-primitives private state, received ${String(state)}.`,
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
      `[hell-ngp-private-state-bridge ${HELL_NGP_PRIVATE_STATE_BRIDGE_VERSION}] ${operation} requires state.${channel}.set to be callable. ` +
        `Expected ng-primitives ${HELL_NGP_PRIVATE_STATE_BRIDGE_VERSION} private writable signal for channel "${channel}", received ${typeof value}.`,
    );
  }
}

function assertSelectPrivateState(state: unknown, operation: string): asserts state is SelectPrivateStateMutation {
  assertWritableSignal(state, operation, 'value');
  assertWritableSignal(state, operation, 'disabled');
}

function assertComboboxPrivateState(state: unknown, operation: string): asserts state is ComboboxPrivateStateMutation {
  assertWritableSignal(state, operation, 'value');
  assertWritableSignal(state, operation, 'disabled');
}

function assertRadioGroupPrivateState(state: unknown, operation: string): asserts state is RadioGroupPrivateStateMutation<unknown> {
  assertWritableSignal(state, operation, 'value');
  assertWritableSignal(state, operation, 'disabled');
}

type SelectPrivateStateMutation = {
  value: { set: (value: unknown) => void };
  disabled: { set: (isDisabled: boolean) => void };
};

type ComboboxPrivateStateMutation = {
  value: { set: (value: unknown) => void };
  disabled: { set: (isDisabled: boolean) => void };
};

type RadioGroupPrivateStateMutation<T = unknown> = {
  value: { set: (value: T | null) => void };
  disabled: { set: (isDisabled: boolean) => void };
};

/**
 * Private ng-primitives 0.117.2 bridge for select CVA writes. Remove when
 * NgpSelect exposes public value/disabled setters.
 */
export function writeSelectPrivateValue(state: SelectPrivateStateMutation, value: unknown): void {
  assertSelectPrivateState(state, 'writeSelectPrivateValue');
  state.value.set(value);
}

/**
 * Private ng-primitives 0.117.2 bridge for select CVA disabled sync. Remove
 * when NgpSelect exposes public value/disabled setters.
 */
export function writeSelectPrivateDisabled(state: SelectPrivateStateMutation, isDisabled: boolean): void {
  assertSelectPrivateState(state, 'writeSelectPrivateDisabled');
  state.disabled.set(isDisabled);
}

/**
 * Private ng-primitives 0.117.2 bridge for combobox CVA writes. Remove when
 * NgpCombobox exposes public value/disabled setters.
 */
export function writeComboboxPrivateValue(state: ComboboxPrivateStateMutation, value: unknown): void {
  assertComboboxPrivateState(state, 'writeComboboxPrivateValue');
  state.value.set(value);
}

/**
 * Private ng-primitives 0.117.2 bridge for combobox CVA disabled sync. Remove
 * when NgpCombobox exposes public value/disabled setters.
 */
export function writeComboboxPrivateDisabled(state: ComboboxPrivateStateMutation, isDisabled: boolean): void {
  assertComboboxPrivateState(state, 'writeComboboxPrivateDisabled');
  state.disabled.set(isDisabled);
}

/**
 * Private ng-primitives 0.117.2 bridge for radio group CVA writes. Remove when
 * NgpRadioGroup exposes public value/disabled setters.
 */
export function writeRadioGroupPrivateValue<T>(state: RadioGroupPrivateStateMutation<T>, value: T | null): void {
  assertRadioGroupPrivateState(state, 'writeRadioGroupPrivateValue');
  state.value.set(value);
}

/**
 * Private ng-primitives 0.117.2 bridge for radio group CVA disabled sync.
 * Remove when NgpRadioGroup exposes public value/disabled setters.
 */
export function writeRadioGroupPrivateDisabled<T>(state: RadioGroupPrivateStateMutation<T>, isDisabled: boolean): void {
  assertRadioGroupPrivateState(state, 'writeRadioGroupPrivateDisabled');
  state.disabled.set(isDisabled);
}
