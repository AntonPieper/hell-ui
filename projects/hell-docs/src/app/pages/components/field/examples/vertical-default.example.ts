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
  selector: 'app-field-vertical-default-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellInput, HellSelect, HellDateInput],
  template: `
    <div hellField>
      <label hellFieldLabel>Email</label>
      <input hellInput type="email" placeholder="you@company.com" />
      <div hellFieldDescription>We never share this.</div>
    </div>

    <div hellField>
      <label hellFieldLabel>Password</label>
      <input hellInput type="password" invalid placeholder="••••••••" />
      <div hellFieldError>Password must be at least 8 characters.</div>
    </div>

    <div hellField>
      <label hellFieldLabel>Role</label>
      <select hellSelect>
        <option>Admin</option>
        <option>Editor</option>
        <option>Viewer</option>
      </select>
      <div hellFieldDescription>Native selects use the same field wiring.</div>
    </div>

    <div hellField>
      <label hellFieldLabel>Birthday</label>
      <hell-date-input [date]="birthday()" (dateChange)="birthday.set($event)" />
      <div hellFieldDescription>Type or pick from the calendar.</div>
    </div>
  `,
})
export class FieldVerticalDefaultExample {
  protected readonly birthday = signal<Date | null>(null);
  protected readonly agree = signal(false);
  protected readonly notify = signal(true);
}
