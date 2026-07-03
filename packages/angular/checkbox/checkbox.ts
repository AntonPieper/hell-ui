import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
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
import { HellControlValueAccessorBridge } from '@hell-ui/angular/internal/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

export type HellCheckboxPart = 'root';
export type HellCheckboxUi = HellUi<HellCheckboxPart>;

export type HellNativeCheckboxPart = 'root';
export type HellNativeCheckboxUi = HellUi<HellNativeCheckboxPart>;

const HELL_CHECKBOX_RECIPE = {
  root: 'inline-flex size-hell-5 cursor-pointer appearance-none items-center justify-center rounded-hell-sm border border-solid border-hell-border-strong bg-hell-surface-elevated p-0 m-0 font-[inherit] text-hell-primary-foreground transition-[background-color,border-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:border-hell-primary data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-2 data-checked:border-hell-primary data-checked:bg-hell-primary data-indeterminate:border-hell-primary data-indeterminate:bg-hell-primary data-disabled:cursor-not-allowed data-disabled:opacity-50 [&>svg]:block [&>svg]:size-hell-4 [&>svg]:translate-y-[-0.5px]',
} satisfies HellRecipe<HellCheckboxPart>;

const HELL_NATIVE_CHECKBOX_RECIPE = {
  root: 'relative inline-flex size-hell-5 cursor-pointer appearance-none items-center justify-center rounded-hell-sm border border-solid border-hell-border-strong bg-hell-surface-elevated p-0 m-0 font-[inherit] text-hell-foreground transition-[background-color,border-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] checked:border-hell-primary checked:bg-hell-primary checked:text-hell-primary-foreground indeterminate:border-hell-primary indeterminate:bg-hell-primary indeterminate:text-hell-primary-foreground data-[indeterminate]:border-hell-primary data-[indeterminate]:bg-hell-primary data-[indeterminate]:text-hell-primary-foreground focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
} satisfies HellRecipe<HellNativeCheckboxPart>;

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
    '[class]': "part('root')",
    'data-slot': 'root',
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
export class HellCheckbox
  extends HellPartStyleable<HellCheckboxPart>
  implements ControlValueAccessor, Validator
{
  protected readonly recipe = HELL_CHECKBOX_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly checked = input(false, { transform: booleanAttribute });
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  readonly checkedChange = output<boolean>();
  readonly indeterminateChange = output<boolean>();

  private readonly formControlled = signal(false);
  private readonly formChecked = signal(false);
  private readonly formDisabled = signal(false);
  private readonly localChecked = linkedSignal(() => this.checked());
  private readonly localIndeterminate = linkedSignal(() => this.indeterminate());
  private readonly valueAccessor = new HellControlValueAccessorBridge<boolean>();
  private onValidatorChange: () => void = () => {};

  private readonly effectiveChecked = computed(() =>
    this.formControlled() ? this.formChecked() : this.localChecked(),
  );
  private readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());

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
    indeterminate: this.localIndeterminate,
    disabled: this.effectiveDisabled,
    onCheckedChange: (checked) => {
      this.localChecked.set(checked);
      if (this.formControlled()) this.formChecked.set(checked);
      this.checkedChange.emit(checked);
      this.valueAccessor.emitValue(checked);
    },
    onIndeterminateChange: (indeterminate) => {
      this.localIndeterminate.set(indeterminate);
      this.indeterminateChange.emit(indeterminate);
    },
  });

  writeValue(value: boolean): void {
    this.formControlled.set(true);
    this.formChecked.set(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected markControlTouched(): void {
    this.valueAccessor.markTouched();
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
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': '"checkbox"',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-indeterminate]': 'indeterminate() ? "" : null',
    '(change)': 'onChange()',
    '[attr.data-required]': 'required() ? "true" : null',
    '[attr.required]': 'required() ? "" : null',
  },
})
export class HellNativeCheckbox extends HellPartStyleable<HellNativeCheckboxPart> {
  protected readonly recipe = HELL_NATIVE_CHECKBOX_RECIPE;
  protected readonly defaultUiPart = 'root';

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
