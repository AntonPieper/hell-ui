import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  booleanAttribute,
  effect,
  forwardRef,
  inject,
  input,
  output,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import { ngpCheckbox } from 'ng-primitives/checkbox';
import { HellControlledValueState } from '../../core/controlled-value-state';
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { HellStyleable } from '../../core/styleable';

/**
 * Styled checkbox built on `ngpCheckbox`. Forwards `checked`, `indeterminate`,
 * `disabled` and `required` through Hell-owned inputs and emits
 * `checkedChange` / `indeterminateChange`.
 *
 * `button[hellCheckbox]` is a custom ARIA checkbox widget, not a native
 * `<input type="checkbox">`. It remains useful for styled, compact controls
 * but does not provide all native checkbox form semantics. For native input
 * behavior (including built-in form constraints and input semantics), use
 * `input[hellNativeCheckbox]`.
 *
 * It implements `ControlValueAccessor` for Angular Forms.
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
    {
      provide: NG_VALIDATORS,
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
export class HellCheckbox extends HellStyleable implements ControlValueAccessor, Validator {
  readonly checked = input(false, { transform: booleanAttribute });
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  readonly checkedChange = output<boolean>();
  readonly indeterminateChange = output<boolean>();

  private readonly controlledChecked = new HellControlledValueState<boolean>({
    externalValue: this.checked,
    externalDisabled: this.disabled,
    initialValue: false,
  });
  private readonly cva = new HellControlValueAccessorBridge<boolean>();
  private onValidatorChange: () => void = () => {};

  private readonly effectiveChecked = this.controlledChecked.value;
  private readonly effectiveDisabled = this.controlledChecked.disabled;

  constructor() {
    super();
    effect(() => {
      this.required();
      this.effectiveDisabled();
      this.onValidatorChange();
    });
  }

  protected readonly state = ngpCheckbox({
    checked: this.effectiveChecked,
    indeterminate: this.indeterminate,
    disabled: this.effectiveDisabled,
    onCheckedChange: (checked) => {
      this.controlledChecked.acceptUserValue(checked);
      this.checkedChange.emit(checked);
      this.cva.emitValue(checked);
    },
    onIndeterminateChange: (indeterminate) => this.indeterminateChange.emit(indeterminate),
  });

  writeValue(value: boolean): void {
    this.controlledChecked.writeValue(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlledChecked.setDisabledState(isDisabled);
  }

  protected markControlTouched(): void {
    this.cva.markTouched();
  }

  validate(control: AbstractControl | null): ValidationErrors | null {
    if (!this.required() || control?.disabled || this.effectiveDisabled()) return null;
    const checked = control ? control.value === true : this.effectiveChecked();
    return checked ? null : { required: true };
  }
}

/**
 * Native checkbox variant that leans on browser + Angular form semantics instead of
 * ng-primitives + custom CVA wiring.
 */
@Directive({
  selector: 'input[type="checkbox"][hellNativeCheckbox]',
  host: {
    '[class.hell-checkbox]': '!unstyled()',
    '[attr.type]': '"checkbox"',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-indeterminate]': 'indeterminate() ? "" : null',
    '(change)': 'onChange()',
    '[attr.data-required]': 'required() ? "true" : null',
    '[attr.required]': 'required() ? "" : null',
  },
})
export class HellNativeCheckbox extends HellStyleable {
  readonly required = input(false, { alias: 'required', transform: booleanAttribute });
  readonly indeterminate = input(false, { alias: 'indeterminate', transform: booleanAttribute });

  readonly checkedChange = output<boolean>();
  readonly indeterminateChange = output<boolean>();

  private readonly host = inject(ElementRef<HTMLInputElement>);

  constructor() {
    super();
    effect(() => {
      this.host.nativeElement.indeterminate = this.indeterminate();
    });
  }

  protected onChange(): void {
    this.checkedChange.emit(this.host.nativeElement.checked);
    this.indeterminateChange.emit(this.host.nativeElement.indeterminate);
  }
}
