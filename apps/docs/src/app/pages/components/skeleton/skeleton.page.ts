import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
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
import { SkeletonStylingExample } from './examples/styling.example';
import skeletonStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
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
    SkeletonShapesExample, SkeletonStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Skeleton"
        icon="faSolidBarsStaggered"
        category="Styled primitive"
        importPath="@hell-ui/angular/skeleton"
        stylesPath="@hell-ui/angular/skeleton/styles.css"
      >
        Loading placeholders that mirror your layout while content arrives — lines, shapes, and composed previews.
      </hd-page-header>
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

      <h2>Styling</h2>
      <p>
        Keep <code>class</code> for sizing placement (the Additive Class Hook) and use <code>ui</code> — <code>HellSkeletonUi</code> — for visual overrides such as radius and shimmer surface.
      </p>
      <hd-example-tabs [code]="skeletonStylingExampleCode" previewClass="grid max-w-md gap-3">
        <app-skeleton-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>width</code>, <code>height</code>: any CSS length (defaults to
          <code>100% / 14px</code>). Tailwind utilities work too.
        </li>
        <li><code>shape</code>: <code>text | circle | rect</code></li>
        <li><code>ui</code>: string or <code>{{ '{' }} root: string {{ '}' }}</code> map</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Skeletons are <code>aria-hidden</code>; announce loading once at the region level (e.g. <code>aria-busy</code> or a status line), not per placeholder.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>
          Match the skeleton's footprint to the real content — same height, same border radius, same
          column widths.
        </li>
        <li>Stagger widths slightly to suggest natural prose.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
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
  protected readonly skeletonStylingExampleCode = skeletonStylingExampleCodeRaw;
}
