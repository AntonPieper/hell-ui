import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellCheckbox } from 'hell';

@Component({
  selector: 'app-checkbox-examples-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCheckbox],
  template: `
    <label class="inline-flex items-center gap-2">
      <button hellCheckbox [checked]="agree()" (checkedChange)="agree.set($event)"></button>
      I agree to the terms
    </label>
    <label class="inline-flex items-center gap-2">
      <button hellCheckbox indeterminate></button>
      Indeterminate (parent of mixed children)
    </label>
    <label class="inline-flex items-center gap-2">
      <button hellCheckbox disabled></button>
      Disabled
    </label>
    <label class="inline-flex items-center gap-2">
      <button hellCheckbox checked disabled></button>
      Disabled, checked
    </label>
    <p>
      Current value: <code>{{ agree() }}</code>
    </p>
  `,
})
export class CheckboxExamplesExample {
  protected readonly agree = signal(false);
}
