import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormField, form, maxDate, minDate, required } from '@angular/forms/signals';

import { HellDateInput } from '@hell-ui/angular/date-input';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

@Component({
  selector: 'app-date-input-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, FormField, HellDateInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="forms-delivery-date">Delivery date</label>
      <input
        id="forms-delivery-date"
        hellDateInput
        placeholder="YYYY-MM-DD"
        [formField]="deliveryForm.date"
      />
      <div hellFieldDescription>
        June 2026 only: the field's <code>minDate</code>/<code>maxDate</code> rules drive the
        input's own bounds, and a committed unparseable draft reports an
        <code>invalidDateInputDraft</code> parse error to this field.
      </div>
    </div>
    <p class="hd-note" data-date-input-forms-state>
      Committed: {{ deliveryForm.date().value()?.toDateString() ?? 'null' }} · touched:
      {{ deliveryForm.date().touched() }} · errors: {{ errorKinds() || 'none' }}
    </p>
  `,
})
export class DateInputFormsExample {
  protected readonly model = signal<{ date: Date | null }>({ date: new Date(2026, 5, 15) });
  protected readonly deliveryForm = form(this.model, (path) => {
    required(path.date);
    minDate(path.date, new Date(2026, 5, 1));
    maxDate(path.date, new Date(2026, 5, 30));
  });
  protected readonly errorKinds = computed(() =>
    this.deliveryForm
      .date()
      .errors()
      .map((error) => error.kind)
      .join(', '),
  );
}
