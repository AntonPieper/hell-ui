import { DestroyRef, Directive, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { HellStyleable } from '../../core/styleable';
import { hellRegisterFloatingHost } from '../../core/floating-scope';
import {
  NgpSelect,
  NgpSelectDropdown,
  NgpSelectOption,
  NgpSelectPortal,
  injectSelectState,
} from 'ng-primitives/select';

/** Rich, headless select. Trigger element is the host of `[hellSelect]`;
 *  use ng-content to render the selected value (or a placeholder), pair
 *  with `[hellSelectDropdown]` inside a `*hellSelectPortal`, and emit
 *  `valueChange` to react to selection. For native `<select>` controls,
 *  use `[hellNativeSelect]` instead. */
@Directive({
  selector: '[hellSelect]',
  hostDirectives: [
    {
      directive: NgpSelect,
      inputs: [
        'ngpSelectValue:value',
        'ngpSelectMultiple:multiple',
        'ngpSelectDisabled:disabled',
        'ngpSelectCompareWith:compareWith',
        'ngpSelectDropdownPlacement:placement',
        'ngpSelectDropdownContainer:container',
        'ngpSelectDropdownFlip:flip',
        'ngpSelectOptions:options',
      ],
      outputs: ['ngpSelectValueChange:valueChange', 'ngpSelectOpenChange:openChange'],
    },
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellSelect),
      multi: true,
    },
  ],
  host: {
    '[class.hell-select]': '!unstyled()',
    '(blur)': 'markControlTouched()',
  },
})
export class HellSelect<T = unknown> extends HellStyleable implements ControlValueAccessor {
  private readonly select = inject(NgpSelect);
  private readonly selectState = injectSelectState<NgpSelect>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly cva = new HellControlValueAccessorBridge<T>();

  constructor() {
    super();
    const valueSub = this.select.valueChange.subscribe((value) => {
      this.cva.emitValue(value as T);
    });
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());
  }

  writeValue(value: T): void {
    this.selectState().value.set(value);
  }

  registerOnChange(fn: (value: T) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.selectState().disabled.set(isDisabled);
  }

  protected markControlTouched(): void {
    this.cva.markTouched();
  }
}

@Directive({
  selector: '[hellSelectValue]',
  host: { '[class.hell-select-value]': '!unstyled()' },
})
export class HellSelectValue extends HellStyleable {}

@Directive({
  selector: '[hellSelectPlaceholder]',
  host: { '[class.hell-select-placeholder]': '!unstyled()' },
})
export class HellSelectPlaceholder extends HellStyleable {}

@Directive({
  selector: '[hellSelectDropdown]',
  hostDirectives: [NgpSelectDropdown],
  host: { '[class.hell-select-dropdown]': '!unstyled()' },
})
export class HellSelectDropdown extends HellStyleable {
  constructor() {
    super();
    hellRegisterFloatingHost();
  }
}

@Directive({
  selector: '[hellSelectPortal]',
  hostDirectives: [NgpSelectPortal],
})
export class HellSelectPortal {}

@Directive({
  selector: '[hellSelectOption]',
  hostDirectives: [
    {
      directive: NgpSelectOption,
      inputs: [
        'ngpSelectOptionValue:value',
        'ngpSelectOptionDisabled:disabled',
        'ngpSelectOptionIndex:index',
      ],
      outputs: ['ngpSelectOptionActivated:activated'],
    },
  ],
  host: {
    '[class.hell-select-option]': '!unstyled()',
    role: 'option',
  },
})
export class HellSelectOption extends HellStyleable {}

export const HELL_SELECT_DIRECTIVES = [
  HellSelect,
  HellSelectValue,
  HellSelectPlaceholder,
  HellSelectDropdown,
  HellSelectPortal,
  HellSelectOption,
] as const;
