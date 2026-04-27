import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDatePicker, HellDateRangePicker } from 'hell';

@Component({
  selector: 'app-date-picker-bounded-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDatePicker],
  template: `
    <hell-date-picker
      [date]="bounded()"
      (dateChange)="bounded.set($event)"
      [min]="minDate"
      [max]="maxDate"
    />
    <p class="hd-muted">{{ minDate.toDateString() }} → {{ maxDate.toDateString() }}</p>
  `,
})
export class DatePickerBoundedExample {
  protected readonly single = signal<Date | undefined>(new Date(2026, 3, 22));
  protected readonly bounded = signal<Date | undefined>(new Date(2026, 5, 15));
  protected readonly rangeStart = signal<Date | undefined>(new Date(2026, 3, 5));
  protected readonly rangeEnd = signal<Date | undefined>(new Date(2026, 3, 12));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
