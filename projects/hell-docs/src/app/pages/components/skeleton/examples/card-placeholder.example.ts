import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellSkeleton } from 'hell/primitives';

@Component({
  selector: 'app-skeleton-card-placeholder-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton],
  template: `
    <div hellSkeleton shape="rect" class="h-32 w-full"></div>
    <div hellSkeleton class="h-4 w-2/3"></div>
    <div hellSkeleton class="h-3 w-full"></div>
    <div hellSkeleton class="h-3 w-5/6"></div>
  `,
})
export class SkeletonCardPlaceholderExample {}
