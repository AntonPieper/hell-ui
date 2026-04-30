import { Directive, booleanAttribute, input } from '@angular/core';
import {
  NgpListbox,
  NgpListboxHeader,
  NgpListboxOption,
  NgpListboxSection,
  NgpListboxTrigger,
} from 'ng-primitives/listbox';

@Directive({
  selector: '[hellListbox]',
  hostDirectives: [
    {
      directive: NgpListbox,
      inputs: [
        'id',
        'ngpListboxMode:mode',
        'ngpListboxValue:value',
        'ngpListboxDisabled:disabled',
        'ngpListboxCompareWith:compareWith',
      ],
      outputs: ['ngpListboxValueChange:valueChange'],
    },
  ],
  host: {
    '[class.hell-listbox]': '!unstyled()',
  },
})
export class HellListbox {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellListboxTrigger]',
  hostDirectives: [NgpListboxTrigger],
})
export class HellListboxTrigger {}

@Directive({
  selector: '[hellListboxOption]',
  hostDirectives: [
    {
      directive: NgpListboxOption,
      inputs: [
        'id',
        'ngpListboxOptionValue:value',
        'ngpListboxOptionDisabled:disabled',
      ],
    },
  ],
  host: {
    '[class.hell-listbox-option]': '!unstyled()',
  },
})
export class HellListboxOption {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellListboxSection]',
  hostDirectives: [NgpListboxSection],
  host: {
    '[class.hell-listbox-section]': '!unstyled()',
  },
})
export class HellListboxSection {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellListboxHeader]',
  hostDirectives: [{ directive: NgpListboxHeader, inputs: ['id'] }],
  host: {
    '[class.hell-listbox-header]': '!unstyled()',
  },
})
export class HellListboxHeader {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

export const HELL_LISTBOX_DIRECTIVES = [
  HellListbox,
  HellListboxTrigger,
  HellListboxOption,
  HellListboxSection,
  HellListboxHeader,
] as const;
