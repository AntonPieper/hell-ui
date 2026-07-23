import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_ALERT_IMPORTS } from 'hell-ui/alert';

@Component({
  selector: 'app-alert-variants-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ALERT_IMPORTS],
  template: `
    <hell-alert variant="info">
      <h3 hellAlertTitle>Maintenance scheduled</h3>
      <p hellAlertDescription>Voicemail transcription pauses Sunday 02:00–03:00 CET.</p>
    </hell-alert>

    <hell-alert variant="success">
      <h3 hellAlertTitle>Backup completed</h3>
      <p hellAlertDescription>Call detail records were archived successfully.</p>
    </hell-alert>

    <hell-alert variant="warning">
      <h3 hellAlertTitle>Trunk nearing capacity</h3>
      <p hellAlertDescription>SIP trunk A is at 88% of its concurrent-call limit.</p>
    </hell-alert>

    <hell-alert variant="danger">
      <h3 hellAlertTitle>Registration failed</h3>
      <p hellAlertDescription>Extension 204 could not register with the gateway.</p>
    </hell-alert>
  `,
})
export class AlertVariantsExample {}
