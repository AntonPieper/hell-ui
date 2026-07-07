import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSkeleton, HellSpinner, type HellSkeletonUi, type HellSpinnerUi } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-spinner-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton, HellSpinner],
  template: `
    <!-- HellSpinner owns a single 'root' part: string shorthand refines it -->
    <!-- directly, an explicit { root: '...' } map is equivalent. -->
    <div class="flex items-center gap-4">
      <span hellSpinner variant="ring" size="lg" ui="text-hell-primary"></span>
      <span hellSpinner variant="dots" size="lg" [ui]="spinnerUi"></span>
      <span hellSpinner variant="bars" size="lg" ui="text-hell-danger"></span>
    </div>

    <!-- HellSkeleton shares this entry point and the same single-part shape. -->
    <div hellSkeleton shape="rect" class="mt-4 h-10 w-40" [ui]="skeletonUi"></div>
  `,
})
export class SpinnerAllPartsStylingExample {
  protected readonly spinnerUi: HellSpinnerUi = {
    root: 'text-hell-success',
  };

  protected readonly skeletonUi: HellSkeletonUi = {
    root: 'rounded-hell-lg bg-hell-info-soft',
  };
}
