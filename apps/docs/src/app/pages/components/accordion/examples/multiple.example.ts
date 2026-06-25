import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_ACCORDION_DIRECTIVES } from '@hell-ui/angular/accordion';

@Component({
  selector: 'app-accordion-multiple-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ACCORDION_DIRECTIVES],
  template: `
    <div hellAccordion type="multiple">
      <div hellAccordionItem value="a">
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">First</button>
        </h3>
        <div hellAccordionContent>
          <div>You can open me…</div>
        </div>
      </div>
      <div hellAccordionItem value="b">
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">Second</button>
        </h3>
        <div hellAccordionContent>
          <div>…and me at the same time.</div>
        </div>
      </div>
    </div>
  `,
})
export class AccordionMultipleExample {}
