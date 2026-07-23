import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSkeleton } from 'hell-ui/skeleton';

@Component({
  selector: 'app-skeleton-text-block-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton],
  template: `
    <!-- Stagger widths so the placeholder reads as prose, not a grid. -->
    <div hellSkeleton class="h-4 w-3/5"></div>
    <div hellSkeleton class="mt-3 h-3 w-full"></div>
    <div hellSkeleton class="mt-2 h-3 w-full"></div>
    <div hellSkeleton class="mt-2 h-3 w-4/5"></div>
  `,
})
export class SkeletonTextBlockExample {}
