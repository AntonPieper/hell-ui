import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellSkeleton, HellSpinner } from 'hell';

@Component({
  selector: 'hd-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton, HellSpinner],
  template: `
    <article class="hd-prose">
      <h1>Skeleton &amp; Spinner</h1>
      <p>Loading placeholders. Skeletons preserve layout and reduce perceived
        wait time; spinners suit short, indeterminate operations.</p>

      <h2>Skeleton</h2>
      <div class="hd-example grid max-w-95 gap-2">
        <div hellSkeleton class="h-5 w-3/5"></div>
        <div hellSkeleton class="h-[14px] w-full"></div>
        <div hellSkeleton class="h-[14px] w-full"></div>
        <div hellSkeleton class="h-[14px] w-4/5"></div>
      </div>

      <h2>Avatar + lines</h2>
      <div class="hd-example flex max-w-95 items-center gap-3">
        <div hellSkeleton class="size-10 rounded-full"></div>
        <div class="hd-fill grid gap-[0.4rem]">
          <div hellSkeleton class="h-[14px] w-1/2"></div>
          <div hellSkeleton class="h-3 w-4/5"></div>
        </div>
      </div>

      <h2>Spinner</h2>
      <div class="hd-example flex items-center gap-4">
        <span hellSpinner></span>
        <span hellSpinner class="text-[24px]"></span>
        <span hellSpinner class="text-[32px]"></span>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellSkeleton</code>: <code>width</code>, <code>height</code> (any CSS length)</li>
        <li><code>hellSpinner</code>: scales with current font-size</li>
      </ul>
    </article>
  `,
})
export class SkeletonPage {}
