import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_ALERT_IMPORTS } from '@hell-ui/angular/alert';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-alert-async-role-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ALERT_IMPORTS, HellButton],
  template: `
    <button hellButton variant="primary" type="button" (click)="failed.set(true)">
      Simulate a failed call
    </button>

    @if (failed()) {
      <!--
        Inserted in response to an async event, so it carries role="alert" to
        announce itself. Statically rendered alerts should NOT set a role.
      -->
      <hell-alert variant="danger" role="alert" (dismissed)="failed.set(false)">
        <h3 hellAlertTitle>Call dropped</h3>
        <p hellAlertDescription>The gateway rejected the outbound call (SIP 503).</p>
        <button hellAlertDismiss></button>
      </hell-alert>
    }
  `,
})
export class AlertAsyncRoleExample {
  protected readonly failed = signal(false);
}
