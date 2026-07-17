import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellCheckbox } from '@hell-ui/angular/checkbox';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-field-orientation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, HellCheckbox, HellInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="orientation-name">Full name</label>
      <input id="orientation-name" hellInput placeholder="Ada Lovelace" />
      <div hellFieldDescription>Vertical (default) stacks label, control, and helper text.</div>
    </div>

    <div hellField orientation="horizontal" [ui]="compactFieldUi">
      <button
        id="orientation-terms"
        hellCheckbox
        [checked]="agree()"
        (checkedChange)="agree.set($event)"
      ></button>
      <label hellFieldLabel for="orientation-terms">I agree to the terms</label>
      <div hellFieldDescription>Horizontal suits a single inline label, like a checkbox row.</div>
    </div>
  `,
})
export class FieldOrientationExample {
  protected readonly agree = signal(false);
  protected readonly compactFieldUi = {
    root: 'gap-hell-3',
  };
}
