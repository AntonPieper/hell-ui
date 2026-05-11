import { DestroyRef, Directive, ElementRef, computed, forwardRef, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  NgpRadioGroup,
  NgpRadioItem,
  NgpRadioIndicator,
  injectRadioGroupState,
} from 'ng-primitives/radio';
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
  ],
  host: {
    '[class.hell-radio-group]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class HellRadioGroup<T = unknown> extends HellStyleable implements ControlValueAccessor {
  readonly orientation = input<HellOrientation>('vertical');

  private readonly group = inject(NgpRadioGroup<T>);
  private readonly groupState = injectRadioGroupState<T>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cva = new HellControlValueAccessorBridge<T | null>();

  constructor() {
    super();
    const valueSub = this.group.valueChange.subscribe((value) => {
      this.cva.emitValue(value);
    });
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());
  }

  writeValue(value: T | null): void {
    this.groupState().value.set(value);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.groupState().disabled.set(isDisabled);
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !this.host.nativeElement.contains(next)) {
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
    '[attr.disabled]': 'groupDisabled() ? "" : null',
    '[attr.aria-disabled]': 'groupDisabled() ? "true" : null',
    type: 'button',
  },
})
export class HellRadio extends HellStyleable {
  private readonly groupState = injectRadioGroupState<unknown>();

  protected readonly groupDisabled = computed(() => this.groupState().disabled());
}

export { NgpRadioIndicator as HellRadioIndicator };
