import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDatePicker } from '@hell-ui/angular/date-picker';

@Component({
  selector: 'app-date-picker-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDatePicker],
  template: `
    <hell-date-picker [date]="date()" (dateChange)="date.set($event)" />
    <p class="hd-muted">Selected: {{ date()?.toDateString() ?? 'none' }}</p>
  `,
})
export class DatePickerBasicExample {
  protected readonly date = signal<Date | undefined>(new Date(2026, 3, 22));
}
