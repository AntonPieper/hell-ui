import { Signal, WritableSignal, computed, signal } from '@angular/core';

type HellControlledValueStateOptions<T> = {
  externalValue: Signal<T>;
  externalDisabled: Signal<boolean>;
  initialValue: T;
};

/**
 * Internal form-authority state for Hell controls that support both uncontrolled
 * value inputs and Angular Forms CVA writes.
 */
export class HellControlledValueState<T> {
  private readonly controlled = signal(false);
  private readonly controlledValue: WritableSignal<T>;
  private readonly formDisabled = signal(false);

  readonly value = computed(() =>
    this.controlled() ? this.controlledValue() : this.options.externalValue(),
  );
  readonly disabled = computed(() => this.options.externalDisabled() || this.formDisabled());

  constructor(private readonly options: HellControlledValueStateOptions<T>) {
    this.controlledValue = signal(options.initialValue);
  }

  writeValue(value: T): void {
    this.controlled.set(true);
    this.controlledValue.set(value);
  }

  acceptUserValue(value: T): void {
    if (this.controlled()) this.controlledValue.set(value);
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
