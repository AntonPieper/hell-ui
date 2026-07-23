import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { MasterDetailBasicExample } from './examples/basic.example';
import masterDetailBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { MasterDetailNavigationExample } from './examples/navigation.example';
import masterDetailNavigationExampleCodeRaw from './examples/navigation.example.ts?raw' with {
  loader: 'text',
};
import { MasterDetailResizableExample } from './examples/resizable.example';
import masterDetailResizableExampleCodeRaw from './examples/resizable.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-master-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    MasterDetailBasicExample,
    MasterDetailResizableExample,
    MasterDetailNavigationExample,
  ],
  template: `
    <article class="hd-doc-page">
      <div class="hd-prose">
        <hd-page-header
          title="Master Detail"
          icon="faSolidTableColumns"
          category="Composite"
          importPath="hell-ui/master-detail"
          stylesPath="hell-ui/master-detail/styles.css"
        >
          A projection-first responsive controller for consumer-owned master and detail panes.
        </hd-page-header>
        <p>
          <code>[hellMasterDetail]</code> observes its own inline size and coordinates two live
          consumer panes. Wide layouts keep both panes available. Compact layouts expose either the
          primary or detail pane through the controlled <code>detailOpen</code> model, while the
          inactive pane becomes <code>hidden</code>, <code>aria-hidden</code>, and <code>inert</code>
          without being destroyed.
        </p>
        <p>
          The controller owns no layout, headers, item data, navigation, or resizable anatomy.
          Compose those concerns from ordinary markup and the narrow Resizable, Toolbar, and
          Pagination entry points.
        </p>

        <h2>Basic controller</h2>
        <p>
          The root and both panes are ordinary elements. This recipe uses the root and pane
          <code>ui</code> inputs for a two-column presentation; the controller contributes only
          state attributes, visibility semantics, and focus policy. On compact open, focus moves to
          the consumer-rendered back button. Back emits <code>detailOpenChange(false)</code> and
          restores the opener when it is still safe to focus.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="basicCode">
        <app-master-detail-basic-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Recipe: external Resizable</h2>
        <p>
          Put an ordinary <code>[hellResizable]</code> group inside the controller and apply
          <code>hellResizablePane</code> to the same consumer sections as
          <code>hellMasterPane</code>. Resizable owns sizing, minimums, pointer capture, separator
          keyboard behavior, and its own styles. The consumer hides the separator when the exported
          controller reports <code>compact()</code>; Master Detail does not query or render a handle.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="resizableCode">
        <app-master-detail-resizable-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Recipe: ordinary Toolbar and Pagination</h2>
        <p>
          Item selection and previous/next behavior stay in application state. The detail header
          below uses the ordinary <code>[hellToolbar]</code> directive for actions and an ordinary
          <code>[hellPagination]</code> region with <code>hellPageLink</code> controls for item
          navigation. No item labels, disabled flags, or navigation outputs live on Master Detail.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="navigationCode">
        <app-master-detail-navigation-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>API</h2>
        <h3><code>[hellMasterDetail]</code> — <code>HellMasterDetail</code></h3>
        <ul>
          <li>
            <code>detailOpen</code>: standard boolean model, default <code>false</code>. Supports
            <code>[(detailOpen)]</code> and emits <code>detailOpenChange</code> when Back requests the
            primary pane.
          </li>
          <li>
            <code>compactBelow</code>: container inline-size breakpoint in pixels, default
            <code>720</code>. A value at or below zero keeps the controller wide.
          </li>
          <li>
            <code>compact</code>: readonly signal available through
            <code>#controller="hellMasterDetail"</code> for consumer composition such as hiding an
            external separator.
          </li>
          <li><code>ui</code>: the root directive's local <code>HellUiInput&lt;'root'&gt;</code>.</li>
        </ul>
        <p>
          The host reflects <code>data-compact="true"</code> and
          <code>data-detail-open="true"</code> when those states are active.
        </p>

        <h3><code>[hellMasterPane]</code> — <code>HellMasterPane</code></h3>
        <ul>
          <li>
            Required value <code>'primary' | 'detail'</code>. Use one consumer-owned element for each
            role.
          </li>
          <li><code>ui</code>: that pane directive's local <code>HellUiInput&lt;'root'&gt;</code>.</li>
          <li>
            Compact state is reflected with <code>data-active</code>; the inactive element receives
            native <code>hidden</code>, <code>aria-hidden="true"</code>, and <code>inert</code>.
          </li>
        </ul>

        <h3><code>button[hellMasterDetailBack]</code> — <code>HellMasterDetailBack</code></h3>
        <ul>
          <li>
            A consumer-rendered native button shown only for the active compact detail pane. Its
            projected text or consumer <code>aria-label</code> supplies the accessible name.
          </li>
          <li><code>ui</code>: the back directive's local <code>HellUiInput&lt;'root'&gt;</code>.</li>
        </ul>
        <p>
          <code>HELL_MASTER_DETAIL_IMPORTS</code> contains exactly
          <code>HellMasterDetail</code>, <code>HellMasterPane</code>, and
          <code>HellMasterDetailBack</code>.
        </p>

        <h2>Breaking migration from Split View</h2>
        <table class="hd-doc-table">
          <thead>
            <tr>
              <th>Removed Split View surface</th>
              <th>Master Detail migration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>hell-ui/split-view</code></td>
              <td>
                Import controller semantics from <code>hell-ui/master-detail</code>; import
                Resizable, Toolbar, and Pagination separately only when the consumer uses them.
              </td>
            </tr>
            <tr>
              <td><code>&lt;hell-split-view&gt;</code></td>
              <td>Use a consumer-owned element with <code>hellMasterDetail</code>.</td>
            </tr>
            <tr>
              <td><code>ng-template[hellSplitPrimary]</code> / <code>[hellSplitDetail]</code></td>
              <td>
                Use live consumer elements with <code>hellMasterPane="primary"</code> and
                <code>hellMasterPane="detail"</code>. Do not duplicate templates.
              </td>
            </tr>
            <tr>
              <td><code>detailOpen</code> / <code>detailOpenChange</code></td>
              <td>Bind the same state through the standard <code>[(detailOpen)]</code> model.</td>
            </tr>
            <tr>
              <td><code>compactBelow</code></td>
              <td>Keep the breakpoint on <code>hellMasterDetail</code>.</td>
            </tr>
            <tr>
              <td><code>backLabel</code> and the owned back header</td>
              <td>
                Render a native <code>&lt;button hellMasterDetailBack type="button"&gt;</code> with the
                consumer's localized text or accessible name.
              </td>
            </tr>
            <tr>
              <td>
                <code>primaryFlex</code>, <code>detailFlex</code>,
                <code>primaryMinSize</code>, <code>detailMinSize</code>
              </td>
              <td>
                Apply <code>initialFlex</code> and <code>minSize</code> to external
                <code>hellResizablePane</code> directives.
              </td>
            </tr>
            <tr>
              <td><code>framed</code>, <code>height</code>, and owned pane/header layout</td>
              <td>Use consumer markup plus root/pane <code>ui</code>, classes, or application CSS.</td>
            </tr>
            <tr>
              <td>
                <code>itemNavigation*</code>, <code>previousItem*</code>, and
                <code>nextItem*</code>
              </td>
              <td>
                Compose ordinary <code>[hellPagination]</code> / <code>hellPageLink</code> controls or
                Toolbar actions against consumer-owned selection state.
              </td>
            </tr>
            <tr>
              <td><code>HellSplitViewPart</code> / <code>HellSplitViewUi</code></td>
              <td>
                There is no owned anatomy map. Each projected public directive has only its local
                <code>root</code> Part Style Map; composed directives keep their own maps.
              </td>
            </tr>
            <tr>
              <td><code>HELL_SPLIT_VIEW_DIRECTIVES</code></td>
              <td>Use <code>HELL_MASTER_DETAIL_IMPORTS</code>.</td>
            </tr>
            <tr>
              <td><code>hell-ui/split-view/styles.css</code></td>
              <td>
                Use <code>hell-ui/master-detail/styles.css</code> for the root recipe plus
                the stylesheets of explicitly composed Resizable, Toolbar, Pagination, and Button
                entry points.
              </td>
            </tr>
          </tbody>
        </table>

        <h2>Accessibility and focus</h2>
        <ul>
          <li>Wide layouts expose both live panes and do not alter their focusability.</li>
          <li>
            Compact open moves focus to the consumer back button, then the first safe detail control,
            then the detail pane as a fallback.
          </li>
          <li>
            Back and external close restore the original primary opener when it remains connected and
            visible; otherwise focus moves to the first safe primary control.
          </li>
          <li>
            A breakpoint transition never leaves focus inside the pane that becomes hidden. All DOM
            and form state remains intact because panes are not conditionally rendered.
          </li>
        </ul>

        <h2>Do</h2>
        <ul class="hd-do">
          <li>Keep selection, item data, and navigation in application state.</li>
          <li>Use real primary and detail elements so compact transitions preserve consumer state.</li>
          <li>Compose Resizable only where the wide presentation needs adjustable panes.</li>
        </ul>

        <h2>Don't</h2>
        <ul class="hd-dont">
          <li>Don't render separate wide and compact copies of the same pane.</li>
          <li>Don't expect Master Detail to size panes, render headers, or navigate collection items.</li>
          <li>Don't put a Back label input on the controller; the consumer owns the button content.</li>
        </ul>
      </div>
    </article>
  `,
})
export class MasterDetailPage {
  protected readonly basicCode = masterDetailBasicExampleCodeRaw;
  protected readonly resizableCode = masterDetailResizableExampleCodeRaw;
  protected readonly navigationCode = masterDetailNavigationExampleCodeRaw;
}
