import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, disabled, form } from '@angular/forms/signals';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellSwitch } from '@hell-ui/angular/switch';

@Component({
  selector: 'app-switch-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, FormField, HellSwitch],
  template: `
    <div class="grid max-w-sm gap-hell-2">
      <div hellField orientation="horizontal">
        <button id="forms-digest-switch" hellSwitch [formField]="settingsForm.emailDigest"></button>
        <label hellFieldLabel for="forms-digest-switch">Email digest</label>
      </div>
      <div hellField orientation="horizontal">
        <button
          id="forms-realtime-switch"
          hellSwitch
          [formField]="settingsForm.realtimeAlerts"
        ></button>
        <label hellFieldLabel for="forms-realtime-switch">Realtime alerts</label>
      </div>
      <p class="m-0 text-hell-sm text-hell-foreground-muted">
        A <code>disabled()</code> rule locks realtime alerts while the digest is off. Digest:
        <code>{{ settingsForm.emailDigest().value() }}</code> · Touched:
        <code>{{ settingsForm.emailDigest().touched() }}</code>
      </p>
    </div>
  `,
})
export class SwitchFormsExample {
  protected readonly settings = signal({ emailDigest: false, realtimeAlerts: true });
  protected readonly settingsForm = form(this.settings, (path) => {
    disabled(path.realtimeAlerts, (ctx) => !ctx.valueOf(path.emailDigest));
  });
}
