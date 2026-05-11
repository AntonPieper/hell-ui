import { DestroyRef, Directive, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { HellStyleable } from '../../core/styleable';
import { hellRegisterFloatingHost } from '../../core/floating-scope';
import {
  NgpCombobox,
  NgpComboboxButton,
  NgpComboboxDropdown,
  NgpComboboxInput,
  NgpComboboxOption,
  NgpComboboxPortal,
  injectComboboxState,
} from 'ng-primitives/combobox';

/**
 * Headless combobox shell around `NgpCombobox`. Pair with
 * `hellComboboxInput`, `hellComboboxButton`, `hellComboboxOption`, and a
 * dropdown rendered through `*hellComboboxPortal`. Bind `[value]` /
 * `(valueChange)` for selection, `[options]` for the option registry, and
 * `[compareWith]` when option identity is not reference-based. In multiple
 * mode the value follows ng-primitives' array contract.
 */
@Directive({
  selector: '[hellCombobox]',
  hostDirectives: [
    {
      directive: NgpCombobox,
      inputs: [
        'ngpComboboxValue:value',
        'ngpComboboxMultiple:multiple',
        'ngpComboboxDisabled:disabled',
        'ngpComboboxAllowDeselect:allowDeselect',
        'ngpComboboxCompareWith:compareWith',
        'ngpComboboxDropdownPlacement:placement',
        'ngpComboboxDropdownContainer:container',
        'ngpComboboxDropdownFlip:flip',
        'ngpComboboxOptions:options',
      ],
      outputs: ['ngpComboboxValueChange:valueChange', 'ngpComboboxOpenChange:openChange'],
    },
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellCombobox),
      multi: true,
    },
  ],
  host: {
    '[class.hell-combobox]': '!unstyled()',
    '(focusout)': 'markControlTouched()',
  },
})
export class HellCombobox<T = unknown> extends HellStyleable implements ControlValueAccessor {
  private readonly combobox = inject(NgpCombobox);
  private readonly comboboxState = injectComboboxState<NgpCombobox>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly cva = new HellControlValueAccessorBridge<T>();

  constructor() {
    super();
    const valueSub = this.combobox.valueChange.subscribe((value) => {
      this.cva.emitValue(value as T);
    });
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());
  }

  writeValue(value: T): void {
    this.comboboxState().value.set(value);
  }

  registerOnChange(fn: (value: T) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.comboboxState().disabled.set(isDisabled);
  }

  protected markControlTouched(): void {
    this.cva.markTouched();
  }
}

/** Text input that drives combobox filtering and keyboard focus. */
@Directive({
  selector: 'input[hellComboboxInput]',
  hostDirectives: [NgpComboboxInput],
  host: {
    '[class.hell-combobox-input]': '!unstyled()',
  },
})
export class HellComboboxInput extends HellStyleable {}

/** Toggle button for opening and closing the combobox dropdown. */
@Directive({
  selector: 'button[hellComboboxButton]',
  hostDirectives: [NgpComboboxButton],
  host: {
    '[class.hell-combobox-button]': '!unstyled()',
    type: 'button',
  },
})
export class HellComboboxButton extends HellStyleable {}

/**
 * Floating dropdown surface for combobox options. Registers with any active
 * Hell Floating Scope so parent floating controls do not treat option clicks as
 * outside interactions.
 */
@Directive({
  selector: '[hellComboboxDropdown]',
  hostDirectives: [NgpComboboxDropdown],
  host: {
    '[class.hell-combobox-dropdown]': '!unstyled()',
  },
})
export class HellComboboxDropdown extends HellStyleable {
  constructor() {
    super();
    hellRegisterFloatingHost();
  }
}

/** Structural directive: renders the dropdown only while the combobox is
 *  open and positions it as a floating overlay anchored to the trigger.
 *
 *  Usage: place on the `<div hellComboboxDropdown>` with a leading `*`:
 *    <div *hellComboboxPortal hellComboboxDropdown>...</div>
 *
 *  This wraps `NgpComboboxPortal`, which needs a `TemplateRef`; the star
 *  syntax desugars the host into an `ng-template` so DI resolves. Without
 *  this, the dropdown markup renders inline and stays visible. */
@Directive({
  selector: '[hellComboboxPortal]',
  hostDirectives: [NgpComboboxPortal],
})
export class HellComboboxPortal {}

/**
 * Selectable combobox option. `[value]` is the payload emitted by the parent
 * combobox; `[index]` is available for virtualized or manually ordered lists.
 */
@Directive({
  selector: '[hellComboboxOption]',
  hostDirectives: [
    {
      directive: NgpComboboxOption,
      inputs: [
        'ngpComboboxOptionValue:value',
        'ngpComboboxOptionDisabled:disabled',
        'ngpComboboxOptionIndex:index',
      ],
      outputs: ['ngpComboboxOptionActivated:activated'],
    },
  ],
  host: {
    '[class.hell-combobox-option]': '!unstyled()',
    role: 'option',
  },
})
export class HellComboboxOption extends HellStyleable {}

@Directive({
  selector: '[hellComboboxEmpty]',
  host: { '[class.hell-combobox-empty]': '!unstyled()' },
})
export class HellComboboxEmpty extends HellStyleable {}

export const HELL_COMBOBOX_DIRECTIVES = [
  HellCombobox,
  HellComboboxInput,
  HellComboboxButton,
  HellComboboxDropdown,
  HellComboboxPortal,
  HellComboboxOption,
  HellComboboxEmpty,
] as const;
