import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellSkeleton } from 'hell';

@Component({
  selector: 'app-skeleton-text-lines-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton],
  template: `
    <div hellSkeleton class="h-5 w-3/5"></div>
    <div hellSkeleton class="h-[14px] w-full"></div>
    <div hellSkeleton class="h-[14px] w-full"></div>
    <div hellSkeleton class="h-[14px] w-4/5"></div>
  `,
})
export class SkeletonTextLinesExample {}
