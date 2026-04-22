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
      <div class="hd-example" style="display:grid; gap:0.5rem; max-width:380px">
        <div hellSkeleton width="60%" height="20px"></div>
        <div hellSkeleton width="100%" height="14px"></div>
        <div hellSkeleton width="100%" height="14px"></div>
        <div hellSkeleton width="80%" height="14px"></div>
      </div>

      <h2>Avatar + lines</h2>
      <div class="hd-example" style="display:flex; gap:0.75rem; align-items:center; max-width:380px">
        <div hellSkeleton width="40px" height="40px" style="border-radius:50%"></div>
        <div style="flex:1; display:grid; gap:0.4rem">
          <div hellSkeleton width="50%" height="14px"></div>
          <div hellSkeleton width="80%" height="12px"></div>
        </div>
      </div>

      <h2>Spinner</h2>
      <div class="hd-example" style="display:flex; gap:1rem; align-items:center">
        <span hellSpinner></span>
        <span hellSpinner style="font-size:24px"></span>
        <span hellSpinner style="font-size:32px"></span>
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
