import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_ALERT_IMPORTS } from 'hell-ui/alert';

@Component({
  selector: 'app-alert-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ALERT_IMPORTS],
  template: `
    <hell-alert>
      <h3 hellAlertTitle>Number ported</h3>
      <p hellAlertDescription>
        +49 30 1234567 now routes to this account. Calls may take a few minutes to switch over.
      </p>
    </hell-alert>
  `,
})
export class AlertBasicExample {}
