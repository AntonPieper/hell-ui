import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_ALERT_IMPORTS } from 'hell-ui/alert';
import { HellButton } from 'hell-ui/button';

@Component({
  selector: 'app-alert-dismissible-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ALERT_IMPORTS, HellButton],
  template: `
    @if (visible()) {
      <hell-alert variant="info" (dismissed)="visible.set(false)">
        <h3 hellAlertTitle>Tip: keyboard shortcuts</h3>
        <p hellAlertDescription>Press ? anywhere to see the shortcut cheat sheet.</p>
        <button hellAlertDismiss></button>
      </hell-alert>
    } @else {
      <button hellButton variant="soft" size="sm" type="button" (click)="visible.set(true)">
        Show the tip again
      </button>
    }
  `,
})
export class AlertDismissibleExample {
  protected readonly visible = signal(true);
}
