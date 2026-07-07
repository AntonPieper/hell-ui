import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SplitViewBasicExample } from './examples/basic.example';
import splitViewBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { SplitViewSizingExample } from './examples/sizing.example';
import splitViewSizingExampleCodeRaw from './examples/sizing.example.ts?raw' with {
  loader: 'text',
};
import { SplitViewItemNavigationExample } from './examples/item-navigation.example';
import splitViewItemNavigationExampleCodeRaw from './examples/item-navigation.example.ts?raw' with {
  loader: 'text',
};
import { SplitViewMasterDetailExample } from './examples/master-detail.example';
import splitViewMasterDetailExampleCodeRaw from './examples/master-detail.example.ts?raw' with {
  loader: 'text',
};
import { SplitViewAllPartsStylingExample } from './examples/all-parts-styling.example';
import splitViewAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-split-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    SplitViewBasicExample,
    SplitViewSizingExample,
    SplitViewItemNavigationExample,
    SplitViewMasterDetailExample,
    SplitViewAllPartsStylingExample,
  ],
  template: `
    <article class="hd-doc-page">
      <div class="hd-prose">
        <hd-page-header
          title="Split view"
          icon="faSolidTableColumns"
          category="Composite"
          importPath="@hell-ui/angular/split-view"
          stylesPath="@hell-ui/angular/split-view/styles.css"
        >
          A responsive master/detail shell that shows two resizable panes side by side and collapses
          to a stacked back-button screen when its container gets too narrow.
        </hd-page-header>
        <p>
          <code>hell-split-view</code> projects two templates —
          <code>ng-template hellSplitPrimary</code> and <code>ng-template hellSplitDetail</code> —
          and decides how to lay them out based on <em>its own</em> inline size, measured with a
          <code>ResizeObserver</code>. Above the <code>compactBelow</code> breakpoint it renders both
          panes side by side inside <code>@hell-ui/angular/resizable</code>, complete with a drag
          handle. Below it, only one pane shows at a time and <code>detailOpen</code> becomes the
          controlled navigation state, with a back button that emits
          <code>detailOpenChange(false)</code>.
        </p>
        <p>
          It is the right choice whenever the same master/detail screen has to work in a wide
          desktop workspace and a narrow docked panel or small viewport without you writing two
          layouts. Selection stays outside the component: you own which record is active and pass
          compact detail state in explicitly, so it composes cleanly with a table, list, or tree on
          the primary side and a card or form on the detail side.
        </p>

        <h2>Basic</h2>
        <p>
          The smallest realistic usage: a framed view with a primary and detail template. There is
          enough room here for two panes, so you get a resizable handle; drag it, or narrow the
          container to trigger the compact back-button flow.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="basicCode">
        <app-split-view-basic-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Sizing</h2>
        <p>
          Wide-mode sizing is driven by four inputs. <code>primaryFlex</code> and
          <code>detailFlex</code> set the initial grow ratio of the two panes, while
          <code>primaryMinSize</code> and <code>detailMinSize</code> (both in pixels) are the floors
          the resize handle will not cross. <code>compactBelow</code> is the container width, in
          pixels, at which the view drops the second pane and switches to the stacked screen flow.
          <code>height</code> pins a fixed height (numbers are normalized to pixels); leave it unset
          to fill the container.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="sizingCode">
        <app-split-view-sizing-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Item navigation</h2>
        <p>
          Set <code>itemNavigation</code> to add previous/next controls that step through the
          selected collection without leaving the detail pane. Wire <code>previousItem</code> and
          <code>nextItem</code> to your own selection logic, and disable the ends with
          <code>previousItemDisabled</code> / <code>nextItemDisabled</code>. The controls render on
          the right of the detail header in wide mode and in the compact header next to the back
          button in stacked mode.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="itemNavigationCode">
        <app-split-view-item-navigation-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>With table and card</h2>
        <p>
          A realistic master/detail screen: a <code>@hell-ui/angular/table</code> of tickets on the
          primary side and a <code>@hell-ui/angular/card</code> detail on the other. Clicking a row
          action opens the detail and marks the row active; item navigation walks the same list. On
          a narrow container the card fills a stacked screen with a back button and the same
          prev/next controls.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="masterDetailCode">
        <app-split-view-master-detail-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Styling</h2>
        <p>
          Split view follows Hell's Part Style Map contract. A <code>ui="..."</code> shorthand
          string refines the default <code>root</code> part; a <code>[ui]</code> map refines named
          parts. Each entry merges on top of the component's recipe through Hell's Tailwind merge,
          so a refinement wins deterministically over the recipe class it conflicts with. The
          component owns projected structure, so styling flows through <code>ui</code> rather than
          template classes on the panes.
        </p>
        <p>
          Some parts only render in one mode: <code>resizable</code> and
          <code>detailHeader</code> exist in wide mode, while <code>screen</code>,
          <code>compactHeader</code>, and <code>backButton</code> exist in the compact stacked
          flow. The <code>itemNavigation</code> refinement is forwarded to both the surrounding
          <code>nav</code> and the internal pagination control's own <code>ui</code>.
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
              <td>The host element — outer frame, border, radius, fixed height.</td>
            </tr>
            <tr>
              <td><code>resizable</code></td>
              <td>Wide-mode wrapper around the two resizable panes.</td>
            </tr>
            <tr>
              <td><code>screen</code></td>
              <td>Compact-mode wrapper holding the single visible pane and its header.</td>
            </tr>
            <tr>
              <td><code>pane</code></td>
              <td>Each pane's content region, in both wide and compact modes.</td>
            </tr>
            <tr>
              <td><code>compactHeader</code></td>
              <td>Compact-mode header bar that holds the back button and item navigation.</td>
            </tr>
            <tr>
              <td><code>backButton</code></td>
              <td>The compact-mode back button (a ghost <code>hellButton</code>).</td>
            </tr>
            <tr>
              <td><code>detailHeader</code></td>
              <td>Wide-mode header strip above the detail pane that holds item navigation.</td>
            </tr>
            <tr>
              <td><code>itemNavigation</code></td>
              <td>The previous/next navigation region and its pagination control.</td>
            </tr>
          </tbody>
        </table>
        <p>
          One <code>[ui]</code> map that refines every public part. Compact-only parts apply when
          the container drops below <code>compactBelow</code>; resize the preview to see them.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="allPartsStylingCode">
        <app-split-view-all-parts-styling-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>API</h2>
        <p><strong><code>hell-split-view</code></strong> (<code>HellSplitView</code>) inputs:</p>
        <ul>
          <li>
            <code>compactBelow</code>: <code>number</code>. Container width in pixels below which the
            view collapses to the stacked compact flow. Default <code>720</code>.
          </li>
          <li>
            <code>detailOpen</code>: <code>boolean</code>. Controlled compact-mode state for whether
            the detail pane is shown. Default <code>false</code>.
          </li>
          <li>
            <code>framed</code>: <code>boolean</code>. Renders the bordered, rounded frame
            (<code>data-framed</code>). Default <code>false</code>.
          </li>
          <li><code>backLabel</code>: <code>string</code>. Compact back-button label. Default <code>'Back'</code>.</li>
          <li><code>primaryFlex</code>: <code>number</code>. Initial flex-grow of the primary pane. Default <code>3</code>.</li>
          <li><code>detailFlex</code>: <code>number</code>. Initial flex-grow of the detail pane. Default <code>2</code>.</li>
          <li><code>primaryMinSize</code>: <code>number</code>. Minimum primary width in pixels. Default <code>320</code>.</li>
          <li><code>detailMinSize</code>: <code>number</code>. Minimum detail width in pixels. Default <code>260</code>.</li>
          <li>
            <code>height</code>: <code>string | number | null</code>. Fixed height; numbers are
            normalized to pixels. Default <code>null</code> (fills the container).
          </li>
          <li><code>itemNavigation</code>: <code>boolean</code>. Renders the prev/next item controls. Default <code>false</code>.</li>
          <li><code>itemNavigationLabel</code>: <code>string</code>. Accessible label for the navigation region. Default <code>'Item navigation'</code>.</li>
          <li><code>previousItemLabel</code>: <code>string</code>. Label for the previous control. Default <code>'Previous item'</code>.</li>
          <li><code>nextItemLabel</code>: <code>string</code>. Label for the next control. Default <code>'Next item'</code>.</li>
          <li><code>previousItemDisabled</code>: <code>boolean</code>. Disables the previous control. Default <code>false</code>.</li>
          <li><code>nextItemDisabled</code>: <code>boolean</code>. Disables the next control. Default <code>false</code>.</li>
          <li>
            <code>ui</code>: <code>HellUiInput&lt;HellSplitViewPart&gt;</code> — a shorthand class
            string for the <code>root</code> part or a <code>HellSplitViewUi</code> map.
          </li>
        </ul>
        <p>Outputs:</p>
        <ul>
          <li><code>detailOpenChange</code>: <code>output&lt;boolean&gt;</code>. Emits <code>false</code> when the compact back button is pressed.</li>
          <li><code>previousItem</code>: <code>output&lt;void&gt;</code>. Emits when the previous-item control is activated.</li>
          <li><code>nextItem</code>: <code>output&lt;void&gt;</code>. Emits when the next-item control is activated.</li>
        </ul>
        <p>Content projection:</p>
        <ul>
          <li>
            <code>ng-template hellSplitPrimary</code> (<code>HellSplitPrimary</code>) — primary pane
            content; receives a <code>&#123; compact, detailOpen &#125;</code> context.
          </li>
          <li>
            <code>ng-template hellSplitDetail</code> (<code>HellSplitDetail</code>) — detail pane
            content; receives the same context.
          </li>
          <li>
            <code>HELL_SPLIT_VIEW_DIRECTIVES</code> — bulk-import tuple of
            <code>HellSplitView</code>, <code>HellSplitPrimary</code>, and
            <code>HellSplitDetail</code>.
          </li>
        </ul>
        <p>Exported types:</p>
        <ul>
          <li>
            <code>HellSplitViewPart</code> —
            <code
              >'root' | 'resizable' | 'screen' | 'pane' | 'compactHeader' | 'backButton' |
              'detailHeader' | 'itemNavigation'</code
            >.
          </li>
          <li><code>HellSplitViewUi</code> — <code>HellUi&lt;HellSplitViewPart&gt;</code>, the map form of <code>ui</code>.</li>
        </ul>

        <h2>Accessibility</h2>
        <ul>
          <li>
            In wide mode the drag handle comes from <code>@hell-ui/angular/resizable</code>: it is a
            <code>role="separator"</code> with <code>aria-orientation</code>,
            <code>aria-valuemin</code>/<code>max</code>/<code>now</code>, and a keyboard contract of
            arrow keys to resize plus <code>Home</code>/<code>End</code> to jump to a pane's
            minimum or maximum.
          </li>
          <li>
            The compact back button is a real labeled <code>hellButton</code> (label from
            <code>backLabel</code>); the previous/next controls are labeled buttons built on
            <code>@hell-ui/angular/pagination</code>, named by
            <code>previousItemLabel</code> / <code>nextItemLabel</code>.
          </li>
          <li>
            The item-navigation region is a <code>nav</code> labeled by
            <code>itemNavigationLabel</code>. When both previous and next are disabled the internal
            pagination collapses to a single inert page.
          </li>
          <li>
            State is reflected on the host through <code>data-compact</code>,
            <code>data-detail-open</code>, and <code>data-framed</code> attributes for styling
            hooks; the component measures its own container width rather than the viewport.
          </li>
        </ul>

        <h2>Do</h2>
        <ul class="hd-do">
          <li>Own selection outside the split view and pass compact <code>detailOpen</code> state in explicitly.</li>
          <li>Disable <code>previousItemDisabled</code> / <code>nextItemDisabled</code> at the ends of the collection.</li>
          <li>Give <code>itemNavigation</code> descriptive labels that name the record type (for example "Previous ticket").</li>
          <li>Let compact mode take over on small containers instead of forcing two cramped panes.</li>
        </ul>

        <h2>Don't</h2>
        <ul class="hd-dont">
          <li>Don't assume viewport size equals available width — the view watches its own container.</li>
          <li>Don't style the panes with template <code>class</code> where a <code>ui</code> part refinement is meant to win.</li>
          <li>Don't leave <code>detailOpen</code> uncontrolled and expect the back button to close the detail; wire <code>detailOpenChange</code>.</li>
        </ul>
      </div>
    </article>
  `,
})
export class SplitViewPage {
  protected readonly basicCode = splitViewBasicExampleCodeRaw;
  protected readonly sizingCode = splitViewSizingExampleCodeRaw;
  protected readonly itemNavigationCode = splitViewItemNavigationExampleCodeRaw;
  protected readonly masterDetailCode = splitViewMasterDetailExampleCodeRaw;
  protected readonly allPartsStylingCode = splitViewAllPartsStylingExampleCodeRaw;
}
