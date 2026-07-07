import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDateInput } from '@hell-ui/angular/date-input';

@Component({
  selector: 'app-date-input-bounds-and-validation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <hell-date-input
      aria-label="Bounded date"
      [date]="bounded()"
      [min]="minDate"
      [max]="maxDate"
      (dateChange)="bounded.set($event)"
    />
    <p class="hd-note">Limited to {{ minDate.toDateString() }} – {{ maxDate.toDateString() }}.</p>

    <hell-date-input aria-label="Invalid date" invalid [date]="value()" />
    <p class="hd-note">
      <code>invalid</code> forces the error look; typing an out-of-range or unparseable date sets it
      automatically.
    </p>

    <hell-date-input aria-label="Disabled date" disabled [date]="value()" />
  `,
})
export class DateInputBoundsAndValidationExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
  protected readonly bounded = signal<Date | null>(new Date(2026, 5, 15));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
