import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellCheckbox } from '@hell-ui/angular/checkbox';

@Component({
  selector: 'app-checkbox-examples-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCheckbox],
  template: `
    <div class="inline-flex items-center gap-2">
      <button
        hellCheckbox
        required
        aria-label="I agree to the terms"
        [checked]="agree()"
        (checkedChange)="agree.set($event)"
      ></button>
      <span>I agree to the terms</span>
    </div>
    <div class="inline-flex items-center gap-2">
      <button hellCheckbox indeterminate aria-label="Indeterminate"></button>
      <span>Indeterminate (parent of mixed children)</span>
    </div>
    <div class="inline-flex items-center gap-2">
      <button hellCheckbox disabled aria-label="Disabled"></button>
      <span>Disabled</span>
    </div>
    <div class="inline-flex items-center gap-2">
      <button hellCheckbox checked disabled aria-label="Disabled, checked"></button>
      <span>Disabled, checked</span>
    </div>
    <p>
      Current value: <code>{{ agree() }}</code>
    </p>
  `,
})
export class CheckboxExamplesExample {
  protected readonly agree = signal(false);
}
