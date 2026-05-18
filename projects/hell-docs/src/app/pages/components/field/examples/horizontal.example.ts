import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellCheckbox } from '@hell-ui/angular/checkbox';
import { HellInput, HellNativeSelect } from '@hell-ui/angular/input';
import { HellSwitch } from '@hell-ui/angular/switch';
import { HellDateInput } from '@hell-ui/angular/date-input';

@Component({
  selector: 'app-field-horizontal-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellCheckbox, HellSwitch],
  template: `
    <div hellField orientation="horizontal">
      <button id="terms-checkbox" hellCheckbox [checked]="agree()" (checkedChange)="agree.set($event)"></button>
      <label hellFieldLabel for="terms-checkbox">I agree to the terms</label>
      <div hellFieldDescription>You can revoke at any time.</div>
    </div>

    <div hellField orientation="horizontal">
      <button id="email-switch" hellSwitch [checked]="notify()" (checkedChange)="notify.set($event)"></button>
      <label hellFieldLabel for="email-switch">Email notifications</label>
    </div>
  `,
})
export class FieldHorizontalExample {
  protected readonly birthday = signal<Date | null>(null);
  protected readonly agree = signal(false);
  protected readonly notify = signal(true);
}
