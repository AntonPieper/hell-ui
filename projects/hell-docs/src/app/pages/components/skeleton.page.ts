import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellSkeleton } from 'hell';

@Component({
  selector: 'hd-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSkeleton, RouterLink],
  template: `
    <article class="hd-prose">
      <h1>Skeleton</h1>
      <p>Layout-preserving loading placeholder. Reserves the space the real
        content will occupy so the page does not jump when it arrives. For
        short, indeterminate work prefer
        <a routerLink="/components/spinner">Spinner</a> instead.</p>

      <h2>Text lines</h2>
      <div class="hd-example grid max-w-95 gap-2">
        <div hellSkeleton class="h-5 w-3/5"></div>
        <div hellSkeleton class="h-[14px] w-full"></div>
        <div hellSkeleton class="h-[14px] w-full"></div>
        <div hellSkeleton class="h-[14px] w-4/5"></div>
      </div>

      <h2>Avatar + lines</h2>
      <div class="hd-example flex max-w-95 items-center gap-3">
        <div hellSkeleton shape="circle" class="size-10"></div>
        <div class="hd-fill grid gap-[0.4rem]">
          <div hellSkeleton class="h-[14px] w-1/2"></div>
          <div hellSkeleton class="h-3 w-4/5"></div>
        </div>
      </div>

      <h2>Card placeholder</h2>
      <div class="hd-example grid max-w-95 gap-3">
        <div hellSkeleton shape="rect" class="h-32 w-full"></div>
        <div hellSkeleton class="h-4 w-2/3"></div>
        <div hellSkeleton class="h-3 w-full"></div>
        <div hellSkeleton class="h-3 w-5/6"></div>
      </div>

      <h2>Shapes</h2>
      <div class="hd-example flex items-center gap-4">
        <div hellSkeleton shape="circle" class="size-12"></div>
        <div hellSkeleton shape="rect" class="h-12 w-24"></div>
        <div hellSkeleton class="h-3 w-32"></div>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>width</code>, <code>height</code>: any CSS length (defaults
          to <code>100% / 14px</code>). Tailwind utilities work too.</li>
        <li><code>shape</code>: <code>text | circle | rect</code></li>
        <li><code>unstyled</code>: opt out of all styling</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Match the skeleton's footprint to the real content — same height,
          same border radius, same column widths.</li>
        <li>Stagger widths slightly to suggest natural prose.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't show a skeleton for content that loads in under ~300 ms —
          the flash is more distracting than a brief blank.</li>
        <li>Don't combine a skeleton with a spinner in the same region.</li>
      </ul>
    </article>
  `,
})
export class SkeletonPage {}
