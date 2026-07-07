import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HellDateInput } from '@hell-ui/angular/date-input';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';

@Component({
  selector: 'app-date-input-reactive-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...HELL_FIELD_DIRECTIVES, HellDateInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="reactive-date">Invoice date</label>
      <hell-date-input inputId="reactive-date" [formControl]="control" />
      <div hellFieldDescription>
        Reactive forms receive <code>Date | null</code>; empty text writes <code>null</code>.
      </div>
    </div>

    <p class="hd-muted">Form value: {{ control.value?.toDateString() ?? 'not set' }}</p>

    <div hellField>
      <label hellFieldLabel for="invalid-date">Invalid</label>
      <hell-date-input inputId="invalid-date" [formControl]="invalidControl" />
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
