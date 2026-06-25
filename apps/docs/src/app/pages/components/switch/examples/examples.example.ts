import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellSwitch } from '@hell-ui/angular/switch';

@Component({
  selector: 'app-switch-examples-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSwitch],
  template: `
    <div class="inline-flex items-center gap-3">
      <button
        id="email-notifications-switch"
        hellSwitch
        [checked]="notify()"
        (checkedChange)="notify.set($event)"
      ></button>
      <label for="email-notifications-switch">Email notifications</label>
    </div>
    <div class="inline-flex items-center gap-3">
      <button id="disabled-switch" hellSwitch disabled></button>
      <label for="disabled-switch">Disabled</label>
    </div>
    <div class="inline-flex items-center gap-3">
      <button id="disabled-on-switch" hellSwitch checked disabled></button>
      <label for="disabled-on-switch">Disabled, on</label>
    </div>
    <p>
      Current value: <code>{{ notify() }}</code>
    </p>
  `,
})
export class SwitchExamplesExample {
  protected readonly notify = signal(true);
}
