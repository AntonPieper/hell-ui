import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSkeleton } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-skeleton-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton],
  template: ` <div hellSkeleton class="h-4 w-48"></div> `,
})
export class SkeletonBasicExample {}
