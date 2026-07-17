import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HellDateInput } from '@hell-ui/angular/date-input';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

@Component({
  selector: 'app-date-input-reactive-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...HELL_FIELD_IMPORTS, HellDateInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="reactive-date">Invoice date</label>
      <input id="reactive-date" hellDateInput [formControl]="control" />
      <div hellFieldDescription>
        Reactive forms receive <code>Date | null</code>; empty text writes <code>null</code>.
      </div>
    </div>

    <p class="hd-muted">Form value: {{ control.value?.toDateString() ?? 'not set' }}</p>

    <div hellField>
      <label hellFieldLabel for="invalid-date">Invalid</label>
      <input id="invalid-date" hellDateInput [formControl]="invalidControl" />
      <div hellFieldError id="invalid-date-error" ngpErrorValidator="futureDate">
        Pick a date in the future.
      </div>
    </div>
  `,
})
export class DateInputReactiveFormsExample {
  protected readonly control = new FormControl<Date | null>(new Date(2026, 4, 13));
  protected readonly invalidControl = new FormControl<Date | null>(new Date(2026, 3, 22), {
    validators: () => ({ futureDate: true }),
  });
}
