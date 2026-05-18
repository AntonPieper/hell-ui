import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellNativeSwitch } from '@hell-ui/angular/switch';

@Component({
  selector: 'app-switch-native-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellNativeSwitch],
  template: `
    <label>
      <input
        type="checkbox"
        hellNativeSwitch
        [checked]="value()"
        (checkedChange)="value.set($event)"
        required
      />
      <span>Auto updates</span>
    </label>
    <p>Checked: {{ value() }}</p>
  `,
})
export class SwitchNativeExample {
  protected readonly value = signal(false);
}
