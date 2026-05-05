import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { DatePickerBoundedExample } from './examples/bounded.example';
import datePickerBoundedExampleCodeRaw from './examples/bounded.example.ts?raw' with {
  loader: 'text'
};
import { DatePickerDisabledExample } from './examples/disabled.example';
import datePickerDisabledExampleCodeRaw from './examples/disabled.example.ts?raw' with {
  loader: 'text'
};
import { DatePickerRangeExample } from './examples/range.example';
import datePickerRangeExampleCodeRaw from './examples/range.example.ts?raw' with {
  loader: 'text'
};
import { DatePickerSingleDateExample } from './examples/single-date.example';
import datePickerSingleDateExampleCodeRaw from './examples/single-date.example.ts?raw' with {
  loader: 'text'
};

@Component({
  selector: 'hd-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    DatePickerSingleDateExample,
    DatePickerBoundedExample,
    DatePickerRangeExample,
    DatePickerDisabledExample,
  ],
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
      <hd-example-tabs
        [code]="datePickerSingleDateExampleCode"
        previewClass="flex flex-wrap items-start gap-6"
      >
        <app-date-picker-single-date-example />
      </hd-example-tabs>

      <h2>Bounded</h2>
      <p>
        Pass <code>min</code> and <code>max</code> to prevent selection outside an allowed range.
      </p>
      <hd-example-tabs
        [code]="datePickerBoundedExampleCode"
        previewClass="flex flex-wrap items-start gap-6"
      >
        <app-date-picker-bounded-example />
      </hd-example-tabs>

      <h2>Range</h2>
      <p>
        The range picker shares the same calendar UI but emits start and end dates independently.
        Use this for bookings, filters, and reports.
      </p>
      <hd-example-tabs
        [code]="datePickerRangeExampleCode"
        previewClass="flex flex-wrap items-start gap-6"
      >
        <app-date-picker-range-example />
      </hd-example-tabs>

      <h2>Disabled</h2>
      <hd-example-tabs
        [code]="datePickerDisabledExampleCode"
        previewClass="flex flex-wrap items-start gap-6"
      >
        <app-date-picker-disabled-example />
      </hd-example-tabs>

      <h2>API</h2>
      <h3><code>hell-date-picker</code></h3>
      <ul>
        <li><code>date</code>: selected <code>Date</code>.</li>
        <li><code>(dateChange)</code>: emits selected <code>Date</code>.</li>
        <li><code>min</code>, <code>max</code>: optional bounds.</li>
        <li><code>locale</code>: BCP-47 locale for month and weekday labels.</li>
        <li><code>firstDayOfWeek</code>: <code>1</code> Monday through <code>7</code> Sunday.</li>
        <li><code>disabled</code>: disables navigation and day selection.</li>
        <li><code>unstyled</code>: opt out of host styling.</li>
      </ul>

      <h3><code>hell-date-range-picker</code></h3>
      <ul>
        <li><code>startDate</code>, <code>(startDateChange)</code>.</li>
        <li><code>endDate</code>, <code>(endDateChange)</code>.</li>
        <li>
          <code>min</code>, <code>max</code>, <code>locale</code>, <code>firstDayOfWeek</code>,
          <code>disabled</code>, <code>unstyled</code>.
        </li>
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
  protected readonly datePickerSingleDateExampleCode = datePickerSingleDateExampleCodeRaw;
  protected readonly datePickerBoundedExampleCode = datePickerBoundedExampleCodeRaw;
  protected readonly datePickerRangeExampleCode = datePickerRangeExampleCodeRaw;
  protected readonly datePickerDisabledExampleCode = datePickerDisabledExampleCodeRaw;
}
