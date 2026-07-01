import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDatePicker } from '@hell-ui/angular/date-picker';

@Component({
  selector: 'app-date-picker-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDatePicker],
  template: `
    <!-- HellDatePickerPart includes header, nav, grid, cell, and dateButton. -->
    <hell-date-picker
      [date]="date()"
      [ui]="{
        root: 'border-hell-primary',
        label: 'uppercase tracking-wide text-hell-primary',
        dateButton: 'rounded-full',
      }"
      (dateChange)="date.set($event)"
    />
  `,
})
export class DatePickerStylingExample {
  protected readonly date = signal<Date | undefined>(new Date(2026, 3, 22));
}
