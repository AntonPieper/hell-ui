import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellTimePicker, type HellTimeValue } from '@hell-ui/angular/time-picker';

@Component({
  selector: 'app-time-picker-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimePicker],
  template: `
    <hell-time-picker [(value)]="value" />
    <p class="hd-muted">Selected: {{ format(value()) }}</p>
  `,
})
export class TimePickerBasicExample {
  protected readonly value = signal<HellTimeValue | null>({
    hour: 14,
    minute: 30,
    second: 0,
  });

  protected format(value: HellTimeValue | null): string {
    if (!value) return 'not set';
    const pad = (part: number) => part.toString().padStart(2, '0');
    return `${pad(value.hour)}:${pad(value.minute)}`;
  }
}
