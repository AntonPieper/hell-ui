import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  HELL_FIELD_DIRECTIVES,
  HellDateInput,
  HellDatePicker,
  HellDateRangePicker,
} from 'hell';

@Component({
  selector: 'hd-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_FIELD_DIRECTIVES,
    HellDateInput,
    HellDatePicker,
    HellDateRangePicker,
  ],
  template: `
    <article class="hd-prose">
      <h1>Date input &amp; picker</h1>
      <p>
        A text-first date field — type or paste a date in <code>YYYY-MM-DD</code>
        (or any locale-friendly format <code>Date.parse</code> understands)
        and tab on, or click the calendar icon on the right to open the
        picker. Use the inline picker directly when you want a calendar
        always on screen, or the range picker for two-date selections.
      </p>

      <h2>Text input + calendar popover</h2>
      <div class="hd-example grid gap-4 max-w-md">
        <div hellField>
          <label hellFieldLabel>Departure</label>
          <hell-date-input
            [date]="value()"
            (dateChange)="value.set($event)"
          />
          <div hellFieldDescription>
            Type a date or pick from the calendar — both work.
          </div>
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
      </div>

      <h2>Sizes</h2>
      <div class="hd-example grid gap-3 max-w-md">
        <hell-date-input size="sm" [date]="small()" (dateChange)="small.set($event)" />
        <hell-date-input size="md" [date]="value()" (dateChange)="value.set($event)" />
        <hell-date-input size="lg" [date]="large()" (dateChange)="large.set($event)" />
      </div>

      <h2>Inline picker</h2>
      <p>
        Skip the input and embed the calendar directly. Useful for booking
        flows or anywhere a date is the only thing on screen.
      </p>
      <div class="hd-example flex flex-wrap items-start gap-6">
        <hell-date-picker
          [date]="inline()"
          (dateChange)="inline.set($event)"
        />
        <p class="hd-muted">Selected: {{ inline()?.toDateString() ?? '—' }}</p>
      </div>

      <h2>Range picker</h2>
      <p>
        Pick a start and end date in one calendar. The selected days at each
        end of the range are filled, and everything between gets a soft
        highlight.
      </p>
      <div class="hd-example flex flex-wrap items-start gap-6">
        <hell-date-range-picker
          [startDate]="rangeStart()"
          [endDate]="rangeEnd()"
          (startDateChange)="rangeStart.set($event)"
          (endDateChange)="rangeEnd.set($event)"
        />
        <p class="hd-muted">
          {{ rangeStart()?.toDateString() ?? '—' }}
          →
          {{ rangeEnd()?.toDateString() ?? '—' }}
        </p>
      </div>

      <h2>API</h2>
      <h3><code>hell-date-input</code></h3>
      <ul>
        <li><code>date</code>: <code>Date</code> currently selected (two-way via <code>(dateChange)</code>).</li>
        <li><code>min</code>, <code>max</code>: bounds.</li>
        <li><code>size</code>: <code>sm | md | lg</code></li>
        <li><code>invalid</code>, <code>disabled</code>, <code>placeholder</code></li>
      </ul>
      <h3><code>hell-date-picker</code></h3>
      <ul>
        <li><code>date</code>, <code>(dateChange)</code>, <code>min</code>, <code>max</code>, <code>disabled</code></li>
      </ul>
      <h3><code>hell-date-range-picker</code></h3>
      <ul>
        <li><code>startDate</code>, <code>(startDateChange)</code></li>
        <li><code>endDate</code>, <code>(endDateChange)</code></li>
        <li><code>min</code>, <code>max</code>, <code>disabled</code></li>
      </ul>
    </article>
  `,
})
export class DateInputPage {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
  protected readonly small = signal<Date | null>(new Date(2026, 0, 15));
  protected readonly large = signal<Date | null>(new Date(2026, 11, 31));
  protected readonly bounded = signal<Date | null>(new Date(2026, 5, 15));
  protected readonly inline = signal<Date | undefined>(new Date());
  protected readonly rangeStart = signal<Date | undefined>(new Date(2026, 3, 5));
  protected readonly rangeEnd = signal<Date | undefined>(new Date(2026, 3, 12));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
