import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidBell, faSolidFileInvoice, faSolidSliders } from '@ng-icons/font-awesome/solid';
import { HELL_ACCORDION_IMPORTS } from 'hell-ui/accordion';
import { HELL_CARD_IMPORTS } from 'hell-ui/card';
import { HellIcon } from 'hell-ui/icon';

@Component({
  selector: 'app-accordion-with-settings-panel-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidBell, faSolidFileInvoice, faSolidSliders })],
  imports: [...HELL_ACCORDION_IMPORTS, ...HELL_CARD_IMPORTS, HellIcon],
  template: `
    <div hellCard [elevation]="0">
      <div hellCardHeader>Workspace settings</div>
      <div hellCardBody class="p-0">
        <div hellAccordion type="single" collapsible value="notifications" ui="rounded-none border-0">
          <div hellAccordionItem value="notifications">
            <h3 class="m-0">
              <button hellAccordionTrigger type="button">
                <span class="flex items-center gap-hell-3">
                  <hell-icon name="faSolidBell" ui="text-hell-foreground-muted" />
                  Notifications
                </span>
              </button>
            </h3>
            <div hellAccordionContent>
              <div>Email digests, in-app alerts, and Slack mentions.</div>
            </div>
          </div>
          <div hellAccordionItem value="preferences">
            <h3 class="m-0">
              <button hellAccordionTrigger type="button">
                <span class="flex items-center gap-hell-3">
                  <hell-icon name="faSolidSliders" ui="text-hell-foreground-muted" />
                  Preferences
                </span>
              </button>
            </h3>
            <div hellAccordionContent>
              <div>Language, timezone, and default landing page.</div>
            </div>
          </div>
          <div hellAccordionItem value="billing">
            <h3 class="m-0">
              <button hellAccordionTrigger type="button">
                <span class="flex items-center gap-hell-3">
                  <hell-icon name="faSolidFileInvoice" ui="text-hell-foreground-muted" />
                  Billing
                </span>
              </button>
            </h3>
            <div hellAccordionContent>
              <div>Plan, payment method, and invoice history.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AccordionWithSettingsPanelExample {}
