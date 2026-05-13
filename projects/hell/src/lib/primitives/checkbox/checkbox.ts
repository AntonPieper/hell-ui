import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ngpCheckbox } from 'ng-primitives/checkbox';
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { HellStyleable } from '../../core/styleable';

/**
 * Styled checkbox built on `ngpCheckbox`. Forwards `checked`, `indeterminate`,
 * `disabled` and `required` through Hell-owned inputs and emits
 * `checkedChange` / `indeterminateChange`.
 *
 * The host is a real `<button>` — a natively labelable element — so wrapping
 * it in a `<label>` (directly, or via any `<label for>` mechanism such as
 * `hellField`) makes label clicks toggle the checkbox with zero wiring on
 * our side. It also implements `ControlValueAccessor` for Angular Forms.
 */
@Component({
  selector: 'button[hellCheckbox]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellCheckbox),
      multi: true,
    },
  ],
  host: {
    type: 'button',
    '[class.hell-checkbox]': '!unstyled()',
    '(blur)': 'markControlTouched()',
    '[attr.required]': 'required() ? "" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
  },
  template: `
    @if (state.indeterminate()) {
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        aria-hidden="true"
      >
        <path d="M3 8h10" />
      </svg>
    } @else if (state.checked()) {
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        aria-hidden="true"
      >
        <path d="M3 8l3.2 3.2L13 4.5" />
      </svg>
    }
  `,
})
export class HellCheckbox extends HellStyleable implements ControlValueAccessor {
  readonly checked = input(false, { transform: booleanAttribute });
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  readonly checkedChange = output<boolean>();
  readonly indeterminateChange = output<boolean>();

  private readonly controlMode = signal(false);
  private readonly controlChecked = signal(false);
  private readonly controlDisabled = signal(false);
  private readonly cva = new HellControlValueAccessorBridge<boolean>();

  private readonly effectiveChecked = computed(() =>
    this.controlMode() ? this.controlChecked() : this.checked(),
  );
  private readonly effectiveDisabled = computed(() => this.disabled() || this.controlDisabled());

  protected readonly state = ngpCheckbox({
    checked: this.effectiveChecked,
    indeterminate: this.indeterminate,
    disabled: this.effectiveDisabled,
    onCheckedChange: (checked) => {
      if (this.controlMode()) this.controlChecked.set(checked);
      this.checkedChange.emit(checked);
      this.cva.emitValue(checked);
    },
    onIndeterminateChange: (indeterminate) => this.indeterminateChange.emit(indeterminate),
  });

  writeValue(value: boolean): void {
    this.controlMode.set(true);
    this.controlChecked.set(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  protected markControlTouched(): void {
    this.cva.markTouched();
  }
}
