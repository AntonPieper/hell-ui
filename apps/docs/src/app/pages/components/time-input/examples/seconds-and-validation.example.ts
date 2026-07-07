import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/time-input';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';

@Component({
  selector: 'app-time-input-seconds-and-validation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellTimeInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="capture-time">Log timestamp</label>
      <hell-time-input
        inputId="capture-time"
        seconds
        [value]="precise()"
        (valueChange)="precise.set($event)"
      />
      <div hellFieldDescription>Seconds mode widens the field and picker to hour/minute/second.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="invalid-time">Departure time</label>
      <hell-time-input inputId="invalid-time" invalid [value]="invalidValue()" />
      <div hellFieldError>Pick a time at least 15 minutes from now.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="disabled-time">Locked slot</label>
      <hell-time-input inputId="disabled-time" disabled [value]="lockedValue()" />
    </div>
  `,
})
export class TimeInputSecondsAndValidationExample {
  protected readonly precise = signal<HellTimeValue | null>({ hour: 12, minute: 34, second: 56 });
  protected readonly invalidValue = signal<HellTimeValue | null>({ hour: 8, minute: 0, second: 0 });
  protected readonly lockedValue = signal<HellTimeValue | null>({ hour: 9, minute: 0, second: 0 });
}
