import { DestroyRef, Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { containsNode } from '../../core/dom';
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
import { writeSelectDisabled, writeSelectValue } from '../adapters/ngp-state-adapters';

export type HellSelectSingleValue<T = unknown> = T | null;
export type HellSelectMultipleValue<T = unknown> = readonly T[];
export type HellSelectFormValue<T = unknown> = HellSelectSingleValue<T> | HellSelectMultipleValue<T>;

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
    '(focusout)': 'markControlTouched($event)',
  },
})
export class HellSelect<T = unknown> extends HellStyleable implements ControlValueAccessor {
  private readonly select = inject(NgpSelect);
  private readonly selectState = injectSelectState<NgpSelect>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cva = new HellControlValueAccessorBridge<HellSelectFormValue<T>>();
  private readonly dropdowns = new Set<HTMLElement>();

  constructor() {
    super();
    const valueSub = this.select.valueChange.subscribe((value) => {
      this.cva.emitValue(this.normalizeValue(value));
    });
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());
  }

  writeValue(value: HellSelectFormValue<T>): void {
    writeSelectValue(this.selectState(), this.normalizeWriteValue(value));
  }

  registerOnChange(fn: (value: HellSelectFormValue<T>) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    writeSelectDisabled(this.selectState(), isDisabled);
  }

  isOutsideControl(next: EventTarget | Node | null): boolean {
    const open = this.selectState().open();
    if (containsNode(this.host.nativeElement, next)) {
      return false;
    }

    if (!open) {
      return true;
    }

    for (const dropdown of this.dropdowns) {
      if (containsNode(dropdown, next)) {
        return false;
      }
    }

    return true;
  }

  markControlTouched(event: FocusEvent): void {
    if (this.isOutsideControl(event.relatedTarget)) {
      this.cva.markTouched();
    }
  }

  registerDropdown(dropdown: HTMLElement): void {
    this.dropdowns.add(dropdown);
  }

  unregisterDropdown(dropdown: HTMLElement): void {
    this.dropdowns.delete(dropdown);
  }

  private normalizeValue(value: unknown): HellSelectFormValue<T> {
    if (this.select.multiple()) {
      return this.normalizeMultipleValue(value);
    }
    return this.normalizeSingleValue(value);
  }

  private normalizeSingleValue(value: unknown): HellSelectSingleValue<T> {
    if (value == null) return null;
    return value as T;
  }

  private normalizeMultipleValue(value: unknown): HellSelectMultipleValue<T> {
    if (value == null) return [];
    if (Array.isArray(value)) return [...value];
    return [value as T];
  }

  private normalizeWriteValue(value: HellSelectFormValue<T>): HellSelectFormValue<T> {
    if (this.select.multiple()) return this.normalizeMultipleValue(value);
    return this.normalizeSingleValue(value);
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
  host: {
    '[class.hell-select-dropdown]': '!unstyled()',
    '(focusout)': 'markControlTouched($event)',
  },
})
export class HellSelectDropdown extends HellStyleable {
  private readonly dropdown = inject(NgpSelectDropdown);
  private readonly select = inject(HellSelect, { optional: true });

  constructor() {
    super();
    hellRegisterFloatingHost();
    if (this.select) {
      this.select.registerDropdown(this.dropdown.elementRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.select) {
      this.select.unregisterDropdown(this.dropdown.elementRef.nativeElement);
    }
  }

  markControlTouched(event: FocusEvent): void {
    this.select?.markControlTouched(event);
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
