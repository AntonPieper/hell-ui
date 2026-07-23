import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDateInput } from 'hell-ui/date-input';

@Component({
  selector: 'app-date-input-bounds-and-validation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <input
      hellDateInput
      aria-label="Bounded date"
      [value]="bounded()"
      [min]="minDate"
      [max]="maxDate"
      (valueChange)="bounded.set($event)"
    />
    <p class="hd-note">Limited to {{ minDate.toDateString() }} – {{ maxDate.toDateString() }}.</p>

    <input hellDateInput aria-label="Invalid date" invalid [value]="value()" />
    <p class="hd-note">
      <code>invalid</code> forces the error look; typing an out-of-range or unparseable date sets it
      automatically.
    </p>

    <input hellDateInput aria-label="Required date" required [value]="requiredValue()" />
    <input hellDateInput aria-label="Disabled date" disabled [value]="value()" />
  `,
})
export class DateInputBoundsAndValidationExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
  protected readonly requiredValue = signal<Date | null>(null);
  protected readonly bounded = signal<Date | null>(new Date(2026, 5, 15));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
