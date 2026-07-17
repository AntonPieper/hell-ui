import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-input-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput, ...HELL_FIELD_IMPORTS],
  template: `
    <div hellField>
      <label hellFieldLabel for="basic-name">Company name</label>
      <input id="basic-name" hellInput placeholder="Acme Inc." />
    </div>
  `,
})
export class InputBasicExample {}
