import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDateInput } from '@hell-ui/angular/date-input';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';

@Component({
  selector: 'app-date-input-text-input-calendar-popover-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellDateInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="departure-date">Departure</label>
      <hell-date-input id="departure-date" aria-label="Departure" [date]="value()" (dateChange)="value.set($event)" />
      <div hellFieldDescription>Type a date or pick from the calendar — both work.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="bounded-date">Bounded</label>
      <hell-date-input
        id="bounded-date"
        aria-label="Bounded"
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
      <label hellFieldLabel for="invalid-date">Invalid</label>
      <hell-date-input id="invalid-date" aria-label="Invalid" invalid [date]="value()" />
      <div hellFieldError>Pick a date in the future.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="disabled-date">Disabled</label>
      <hell-date-input id="disabled-date" aria-label="Disabled" disabled [date]="value()" />
    </div>
  `,
})
export class DateInputTextInputCalendarPopoverExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
  protected readonly bounded = signal<Date | null>(new Date(2026, 5, 15));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
