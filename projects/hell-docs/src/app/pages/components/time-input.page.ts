import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellTimeInput } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-time-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, ...HELL_FIELD_DIRECTIVES, HellTimeInput],
  template: `
    <article class="hd-prose">
      <h1>Time input</h1>
      <p>
        A text-first time field that accepts <code>HH:mm</code>, <code>HH:mm:ss</code> and common
        12-hour spellings (<code>9:00 am</code>, <code>1:30PM</code>). Click the clock icon to open
        a compact dial: hour and minute grids you can click directly, with ±5 minute nudges for
        fine-tuning.
      </p>

      <h2>Examples</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="grid gap-4 max-w-md">
        <div hellField>
          <label hellFieldLabel>Reminder time</label>
          <hell-time-input [value]="value()" (valueChange)="value.set($event)" />
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
      </hd-example-tabs>

      <h2>Placeholder and labels</h2>
      <hd-example-tabs [code]="exampleCodes[1]" previewClass="grid gap-3 max-w-md">
        <hell-time-input placeholder="09:00" aria-label="Start time" />
        <p class="hd-note">
          Use <code>aria-label</code> when no visible <code>hellFieldLabel</code> is present.
        </p>
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="exampleCodes[2]" previewClass="grid gap-3 max-w-md">
        <hell-time-input size="sm" [value]="small()" (valueChange)="small.set($event)" />
        <hell-time-input size="md" [value]="value()" (valueChange)="value.set($event)" />
        <hell-time-input size="lg" [value]="large()" (valueChange)="large.set($event)" />
      </hd-example-tabs>

      <p class="hd-muted">Selected: {{ value() || '—' }}</p>

      <h2>API</h2>
      <ul>
        <li>
          <code>value</code>: <code>"HH:mm"</code> or <code>"HH:mm:ss"</code> (two-way via
          <code>(valueChange)</code>).
        </li>
        <li><code>seconds</code>: include a seconds grid + readout.</li>
        <li><code>size</code>: <code>sm | md | lg</code></li>
        <li><code>invalid</code>, <code>disabled</code></li>
        <li><code>placeholder</code>, <code>aria-label</code></li>
        <li><code>unstyled</code></li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use <code>seconds</code> only when users really need second precision.</li>
        <li>Pair with field labels and help for timezone expectations.</li>
        <li>Keep value format stable for form submission.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't force time input for broad periods like morning or afternoon.</li>
        <li>Don't omit timezone context in scheduling flows.</li>
      </ul>
    </article>
  `,
})
export class TimeInputPage {
  protected readonly exampleCodes = [
    '<div hellField>\n  <label hellFieldLabel>Reminder time</label>\n  <hell-time-input value="09:30" />\n  <div hellFieldDescription>Type or pick from the dial.</div>\n</div>\n\n<div hellField>\n  <label hellFieldLabel>With seconds</label>\n  <hell-time-input value="14:45:30" seconds />\n</div>\n',
    '<hell-time-input size="sm" value="09:00" />\n<hell-time-input size="md" value="12:30" />\n<hell-time-input size="lg" value="18:45" />\n',
    '<hell-time-input placeholder="HH:mm" aria-label="Start time" />\n',
  ] as const;
  protected readonly value = signal<string | null>('14:30');
  protected readonly small = signal<string | null>('09:00');
  protected readonly large = signal<string | null>('17:30');
  protected readonly precise = signal<string | null>('12:34:56');
}
