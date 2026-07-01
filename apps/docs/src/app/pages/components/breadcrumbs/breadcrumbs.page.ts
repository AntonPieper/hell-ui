import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen, faSolidGear, faSolidHouse } from '@ng-icons/font-awesome/solid';
import { HELL_BREADCRUMBS_DIRECTIVES } from '@hell-ui/angular/breadcrumbs';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { ExampleTabs } from '../../../shared/example-tabs';
import { BreadcrumbsCustomSeparatorExample } from './examples/custom-separator.example';
import breadcrumbsCustomSeparatorExampleCodeRaw from './examples/custom-separator.example.ts?raw' with {
  loader: 'text',
};
import { BreadcrumbsLongPathWithEllipsisExample } from './examples/long-path-with-ellipsis.example';
import breadcrumbsLongPathWithEllipsisExampleCodeRaw from './examples/long-path-with-ellipsis.example.ts?raw' with {
  loader: 'text',
};
import { BreadcrumbsStandardExample } from './examples/standard.example';
import breadcrumbsStandardExampleCodeRaw from './examples/standard.example.ts?raw' with {
  loader: 'text',
};
import { BreadcrumbsWithIconsExample } from './examples/with-icons.example';
import breadcrumbsWithIconsExampleCodeRaw from './examples/with-icons.example.ts?raw' with {
  loader: 'text',
};
import { BreadcrumbsStylingExample } from './examples/styling.example';
import breadcrumbsStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidFolderOpen, faSolidGear, faSolidHouse })],
  imports: [
    ExampleTabs,
    ...HELL_BREADCRUMBS_DIRECTIVES,
    ...HELL_MENU_DIRECTIVES,
    BreadcrumbsStandardExample,
    BreadcrumbsWithIconsExample,
    BreadcrumbsLongPathWithEllipsisExample,
    BreadcrumbsCustomSeparatorExample, BreadcrumbsStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Breadcrumbs</h1>
      <p>
        Hierarchical trail showing the user's location, built on
        <code>ng-primitives/breadcrumbs</code>. Use <code>hellBreadcrumbLink</code> for navigable
        crumbs and <code>hellBreadcrumbPage</code> for the current page (which receives
        <code>aria-current="page"</code> automatically). The separator paints a chevron-right by
        default — provide custom content to override.
      </p>

      <h2>Standard</h2>
      <hd-example-tabs [code]="breadcrumbsStandardExampleCode">
        <app-breadcrumbs-standard-example />
      </hd-example-tabs>

      <h2>With icons</h2>
      <p>
        Use <code>hell-icon</code> inside any link or page. The library provides a default chevron
        separator but consumers can drop in their own icon by writing into the separator element.
      </p>
      <hd-example-tabs [code]="breadcrumbsWithIconsExampleCode">
        <app-breadcrumbs-with-icons-example />
      </hd-example-tabs>

      <h2>Long path with ellipsis</h2>
      <p>
        For deeply nested trails, collapse the middle with <code>hellBreadcrumbEllipsis</code>. Pair
        it with a menu (e.g. <code>hellMenu</code>) to surface the hidden crumbs on click.
      </p>
      <hd-example-tabs [code]="breadcrumbsLongPathWithEllipsisExampleCode">
        <app-breadcrumbs-long-path-with-ellipsis-example />
      </hd-example-tabs>

      <h2>Custom separator</h2>
      <p>
        Provide content inside <code>[hellBreadcrumbSeparator]</code> to override the default
        chevron.
      </p>
      <hd-example-tabs [code]="breadcrumbsCustomSeparatorExampleCode">
        <app-breadcrumbs-custom-separator-example />
      </hd-example-tabs>

      <h2>Part style map</h2>
      <p>
        Every breadcrumbs directive exposes its own single-part <code>ui</code> input (<code>HellBreadcrumbLinkUi</code>, <code>HellBreadcrumbPageUi</code>, …). Refine each directive locally instead of styling descendants from the root.
      </p>
      <hd-example-tabs [code]="breadcrumbsStylingExampleCode">
        <app-breadcrumbs-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>nav[hellBreadcrumbs]</code> — landmark wrapper (host directive
          <code>NgpBreadcrumbs</code>)
        </li>
        <li><code>ol|ul[hellBreadcrumbList]</code> — list wrapper</li>
        <li><code>li[hellBreadcrumbItem]</code> — apply once per crumb</li>
        <li>
          <code>a|button[hellBreadcrumbLink]</code> — navigable crumb (host directive
          <code>NgpBreadcrumbLink</code>)
        </li>
        <li>
          <code>[hellBreadcrumbPage]</code> — current page; sets
          <code>aria-current="page"</code> automatically (host directive
          <code>NgpBreadcrumbPage</code>)
        </li>
        <li>
          <code>li[hellBreadcrumbSeparator]</code> — divider; renders a chevron-right by default,
          override with content
        </li>
        <li><code>[hellBreadcrumbEllipsis]</code> — collapsed middle indicator for long trails</li>
        <li>
          Each breadcrumb directive accepts
          <code>ui</code>: string or <code>{{ '{' }} root: string {{ '}' }}</code> map.
        </li>
        <li>Import the bundle via <code>HELL_BREADCRUMBS_DIRECTIVES</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>
          Use <code>hellBreadcrumbPage</code> for the leaf crumb so screen readers announce the
          current location.
        </li>
        <li>Collapse with an ellipsis once the trail exceeds ~5 levels.</li>
      </ul>
      <h2>Don't</h2>
      <ul>
        <li>Don't make the current page a link — it confuses users and fails WCAG 2.4.8.</li>
        <li>
          Don't render breadcrumbs for flat hierarchies; they only help when there's a parent to
          return to.
        </li>
      </ul>
    </article>
  `,
})
export class BreadcrumbsPage {
  protected readonly breadcrumbsStandardExampleCode = breadcrumbsStandardExampleCodeRaw;
  protected readonly breadcrumbsWithIconsExampleCode = breadcrumbsWithIconsExampleCodeRaw;
  protected readonly breadcrumbsLongPathWithEllipsisExampleCode =
    breadcrumbsLongPathWithEllipsisExampleCodeRaw;
  protected readonly breadcrumbsCustomSeparatorExampleCode =
    breadcrumbsCustomSeparatorExampleCodeRaw;
  protected readonly breadcrumbsStylingExampleCode = breadcrumbsStylingExampleCodeRaw;
}
