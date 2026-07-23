import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HellInput } from 'hell-ui/input';

@Component({
  selector: 'app-field-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, HellInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="basic-email">Email</label>
      <input id="basic-email" hellInput type="email" placeholder="you@company.com" />
      <div hellFieldDescription>We never share this.</div>
    </div>
  `,
})
export class FieldBasicExample {}
