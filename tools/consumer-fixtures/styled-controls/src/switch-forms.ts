import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { HellSwitch } from '@hell-ui/angular/switch';

/**
 * Switch Control Value Authority boundary coverage (#283): the packed
 * `button[hellSwitch]` binds one `checked` model across direct property
 * binding, two-way binding, Signal Forms `[formField]`, Reactive Forms
 * `[formControl]`, and Template-driven Forms `[(ngModel)]`, and every path
 * reports the same committed boolean at runtime.
 */
@Component({
  selector: 'app-switch-forms',
  imports: [FormsModule, ReactiveFormsModule, FormField, HellSwitch],
  template: `
    <button
      hellSwitch
      aria-label="Property alerts"
      [checked]="propertyChecked()"
      (checkedChange)="propertyChecked.set($event)"
    ></button>
    <button hellSwitch aria-label="Two-way alerts" [(checked)]="twoWayChecked"></button>
    <button hellSwitch aria-label="Signal Forms alerts" [formField]="settingsForm.alerts"></button>
    <button hellSwitch aria-label="Reactive alerts" [formControl]="reactiveControl"></button>
    <button hellSwitch aria-label="Template-driven alerts" [(ngModel)]="ngModelChecked"></button>
    <p data-test-id="switch-forms-status">{{ status() }}</p>
  `,
})
export class SwitchForms {
  protected readonly propertyChecked = signal(false);
  protected readonly twoWayChecked = signal(true);
  protected readonly formModel = signal({ alerts: false });
  protected readonly settingsForm = form(this.formModel);
  protected readonly reactiveControl = new FormControl(true, { nonNullable: true });
  protected readonly ngModelChecked = signal(false);

  protected readonly status = computed(
    () =>
      `Switch forms ready ${this.propertyChecked()}-${this.twoWayChecked()}-` +
      `${this.settingsForm.alerts().value()}-${this.reactiveControl.value}-${this.ngModelChecked()}`,
  );
}
