import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDatePicker, HellDateRangePicker } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-date-picker-range-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateRangePicker],
  template: `
    <hell-date-range-picker
      [startDate]="rangeStart()"
      [endDate]="rangeEnd()"
      (startDateChange)="rangeStart.set($event)"
      (endDateChange)="rangeEnd.set($event)"
    />
    <p class="hd-muted">
      {{ rangeStart()?.toDateString() ?? '—' }}
      →
      {{ rangeEnd()?.toDateString() ?? '—' }}
    </p>
  `,
})
export class DatePickerRangeExample {
  protected readonly single = signal<Date | undefined>(new Date(2026, 3, 22));
  protected readonly bounded = signal<Date | undefined>(new Date(2026, 5, 15));
  protected readonly rangeStart = signal<Date | undefined>(new Date(2026, 3, 5));
  protected readonly rangeEnd = signal<Date | undefined>(new Date(2026, 3, 12));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
