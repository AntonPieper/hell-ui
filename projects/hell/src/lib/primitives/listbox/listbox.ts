import { Directive, booleanAttribute, input } from '@angular/core';
import { HellStyleable } from '../../core/styleable';
import {
  NgpListbox,
  NgpListboxHeader,
  NgpListboxOption,
  NgpListboxSection,
  NgpListboxTrigger,
} from 'ng-primitives/listbox';

/**
 * Headless ARIA listbox wrapper. Use `[value]` / `(valueChange)` for the
 * selected item, `[mode]="multiple"` for multi-select, and `[compareWith]`
 * when values are objects. Child `hellListboxOption` directives provide the
 * option values; sections and headers are structural grouping aids.
 */
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
export class HellListbox extends HellStyleable {}

/** Optional trigger used by composed controls that open a separate listbox. */
@Directive({
  selector: '[hellListboxTrigger]',
  hostDirectives: [NgpListboxTrigger],
})
export class HellListboxTrigger {}

/** Selectable listbox row. `[value]` is compared against the parent value. */
@Directive({
  selector: '[hellListboxOption]',
  hostDirectives: [
    {
      directive: NgpListboxOption,
      inputs: ['id', 'ngpListboxOptionValue:value', 'ngpListboxOptionDisabled:disabled'],
    },
  ],
  host: {
    '[class.hell-listbox-option]': '!unstyled()',
  },
})
export class HellListboxOption extends HellStyleable {}

/** Groups related options while preserving listbox keyboard behavior. */
@Directive({
  selector: '[hellListboxSection]',
  hostDirectives: [NgpListboxSection],
  host: {
    '[class.hell-listbox-section]': '!unstyled()',
  },
})
export class HellListboxSection extends HellStyleable {}

/** Non-selectable label/header for a listbox section. */
@Directive({
  selector: '[hellListboxHeader]',
  hostDirectives: [{ directive: NgpListboxHeader, inputs: ['id'] }],
  host: {
    '[class.hell-listbox-header]': '!unstyled()',
  },
})
export class HellListboxHeader extends HellStyleable {}

export const HELL_LISTBOX_DIRECTIVES = [
  HellListbox,
  HellListboxTrigger,
  HellListboxOption,
  HellListboxSection,
  HellListboxHeader,
] as const;
