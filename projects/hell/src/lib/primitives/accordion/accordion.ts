import { Directive, booleanAttribute, input } from '@angular/core';
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
export class HellAccordion {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

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
export class HellAccordionItem {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'button[hellAccordionTrigger]',
  hostDirectives: [NgpAccordionTrigger],
  host: {
    '[class.hell-accordion-trigger]': '!unstyled()',
    type: 'button',
  },
})
export class HellAccordionTrigger {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellAccordionContent]',
  hostDirectives: [NgpAccordionContent],
  host: { '[class.hell-accordion-content]': '!unstyled()' },
})
export class HellAccordionContent {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

export const HELL_ACCORDION_DIRECTIVES = [
  HellAccordion,
  HellAccordionItem,
  HellAccordionTrigger,
  HellAccordionContent,
] as const;
