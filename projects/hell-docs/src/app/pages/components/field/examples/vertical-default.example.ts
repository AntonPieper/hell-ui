import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellCheckbox } from '@hell-ui/angular/checkbox';
import { HellInput, HellNativeSelect } from '@hell-ui/angular/input';
import { HellSwitch } from '@hell-ui/angular/switch';
import { HellDateInput } from '@hell-ui/angular/date-input';

@Component({
  selector: 'app-field-vertical-default-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellInput, HellNativeSelect, HellDateInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="field-email">Email</label>
      <input id="field-email" hellInput type="email" placeholder="you@company.com" />
      <div hellFieldDescription>We never share this.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="field-password">Password</label>
      <input id="field-password" hellInput type="password" invalid placeholder="••••••••" />
      <div hellFieldError>Password must be at least 8 characters.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="field-role">Role</label>
      <select id="field-role" hellNativeSelect>
        <option>Admin</option>
        <option>Editor</option>
        <option>Viewer</option>
      </select>
      <div hellFieldDescription>Native selects use the same field wiring.</div>
    </div>

    <div hellField>
      <label hellFieldLabel for="field-birthday">Birthday</label>
      <hell-date-input id="field-birthday" aria-label="Birthday" [date]="birthday()" (dateChange)="birthday.set($event)" />
      <div hellFieldDescription>Type or pick from the calendar.</div>
    </div>
  `,
})
export class FieldVerticalDefaultExample {
  protected readonly birthday = signal<Date | null>(null);
  protected readonly agree = signal(false);
  protected readonly notify = signal(true);
}
