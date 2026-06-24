import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  HellInput,
  type HellInputUi,
  HellNativeSelect,
  type HellNativeSelectUi,
  HellTextarea,
  type HellTextareaUi,
} from '@hell-ui/angular/input';

const inputUi = {
  root: 'rounded-hell-pill border-hell-info bg-hell-info-soft px-hell-5',
} satisfies HellInputUi;

const selectUi = {
  root: 'rounded-hell-pill border-hell-primary bg-hell-primary-soft',
} satisfies HellNativeSelectUi;

const textareaUi = {
  root: 'min-h-28 rounded-hell-lg border-hell-success bg-hell-success-soft resize-none',
} satisfies HellTextareaUi;

@Component({
  selector: 'app-input-customization-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput, HellNativeSelect, HellTextarea],
  template: `
    <input hellInput [ui]="inputUi" placeholder="Search tickets" aria-label="Search tickets" />

    <select hellNativeSelect [ui]="selectUi" aria-label="Priority">
      <option>Priority</option>
      <option>Urgent</option>
      <option>Routine</option>
    </select>

    <textarea
      hellTextarea
      [ui]="textareaUi"
      rows="3"
      placeholder="Internal note"
      aria-label="Internal note"
    ></textarea>
  `,
})
export class InputCustomizationExample {
  protected readonly inputUi = inputUi;
  protected readonly selectUi = selectUi;
  protected readonly textareaUi = textareaUi;
}
