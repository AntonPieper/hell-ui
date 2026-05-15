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

// Internal writable contracts for ng-primitives state adapters.
// Keep these narrow: these are the compatibility write APIs this seam protects.
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
  state.value.set(value);
}

/**
 * Sync select disabled state without touching component internals directly.
 */
export function writeSelectDisabled(state: SelectStateMutation, isDisabled: boolean): void {
  state.disabled.set(isDisabled);
}

/**
 * Write combobox value without touching component internals directly.
 */
export function writeComboboxValue(state: ComboboxStateMutation, value: unknown): void {
  state.value.set(value);
}

/**
 * Sync combobox disabled state without touching component internals directly.
 */
export function writeComboboxDisabled(state: ComboboxStateMutation, isDisabled: boolean): void {
  state.disabled.set(isDisabled);
}

/**
 * Write radio-group value without touching component internals directly.
 */
export function writeRadioGroupValue<T>(state: RadioGroupStateMutation<T>, value: T | null): void {
  state.value.set(value);
}

/**
 * Sync radio-group disabled state without touching component internals directly.
 */
export function writeRadioGroupDisabled<T>(state: RadioGroupStateMutation<T>, isDisabled: boolean): void {
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
  state.setValue([...value], { emit });
}

/**
 * Sync toggle-group disabled state without touching component internals directly.
 */
export function writeToggleGroupDisabled(state: ToggleGroupStateMutation, isDisabled: boolean): void {
  state.setDisabled(isDisabled);
}
