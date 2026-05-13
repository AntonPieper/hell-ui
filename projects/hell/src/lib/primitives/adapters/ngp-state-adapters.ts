/**
 * Audited seam for direct ng-primitives state mutation.
 *
 * ng-primitives exposes internal writable state for some patterns. Those writes are
 * unavoidable in Hell today (mainly CVA sync paths), but they should be funnelled
 * through one file so we can audit intent and adapt quickly if ng-primitives
 * changes its mutation contract.
 *
 * @internal
 */

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
