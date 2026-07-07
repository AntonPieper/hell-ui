import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellNativeSwitch } from '@hell-ui/angular/switch';

@Component({
  selector: 'app-switch-native-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellNativeSwitch],
  template: `
    <label class="inline-flex items-center gap-3">
      <input
        type="checkbox"
        hellNativeSwitch
        [checked]="value()"
        (checkedChange)="value.set($event)"
        required
      />
      <span>Auto-renew subscription</span>
    </label>
    <p>
      Checked: <code>{{ value() }}</code>
    </p>
  `,
})
export class SwitchNativeExample {
  protected readonly value = signal(false);
}
