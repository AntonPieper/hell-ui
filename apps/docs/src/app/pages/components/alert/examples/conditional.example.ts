import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_ALERT_IMPORTS } from '@hell-ui/angular/alert';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-alert-conditional-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_ALERT_IMPORTS, HellButton],
  template: `
    <div class="mb-hell-3">
      <button hellButton variant="soft" size="sm" type="button" (click)="closable.set(!closable())">
        {{ closable() ? 'Make persistent' : 'Allow dismissing' }}
      </button>
    </div>

    @if (visible()) {
      <hell-alert variant="info" (dismissed)="visible.set(false)">
        <h3 hellAlertTitle>Weekly digest is ready</h3>
        <p hellAlertDescription>
          The dismiss button only mounts while dismissing is allowed — toggle it above.
        </p>

        <!--
          ngProjectAs keeps the conditionally-rendered dismiss button matched to
          the dismiss slot. A wrapper without it (or several elements in one @if)
          does not carry the slot selector, so the button would fall into the
          content region instead of the dismiss position.
        -->
        <ng-container ngProjectAs="[hellAlertDismiss]">
          @if (closable()) {
            <button hellAlertDismiss></button>
          }
        </ng-container>
      </hell-alert>
    } @else {
      <button hellButton variant="soft" size="sm" type="button" (click)="visible.set(true)">
        Show the alert again
      </button>
    }
  `,
})
export class AlertConditionalExample {
  protected readonly visible = signal(true);
  protected readonly closable = signal(true);
}
