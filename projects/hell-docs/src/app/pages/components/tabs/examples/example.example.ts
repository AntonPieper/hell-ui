import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_TABS_DIRECTIVES } from 'hell';

@Component({
  selector: 'app-tabs-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_TABS_DIRECTIVES],
  template: `
    <div hellTabset value="general">
      <div hellTabList>
        <button hellTab value="general">General</button>
        <button hellTab value="security">Security</button>
        <button hellTab value="billing">Billing</button>
      </div>
      <div hellTabPanel value="general" class="pt-4">
        Account name, language and timezone preferences.
      </div>
      <div hellTabPanel value="security" class="pt-4">
        Password, multi-factor authentication and active sessions.
      </div>
      <div hellTabPanel value="billing" class="pt-4">Plan, payment method and invoices.</div>
    </div>
  `,
})
export class TabsExampleExample {}
