import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellTimePicker, type HellTimeValue } from 'hell-ui/time-picker';

@Component({
  selector: 'app-time-picker-seconds-and-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimePicker],
  template: `
    <div class="grid gap-2">
      <span class="text-sm font-medium text-hell-foreground">Second precision</span>
      <hell-time-picker seconds [(value)]="precise" />
    </div>

    <div class="grid gap-2">
      <span class="text-sm font-medium text-hell-foreground">Locked schedule</span>
      <hell-time-picker disabled [value]="locked()" />
    </div>
  `,
})
export class TimePickerSecondsAndDisabledExample {
  protected readonly precise = signal<HellTimeValue | null>({
    hour: 12,
    minute: 34,
    second: 56,
  });
  protected readonly locked = signal<HellTimeValue | null>({
    hour: 9,
    minute: 0,
    second: 0,
  });
}
