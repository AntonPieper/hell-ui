import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDatePicker, HellDateRangePicker } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellDatePicker, HellDateRangePicker],
  template: `
    <article class="hd-prose">
      <h1>Date picker</h1>
      <p>
        Calendar surface for single-date and range selection. Built on
        <code>ng-primitives/date-picker</code>; keyboard focus, disabled dates, month navigation and
        ARIA grid semantics come from the primitive layer. The hell wrapper adds month and year
        navigation buttons plus library styling.
      </p>

      <h2>Single date</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="flex flex-wrap items-start gap-6">
        <hell-date-picker [date]="single()" (dateChange)="single.set($event)" />
        <p class="hd-muted">Selected: {{ single()?.toDateString() ?? '—' }}</p>
      </hd-example-tabs>

      <h2>Bounded</h2>
      <p>
        Pass <code>min</code> and <code>max</code> to prevent selection outside an allowed range.
      </p>
      <hd-example-tabs [code]="exampleCodes[1]" previewClass="flex flex-wrap items-start gap-6">
        <hell-date-picker
          [date]="bounded()"
          (dateChange)="bounded.set($event)"
          [min]="minDate"
          [max]="maxDate"
        />
        <p class="hd-muted">{{ minDate.toDateString() }} → {{ maxDate.toDateString() }}</p>
      </hd-example-tabs>

      <h2>Range</h2>
      <p>
        The range picker shares the same calendar UI but emits start and end dates independently.
        Use this for bookings, filters, and reports.
      </p>
      <hd-example-tabs [code]="exampleCodes[2]" previewClass="flex flex-wrap items-start gap-6">
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
      </hd-example-tabs>

      <h2>Disabled</h2>
      <hd-example-tabs [code]="exampleCodes[3]" previewClass="flex flex-wrap items-start gap-6">
        <hell-date-picker [date]="single()" disabled />
        <hell-date-range-picker [startDate]="rangeStart()" [endDate]="rangeEnd()" disabled />
      </hd-example-tabs>

      <h2>API</h2>
      <h3><code>hell-date-picker</code></h3>
      <ul>
        <li><code>date</code>: selected <code>Date</code>.</li>
        <li><code>(dateChange)</code>: emits selected <code>Date</code>.</li>
        <li><code>min</code>, <code>max</code>: optional bounds.</li>
        <li><code>disabled</code>: disables navigation and day selection.</li>
        <li><code>unstyled</code>: opt out of host styling.</li>
      </ul>

      <h3><code>hell-date-range-picker</code></h3>
      <ul>
        <li><code>startDate</code>, <code>(startDateChange)</code>.</li>
        <li><code>endDate</code>, <code>(endDateChange)</code>.</li>
        <li><code>min</code>, <code>max</code>, <code>disabled</code>, <code>unstyled</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use date picker for bounded calendar selection.</li>
        <li>Use range picker when start and end dates are part of one decision.</li>
        <li>Set initial dates close to expected values.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use it for free-form historic dates where typing is faster.</li>
        <li>Don't hide min/max rules until submit.</li>
      </ul>
    </article>
  `,
})
export class DatePickerPage {
  protected readonly exampleCodes = [
    '<hell-date-picker />\n',
    '<hell-date-picker [min]="null" [max]="null" />\n',
    '<hell-date-range-picker />\n',
    '<hell-date-picker disabled />\n<hell-date-range-picker disabled />\n',
  ] as const;
  protected readonly single = signal<Date | undefined>(new Date(2026, 3, 22));
  protected readonly bounded = signal<Date | undefined>(new Date(2026, 5, 15));
  protected readonly rangeStart = signal<Date | undefined>(new Date(2026, 3, 5));
  protected readonly rangeEnd = signal<Date | undefined>(new Date(2026, 3, 12));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
