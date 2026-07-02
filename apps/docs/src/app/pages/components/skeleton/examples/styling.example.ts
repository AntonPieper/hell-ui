import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellSkeleton } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-skeleton-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton],
  template: `
    <!-- class stays the layout hook; ui overrides recipe visuals. -->
    <div hellSkeleton class="h-3 w-40"></div>
    <div hellSkeleton class="h-3 w-40" ui="rounded-hell-pill bg-hell-primary-soft"></div>
    <div hellSkeleton shape="circle" class="size-10" [ui]="{ root: 'bg-hell-primary-soft' }"></div>
  `,
})
export class SkeletonStylingExample {}
