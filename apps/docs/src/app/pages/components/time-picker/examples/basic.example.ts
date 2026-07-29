import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HellTimePicker, type HellTimeValue } from 'hell-ui/time-picker';

@Component({
  selector: 'app-time-picker-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTimePicker],
  template: `
    <hell-time-picker [(value)]="value" />
    <p class="hd-muted">Selected: {{ format(value()) }}</p>
    <button hellButton type="button" size="sm" (click)="setToMorning()">Set to 08:15</button>
  `,
})
export class TimePickerBasicExample {
  protected readonly value = signal<HellTimeValue | null>({
    hour: 14,
    minute: 30,
    second: 0,
  });

  /** Writing the value from outside re-centers every column on the new time. */
  protected setToMorning(): void {
    this.value.set({ hour: 8, minute: 15, second: 0 });
  }

  protected format(value: HellTimeValue | null): string {
    if (!value) return 'not set';
    const pad = (part: number) => part.toString().padStart(2, '0');
    return `${pad(value.hour)}:${pad(value.minute)}`;
  }
}
