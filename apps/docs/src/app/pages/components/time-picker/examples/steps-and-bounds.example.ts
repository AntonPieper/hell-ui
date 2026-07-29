import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellTimePicker, type HellTimeValue } from 'hell-ui/time-picker';

@Component({
  selector: 'app-time-picker-steps-and-bounds-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimePicker],
  template: `
    <div class="grid gap-2">
      <span class="text-sm font-medium text-hell-foreground">Quarter-hour booking slots</span>
      <hell-time-picker
        [(value)]="slot"
        [minuteStep]="15"
        [min]="opens"
        [max]="closes"
      />
      <p class="hd-muted">Selected: {{ format(slot()) }}</p>
    </div>
  `,
})
export class TimePickerStepsAndBoundsExample {
  protected readonly opens: HellTimeValue = { hour: 9, minute: 0, second: 0 };
  protected readonly closes: HellTimeValue = { hour: 17, minute: 30, second: 0 };
  // Starting empty shows the placeholder readout; the first activation commits
  // the earliest in-range time containing the chosen option.
  protected readonly slot = signal<HellTimeValue | null>(null);

  protected format(value: HellTimeValue | null): string {
    if (!value) return 'not set';
    const pad = (part: number) => part.toString().padStart(2, '0');
    return `${pad(value.hour)}:${pad(value.minute)}`;
  }
}
