import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSpinner, type HellSpinnerUi } from '@hell-ui/angular/spinner';

@Component({
  selector: 'app-spinner-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSpinner],
  template: `
    <!-- HellSpinner owns a single 'root' part: string shorthand refines it -->
    <!-- directly, an explicit { root: '...' } map is equivalent. -->
    <div class="flex items-center gap-4">
      <span hellSpinner variant="ring" size="lg" ui="text-hell-primary"></span>
      <span hellSpinner variant="dots" size="lg" [ui]="spinnerUi"></span>
      <span hellSpinner variant="bars" size="lg" ui="text-hell-danger"></span>
    </div>
  `,
})
export class SpinnerAllPartsStylingExample {
  protected readonly spinnerUi: HellSpinnerUi = {
    root: 'text-hell-success',
  };
}
