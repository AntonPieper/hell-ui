import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_ALERT_DIRECTIVES } from '@hell-ui/angular/alert';

@Component({
  selector: 'app-alert-validation-summary-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ALERT_DIRECTIVES],
  template: `
    <hell-alert variant="danger">
      <h3 hellAlertTitle>Fix 3 fields before saving</h3>
      <ul hellAlertDescription class="m-0 ps-hell-4 list-disc">
        <li>Display name is required.</li>
        <li>Extension must be between 100 and 999.</li>
        <li>Voicemail PIN must be 4 digits.</li>
      </ul>
    </hell-alert>
  `,
})
export class AlertValidationSummaryExample {}
