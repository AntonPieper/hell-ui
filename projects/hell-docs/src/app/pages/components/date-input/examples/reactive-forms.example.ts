import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HellDateInput } from '@hell-ui/angular/composites';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-date-input-reactive-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...HELL_FIELD_DIRECTIVES, HellDateInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="reactive-date">Invoice date</label>
      <hell-date-input id="reactive-date" aria-label="Invoice date" [formControl]="control" />
      <div hellFieldDescription>
        Reactive forms receive <code>Date | null</code>; empty text writes <code>null</code>.
      </div>
    </div>

    <p class="hd-muted">Form value: {{ control.value?.toDateString() ?? 'not set' }}</p>
  `,
})
export class DateInputReactiveFormsExample {
  protected readonly control = new FormControl<Date | null>(new Date(2026, 4, 13));
}
