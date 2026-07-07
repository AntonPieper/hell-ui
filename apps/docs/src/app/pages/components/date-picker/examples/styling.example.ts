import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  HellDateRangePicker,
  type HellDateRangePickerUi,
} from '@hell-ui/angular/date-picker';

@Component({
  selector: 'app-date-picker-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateRangePicker],
  template: `
    <hell-date-range-picker
      [startDate]="start()"
      [endDate]="end()"
      (startDateChange)="start.set($event)"
      (endDateChange)="end.set($event)"
      [ui]="ui"
    />
  `,
})
export class DatePickerStylingExample {
  protected readonly start = signal<Date | undefined>(new Date(2026, 3, 6));
  protected readonly end = signal<Date | undefined>(new Date(2026, 3, 13));

  protected readonly ui: HellDateRangePickerUi = {
    root: 'rounded-hell-lg border-hell-primary bg-hell-surface-subtle p-hell-4 shadow-hell-md',
    header: 'mb-hell-3',
    nav: 'gap-hell-2',
    navButton: 'rounded-hell-pill bg-hell-surface-muted text-hell-primary',
    label: 'text-hell-primary uppercase tracking-wide',
    grid: 'border-spacing-y-hell-2',
    weekdayHeader: 'text-hell-primary-soft-foreground',
    cell: 'px-hell-1',
    dateButton: 'rounded-hell-md data-[selected]:bg-hell-primary-hover data-[range-between]:bg-hell-primary-soft',
  };
}
