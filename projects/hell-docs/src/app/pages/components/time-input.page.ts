import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellTimeInput } from 'hell';

@Component({
  selector: 'hd-time-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `
    <article class="hd-prose">
      <h1>Time input</h1>
      <p>
        Native HTML time input styled to match the rest of the system. Pass
        <code>step="1"</code> to enable seconds.
      </p>

      <h2>Examples</h2>
      <div class="hd-example flex flex-col gap-3 max-w-xs">
        <input hellTimeInput [value]="value()" (input)="value.set($any($event.target).value)" />
        <input hellTimeInput size="sm" value="09:00" />
        <input hellTimeInput size="lg" value="17:30" />
        <input hellTimeInput value="12:34:56" step="1" />
        <input hellTimeInput value="08:00" disabled />
      </div>
      <p class="hd-muted">Selected: {{ value() || '—' }}</p>

      <h2>API</h2>
      <ul>
        <li><code>size</code>: <code>sm | md | lg</code></li>
        <li><code>invalid</code>: red border + <code>aria-invalid</code></li>
        <li>All native <code>&lt;input type="time"&gt;</code> attributes (<code>min</code>, <code>max</code>, <code>step</code>, <code>required</code>).</li>
      </ul>
    </article>
  `,
})
export class TimeInputPage {
  protected readonly value = signal('14:30');
}
