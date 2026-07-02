import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellCheckbox } from '@hell-ui/angular/checkbox';

@Component({
  selector: 'app-checkbox-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCheckbox],
  template: `
    <div class="inline-flex items-center gap-2">
      <!-- ui shorthand: conflicting radius utility beats the recipe. -->
      <button hellCheckbox checked aria-label="Round checkbox" ui="rounded-full"></button>
      <span>Round</span>
    </div>
    <div class="inline-flex items-center gap-2">
      <!-- Part Style Map with state-aware utilities on data-checked. -->
      <button
        hellCheckbox
        checked
        aria-label="Success checkbox"
        [ui]="{ root: 'data-checked:border-hell-success data-checked:bg-hell-success' }"
      ></button>
      <span>Success tint</span>
    </div>
  `,
})
export class CheckboxStylingExample {}
