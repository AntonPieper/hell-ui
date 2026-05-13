import {
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import {
  NgpRadioGroup,
  NgpRadioItem,
  NgpRadioIndicator,
  injectRadioGroupState,
} from 'ng-primitives/radio';
import { writeRadioGroupDisabled, writeRadioGroupValue } from '../adapters/ngp-state-adapters';
import { containsNode } from '../../core/dom';
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { HellOrientation } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

@Directive({
  selector: '[hellRadioGroup]',
  hostDirectives: [
    {
      directive: NgpRadioGroup,
      inputs: [
        'ngpRadioGroupValue:value',
        'ngpRadioGroupDisabled:disabled',
        'ngpRadioGroupOrientation:orientation',
        'ngpRadioGroupCompareWith:compareWith',
      ],
      outputs: ['ngpRadioGroupValueChange:valueChange'],
    },
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellRadioGroup),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HellRadioGroup),
      multi: true,
    },
  ],
  host: {
    '[class.hell-radio-group]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class HellRadioGroup<T = unknown> extends HellStyleable implements ControlValueAccessor, Validator {
  readonly orientation = input<HellOrientation>('vertical');
  readonly required = input(false, { transform: booleanAttribute });

  private readonly group = inject(NgpRadioGroup<T>);
  private readonly groupState = injectRadioGroupState<T>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cva = new HellControlValueAccessorBridge<T | null>();
  private onValidatorChange: () => void = () => {};
  private readonly disabled = computed(() => this.groupState().disabled());

  constructor() {
    super();
    effect(() => {
      this.required();
      this.disabled();
      this.onValidatorChange();
    });

    const valueSub = this.group.valueChange.subscribe((value) => {
      this.cva.emitValue(value);
    });
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());
  }

  writeValue(value: T | null): void {
    writeRadioGroupValue(this.groupState(), value);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    writeRadioGroupDisabled(this.groupState(), isDisabled);
    this.onValidatorChange();
  }

  validate(control: AbstractControl | null): ValidationErrors | null {
    if (!this.required() || control?.disabled || this.disabled()) return null;
    const value = control ? control.value : this.groupState().value();
    return this.isEmptyValue(value) ? { required: true } : null;
  }

  private isEmptyValue(value: T | null): boolean {
    return value == null || value === '';
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!containsNode(this.host.nativeElement, next)) {
      this.cva.markTouched();
    }
  }
}

@Directive({
  selector: 'button[hellRadio]',
  hostDirectives: [
    {
      directive: NgpRadioItem,
      inputs: ['ngpRadioItemValue:value', 'ngpRadioItemDisabled:disabled'],
    },
  ],
  host: {
    '[class.hell-radio]': '!unstyled()',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    type: 'button',
  },
})
export class HellRadio extends HellStyleable {
  private readonly groupState = injectRadioGroupState<unknown>();
  private readonly radioItem = inject(NgpRadioItem<unknown>);

  protected readonly groupDisabled = computed(() => this.groupState().disabled());
  protected readonly itemDisabled = computed(() => this.radioItem.disabled());
  protected readonly isDisabled = computed(() => this.groupDisabled() || this.itemDisabled());
}

export { NgpRadioIndicator as HellRadioIndicator };
