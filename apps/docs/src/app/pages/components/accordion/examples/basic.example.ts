import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_ACCORDION_DIRECTIVES } from '@hell-ui/angular/accordion';

@Component({
  selector: 'app-accordion-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ACCORDION_DIRECTIVES],
  template: `
    <div hellAccordion type="single" collapsible value="shipping">
      <div hellAccordionItem value="shipping">
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">When will my order ship?</button>
        </h3>
        <div hellAccordionContent>
          <div>Orders placed before 2pm local time ship the same business day.</div>
        </div>
      </div>
      <div hellAccordionItem value="returns">
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">What is your return policy?</button>
        </h3>
        <div hellAccordionContent>
          <div>Unused items can be returned within 30 days of delivery for a full refund.</div>
        </div>
      </div>
    </div>
  `,
})
export class AccordionBasicExample {}
