import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSkeleton } from 'hell-ui/skeleton';

@Component({
  selector: 'app-skeleton-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton],
  template: `
    <!-- HellSkeleton owns a single 'root' part: string shorthand refines it -->
    <!-- directly, an explicit { root: '...' } map is equivalent. -->
    <div hellSkeleton shape="rect" class="h-10 w-40" ui="rounded-hell-lg bg-hell-primary-soft"></div>
    <div hellSkeleton shape="circle" class="mt-3 size-10" [ui]="skeletonUi"></div>
  `,
})
export class SkeletonAllPartsStylingExample {
  protected readonly skeletonUi = {
    root: 'bg-hell-info-soft',
  };
}
