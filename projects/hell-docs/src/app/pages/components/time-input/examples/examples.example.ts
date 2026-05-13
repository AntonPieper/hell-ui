import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/composites';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-time-input-examples-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellTimeInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="reminder-time">Reminder time</label>
      <hell-time-input id="reminder-time" aria-label="Reminder time" [value]="value()" (valueChange)="value.set($event)" />
      <div hellFieldDescription>Type or pick from the dial.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="precise-time">With seconds</label>
      <hell-time-input id="precise-time" aria-label="With seconds" [value]="precise()" (valueChange)="precise.set($event)" [seconds]="true" />
    </div>

    <div hellField>
      <label hellFieldLabel for="invalid-time">Invalid</label>
      <hell-time-input id="invalid-time" aria-label="Invalid time" invalid [value]="value()" />
      <div hellFieldError>Pick a time at least 15 minutes from now.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="disabled-time">Disabled</label>
      <hell-time-input id="disabled-time" aria-label="Disabled time" disabled [value]="value()" />
    </div>
    <p class="hd-muted">Selected: {{ format(value()) || '-' }}</p>
  `,
})
export class TimeInputExamplesExample {
  protected readonly value = signal<HellTimeValue | null>({ hour: 14, minute: 30, second: 0 });
  protected readonly precise = signal<HellTimeValue | null>({ hour: 12, minute: 34, second: 56 });

  protected format(value: HellTimeValue | null): string {
    return value
      ? `${value.hour.toString().padStart(2, '0')}:${value.minute.toString().padStart(2, '0')}`
      : '';
  }
}
