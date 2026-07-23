import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormField, form, max, min, required } from '@angular/forms/signals';

import { HellControlGroup } from 'hell-ui/control-group';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HELL_NUMBER_INPUT_IMPORTS } from 'hell-ui/number-input';

@Component({
  selector: 'app-number-input-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_FIELD_IMPORTS,
    FormField,
    HellControlGroup,
    ...HELL_NUMBER_INPUT_IMPORTS,
  ],
  template: `
    <div hellField>
      <label id="forms-port-label" hellFieldLabel for="forms-port">Listen port</label>
      <div hellControlGroup aria-labelledby="forms-port-label">
        <input
          #portInput="hellNumberInput"
          id="forms-port"
          hellNumberInput
          integer
          placeholder="Port"
          [formField]="portForm.port"
          [ui]="controlUi"
        />
        <button hellNumberStep="decrement" [hellNumberStepFor]="portInput">−</button>
        <button hellNumberStep="increment" [hellNumberStepFor]="portInput">+</button>
      </div>
      <div hellFieldDescription>
        Ports 1–65535: the field's <code>min</code>/<code>max</code> rules drive the input's own
        bounds and stepping, and a committed malformed draft reports an
        <code>invalidNumberInputDraft</code> parse error to this field.
      </div>
    </div>
    <p class="hd-note" data-number-input-forms-state>
      Committed: {{ portForm.port().value() ?? 'null' }} · touched:
      {{ portForm.port().touched() }} · errors: {{ errorKinds() || 'none' }}
    </p>
  `,
})
export class NumberInputFormsExample {
  protected readonly model = signal<{ port: number | null }>({ port: 8080 });
  protected readonly portForm = form(this.model, (path) => {
    required(path.port);
    min(path.port, 1);
    max(path.port, 65535);
  });
  protected readonly errorKinds = computed(() =>
    this.portForm
      .port()
      .errors()
      .map((error) => error.kind)
      .join(', '),
  );
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 max-w-none flex-1 rounded-none border-0 bg-transparent shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none disabled:bg-transparent data-disabled:bg-transparent';
}
