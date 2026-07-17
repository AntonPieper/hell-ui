import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/time-input';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

@Component({
  selector: 'app-time-input-seconds-and-validation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, HellTimeInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="capture-time">Log timestamp</label>
      <input
        id="capture-time"
        hellTimeInput
        seconds
        [value]="precise()"
        (valueChange)="precise.set($event)"
      />
      <div hellFieldDescription>Seconds mode parses and formats <code>HH:mm:ss</code>.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="bounded-time">Service window</label>
      <input
        id="bounded-time"
        hellTimeInput
        [value]="bounded()"
        [min]="minTime"
        [max]="maxTime"
        (valueChange)="bounded.set($event)"
      />
      <div hellFieldDescription>Inclusive bounds: 08:00–18:00.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="invalid-time">Departure time</label>
      <input
        id="invalid-time"
        hellTimeInput
        invalid
        aria-describedby="invalid-time-error"
        [value]="invalidValue()"
      />
      <div id="invalid-time-error" hellFieldError>
        Resolve the departure-time validation error.
      </div>
    </div>

    <div hellField>
      <label hellFieldLabel for="required-time">Required time</label>
      <input
        id="required-time"
        hellTimeInput
        required
        aria-describedby="required-time-error"
        [value]="requiredValue()"
      />
      <div id="required-time-error" hellFieldError>A time is required.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="disabled-time">Locked slot</label>
      <input id="disabled-time" hellTimeInput disabled [value]="lockedValue()" />
    </div>
  `,
})
export class TimeInputSecondsAndValidationExample {
  protected readonly precise = signal<HellTimeValue | null>({ hour: 12, minute: 34, second: 56 });
  protected readonly bounded = signal<HellTimeValue | null>({ hour: 9, minute: 30, second: 0 });
  protected readonly invalidValue = signal<HellTimeValue | null>({ hour: 8, minute: 0, second: 0 });
  protected readonly requiredValue = signal<HellTimeValue | null>(null);
  protected readonly lockedValue = signal<HellTimeValue | null>({ hour: 9, minute: 0, second: 0 });
  protected readonly minTime: HellTimeValue = { hour: 8, minute: 0, second: 0 };
  protected readonly maxTime: HellTimeValue = { hour: 18, minute: 0, second: 0 };
}
