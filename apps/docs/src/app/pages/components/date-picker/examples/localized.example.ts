import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDatePicker } from '@hell-ui/angular/date-picker';

@Component({
  selector: 'app-date-picker-localized-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDatePicker],
  template: `
    <hell-date-picker
      locale="de-DE"
      [firstDayOfWeek]="1"
      [date]="date()"
      (dateChange)="date.set($event)"
    />
    <p class="hd-muted">German labels, week starts Monday.</p>
  `,
})
export class DatePickerLocalizedExample {
  protected readonly date = signal<Date | undefined>(new Date(2026, 3, 22));
}
