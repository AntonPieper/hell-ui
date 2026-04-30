import { Directive, booleanAttribute, input } from '@angular/core';
import { HellStyleable } from '../../core/styleable';
import {
  NgpAccordion,
  NgpAccordionItem,
  NgpAccordionTrigger,
  NgpAccordionContent,
} from 'ng-primitives/accordion';

@Directive({
  selector: '[hellAccordion]',
  hostDirectives: [
    {
      directive: NgpAccordion,
      inputs: [
        'ngpAccordionValue:value',
        'ngpAccordionType:type',
        'ngpAccordionCollapsible:collapsible',
        'ngpAccordionDisabled:disabled',
        'ngpAccordionOrientation:orientation',
      ],
      outputs: ['ngpAccordionValueChange:valueChange'],
    },
  ],
  host: { '[class.hell-accordion]': '!unstyled()' },
})
export class HellAccordion extends HellStyleable {}

@Directive({
  selector: '[hellAccordionItem]',
  hostDirectives: [
    {
      directive: NgpAccordionItem,
      inputs: ['ngpAccordionItemValue:value', 'ngpAccordionItemDisabled:disabled'],
    },
  ],
  host: { '[class.hell-accordion-item]': '!unstyled()' },
})
export class HellAccordionItem extends HellStyleable {}

@Directive({
  selector: 'button[hellAccordionTrigger]',
  hostDirectives: [NgpAccordionTrigger],
  host: {
    '[class.hell-accordion-trigger]': '!unstyled()',
    type: 'button',
  },
})
export class HellAccordionTrigger extends HellStyleable {}

@Directive({
  selector: '[hellAccordionContent]',
  hostDirectives: [NgpAccordionContent],
  host: { '[class.hell-accordion-content]': '!unstyled()' },
})
export class HellAccordionContent extends HellStyleable {}

export const HELL_ACCORDION_DIRECTIVES = [
  HellAccordion,
  HellAccordionItem,
  HellAccordionTrigger,
  HellAccordionContent,
] as const;
