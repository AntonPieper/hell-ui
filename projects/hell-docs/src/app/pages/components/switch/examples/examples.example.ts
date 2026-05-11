import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellSwitch } from 'hell/primitives';

@Component({
  selector: 'app-switch-examples-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSwitch],
  template: `
    <label class="inline-flex items-center gap-3">
      <button hellSwitch [checked]="notify()" (checkedChange)="notify.set($event)"></button>
      Email notifications
    </label>
    <label class="inline-flex items-center gap-3">
      <button hellSwitch disabled></button>
      Disabled
    </label>
    <label class="inline-flex items-center gap-3">
      <button hellSwitch checked disabled></button>
      Disabled, on
    </label>
    <p>
      Current value: <code>{{ notify() }}</code>
    </p>
  `,
})
export class SwitchExamplesExample {
  protected readonly notify = signal(true);
}
