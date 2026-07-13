import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SkeletonAllPartsStylingExample } from './examples/all-parts-styling.example';
import skeletonAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { SkeletonBasicExample } from './examples/basic.example';
import skeletonBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { SkeletonShapesExample } from './examples/shapes.example';
import skeletonShapesExampleCodeRaw from './examples/shapes.example.ts?raw' with {
  loader: 'text',
};
import { SkeletonTextBlockExample } from './examples/text-block.example';
import skeletonTextBlockExampleCodeRaw from './examples/text-block.example.ts?raw' with {
  loader: 'text',
};
import { SkeletonWithCardAvatarExample } from './examples/with-card-avatar.example';
import skeletonWithCardAvatarExampleCodeRaw from './examples/with-card-avatar.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    SkeletonBasicExample,
    SkeletonShapesExample,
    SkeletonTextBlockExample,
    SkeletonWithCardAvatarExample,
    SkeletonAllPartsStylingExample,
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
        A layout-shaped placeholder that reserves the exact footprint of content still loading, so
        the page never jumps when it arrives.
      </hd-page-header>
      <p>
        <code>hellSkeleton</code> is a directive you attach to a plain <code>div</code> you already
        size with <code>class</code> — it contributes only a shimmering background and a
        <code>shape</code>-driven radius, never a wrapper element. It carries no semantics
        (<code>aria-hidden="true"</code>); it is purely visual.
      </p>
      <p>
        Reach for <code>hellSkeleton</code> when you know the shape of the content that is coming
        — a line of text, an avatar, a card — and want to reserve its space. Reach for
        <a routerLink="/components/spinner">Spinner</a> (its own entry point,
        <code>@hell-ui/angular/spinner</code>) for short, unquantifiable waits such as a submit
        button or a refresh icon, where there is no layout to preserve.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="skeletonBasicExampleCode">
        <app-skeleton-basic-example />
      </hd-example-tabs>

      <h2>Shapes</h2>
      <p>
        <code>shape</code> selects the built-in radius: <code>text</code> (default, small radius
        for a line of copy), <code>circle</code> (avatars, icons), and <code>rect</code> (images,
        cards, larger blocks). Pair it with <code>class</code> for the actual width and height —
        the directive has no opinion on size beyond its <code>100% / 14px</code> default.
      </p>
      <hd-example-tabs [code]="skeletonShapesExampleCode" previewClass="flex items-center gap-4">
        <app-skeleton-shapes-example />
      </hd-example-tabs>

      <h2>Text block</h2>
      <p>
        Stagger line widths — full, full, four-fifths — so a paragraph placeholder reads as prose
        rather than a uniform grid of bars.
      </p>
      <hd-example-tabs [code]="skeletonTextBlockExampleCode" previewClass="max-w-95">
        <app-skeleton-text-block-example />
      </hd-example-tabs>

      <h2>With card and avatar</h2>
      <p>
        A realistic loading state: <code>hellCard</code> (narrow entry point
        <code>@hell-ui/angular/card</code>) supplies the surface, and its header/body swap between
        <code>hellSkeleton</code> placeholders and the real <code>hell-avatar</code> and copy once
        data arrives. The card also sets <code>aria-busy</code> while loading so assistive tech gets
        one region-level signal instead of one per placeholder.
      </p>
      <hd-example-tabs [code]="skeletonWithCardAvatarExampleCode">
        <app-skeleton-with-card-avatar-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellSkeleton</code> owns exactly one Public Part, <code>root</code> — the host
        element itself. Pass <code>ui="..."</code> as shorthand to refine it, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit
        <code>&#123; root?: string &#125;</code> map. Refinements merge on top of the default recipe through
        Hell's Tailwind merge, so a conflicting utility such as
        <code>bg-hell-primary-soft</code> or <code>rounded-hell-lg</code> wins deterministically.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>HellSkeleton</code></td>
            <td><code>root</code></td>
            <td>
              The placeholder itself — shimmer background, radius. Sizing (<code>width</code> /
              <code>height</code> CSS vars) is a separate input, not part of the Part Style Map.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Keep <code>class</code> for layout hooks — width, height, margins — since the recipe never
        sets them itself. Use <code>ui</code> whenever a refinement needs to beat a recipe utility
        such as the default shimmer background or radius.
      </p>
      <hd-example-tabs
        [code]="skeletonAllPartsStylingExampleCode"
        previewClass="flex flex-col"
      >
        <app-skeleton-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><code>hellSkeleton</code></p>
      <ul>
        <li>
          <code>width</code>: <code>string</code> — any CSS length. Sets the
          <code>--_hell-skeleton-width</code> host variable. Default <code>'100%'</code>.
        </li>
        <li>
          <code>height</code>: <code>string</code> — any CSS length. Sets the
          <code>--_hell-skeleton-height</code> host variable. Default <code>'14px'</code>.
        </li>
        <li>
          <code>shape</code>: <code>'text' | 'circle' | 'rect'</code>. Default <code>'text'</code>.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — a shorthand class
          string or a <code>&#123; root?: string &#125;</code> map that
          refines the <code>root</code> public part.
        </li>
        <li>
          </li>
      </ul>
      <h2>Accessibility</h2>
      <ul>
        <li>
          <code>hellSkeleton</code> renders with <code>aria-hidden="true"</code> — it has no
          semantics of its own. Announce loading once at the region level (for example
          <code>aria-busy</code> on the containing card, or a single status line), not once per
          placeholder.
        </li>
        <li>
          If a wait needs an announced live region instead, use
          <a routerLink="/components/spinner"><code>hellSpinner</code></a> — it carries
          <code>role="status"</code> and a Label Contract-resolved <code>aria-label</code>.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>
          Match the skeleton's footprint to the real content — same height, same radius, same
          column widths — so nothing shifts when data arrives.
        </li>
        <li>Stagger line widths slightly to suggest natural prose instead of a uniform grid.</li>
        <li>Set <code>aria-busy</code> on the loading region rather than adding ARIA to each placeholder.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>
          Don't show a skeleton for content that loads in under ~300 ms — the flash is more
          distracting than a brief blank.
        </li>
        <li>Don't combine a skeleton with a spinner in the same region; pick one loading signal.</li>
        <li>Don't reach for <code>hellSkeleton</code> for unquantifiable waits with no known layout — use <a routerLink="/components/spinner">Spinner</a> instead.</li>
      </ul>
    </article>
  `,
})
export class SkeletonPage {
  protected readonly skeletonBasicExampleCode = skeletonBasicExampleCodeRaw;
  protected readonly skeletonShapesExampleCode = skeletonShapesExampleCodeRaw;
  protected readonly skeletonTextBlockExampleCode = skeletonTextBlockExampleCodeRaw;
  protected readonly skeletonWithCardAvatarExampleCode = skeletonWithCardAvatarExampleCodeRaw;
  protected readonly skeletonAllPartsStylingExampleCode = skeletonAllPartsStylingExampleCodeRaw;
}
