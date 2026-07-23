import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_ACCORDION_IMPORTS } from 'hell-ui/accordion';

@Component({
  selector: 'app-accordion-disabled-item-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ACCORDION_IMPORTS],
  template: `
    <div hellAccordion type="single" collapsible value="basic-plan">
      <div hellAccordionItem value="basic-plan">
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">Basic plan</button>
        </h3>
        <div hellAccordionContent>
          <div>Up to 5 seats, community support, 1 GB storage.</div>
        </div>
      </div>
      <div hellAccordionItem value="enterprise-plan" disabled>
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">Enterprise plan (upgrade required)</button>
        </h3>
        <div hellAccordionContent>
          <div>Unlimited seats, SSO, and a dedicated support channel.</div>
        </div>
      </div>
    </div>
  `,
})
export class AccordionDisabledItemExample {}
