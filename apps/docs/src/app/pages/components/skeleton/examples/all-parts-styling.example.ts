import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSkeleton, HellSpinner, type HellSkeletonUi, type HellSpinnerUi } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-skeleton-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton, HellSpinner],
  template: `
    <!-- Both directives own a single 'root' part: string shorthand refines it -->
    <!-- directly, an explicit { root: '...' } map is equivalent. -->
    <div hellSkeleton shape="rect" class="h-10 w-40" ui="rounded-hell-lg bg-hell-primary-soft"></div>
    <div hellSkeleton shape="circle" class="mt-3 size-10" [ui]="skeletonUi"></div>

    <div class="mt-4 flex items-center gap-4">
      <span hellSpinner variant="ring" size="lg" ui="text-hell-primary"></span>
      <span hellSpinner variant="dots" size="lg" [ui]="spinnerUi"></span>
    </div>
  `,
})
export class SkeletonAllPartsStylingExample {
  protected readonly skeletonUi: HellSkeletonUi = {
    root: 'bg-hell-info-soft',
  };

  protected readonly spinnerUi: HellSpinnerUi = {
    root: 'text-hell-success',
  };
}
