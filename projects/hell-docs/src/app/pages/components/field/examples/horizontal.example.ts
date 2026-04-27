import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  HELL_FIELD_DIRECTIVES,
  HellCheckbox,
  HellDateInput,
  HellInput,
  HellSelect,
  HellSwitch,
} from 'hell';

@Component({
  selector: 'app-field-horizontal-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellCheckbox, HellSwitch],
  template: `
    <div hellField orientation="horizontal">
      <button hellCheckbox [checked]="agree()" (checkedChange)="agree.set($event)"></button>
      <label hellFieldLabel>I agree to the terms</label>
      <div hellFieldDescription>You can revoke at any time.</div>
    </div>

    <div hellField orientation="horizontal">
      <button hellSwitch [checked]="notify()" (checkedChange)="notify.set($event)"></button>
      <label hellFieldLabel>Email notifications</label>
    </div>
  `,
})
export class FieldHorizontalExample {
  protected readonly birthday = signal<Date | null>(null);
  protected readonly agree = signal(false);
  protected readonly notify = signal(true);
}
