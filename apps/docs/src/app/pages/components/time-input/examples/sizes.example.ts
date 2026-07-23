import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellTimeInput, type HellTimeValue } from 'hell-ui/time-input';

@Component({
  selector: 'app-time-input-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `
    <input
      hellTimeInput
      size="sm"
      aria-label="Small time input"
      [value]="small()"
      (valueChange)="small.set($event)"
    />
    <input
      hellTimeInput
      size="md"
      aria-label="Medium time input"
      [value]="medium()"
      (valueChange)="medium.set($event)"
    />
    <input
      hellTimeInput
      size="lg"
      aria-label="Large time input"
      [value]="large()"
      (valueChange)="large.set($event)"
    />
  `,
})
export class TimeInputSizesExample {
  protected readonly small = signal<HellTimeValue | null>({ hour: 9, minute: 0, second: 0 });
  protected readonly medium = signal<HellTimeValue | null>({ hour: 14, minute: 30, second: 0 });
  protected readonly large = signal<HellTimeValue | null>({ hour: 17, minute: 45, second: 0 });
}
