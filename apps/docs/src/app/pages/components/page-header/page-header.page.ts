import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { PageHeaderListExample } from './examples/list.example';
import pageHeaderListExampleCodeRaw from './examples/list.example.ts?raw' with {
  loader: 'text',
};
import { PageHeaderDetailExample } from './examples/detail.example';
import pageHeaderDetailExampleCodeRaw from './examples/detail.example.ts?raw' with {
  loader: 'text',
};
import { PageHeaderStylingExample } from './examples/styling.example';
import pageHeaderStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-page-header-doc',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    PageHeaderListExample,
    PageHeaderDetailExample,
    PageHeaderStylingExample,
  ],
  template: `
    <article class="hd-doc-page">
      <div class="hd-prose">
        <hd-page-header
          title="Page header"
          icon="faSolidHeading"
          category="Composite"
          importPath="@hell-ui/angular/page-header"
          stylesPath="@hell-ui/angular/page-header/styles.css"
        >
          Slot-based page chrome: compose a leading region, a configurable heading with meta badges,
          a description, and a toolbar from projected content — one header anatomy for every screen.
        </hd-page-header>
        <p>
          <code>hell-page-header</code> owns the layout and the heading; everything inside is
          content projection of real Hell components, so there is no config-array API. Mark the title
          with <code>hellPageHeaderTitle</code> (it becomes the page's main heading), badges with
          <code>hellPageHeaderMeta</code>, a supporting line with <code>hellPageHeaderDescription</code>,
          and trailing actions with <code>hellPageHeaderToolbar</code> — typically a
          <code>hell-toolbar</code>, which brings its own responsive overflow. The header is
          responsive by default: the toolbar drops below the title on narrow widths.
        </p>

        <h2>List screen</h2>
        <p>
          The most common anatomy: a title, a status badge in the <code>meta</code> region, a short
          description, and a toolbar of actions. No leading region, so the heading sits at the top.
        </p>
      </div>

      <hd-example-tabs [code]="listCode">
        <app-page-header-list-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Detail screen</h2>
        <p>
          A drill-down screen adds a leading region. Drop a <code>hell-page-header-back</code>
          affordance and a <code>hellBreadcrumbs</code> trail before the title. The back button emits
          a <code>back</code> event only — it performs no navigation, so routing stays with your app.
        </p>
      </div>

      <hd-example-tabs [code]="detailCode">
        <app-page-header-detail-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Styling</h2>
        <p>
          Page header follows Hell's Part Style Map contract. A <code>ui="..."</code> shorthand
          refines the default <code>root</code> part; a <code>[ui]</code> map refines named parts.
          Projected children (breadcrumbs, the toolbar) expose their own Part Style Maps.
        </p>
        <table class="hd-doc-table">
          <thead>
            <tr>
              <th>Part</th>
              <th>Styles</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>root</code></td>
              <td>The host element and its vertical rhythm.</td>
            </tr>
            <tr>
              <td><code>leading</code></td>
              <td>The leading row that holds the back affordance and/or breadcrumbs.</td>
            </tr>
            <tr>
              <td><code>titleGroup</code></td>
              <td>The column holding the heading, meta, and description.</td>
            </tr>
            <tr>
              <td><code>title</code></td>
              <td>The heading element (<code>role="heading"</code> at the configured level).</td>
            </tr>
            <tr>
              <td><code>meta</code></td>
              <td>The badge/status region beside the title.</td>
            </tr>
            <tr>
              <td><code>description</code></td>
              <td>The supporting line under the title.</td>
            </tr>
            <tr>
              <td><code>toolbar</code></td>
              <td>The trailing region that holds the projected toolbar.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hd-example-tabs [code]="stylingCode">
        <app-page-header-styling-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>API</h2>
        <p><strong><code>hell-page-header</code></strong> (<code>HellPageHeader</code>) inputs:</p>
        <ul>
          <li>
            <code>level</code>: <code>1 | 2 | 3 | 4 | 5 | 6</code>. Heading level of the title,
            exposed via <code>role="heading"</code> + <code>aria-level</code>. Default <code>1</code>.
          </li>
          <li>
            <code>ui</code>: <code>HellUiInput&lt;HellPageHeaderPart&gt;</code> — a shorthand class
            string for the <code>root</code> part or a <code>HellPageHeaderUi</code> map.
          </li>
        </ul>
        <p>Content-projection markers (all optional except the title):</p>
        <ul>
          <li><code>hell-page-header-back</code> (<code>HellPageHeaderBack</code>) — the back affordance; emits <code>back</code>. Auto-projects into the leading region.</li>
          <li><code>[hellPageHeaderLeading]</code> — any other leading content, e.g. breadcrumbs.</li>
          <li><code>[hellPageHeaderTitle]</code> — the heading content.</li>
          <li><code>[hellPageHeaderMeta]</code> — badges beside the title.</li>
          <li><code>[hellPageHeaderDescription]</code> — the supporting line.</li>
          <li><code>[hellPageHeaderToolbar]</code> — trailing actions (typically <code>hell-toolbar</code>).</li>
        </ul>
        <p>
          <strong><code>hell-page-header-back</code></strong> (<code>HellPageHeaderBack</code>)
          inputs and outputs:
        </p>
        <ul>
          <li><code>aria-label</code>: <code>string | null</code>. Accessible name override. Defaults to the <code>back</code> Label Contract string.</li>
          <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — refines its <code>root</code> part.</li>
          <li><code>back</code>: <code>output&lt;void&gt;</code>. Emits when activated. No navigation.</li>
        </ul>
        <p>Exports and labels:</p>
        <ul>
          <li><code>HELL_PAGE_HEADER_DIRECTIVES</code> — bulk-import tuple of the header, the back affordance, and every slot marker.</li>
          <li><code>HELL_PAGE_HEADER_LABELS</code> — overrides the built-in labels (<code>back</code>).</li>
          <li><code>HellPageHeaderPart</code> — <code>'root' | 'leading' | 'titleGroup' | 'title' | 'meta' | 'description' | 'toolbar'</code>.</li>
        </ul>

        <h2>Accessibility</h2>
        <ul>
          <li>The title is exposed as a heading at <code>level</code> (default 1) so screen-reader users reach per-page orientation in one keystroke; keep exactly one page header per screen at level 1.</li>
          <li>The back affordance is a real button with an accessible name from the Label Contract; localize it with <code>HELL_PAGE_HEADER_LABELS</code> or override per instance with <code>aria-label</code>.</li>
          <li>Breadcrumbs projected into the leading region keep their own <code>nav</code> landmark and <code>aria-current</code> semantics.</li>
        </ul>

        <h2>Do</h2>
        <ul class="hd-do">
          <li>Project a title on every page header; it is the page's main heading.</li>
          <li>Use the <code>meta</code> region for status badges and counts that belong beside the title.</li>
          <li>Reach for <code>hell-toolbar</code> in the toolbar region so actions overflow gracefully on narrow screens.</li>
        </ul>

        <h2>Don't</h2>
        <ul class="hd-dont">
          <li>Don't wire navigation into the header — the back affordance emits an event; your app decides where it goes.</li>
          <li>Don't lower the <code>level</code> below the surrounding outline just for visual size; refine the <code>title</code> part instead.</li>
          <li>Don't stack multiple level-1 page headers on one screen.</li>
        </ul>
      </div>
    </article>
  `,
})
export class PageHeaderPage {
  protected readonly listCode = pageHeaderListExampleCodeRaw;
  protected readonly detailCode = pageHeaderDetailExampleCodeRaw;
  protected readonly stylingCode = pageHeaderStylingExampleCodeRaw;
}
