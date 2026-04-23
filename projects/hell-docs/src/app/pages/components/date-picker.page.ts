import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDatePicker } from 'hell';

@Component({
  selector: 'hd-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDatePicker],
  template: `
    <article class="hd-prose">
      <h1>Date picker</h1>
      <p>
        Inline calendar built on
        <code>ng-primitives/date-picker</code>. Emits <code>(dateChange)</code>
        with the selected <code>Date</code>. Pair with a popover or dialog if
        you need a dropdown trigger; the bare component renders inline so it
        composes anywhere.
      </p>

      <h2>Inline</h2>
      <div class="hd-example flex flex-wrap items-start gap-6">
        <hell-date-picker [date]="value()" (dateChange)="value.set($event)" />
        <div>
          <p>Selected:</p>
          <p><code>{{ value()?.toDateString() ?? '—' }}</code></p>
        </div>
      </div>

      <h2>With min/max</h2>
      <div class="hd-example">
        <hell-date-picker
          [date]="bounded()"
          [min]="minDate"
          [max]="maxDate"
          (dateChange)="bounded.set($event)"
        />
      </div>

      <h2>API</h2>
      <ul>
        <li><code>date</code>: <code>Date</code> currently selected (two-way via <code>(dateChange)</code>).</li>
        <li><code>min</code>, <code>max</code>: bounds.</li>
        <li><code>disabled</code>: disable all interaction.</li>
      </ul>
    </article>
  `,
})
export class DatePickerPage {
  protected readonly value = signal<Date | undefined>(new Date());
  protected readonly bounded = signal<Date | undefined>(undefined);
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
