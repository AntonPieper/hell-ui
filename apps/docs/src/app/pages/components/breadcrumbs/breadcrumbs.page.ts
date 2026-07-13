import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen, faSolidGauge, faSolidHouse } from '@ng-icons/font-awesome/solid';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { BreadcrumbsAllPartsStylingExample } from './examples/all-parts-styling.example';
import breadcrumbsAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { BreadcrumbsBasicExample } from './examples/basic.example';
import breadcrumbsBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { BreadcrumbsCollapsedEllipsisExample } from './examples/collapsed-ellipsis.example';
import breadcrumbsCollapsedEllipsisExampleCodeRaw from './examples/collapsed-ellipsis.example.ts?raw' with {
  loader: 'text',
};
import { BreadcrumbsCustomSeparatorExample } from './examples/custom-separator.example';
import breadcrumbsCustomSeparatorExampleCodeRaw from './examples/custom-separator.example.ts?raw' with {
  loader: 'text',
};
import { BreadcrumbsWithAppShellTopbarExample } from './examples/with-app-shell-topbar.example';
import breadcrumbsWithAppShellTopbarExampleCodeRaw from './examples/with-app-shell-topbar.example.ts?raw' with {
  loader: 'text',
};
import { BreadcrumbsWithIconsExample } from './examples/with-icons.example';
import breadcrumbsWithIconsExampleCodeRaw from './examples/with-icons.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidFolderOpen, faSolidGauge, faSolidHouse })],
  imports: [
    ExampleTabs,
    PageHeader,
    BreadcrumbsBasicExample,
    BreadcrumbsWithIconsExample,
    BreadcrumbsCollapsedEllipsisExample,
    BreadcrumbsCustomSeparatorExample,
    BreadcrumbsWithAppShellTopbarExample,
    BreadcrumbsAllPartsStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Breadcrumbs"
        icon="faSolidSignsPost"
        category="Styled primitive"
        importPath="@hell-ui/angular/breadcrumbs"
        stylesPath="@hell-ui/angular/breadcrumbs/styles.css"
      >
        A hierarchical location trail — links back up the path, a non-link marker for the current
        page, and an optional collapsed-middle for deep hierarchies.
      </hd-page-header>
      <p>
        Breadcrumbs are a suite of host directives — <code>hellBreadcrumbs</code>,
        <code>hellBreadcrumbList</code>, <code>hellBreadcrumbItem</code>,
        <code>hellBreadcrumbLink</code>, <code>hellBreadcrumbPage</code>,
        <code>hellBreadcrumbSeparator</code>, and <code>hellBreadcrumbEllipsis</code> — built on
        <code>ng-primitives/breadcrumbs</code>. Each directive attaches to markup you already own
        (<code>nav</code>, <code>ol</code>, <code>li</code>, <code>a</code>, <code>span</code>),
        contributing behavior, ARIA, and a single styleable <code>root</code> part rather than
        rendering its own template.
      </p>
      <p>
        Reach for breadcrumbs in dense business apps once a page sits more than one level below a
        landing page — settings screens, nested resource detail views, file/folder trees. Skip them
        for flat hierarchies where there is no meaningful parent to climb back to.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="breadcrumbsBasicExampleCode">
        <app-breadcrumbs-basic-example />
      </hd-example-tabs>

      <h2>With icons</h2>
      <p>
        Drop a <code>hell-icon</code> inside any link or the current page. Separators paint their
        own chevron by default via CSS — write content into
        <code>[hellBreadcrumbSeparator]</code> only when you need to override it.
      </p>
      <hd-example-tabs [code]="breadcrumbsWithIconsExampleCode">
        <app-breadcrumbs-with-icons-example />
      </hd-example-tabs>

      <h2>Collapsed middle</h2>
      <p>
        For deep trails, collapse the middle crumbs behind <code>hellBreadcrumbEllipsis</code> and
        pair it with <code>hellMenuTrigger</code>/<code>hellMenu</code> (narrow entry point
        <code>@hell-ui/angular/menu</code>) so the hidden levels stay reachable. Applying the
        directive to a <code>button</code> automatically wires an accessible label from the
        breadcrumbs Label Contract.
      </p>
      <hd-example-tabs [code]="breadcrumbsCollapsedEllipsisExampleCode">
        <app-breadcrumbs-collapsed-ellipsis-example />
      </hd-example-tabs>

      <h2>Custom separator</h2>
      <p>
        <code>[hellBreadcrumbSeparator]</code> renders a chevron only while empty. Give it content —
        a slash, an arrow, an icon — to replace the default.
      </p>
      <hd-example-tabs [code]="breadcrumbsCustomSeparatorExampleCode">
        <app-breadcrumbs-custom-separator-example />
      </hd-example-tabs>

      <h2>With app shell topbar</h2>
      <p>
        Breadcrumbs read naturally inside <code>hellAppTopbar</code> (narrow entry point
        <code>@hell-ui/angular/app-shell</code>), reporting the current location without repeating
        the sidenav's own navigation.
      </p>
      <hd-example-tabs [code]="breadcrumbsWithAppShellTopbarExampleCode">
        <app-breadcrumbs-with-app-shell-topbar-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Every breadcrumbs directive follows the same Part Style Map shape: it owns exactly one
        public part, <code>root</code>, so its <code>ui</code> input takes either a shorthand class
        string or an explicit <code>{{ '{' }} root: string {{ '}' }}</code> map. Because each
        directive is independent, refine the directive you actually want to change instead of
        cascading classes down from <code>hellBreadcrumbs</code>.
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
            <td><code>HellBreadcrumbs</code></td>
            <td><code>root</code></td>
            <td>The <code>nav</code> landmark wrapping the whole trail.</td>
          </tr>
          <tr>
            <td><code>HellBreadcrumbList</code></td>
            <td><code>root</code></td>
            <td>The <code>ol</code>/<code>ul</code> that lays out the crumb items.</td>
          </tr>
          <tr>
            <td><code>HellBreadcrumbItem</code></td>
            <td><code>root</code></td>
            <td>Each <code>li</code> wrapping one crumb (link, page, separator, or ellipsis).</td>
          </tr>
          <tr>
            <td><code>HellBreadcrumbLink</code></td>
            <td><code>root</code></td>
            <td>A navigable crumb — the <code>a</code> or <code>button</code>.</td>
          </tr>
          <tr>
            <td><code>HellBreadcrumbPage</code></td>
            <td><code>root</code></td>
            <td>The current page marker, non-interactive.</td>
          </tr>
          <tr>
            <td><code>HellBreadcrumbSeparator</code></td>
            <td><code>root</code></td>
            <td>The decorative divider between items.</td>
          </tr>
          <tr>
            <td><code>HellBreadcrumbEllipsis</code></td>
            <td><code>root</code></td>
            <td>The collapsed-middle indicator, plain or interactive.</td>
          </tr>
        </tbody>
      </table>
      <p>The example below refines every part across every module in the entry point:</p>
      <hd-example-tabs [code]="breadcrumbsAllPartsStylingExampleCode">
        <app-breadcrumbs-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p>Every directive below accepts <code>ui</code>: a shorthand class string or a map keyed by its part names.</p>
      <ul>
        <li>
          <code>nav[hellBreadcrumbs]</code> — landmark wrapper (host directive
          <code>NgpBreadcrumbs</code>). <code>ui: HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          <code>ol|ul[hellBreadcrumbList]</code> — list wrapper (host directive
          <code>NgpBreadcrumbList</code>). <code>ui: HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          <code>li[hellBreadcrumbItem]</code> — apply once per crumb (host directive
          <code>NgpBreadcrumbItem</code>). <code>ui: HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          <code>a|button[hellBreadcrumbLink]</code> — navigable crumb (host directive
          <code>NgpBreadcrumbLink</code>). Sets <code>type="button"</code> automatically on a
          <code>button</code> host. <code>ui: HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          <code>[hellBreadcrumbPage]</code> — current page; sets <code>aria-current="page"</code>
          automatically (host directive <code>NgpBreadcrumbPage</code>).
          <code>ui: HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          <code>li[hellBreadcrumbSeparator]</code> — divider; renders a chevron via CSS while empty,
          sets <code>role="presentation"</code> and <code>aria-hidden="true"</code> (host directive
          <code>NgpBreadcrumbSeparator</code>). <code>ui: HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          <code>[hellBreadcrumbEllipsis]</code> — collapsed-middle indicator (host directive
          <code>NgpBreadcrumbEllipsis</code>). Renders three dots via CSS while empty. On a
          <code>button</code> host, sets <code>type="button"</code> and
          <code>aria-label</code> — defaulting to the <code>showHiddenNavigation</code> label —
          unless overridden by the <code>aria-label</code> input.
          <code>ui: HellUiInput&lt;'root'&gt;</code>.
          <ul>
            <li><code>ariaLabel</code> (alias <code>aria-label</code>): <code>string | null</code>, default <code>null</code>.</li>
          </ul>
        </li>
        <li>
          <code>HELL_BREADCRUMBS_LABELS</code> / <code>provideHellLabels(HELL_BREADCRUMBS_LABELS, overrides)</code>
          — Label Contract for built-in accessibility strings. Default
          <code>showHiddenNavigation: 'Show hidden navigation'</code>.
        </li>
        <li>Import every directive at once via <code>HELL_BREADCRUMBS_DIRECTIVES</code>.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          <code>hellBreadcrumbs</code> renders <code>role="navigation"</code>; pair it with an
          <code>aria-label</code> (for example <code>"Breadcrumb"</code>) since a page may have more
          than one landmark.
        </li>
        <li><code>hellBreadcrumbList</code> exposes <code>role="list"</code> and each <code>hellBreadcrumbItem</code> exposes <code>role="listitem"</code>.</li>
        <li>
          <code>hellBreadcrumbPage</code> sets <code>aria-current="page"</code> automatically —
          apply it to a non-interactive element, never a link.
        </li>
        <li>
          <code>hellBreadcrumbSeparator</code> is always presentational:
          <code>role="presentation"</code> plus <code>aria-hidden="true"</code>, so custom separator
          content never reaches assistive tech.
        </li>
        <li>
          <code>hellBreadcrumbEllipsis</code> on a <code>button</code> gets an accessible name from
          the Label Contract (or your <code>aria-label</code> override) since its default content is
          purely decorative dots.
        </li>
        <li>Keyboard interaction is native: links and the ellipsis button are reached with Tab and activated with Enter/Space.</li>
      </ul>

      <ul class="hd-do">
        <li>Use <code>hellBreadcrumbPage</code> for the leaf crumb so screen readers announce the current location.</li>
        <li>Collapse the middle with <code>hellBreadcrumbEllipsis</code> once a trail exceeds ~5 levels.</li>
        <li>Give <code>hellBreadcrumbs</code> a descriptive <code>aria-label</code> when a page has more than one navigation landmark.</li>
      </ul>
      <ul class="hd-dont">
        <li>Don't make the current page a link — it confuses users and fails WCAG 2.4.8.</li>
        <li>Don't render breadcrumbs for flat hierarchies; they only help when there's a parent to return to.</li>
        <li>Don't put interactive content inside <code>hellBreadcrumbSeparator</code> — it's hidden from assistive tech.</li>
      </ul>
    </article>
  `,
})
export class BreadcrumbsPage {
  protected readonly breadcrumbsBasicExampleCode = breadcrumbsBasicExampleCodeRaw;
  protected readonly breadcrumbsWithIconsExampleCode = breadcrumbsWithIconsExampleCodeRaw;
  protected readonly breadcrumbsCollapsedEllipsisExampleCode =
    breadcrumbsCollapsedEllipsisExampleCodeRaw;
  protected readonly breadcrumbsCustomSeparatorExampleCode =
    breadcrumbsCustomSeparatorExampleCodeRaw;
  protected readonly breadcrumbsWithAppShellTopbarExampleCode =
    breadcrumbsWithAppShellTopbarExampleCodeRaw;
  protected readonly breadcrumbsAllPartsStylingExampleCode =
    breadcrumbsAllPartsStylingExampleCodeRaw;
}
