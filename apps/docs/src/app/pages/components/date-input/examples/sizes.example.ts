import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDateInput } from 'hell-ui/date-input';

@Component({
  selector: 'app-date-input-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <input
      hellDateInput
      size="sm"
      aria-label="Small date input"
      [value]="small()"
      (valueChange)="small.set($event)"
    />
    <input
      hellDateInput
      size="md"
      aria-label="Medium date input"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
    <input
      hellDateInput
      size="lg"
      aria-label="Large date input"
      [value]="large()"
      (valueChange)="large.set($event)"
    />
  `,
})
export class DateInputSizesExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
  protected readonly small = signal<Date | null>(new Date(2026, 0, 15));
  protected readonly large = signal<Date | null>(new Date(2026, 11, 31));
}
