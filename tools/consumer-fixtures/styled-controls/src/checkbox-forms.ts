import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { HellCheckbox } from 'hell-ui/checkbox';

/**
 * Checkbox Control Value Authority boundary coverage (#283): the packed
 * `button[hellCheckbox]` binds one `checked` model across direct property
 * binding, two-way binding, Signal Forms `[formField]`, Reactive Forms
 * `[formControl]`, and Template-driven Forms `[(ngModel)]`, and every path
 * reports the same committed boolean at runtime.
 */
@Component({
  selector: 'app-checkbox-forms',
  imports: [FormsModule, ReactiveFormsModule, FormField, HellCheckbox],
  template: `
    <button
      hellCheckbox
      aria-label="Property consent"
      [checked]="propertyChecked()"
      (checkedChange)="propertyChecked.set($event)"
    ></button>
    <button hellCheckbox aria-label="Two-way consent" [(checked)]="twoWayChecked"></button>
    <button
      hellCheckbox
      aria-label="Signal Forms consent"
      [formField]="consentForm.agree"
    ></button>
    <button hellCheckbox aria-label="Reactive consent" [formControl]="reactiveControl"></button>
    <button hellCheckbox aria-label="Template-driven consent" [(ngModel)]="ngModelChecked"></button>
    <p data-test-id="checkbox-forms-status">{{ status() }}</p>
  `,
})
export class CheckboxForms {
  protected readonly propertyChecked = signal(true);
  protected readonly twoWayChecked = signal(false);
  protected readonly formModel = signal({ agree: true });
  protected readonly consentForm = form(this.formModel);
  protected readonly reactiveControl = new FormControl(false, { nonNullable: true });
  protected readonly ngModelChecked = signal(true);

  protected readonly status = computed(
    () =>
      `Checkbox forms ready ${this.propertyChecked()}-${this.twoWayChecked()}-` +
      `${this.consentForm.agree().value()}-${this.reactiveControl.value}-${this.ngModelChecked()}`,
  );
}
