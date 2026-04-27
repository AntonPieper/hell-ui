import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellTimeInput } from 'hell';

@Component({
  selector: 'hd-time-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellTimeInput],
  template: `
    <article class="hd-prose">
      <h1>Time input</h1>
      <p>
        A text-first time field that accepts <code>HH:mm</code>,
        <code>HH:mm:ss</code> and common 12-hour spellings (<code>9:00 am</code>,
        <code>1:30PM</code>). Click the clock icon to open a compact dial:
        hour and minute grids you can click directly, with ±5 minute nudges
        for fine-tuning.
      </p>

      <h2>Examples</h2>
      <div class="hd-example grid gap-4 max-w-md">
        <div hellField>
          <label hellFieldLabel>Reminder time</label>
          <hell-time-input
            [value]="value()"
            (valueChange)="value.set($event)"
          />
          <div hellFieldDescription>Type or pick from the dial.</div>
        </div>

        <div hellField>
          <label hellFieldLabel>With seconds</label>
          <hell-time-input
            [value]="precise()"
            (valueChange)="precise.set($event)"
            [seconds]="true"
          />
        </div>

        <div hellField>
          <label hellFieldLabel>Invalid</label>
          <hell-time-input invalid [value]="value()" />
          <div hellFieldError>Pick a time at least 15 minutes from now.</div>
        </div>

        <div hellField>
          <label hellFieldLabel>Disabled</label>
          <hell-time-input disabled [value]="value()" />
        </div>
      </div>

      <h2>Placeholder and labels</h2>
      <div class="hd-example grid gap-3 max-w-md">
        <hell-time-input placeholder="09:00" aria-label="Start time" />
        <p class="hd-note">
          Use <code>aria-label</code> when no visible <code>hellFieldLabel</code> is present.
        </p>
      </div>

      <h2>Sizes</h2>
      <div class="hd-example grid gap-3 max-w-md">
        <hell-time-input size="sm" [value]="small()" (valueChange)="small.set($event)" />
        <hell-time-input size="md" [value]="value()" (valueChange)="value.set($event)" />
        <hell-time-input size="lg" [value]="large()" (valueChange)="large.set($event)" />
      </div>

      <p class="hd-muted">Selected: {{ value() || '—' }}</p>

      <h2>API</h2>
      <ul>
        <li><code>value</code>: <code>"HH:mm"</code> or <code>"HH:mm:ss"</code> (two-way via <code>(valueChange)</code>).</li>
        <li><code>seconds</code>: include a seconds grid + readout.</li>
        <li><code>size</code>: <code>sm | md | lg</code></li>
        <li><code>invalid</code>, <code>disabled</code></li>
        <li><code>placeholder</code>, <code>aria-label</code></li>
        <li><code>unstyled</code></li>
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
