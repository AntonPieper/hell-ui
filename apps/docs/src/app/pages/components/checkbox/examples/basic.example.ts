import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellCheckbox } from '@hell-ui/angular/checkbox';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

@Component({
  selector: 'app-checkbox-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCheckbox, ...HELL_FIELD_IMPORTS],
  template: `
    <div hellField orientation="horizontal">
      <button id="basic-checkbox" hellCheckbox required [checked]="agree()" (checkedChange)="agree.set($event)"></button>
      <label hellFieldLabel for="basic-checkbox">I agree to the terms of service</label>
    </div>
    <p>Current value: <code>{{ agree() }}</code></p>
  `,
})
export class CheckboxBasicExample {
  protected readonly agree = signal(false);
}
