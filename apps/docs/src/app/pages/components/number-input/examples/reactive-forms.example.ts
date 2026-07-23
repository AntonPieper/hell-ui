import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { HellControlGroup } from 'hell-ui/control-group';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HELL_NUMBER_INPUT_IMPORTS } from 'hell-ui/number-input';

@Component({
  selector: 'app-number-input-reactive-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    HellControlGroup,
    ...HELL_FIELD_IMPORTS,
    ...HELL_NUMBER_INPUT_IMPORTS,
  ],
  template: `
    <div hellField>
      <label id="reactive-port-label" hellFieldLabel for="reactive-port">Listen port</label>
      <div
        hellControlGroup
        aria-labelledby="reactive-port-label"
        [invalid]="port.invalid"
        [disabled]="port.disabled"
      >
        <input
          #portInput="hellNumberInput"
          id="reactive-port"
          hellNumberInput
          integer
          [min]="1"
          [max]="65535"
          [formControl]="port"
          [invalid]="port.invalid"
          [ui]="controlUi"
        />
        <button
          hellNumberStep="decrement"
          [hellNumberStepFor]="portInput"
        >−</button>
        <button
          hellNumberStep="increment"
          [hellNumberStepFor]="portInput"
        >+</button>
      </div>
      <div hellFieldDescription>
        Reactive forms receive a real <code>number | null</code>; the control's own validators
        declare required and range policy.
      </div>
      <div hellFieldError id="reactive-port-required" ngpErrorValidator="required">
        Choose a listen port.
      </div>
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
  protected readonly port = new FormControl<number | null>(8080, {
    validators: [
      (control) => Validators.required(control),
      Validators.min(1),
      Validators.max(65535),
    ],
  });
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 max-w-none flex-1 rounded-none border-0 bg-transparent shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none disabled:bg-transparent data-disabled:bg-transparent';
}
