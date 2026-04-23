import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDateInput } from 'hell';

@Component({
  selector: 'hd-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <article class="hd-prose">
      <h1>Date input</h1>
      <p>
        Trigger button + calendar popover, built on
        <code>ng-primitives/date-picker</code>. Bind to <code>[date]</code>
        for a controlled value and listen to <code>(dateChange)</code>. Pass
        <code>[min]</code>/<code>[max]</code> to bound the picker. For an
        always-visible inline calendar, see
        <a routerLink="/components/date-picker">Date picker</a>.
      </p>

      <h2>Examples</h2>
      <div class="hd-example flex flex-col gap-3 max-w-xs">
        <hell-date-input
          [date]="value()"
          (dateChange)="value.set($event)"
        />
        <hell-date-input size="sm" [date]="small()" (dateChange)="small.set($event)" />
        <hell-date-input size="lg" [date]="large()" (dateChange)="large.set($event)" />
        <hell-date-input [date]="bounded()" (dateChange)="bounded.set($event)"
          [min]="minDate" [max]="maxDate" />
        <hell-date-input [date]="value()" disabled />
      </div>
      <p class="hd-muted">Selected: {{ value()?.toDateString() ?? '—' }}</p>

      <h2>API</h2>
      <ul>
        <li><code>date</code>: <code>Date</code> currently selected (two-way via <code>(dateChange)</code>).</li>
        <li><code>min</code>, <code>max</code>: bounds.</li>
        <li><code>size</code>: <code>sm | md | lg</code></li>
        <li><code>invalid</code>: red border.</li>
        <li><code>disabled</code>: disable the trigger.</li>
        <li><code>placeholder</code>: text shown before a date is picked.</li>
      </ul>
    </article>
  `,
})
export class DateInputPage {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
  protected readonly small = signal<Date | null>(new Date(2026, 0, 15));
  protected readonly large = signal<Date | null>(new Date(2026, 11, 31));
  protected readonly bounded = signal<Date | null>(new Date(2026, 5, 15));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
