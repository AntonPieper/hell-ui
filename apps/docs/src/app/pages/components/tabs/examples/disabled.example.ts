import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_TABS_IMPORTS } from '@hell-ui/angular/tabs';

@Component({
  selector: 'app-tabs-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_TABS_IMPORTS],
  template: `
    <div hellTabset value="draft">
      <div hellTabList aria-label="Invoice stages">
        <button hellTab value="draft">Draft</button>
        <button hellTab value="sent">Sent</button>
        <button hellTab value="paid" disabled>Paid</button>
      </div>
      <div hellTabPanel value="draft" class="pt-4">
        Line items are still editable. Nothing has been sent to the customer yet.
      </div>
      <div hellTabPanel value="sent" class="pt-4">
        Waiting on payment. Resend or void the invoice from here.
      </div>
      <div hellTabPanel value="paid" class="pt-4">Payment history and receipt.</div>
    </div>
  `,
})
export class TabsDisabledExample {}
