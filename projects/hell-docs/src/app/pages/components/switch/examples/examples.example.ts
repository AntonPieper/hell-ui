import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellSwitch } from '@hell-ui/angular/switch';

@Component({
  selector: 'app-switch-examples-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSwitch],
  template: `
    <div class="inline-flex items-center gap-3">
      <button
        hellSwitch
        aria-label="Email notifications"
        [checked]="notify()"
        (checkedChange)="notify.set($event)"
      ></button>
      <span>Email notifications</span>
    </div>
    <div class="inline-flex items-center gap-3">
      <button hellSwitch disabled aria-label="Disabled"></button>
      <span>Disabled</span>
    </div>
    <div class="inline-flex items-center gap-3">
      <button hellSwitch checked disabled aria-label="Disabled, on"></button>
      <span>Disabled, on</span>
    </div>
    <p>
      Current value: <code>{{ notify() }}</code>
    </p>
  `,
})
export class SwitchExamplesExample {
  protected readonly notify = signal(true);
}
