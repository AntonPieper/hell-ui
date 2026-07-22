import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { HellNumberInput } from '@hell-ui/angular/number-input';

function formatNumber(value: number | null): string {
  return value === null ? 'null' : String(value);
}

/**
 * Number Input Control Value Authority boundary coverage (#285): the packed
 * `input[hellNumberInput]` binds one `value` model across direct property
 * binding, two-way binding, Signal Forms `[formField]`, Reactive Forms
 * `[formControl]`, and Template-driven Forms `[(ngModel)]`, and every path
 * reports the same committed nullable number at runtime.
 */
@Component({
  selector: 'app-number-input-forms',
  imports: [FormsModule, ReactiveFormsModule, FormField, HellNumberInput],
  template: `
    <input
      hellNumberInput
      aria-label="Property number"
      [value]="propertyValue()"
      (valueChange)="propertyValue.set($event)"
    />
    <input hellNumberInput aria-label="Two-way number" [(value)]="twoWayValue" />
    <input hellNumberInput aria-label="Signal Forms number" [formField]="portForm.port" />
    <input hellNumberInput aria-label="Reactive number" [formControl]="reactiveControl" />
    <input hellNumberInput aria-label="Template-driven number" [(ngModel)]="ngModelValue" />
    <p data-test-id="number-input-forms-status">{{ status() }}</p>
  `,
})
export class NumberInputForms {
  protected readonly propertyValue = signal<number | null>(11);
  protected readonly twoWayValue = signal<number | null>(22);
  protected readonly formModel = signal<{ port: number | null }>({ port: 33 });
  protected readonly portForm = form(this.formModel);
  protected readonly reactiveControl = new FormControl<number | null>(44);
  protected readonly ngModelValue = signal<number | null>(55);

  protected readonly status = computed(
    () =>
      `Number input forms ready ${formatNumber(this.propertyValue())} ` +
      `${formatNumber(this.twoWayValue())} ${formatNumber(this.portForm.port().value())} ` +
      `${formatNumber(this.reactiveControl.value)} ${formatNumber(this.ngModelValue())}`,
  );
}
