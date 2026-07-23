import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_ALERT_IMPORTS } from 'hell-ui/alert';
import { HellButton } from 'hell-ui/button';

@Component({
  selector: 'app-alert-actions-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ALERT_IMPORTS, HellButton],
  template: `
    <hell-alert variant="danger">
      <h3 hellAlertTitle>Sync failed</h3>
      <p hellAlertDescription>The directory sync could not reach the LDAP server.</p>
      <div hellAlertActions>
        <button hellButton variant="primary" size="sm" type="button">Retry sync</button>
        <button hellButton variant="ghost" size="sm" type="button">View log</button>
      </div>
    </hell-alert>
  `,
})
export class AlertActionsExample {}
