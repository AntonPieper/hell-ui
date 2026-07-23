import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellCheckbox } from 'hell-ui/checkbox';

@Component({
  selector: 'app-checkbox-states-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCheckbox],
  template: `
    <div class="inline-flex items-center gap-2">
      <button hellCheckbox aria-label="Unchecked"></button>
      <span>Unchecked</span>
    </div>
    <div class="inline-flex items-center gap-2">
      <button hellCheckbox [checked]="true" aria-label="Checked"></button>
      <span>Checked</span>
    </div>
    <div class="inline-flex items-center gap-2">
      <button hellCheckbox indeterminate aria-label="Indeterminate"></button>
      <span>Indeterminate</span>
    </div>
    <div class="inline-flex items-center gap-2">
      <button hellCheckbox disabled aria-label="Disabled, unchecked"></button>
      <span>Disabled</span>
    </div>
    <div class="inline-flex items-center gap-2">
      <button hellCheckbox [checked]="true" disabled aria-label="Disabled, checked"></button>
      <span>Disabled, checked</span>
    </div>
  `,
})
export class CheckboxStatesExample {}
