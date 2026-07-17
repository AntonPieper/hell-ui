import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_ACCORDION_IMPORTS } from '@hell-ui/angular/accordion';

@Component({
  selector: 'app-accordion-multiple-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ACCORDION_IMPORTS],
  template: `
    <div hellAccordion type="multiple" [value]="['permissions']">
      <div hellAccordionItem value="permissions">
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">Permissions</button>
        </h3>
        <div hellAccordionContent>
          <div>Read, write, and admin scopes for this workspace.</div>
        </div>
      </div>
      <div hellAccordionItem value="integrations">
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">Integrations</button>
        </h3>
        <div hellAccordionContent>
          <div>Connected services that can read workspace data.</div>
        </div>
      </div>
      <div hellAccordionItem value="audit-log">
        <h3 class="m-0">
          <button hellAccordionTrigger type="button">Audit log</button>
        </h3>
        <div hellAccordionContent>
          <div>Every permission and integration change, timestamped.</div>
        </div>
      </div>
    </div>
  `,
})
export class AccordionMultipleExample {}
