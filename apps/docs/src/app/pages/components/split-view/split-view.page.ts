import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SplitViewBasicExample } from './examples/basic.example';
import splitViewBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { SplitViewMasterDetailExample } from './examples/master-detail.example';
import splitViewMasterDetailExampleCodeRaw from './examples/master-detail.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-split-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, SplitViewBasicExample, SplitViewMasterDetailExample, PageHeader],
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
          Master–detail layout on top of Resizable that collapses into a stacked screen flow with item navigation on small viewports.
        </hd-page-header>
        <p>
          Responsive master/detail shell. It uses resizable panes when the container can support two
          columns and switches to a compact screen flow with a back button below the breakpoint.
        </p>

        <h2>Basic</h2>
        <p>Default framing, handle, and compact behavior with no <code>ui</code> refinements.</p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="splitViewBasicExampleCode">
        <app-split-view-basic-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Master/detail</h2>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="splitViewMasterDetailExampleCode">
        <app-split-view-master-detail-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>API</h2>
        <ul>
          <li><code>hell-split-view</code>: host component.</li>
          <li><code>ng-template hellSplitPrimary</code>: primary pane content.</li>
          <li><code>ng-template hellSplitDetail</code>: detail pane content.</li>
          <li><code>compactBelow</code>: container width below which compact mode is used.</li>
          <li>
            <code>detailOpen</code> / <code>detailOpenChange</code>: compact detail screen state.
          </li>
          <li>
            <code>itemNavigation</code>, <code>previousItemDisabled</code>,
            <code>nextItemDisabled</code>, <code>previousItem</code>, and <code>nextItem</code>:
            opt-in detail item navigation.
          </li>
          <li>
            <code>primaryFlex</code>, <code>detailFlex</code>, <code>primaryMinSize</code>,
            <code>detailMinSize</code>: desktop pane sizing.
          </li>
          <li>
            <code>framed</code>, <code>height</code>, <code>backLabel</code>,
            <code>itemNavigationLabel</code>, <code>previousItemLabel</code>,
            <code>nextItemLabel</code>, and flat Part Style Map keys such as
            <code>resizable</code>, <code>pane</code>, <code>compactHeader</code>, and
            <code>itemNavigation</code> via <code>ui</code>.
          </li>
        </ul>

        <h2>Accessibility</h2>
        <ul>
          <li>Compact mode exposes back/previous/next controls as labeled buttons; headers stay real headings.</li>
          <li>The resize handle inherits the Resizable keyboard contract.</li>
        </ul>

        <h2>Do</h2>
        <ul class="hd-do">
          <li>Drive selection outside the split view and pass compact detail state explicitly.</li>
          <li>Disable previous/next item controls at collection boundaries.</li>
          <li>
            Use compact mode for small containers instead of forcing unusable resizable panes.
          </li>
        </ul>

        <h2>Don't</h2>
        <ul class="hd-dont">
          <li>
            Don't assume viewport size equals available component size; split view watches its own
            container.
          </li>
        </ul>
      </div>
    </article>
  `,
})
export class SplitViewPage {
  protected readonly splitViewBasicExampleCode = splitViewBasicExampleCodeRaw;
  protected readonly splitViewMasterDetailExampleCode = splitViewMasterDetailExampleCodeRaw;
}
