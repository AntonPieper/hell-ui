import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-field-validation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, HellInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="validation-password">Password</label>
      <input
        id="validation-password"
        hellInput
        type="password"
        [invalid]="tooShort()"
        [value]="password()"
        (input)="password.set($any($event.target).value)"
      />
      @if (tooShort()) {
        <div hellFieldError>Password must be at least 8 characters.</div>
      } @else {
        <div hellFieldDescription>Use at least 8 characters.</div>
      }
    </div>
  `,
})
export class FieldValidationExample {
  protected readonly password = signal('');
  protected readonly tooShort = computed(
    () => this.password().length > 0 && this.password().length < 8,
  );
}
