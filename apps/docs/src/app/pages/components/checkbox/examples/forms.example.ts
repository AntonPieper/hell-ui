import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellCheckbox } from '@hell-ui/angular/checkbox';

@Component({
  selector: 'app-checkbox-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, FormField, HellCheckbox],
  template: `
    <div class="grid max-w-sm gap-hell-2">
      <div hellField orientation="horizontal">
        <button
          id="forms-terms-checkbox"
          hellCheckbox
          [formField]="signupForm.acceptTerms"
        ></button>
        <label hellFieldLabel for="forms-terms-checkbox">Accept the terms of service</label>
      </div>
      <p class="m-0 text-hell-sm text-hell-foreground-muted">
        A <code>required()</code> rule marks the field; the checkbox mirrors it as
        <code>aria-required</code>. Checked:
        <code>{{ signupForm.acceptTerms().value() }}</code> · Invalid:
        <code>{{ signupForm.acceptTerms().invalid() }}</code> · Touched:
        <code>{{ signupForm.acceptTerms().touched() }}</code>
      </p>
    </div>
  `,
})
export class CheckboxFormsExample {
  protected readonly signup = signal({ acceptTerms: false });
  protected readonly signupForm = form(this.signup, (path) => {
    required(path.acceptTerms);
  });
}
