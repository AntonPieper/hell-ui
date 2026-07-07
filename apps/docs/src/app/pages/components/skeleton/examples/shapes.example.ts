import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSkeleton } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-skeleton-shapes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton],
  template: `
    <div hellSkeleton shape="circle" class="size-12"></div>
    <div hellSkeleton shape="rect" class="h-12 w-24"></div>
    <div hellSkeleton shape="text" class="h-3 w-32"></div>
  `,
})
export class SkeletonShapesExample {}
