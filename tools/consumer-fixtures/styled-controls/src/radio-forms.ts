import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { HellRadio, HellRadioGroup } from '@hell-ui/angular/radio';

/**
 * Radio Group Control Value Authority boundary coverage (#288): the packed
 * `[hellRadioGroup]` binds one `value` model across direct property binding,
 * two-way binding, Signal Forms `[formField]`, Reactive Forms
 * `[formControl]`, and Template-driven Forms `[(ngModel)]`, and every path
 * reports the same committed selection at runtime.
 */
@Component({
  selector: 'app-radio-forms',
  imports: [FormsModule, ReactiveFormsModule, FormField, HellRadioGroup, HellRadio],
  template: `
    <div
      hellRadioGroup
      aria-label="Property channel"
      [value]="propertyValue()"
      (valueChange)="propertyValue.set($any($event))"
    >
      <button hellRadio type="button" value="email">Email</button>
      <button hellRadio type="button" value="sms">SMS</button>
    </div>
    <div hellRadioGroup aria-label="Two-way channel" [(value)]="twoWayValue">
      <button hellRadio type="button" value="email">Email</button>
      <button hellRadio type="button" value="sms">SMS</button>
    </div>
    <div hellRadioGroup aria-label="Signal Forms channel" [formField]="channelForm.channel">
      <button hellRadio type="button" value="email">Email</button>
      <button hellRadio type="button" value="push">Push</button>
    </div>
    <div hellRadioGroup aria-label="Reactive channel" [formControl]="reactiveControl">
      <button hellRadio type="button" value="sms">SMS</button>
      <button hellRadio type="button" value="push">Push</button>
    </div>
    <div hellRadioGroup aria-label="Template-driven channel" [(ngModel)]="ngModelValue">
      <button hellRadio type="button" value="email">Email</button>
      <button hellRadio type="button" value="none">None</button>
    </div>
    <p data-test-id="radio-forms-status">{{ status() }}</p>
  `,
})
export class RadioForms {
  protected readonly propertyValue = signal<string | null>('email');
  protected readonly twoWayValue = signal<string | null>('sms');
  protected readonly formModel = signal<{ channel: string | null }>({ channel: 'push' });
  protected readonly channelForm = form(this.formModel);
  protected readonly reactiveControl = new FormControl<string | null>('sms');
  protected readonly ngModelValue = signal<string | null>('none');

  protected readonly status = computed(
    () =>
      `Radio forms ready ${this.propertyValue()}-${this.twoWayValue()}-` +
      `${this.channelForm.channel().value()}-${this.reactiveControl.value}-${this.ngModelValue()}`,
  );
}
