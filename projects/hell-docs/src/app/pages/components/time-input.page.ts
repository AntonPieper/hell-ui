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
        Trigger button + time-picker popover with hour/minute scroll columns.
        Bind <code>[value]</code> as <code>"HH:mm"</code> (or
        <code>"HH:mm:ss"</code> with <code>[seconds]="true"</code>) and
        listen to <code>(valueChange)</code>.
      </p>

      <h2>Examples</h2>
      <div class="hd-example flex flex-col gap-3 max-w-xs">
        <hell-time-input
          [value]="value()"
          (valueChange)="value.set($event)"
        />
        <hell-time-input size="sm" [value]="small()" (valueChange)="small.set($event)" />
        <hell-time-input size="lg" [value]="large()" (valueChange)="large.set($event)" />
        <hell-time-input
          [value]="precise()"
          (valueChange)="precise.set($event)"
          [seconds]="true"
        />
        <hell-time-input [value]="value()" disabled />
      </div>
      <p class="hd-muted">Selected: {{ value() || '—' }}</p>

      <h2>API</h2>
      <ul>
        <li><code>value</code>: <code>"HH:mm"</code> or <code>"HH:mm:ss"</code> (two-way via <code>(valueChange)</code>).</li>
        <li><code>seconds</code>: include a seconds column.</li>
        <li><code>size</code>: <code>sm | md | lg</code></li>
        <li><code>invalid</code>: red border.</li>
        <li><code>disabled</code>: disable the trigger.</li>
        <li><code>placeholder</code>: text shown before a time is picked.</li>
      </ul>
    </article>
  `,
})
export class TimeInputPage {
  protected readonly value = signal<string | null>('14:30');
  protected readonly small = signal<string | null>('09:00');
  protected readonly large = signal<string | null>('17:30');
  protected readonly precise = signal<string | null>('12:34:56');
}
