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
        Native HTML date input styled to match the rest of the system. Wraps
        <code>NgpInput</code> for consistent state attributes
        (<code>data-hover</code>, <code>data-focus</code>,
        <code>data-disabled</code>) and tints the picker indicator. For an
        inline calendar surface see <a routerLink="/components/date-picker">Date picker</a>.
      </p>

      <h2>Examples</h2>
      <div class="hd-example flex flex-col gap-3 max-w-xs">
        <input hellDateInput [value]="value()" (input)="value.set($any($event.target).value)" />
        <input hellDateInput size="sm" value="2026-01-15" />
        <input hellDateInput size="lg" value="2026-12-31" />
        <input hellDateInput value="2026-04-22" disabled />
        <input hellDateInput value="2026-06-15" min="2026-04-01" max="2026-12-31" />
      </div>
      <p class="hd-muted">Selected: {{ value() || '—' }}</p>

      <h2>API</h2>
      <ul>
        <li><code>size</code>: <code>sm | md | lg</code></li>
        <li><code>invalid</code>: red border + <code>aria-invalid</code></li>
        <li>All native <code>&lt;input type="date"&gt;</code> attributes (<code>min</code>, <code>max</code>, <code>step</code>, <code>required</code>).</li>
      </ul>
    </article>
  `,
})
export class DateInputPage {
  protected readonly value = signal('2026-04-22');
}
