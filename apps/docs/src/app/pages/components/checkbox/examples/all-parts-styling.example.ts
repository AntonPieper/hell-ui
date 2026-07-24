import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellCheckbox, HellNativeCheckbox, type HellCheckboxUi } from 'hell-ui/checkbox';

@Component({
  selector: 'app-checkbox-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCheckbox, HellNativeCheckbox],
  template: `
    <div class="flex flex-wrap items-center gap-hell-6">
      <div class="inline-flex items-center gap-hell-3">
        <!-- HellCheckbox: root + indicator, both refined through one ui map. -->
        <button hellCheckbox [checked]="true" aria-label="Custom checkbox" [ui]="checkboxUi"></button>
        <span>Styled checkbox (root + indicator)</span>
      </div>
      <div class="inline-flex items-center gap-hell-3">
        <!-- HellNativeCheckbox: single 'root' part, string shorthand refines it. -->
        <input
          type="checkbox"
          hellNativeCheckbox
          checked
          aria-label="Custom native checkbox"
          ui="rounded-hell-pill border-hell-success bg-hell-success-soft text-hell-success"
        />
        <span>Styled native checkbox (root)</span>
      </div>
    </div>
  `,
})
export class CheckboxAllPartsStylingExample {
  protected readonly checkboxUi: HellCheckboxUi = {
    root: 'rounded-hell-pill border-hell-primary bg-hell-primary-soft data-checked:border-hell-primary data-checked:bg-hell-primary',
    indicator: 'size-hell-3 text-hell-primary-foreground',
  };
}
