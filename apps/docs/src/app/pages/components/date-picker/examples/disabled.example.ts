import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDatePicker, HellDateRangePicker } from 'hell-ui/date-picker';

@Component({
  selector: 'app-date-picker-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDatePicker, HellDateRangePicker],
  template: `
    <hell-date-picker [date]="date()" disabled />
    <hell-date-range-picker [startDate]="rangeStart()" [endDate]="rangeEnd()" disabled />
  `,
})
export class DatePickerDisabledExample {
  protected readonly date = signal<Date | undefined>(new Date(2026, 3, 22));
  protected readonly rangeStart = signal<Date | undefined>(new Date(2026, 3, 5));
  protected readonly rangeEnd = signal<Date | undefined>(new Date(2026, 3, 12));
}
