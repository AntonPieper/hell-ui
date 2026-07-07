import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDatePicker } from '@hell-ui/angular/date-picker';

@Component({
  selector: 'app-date-picker-bounded-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDatePicker],
  template: `
    <hell-date-picker
      [date]="date()"
      [min]="min"
      [max]="max"
      (dateChange)="date.set($event)"
    />
    <p class="hd-muted">
      Allowed: {{ min.toDateString() }} to {{ max.toDateString() }}
    </p>
  `,
})
export class DatePickerBoundedExample {
  protected readonly min = new Date(2026, 3, 6);
  protected readonly max = new Date(2026, 4, 15);
  protected readonly date = signal<Date | undefined>(new Date(2026, 3, 22));
}
