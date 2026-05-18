import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellSkeleton } from '@hell-ui/angular/skeleton';

@Component({
  selector: 'app-skeleton-avatar-lines-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton],
  template: `
    <div hellSkeleton shape="circle" class="size-10"></div>
    <div class="hd-fill grid gap-[0.4rem]">
      <div hellSkeleton class="h-[14px] w-1/2"></div>
      <div hellSkeleton class="h-3 w-4/5"></div>
    </div>
  `,
})
export class SkeletonAvatarLinesExample {}
