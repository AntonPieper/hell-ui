import { computed, Directive } from '@angular/core';
import { HellStyleable } from '../../core/styleable';
import {
  NgpAccordion,
  NgpAccordionItem,
  NgpAccordionTrigger,
  NgpAccordionContent,
  injectAccordionItemState,
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
  host: {
    '[class.hell-accordion-content]': '!unstyled()',
    '[attr.aria-hidden]': 'closed() ? "true" : null',
    '[attr.inert]': 'closed() ? "" : null',
  },
})
export class HellAccordionContent extends HellStyleable {
  private readonly accordionItem = injectAccordionItemState<unknown>();
  protected readonly closed = computed(() => !this.accordionItem().open());
}

export const HELL_ACCORDION_DIRECTIVES = [
  HellAccordion,
  HellAccordionItem,
  HellAccordionTrigger,
  HellAccordionContent,
] as const;
