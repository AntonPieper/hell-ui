import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HellNumberInput } from '@hell-ui/angular/number-input';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

@Component({
  selector: 'app-number-input-reactive-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...HELL_FIELD_IMPORTS, HellNumberInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="reactive-port">Listen port</label>
      <hell-number-input
        inputId="reactive-port"
        integer
        steppers
        [min]="1"
        [max]="65535"
        [formControl]="port"
      />
      <div hellFieldDescription>Reactive forms receive a real <code>number | null</code>.</div>
      <div hellFieldError id="reactive-port-min" ngpErrorValidator="min">
        Ports start at 1.
      </div>
      <div hellFieldError id="reactive-port-max" ngpErrorValidator="max">
        Ports stop at 65535.
      </div>
    </div>

    <p class="hd-muted">Form value: {{ port.value ?? 'not set' }}</p>
  `,
})
export class NumberInputReactiveFormsExample {
  protected readonly port = new FormControl<number | null>(8080);
}
