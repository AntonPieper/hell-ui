import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_TABS_IMPORTS } from '@hell-ui/angular/tabs';

@Component({
  selector: 'app-tabs-vertical-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_TABS_IMPORTS],
  template: `
    <div hellTabset value="profile" orientation="vertical" [activateOnFocus]="false">
      <div hellTabList aria-label="Settings sections">
        <button hellTab value="profile">Profile</button>
        <button hellTab value="notifications">Notifications</button>
        <button hellTab value="integrations">Integrations</button>
      </div>
      <div class="hd-fill">
        <div hellTabPanel value="profile">Name, avatar and contact details.</div>
        <div hellTabPanel value="notifications">Email and push notification preferences.</div>
        <div hellTabPanel value="integrations">Connected apps and API tokens.</div>
      </div>
    </div>
  `,
})
export class TabsVerticalExample {}
