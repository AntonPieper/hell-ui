import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellNativeRadio, HellNativeRadioGroup } from 'hell-ui/radio';

@Component({
  selector: 'app-radio-native-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellNativeRadio, HellNativeRadioGroup],
  template: `
    <div class="mb-2 text-sm font-medium">Priority</div>
    <div hellNativeRadioGroup aria-label="Priority" orientation="horizontal">
      <label class="inline-flex items-center gap-2">
        <input
          type="radio"
          hellNativeRadio
          name="priority"
          value="low"
          [checked]="value() === 'low'"
          (checkedChange)="set('low', $event)"
        />
        <span>Low</span>
      </label>
      <label class="inline-flex items-center gap-2">
        <input
          type="radio"
          hellNativeRadio
          name="priority"
          value="high"
          [checked]="value() === 'high'"
          (checkedChange)="set('high', $event)"
        />
        <span>High</span>
      </label>
    </div>
    <p>Selected: {{ value() }}</p>
  `,
})
export class RadioNativeExample {
  protected readonly value = signal('low');

  protected set(next: string, checked: boolean): void {
    if (checked) this.value.set(next);
  }
}
