import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDateRangePicker } from 'hell-ui/date-picker';

@Component({
  selector: 'app-date-picker-range-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateRangePicker],
  template: `
    <hell-date-range-picker
      [startDate]="start()"
      [endDate]="end()"
      (startDateChange)="start.set($event)"
      (endDateChange)="end.set($event)"
    />
    <p class="hd-muted">
      {{ start()?.toDateString() ?? 'none' }} to {{ end()?.toDateString() ?? 'none' }}
    </p>
  `,
})
export class DatePickerRangeExample {
  protected readonly start = signal<Date | undefined>(new Date(2026, 3, 6));
  protected readonly end = signal<Date | undefined>(new Date(2026, 3, 13));
}
