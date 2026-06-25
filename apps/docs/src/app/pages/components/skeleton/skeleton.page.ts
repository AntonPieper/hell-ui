import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { SkeletonAvatarLinesExample } from './examples/avatar-lines.example';
import skeletonAvatarLinesExampleCodeRaw from './examples/avatar-lines.example.ts?raw' with {
  loader: 'text',
};
import { SkeletonCardPlaceholderExample } from './examples/card-placeholder.example';
import skeletonCardPlaceholderExampleCodeRaw from './examples/card-placeholder.example.ts?raw' with {
  loader: 'text',
};
import { SkeletonShapesExample } from './examples/shapes.example';
import skeletonShapesExampleCodeRaw from './examples/shapes.example.ts?raw' with {
  loader: 'text',
};
import { SkeletonTextLinesExample } from './examples/text-lines.example';
import skeletonTextLinesExampleCodeRaw from './examples/text-lines.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    SkeletonTextLinesExample,
    SkeletonAvatarLinesExample,
    SkeletonCardPlaceholderExample,
    SkeletonShapesExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Skeleton</h1>
      <p>
        Layout-preserving loading placeholder. Reserves the space the real content will occupy so
        the page does not jump when it arrives. For short, indeterminate work prefer
        <a routerLink="/components/spinner">Spinner</a> instead.
      </p>

      <h2>Text lines</h2>
      <hd-example-tabs [code]="skeletonTextLinesExampleCode" previewClass="grid max-w-95 gap-2">
        <app-skeleton-text-lines-example />
      </hd-example-tabs>

      <h2>Avatar + lines</h2>
      <hd-example-tabs
        [code]="skeletonAvatarLinesExampleCode"
        previewClass="flex max-w-95 items-center gap-3"
      >
        <app-skeleton-avatar-lines-example />
      </hd-example-tabs>

      <h2>Card placeholder</h2>
      <hd-example-tabs
        [code]="skeletonCardPlaceholderExampleCode"
        previewClass="grid max-w-95 gap-3"
      >
        <app-skeleton-card-placeholder-example />
      </hd-example-tabs>

      <h2>Shapes</h2>
      <hd-example-tabs [code]="skeletonShapesExampleCode" previewClass="flex items-center gap-4">
        <app-skeleton-shapes-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>width</code>, <code>height</code>: any CSS length (defaults to
          <code>100% / 14px</code>). Tailwind utilities work too.
        </li>
        <li><code>shape</code>: <code>text | circle | rect</code></li>
        <li><code>unstyled</code>: opt out of all styling</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>
          Match the skeleton's footprint to the real content — same height, same border radius, same
          column widths.
        </li>
        <li>Stagger widths slightly to suggest natural prose.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>
          Don't show a skeleton for content that loads in under ~300 ms — the flash is more
          distracting than a brief blank.
        </li>
        <li>Don't combine a skeleton with a spinner in the same region.</li>
      </ul>
    </article>
  `,
})
export class SkeletonPage {
  protected readonly skeletonTextLinesExampleCode = skeletonTextLinesExampleCodeRaw;
  protected readonly skeletonAvatarLinesExampleCode = skeletonAvatarLinesExampleCodeRaw;
  protected readonly skeletonCardPlaceholderExampleCode = skeletonCardPlaceholderExampleCodeRaw;
  protected readonly skeletonShapesExampleCode = skeletonShapesExampleCodeRaw;
}
