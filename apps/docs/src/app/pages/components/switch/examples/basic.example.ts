import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellSwitch } from '@hell-ui/angular/switch';

@Component({
  selector: 'app-switch-basic-example',
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
    <p>
      Current value: <code>{{ notify() }}</code>
    </p>
  `,
})
export class SwitchBasicExample {
  protected readonly notify = signal(true);
}
