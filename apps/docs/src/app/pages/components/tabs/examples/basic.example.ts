import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_TABS_DIRECTIVES } from '@hell-ui/angular/tabs';

@Component({
  selector: 'app-tabs-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_TABS_DIRECTIVES],
  template: `
    <div hellTabset value="general">
      <div hellTabList aria-label="Account sections">
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
export class TabsBasicExample {}
