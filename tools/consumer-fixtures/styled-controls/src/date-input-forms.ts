import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { HellDateInput } from '@hell-ui/angular/date-input';

function formatDay(value: Date | null): string {
  if (!value) return 'null';
  const year = value.getFullYear().toString().padStart(4, '0');
  const month = (value.getMonth() + 1).toString().padStart(2, '0');
  const day = value.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Date Input Control Value Authority boundary coverage (#284): the packed
 * `input[hellDateInput]` binds one `value` model across direct property
 * binding, two-way binding, Signal Forms `[formField]`, Reactive Forms
 * `[formControl]`, and Template-driven Forms `[(ngModel)]`, and every path
 * reports the same committed nullable date at runtime.
 */
@Component({
  selector: 'app-date-input-forms',
  imports: [FormsModule, ReactiveFormsModule, FormField, HellDateInput],
  template: `
    <input
      hellDateInput
      aria-label="Property date"
      [value]="propertyValue()"
      (valueChange)="propertyValue.set($event)"
    />
    <input hellDateInput aria-label="Two-way date" [(value)]="twoWayValue" />
    <input hellDateInput aria-label="Signal Forms date" [formField]="deliveryForm.date" />
    <input hellDateInput aria-label="Reactive date" [formControl]="reactiveControl" />
    <input hellDateInput aria-label="Template-driven date" [(ngModel)]="ngModelValue" />
    <p data-test-id="date-input-forms-status">{{ status() }}</p>
  `,
})
export class DateInputForms {
  protected readonly propertyValue = signal<Date | null>(new Date(2026, 0, 1));
  protected readonly twoWayValue = signal<Date | null>(new Date(2026, 1, 2));
  protected readonly formModel = signal<{ date: Date | null }>({ date: new Date(2026, 2, 3) });
  protected readonly deliveryForm = form(this.formModel);
  protected readonly reactiveControl = new FormControl<Date | null>(new Date(2026, 3, 4));
  protected readonly ngModelValue = signal<Date | null>(new Date(2026, 4, 5));

  protected readonly status = computed(
    () =>
      `Date input forms ready ${formatDay(this.propertyValue())} ` +
      `${formatDay(this.twoWayValue())} ${formatDay(this.deliveryForm.date().value())} ` +
      `${formatDay(this.reactiveControl.value)} ${formatDay(this.ngModelValue())}`,
  );
}
