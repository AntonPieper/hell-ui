import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellTimeInput } from 'hell';

@Component({
  selector: 'app-time-input-examples-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellTimeInput],
  template: `
    <div hellField>
      <label hellFieldLabel>Reminder time</label>
      <hell-time-input [value]="value()" (valueChange)="value.set($event)" />
      <div hellFieldDescription>Type or pick from the dial.</div>
    </div>

    <div hellField>
      <label hellFieldLabel>With seconds</label>
      <hell-time-input [value]="precise()" (valueChange)="precise.set($event)" [seconds]="true" />
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
    <p class="hd-muted">Selected: {{ value() || '-' }}</p>
  `,
})
export class TimeInputExamplesExample {
  protected readonly value = signal<string | null>('14:30');
  protected readonly small = signal<string | null>('09:00');
  protected readonly large = signal<string | null>('17:30');
  protected readonly precise = signal<string | null>('12:34:56');
}
