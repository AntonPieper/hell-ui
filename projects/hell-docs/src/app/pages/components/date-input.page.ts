import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HELL_FIELD_DIRECTIVES, HellDateInput } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, RouterLink, ...HELL_FIELD_DIRECTIVES, HellDateInput],
  template: `
    <article class="hd-prose">
      <h1>Date input</h1>
      <p>
        Composite date field: a text input plus calendar-trigger popover. Type or paste
        <code>YYYY-MM-DD</code> (or any locale-friendly format <code>Date.parse</code> understands),
        then blur or press Enter to commit. Click the calendar icon to pick from
        <a routerLink="/components/date-picker">Date picker</a>.
      </p>

      <h2>Text input + calendar popover</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="grid gap-4 max-w-md">
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
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="exampleCodes[1]" previewClass="grid gap-3 max-w-md">
        <hell-date-input size="sm" [date]="small()" (dateChange)="small.set($event)" />
        <hell-date-input size="md" [date]="value()" (dateChange)="value.set($event)" />
        <hell-date-input size="lg" [date]="large()" (dateChange)="large.set($event)" />
      </hd-example-tabs>

      <h2>Placeholders and labels</h2>
      <hd-example-tabs [code]="exampleCodes[2]" previewClass="grid gap-3 max-w-md">
        <hell-date-input placeholder="Apr 22, 2026" aria-label="Invoice date" [date]="null" />
        <p class="hd-note">
          Use <code>aria-label</code> when no visible <code>hellFieldLabel</code> is present.
        </p>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>date</code>: <code>Date | null</code> current value.</li>
        <li><code>(dateChange)</code>: emits a valid <code>Date</code> after typing or picking.</li>
        <li><code>min</code>, <code>max</code>: optional picker bounds.</li>
        <li><code>size</code>: <code>sm | md | lg</code>.</li>
        <li><code>invalid</code>, <code>disabled</code>: visual / interaction states.</li>
        <li><code>placeholder</code>: text shown while empty.</li>
        <li><code>aria-label</code>: accessible name for standalone usage.</li>
        <li><code>unstyled</code>: opt out of host styling.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Pair with <code>hellFieldLabel</code> for visible naming.</li>
        <li>Use <code>min</code> and <code>max</code> for business constraints.</li>
        <li>Accept typed dates and picker selection as equal paths.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't block keyboard entry by forcing the calendar only.</li>
        <li>Don't use locale-specific placeholders without validation copy.</li>
      </ul>
    </article>
  `,
})
export class DateInputPage {
  protected readonly exampleCodes = [
    '<div hellField>\n  <label hellFieldLabel>Departure</label>\n  <hell-date-input />\n  <div hellFieldDescription>Type a date or pick from the calendar.</div>\n</div>\n\n<div hellField>\n  <label hellFieldLabel>Invalid</label>\n  <hell-date-input invalid />\n  <div hellFieldError>Pick a date in the future.</div>\n</div>\n\n<div hellField>\n  <label hellFieldLabel>Disabled</label>\n  <hell-date-input disabled />\n</div>\n',
    '<hell-date-input size="sm" />\n<hell-date-input size="md" />\n<hell-date-input size="lg" />\n',
    '<hell-date-input\n  placeholder="Apr 22, 2026"\n  aria-label="Invoice date"\n/>\n',
  ] as const;
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
  protected readonly small = signal<Date | null>(new Date(2026, 0, 15));
  protected readonly large = signal<Date | null>(new Date(2026, 11, 31));
  protected readonly bounded = signal<Date | null>(new Date(2026, 5, 15));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
