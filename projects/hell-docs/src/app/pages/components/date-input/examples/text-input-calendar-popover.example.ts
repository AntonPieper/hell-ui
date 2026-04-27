import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HELL_FIELD_DIRECTIVES, HellDateInput } from 'hell';

@Component({
  selector: 'app-date-input-text-input-calendar-popover-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellDateInput],
  template: `
    <div hellField>
      <label hellFieldLabel>Departure</label>
      <hell-date-input [date]="value()" (dateChange)="value.set($event)" />
      <div hellFieldDescription>Type a date or pick from the calendar — both work.</div>
    </div>

    <div hellField>
      <label hellFieldLabel>Bounded</label>
      <hell-date-input
        [date]="bounded()"
        (dateChange)="bounded.set($event)"
        [min]="minDate"
        [max]="maxDate"
      />
      <div hellFieldDescription>
        Limited to {{ minDate.toDateString() }} – {{ maxDate.toDateString() }}.
      </div>
    </div>

    <div hellField>
      <label hellFieldLabel>Invalid</label>
      <hell-date-input invalid [date]="value()" />
      <div hellFieldError>Pick a date in the future.</div>
    </div>

    <div hellField>
      <label hellFieldLabel>Disabled</label>
      <hell-date-input disabled [date]="value()" />
    </div>
  `,
})
export class DateInputTextInputCalendarPopoverExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
  protected readonly small = signal<Date | null>(new Date(2026, 0, 15));
  protected readonly large = signal<Date | null>(new Date(2026, 11, 31));
  protected readonly bounded = signal<Date | null>(new Date(2026, 5, 15));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
