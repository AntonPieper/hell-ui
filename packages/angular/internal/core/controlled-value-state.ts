import { Signal, WritableSignal, computed, linkedSignal, signal } from '@angular/core';

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
  /**
   * Follows the consumer's value input but absorbs user interactions until the
   * input next changes. ng-primitives >= 0.123 latches a defined value input as
   * permanently controlled, so uncontrolled Hell wrappers must own this
   * linked-signal behavior themselves for plain (non-form, unbound) usage to
   * keep toggling.
   */
  private readonly interactiveValue: WritableSignal<T>;

  readonly value: Signal<T>;
  readonly disabled = computed(() => this.options.externalDisabled() || this.formDisabled());

  constructor(private readonly options: HellControlledValueStateOptions<T>) {
    this.controlledValue = signal(options.initialValue);
    this.interactiveValue = linkedSignal(() => options.externalValue());
    this.value = computed(() =>
      this.controlled() ? this.controlledValue() : this.interactiveValue(),
    );
  }

  writeValue(value: T): void {
    this.controlled.set(true);
    this.controlledValue.set(value);
  }

  acceptUserValue(value: T): void {
    if (this.controlled()) {
      this.controlledValue.set(value);
      return;
    }
    this.interactiveValue.set(value);
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
