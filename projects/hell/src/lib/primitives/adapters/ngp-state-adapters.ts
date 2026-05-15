/**
 * Compatibility seam for direct ng-primitives state mutation.
 *
 * ng-primitives exposes writable state channels for several control flows. Hell
 * writes through this file so we can isolate and audit this high-risk bridge point
 * from the main component/runtime code and quickly adapt if ng-primitives changes
 * its mutation contract.
 *
 * @internal
 */

/**
 * Internal helper for asserting that a writable ng-primitives state channel is
 * present.
 *
 * NOTE: This is intentionally defensive. We only mutate through these helpers
 * when the state seam shape changes unexpectedly across versions, and this should
 * fail with a clear message instead of silently dropping writes.
 */
function assertWritableSignal(
  state: unknown,
  operation: string,
  channel: string,
): void {
  if (!state || typeof state !== 'object') {
    throw new Error(
      `[hell-ngp-state-adapters] ${operation} requires ${channel} from a writable ng-primitives state object, received ${String(state)}.`,
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
      `[hell-ngp-state-adapters] ${operation} requires state.${channel}.set to be callable. ` +
        `Expected a writable signal for channel "${channel}", received ${typeof value}.`,
    );
  }
}

function assertMethod(
  state: unknown,
  operation: string,
  method: string,
): void {
  if (!state || typeof state !== 'object') {
    throw new Error(
      `[hell-ngp-state-adapters] ${operation} requires ${method}() from a writable ng-primitives state object, received ${String(state)}.`,
    );
  }

  const value = (state as Record<string, unknown>)[method];
  if (typeof value !== 'function') {
    throw new Error(
      `[hell-ngp-state-adapters] ${operation} requires state.${method} to be callable. ` +
        `Expected a writable state method "${method}", received ${typeof value}.`,
    );
  }
}

function assertSelectStateMutations(state: unknown, operation: string): asserts state is SelectStateMutation {
  assertWritableSignal(state, operation, 'value');
  assertWritableSignal(state, operation, 'disabled');
}

function assertComboboxStateMutations(state: unknown, operation: string): asserts state is ComboboxStateMutation {
  assertWritableSignal(state, operation, 'value');
  assertWritableSignal(state, operation, 'disabled');
}

function assertRadioGroupStateMutations(state: unknown, operation: string): asserts state is RadioGroupStateMutation<unknown> {
  assertWritableSignal(state, operation, 'value');
  assertWritableSignal(state, operation, 'disabled');
}

function assertToggleGroupStateMutations(state: unknown, operation: string): asserts state is ToggleGroupStateMutation {
  assertMethod(state, operation, 'setValue');
  assertMethod(state, operation, 'setDisabled');
}

type SelectStateMutation = {
  value: { set: (value: unknown) => void };
  disabled: { set: (isDisabled: boolean) => void };
};

type ComboboxStateMutation = {
  value: { set: (value: unknown) => void };
  disabled: { set: (isDisabled: boolean) => void };
};

type RadioGroupStateMutation<T = unknown> = {
  value: { set: (value: T | null) => void };
  disabled: { set: (isDisabled: boolean) => void };
};

type ToggleGroupStateMutation = {
  setValue: (value: string[], options?: { emit?: boolean }) => void;
  setDisabled: (isDisabled: boolean) => void;
};

/**
 * Write select value without touching component internals directly.
 */
export function writeSelectValue(state: SelectStateMutation, value: unknown): void {
  assertSelectStateMutations(state, 'writeSelectValue');
  state.value.set(value);
}

/**
 * Sync select disabled state without touching component internals directly.
 */
export function writeSelectDisabled(state: SelectStateMutation, isDisabled: boolean): void {
  assertSelectStateMutations(state, 'writeSelectDisabled');
  state.disabled.set(isDisabled);
}

/**
 * Write combobox value without touching component internals directly.
 */
export function writeComboboxValue(state: ComboboxStateMutation, value: unknown): void {
  assertComboboxStateMutations(state, 'writeComboboxValue');
  state.value.set(value);
}

/**
 * Sync combobox disabled state without touching component internals directly.
 */
export function writeComboboxDisabled(state: ComboboxStateMutation, isDisabled: boolean): void {
  assertComboboxStateMutations(state, 'writeComboboxDisabled');
  state.disabled.set(isDisabled);
}

/**
 * Write radio-group value without touching component internals directly.
 */
export function writeRadioGroupValue<T>(state: RadioGroupStateMutation<T>, value: T | null): void {
  assertRadioGroupStateMutations(state, 'writeRadioGroupValue');
  state.value.set(value);
}

/**
 * Sync radio-group disabled state without touching component internals directly.
 */
export function writeRadioGroupDisabled<T>(state: RadioGroupStateMutation<T>, isDisabled: boolean): void {
  assertRadioGroupStateMutations(state, 'writeRadioGroupDisabled');
  state.disabled.set(isDisabled);
}

/**
 * Write toggle-group value without touching component internals directly.
 */
export function writeToggleGroupValue(
  state: ToggleGroupStateMutation,
  value: readonly string[],
  emit = true,
): void {
  assertToggleGroupStateMutations(state, 'writeToggleGroupValue');
  state.setValue([...value], { emit });
}

/**
 * Sync toggle-group disabled state without touching component internals directly.
 */
export function writeToggleGroupDisabled(state: ToggleGroupStateMutation, isDisabled: boolean): void {
  assertToggleGroupStateMutations(state, 'writeToggleGroupDisabled');
  state.setDisabled(isDisabled);
}
