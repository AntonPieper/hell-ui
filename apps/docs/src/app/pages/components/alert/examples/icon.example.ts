import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidBullhorn } from '@ng-icons/font-awesome/solid';
import { HELL_ALERT_IMPORTS } from 'hell-ui/alert';
import { HellIcon } from 'hell-ui/icon';

@Component({
  selector: 'app-alert-icon-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidBullhorn })],
  imports: [...HELL_ALERT_IMPORTS, HellIcon],
  template: `
    <hell-alert variant="info">
      <hell-icon hellAlertIcon name="faSolidBullhorn" size="16px" />
      <h3 hellAlertTitle>New release available</h3>
      <p hellAlertDescription>Version 4.2 adds call-recording retention policies.</p>
    </hell-alert>

    <hell-alert variant="success" [showIcon]="false">
      <h3 hellAlertTitle>Settings saved</h3>
      <p hellAlertDescription>No glyph — the title carries the meaning on its own.</p>
    </hell-alert>
  `,
})
export class AlertIconExample {}
