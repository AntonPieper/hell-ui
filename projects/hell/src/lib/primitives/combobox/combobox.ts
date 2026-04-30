import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { HellStyleable } from '../../core/styleable';
import { HELL_OVERLAY_SCOPE, hellRegisterOverlayElement } from '../../core/overlay-scope';
import {
  NgpCombobox,
  NgpComboboxButton,
  NgpComboboxDropdown,
  NgpComboboxInput,
  NgpComboboxOption,
  NgpComboboxPortal,
} from 'ng-primitives/combobox';

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
  host: {
    '[class.hell-combobox]': '!unstyled()',
  },
})
export class HellCombobox extends HellStyleable {}

@Directive({
  selector: 'input[hellComboboxInput]',
  hostDirectives: [NgpComboboxInput],
  host: {
    '[class.hell-combobox-input]': '!unstyled()',
  },
})
export class HellComboboxInput extends HellStyleable {}

@Directive({
  selector: 'button[hellComboboxButton]',
  hostDirectives: [NgpComboboxButton],
  host: {
    '[class.hell-combobox-button]': '!unstyled()',
  },
})
export class HellComboboxButton extends HellStyleable {}

@Directive({
  selector: '[hellComboboxDropdown]',
  hostDirectives: [NgpComboboxDropdown],
  host: {
    '[class.hell-combobox-dropdown]': '!unstyled()',
  },
})
export class HellComboboxDropdown extends HellStyleable {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly overlayScope = inject(HELL_OVERLAY_SCOPE, { optional: true });

  constructor() {
    super();
    hellRegisterOverlayElement(this.overlayScope, this.host, inject(DestroyRef));
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
