import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/time-input';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';

@Component({
  selector: 'app-time-input-reactive-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...HELL_FIELD_DIRECTIVES, HellTimeInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="reactive-time">Meeting time</label>
      <hell-time-input id="reactive-time" aria-label="Meeting time" [formControl]="control" />
      <div hellFieldDescription>
        Reactive forms receive <code>HellTimeValue | null</code>; the transport format stays your responsibility.
      </div>
    </div>

    <p class="hd-muted">Form value: {{ format(control.value) || 'not set' }}</p>
  `,
})
export class TimeInputReactiveFormsExample {
  protected readonly control = new FormControl<HellTimeValue | null>({
    hour: 9,
    minute: 30,
    second: 0,
  });

  protected format(value: HellTimeValue | null): string {
    return value
      ? `${value.hour.toString().padStart(2, '0')}:${value.minute.toString().padStart(2, '0')}`
      : '';
  }
}
