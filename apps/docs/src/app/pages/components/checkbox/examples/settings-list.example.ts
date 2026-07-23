import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidBell, faSolidEnvelope, faSolidLock } from '@ng-icons/font-awesome/solid';
import { HellCheckbox } from '@hell-ui/angular/checkbox';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellIcon } from '@hell-ui/angular/icon';

@Component({
  selector: 'app-checkbox-settings-list-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidBell, faSolidEnvelope, faSolidLock })],
  imports: [HellCheckbox, ...HELL_CARD_IMPORTS, ...HELL_FIELD_IMPORTS, HellIcon],
  template: `
    <div hellCard class="max-w-md" [elevation]="0">
      <div hellCardHeader>Notification preferences</div>
      <div hellCardBody class="grid gap-hell-4">
        <div hellField orientation="horizontal">
          <button
            id="notify-email"
            hellCheckbox
            [checked]="email()"
            (checkedChange)="email.set($event)"
          ></button>
          <label hellFieldLabel for="notify-email">
            <hell-icon name="faSolidEnvelope" ui="text-hell-foreground-muted" />
            Email digests
          </label>
          <div hellFieldDescription>A daily summary of account activity.</div>
        </div>

        <div hellField orientation="horizontal">
          <button
            id="notify-push"
            hellCheckbox
            [checked]="push()"
            (checkedChange)="push.set($event)"
          ></button>
          <label hellFieldLabel for="notify-push">
            <hell-icon name="faSolidBell" ui="text-hell-foreground-muted" />
            Push alerts
          </label>
          <div hellFieldDescription>Real-time alerts for mentions and approvals.</div>
        </div>

        <div hellField orientation="horizontal">
          <button id="notify-security" hellCheckbox [checked]="true" disabled></button>
          <label hellFieldLabel for="notify-security">
            <hell-icon name="faSolidLock" ui="text-hell-foreground-muted" />
            Security alerts
          </label>
          <div hellFieldDescription>Always on and cannot be disabled.</div>
        </div>
      </div>
    </div>
  `,
})
export class CheckboxSettingsListExample {
  protected readonly email = signal(true);
  protected readonly push = signal(false);
}
