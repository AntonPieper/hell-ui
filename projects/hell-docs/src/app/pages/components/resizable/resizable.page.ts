import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/composites';
import { ExampleTabs } from '../../../shared/example-tabs';
import { ResizableGripHandle5Example } from './examples/grip-handle-5.example';
import resizableGripHandle5ExampleCodeRaw from './examples/grip-handle-5.example.ts?raw' with {
  loader: 'text',
};
import { ResizableGripHandleExample } from './examples/grip-handle.example';
import resizableGripHandleExampleCodeRaw from './examples/grip-handle.example.ts?raw' with {
  loader: 'text',
};
import { ResizableHorizontalSplitExample } from './examples/horizontal-split.example';
import resizableHorizontalSplitExampleCodeRaw from './examples/horizontal-split.example.ts?raw' with {
  loader: 'text',
};
import { ResizableThreePanesExample } from './examples/three-panes.example';
import resizableThreePanesExampleCodeRaw from './examples/three-panes.example.ts?raw' with {
  loader: 'text',
};
import { ResizableVerticalSplitExample } from './examples/vertical-split.example';
import resizableVerticalSplitExampleCodeRaw from './examples/vertical-split.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-resizable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ...HELL_RESIZABLE_DIRECTIVES,
    ResizableHorizontalSplitExample,
    ResizableThreePanesExample,
    ResizableVerticalSplitExample,
    ResizableGripHandleExample,
    ResizableGripHandle5Example,
  ],
  template: `
    <article class="hd-prose">
      <h1>Resizable</h1>
      <p>
        Pointer-driven resizable panes. Place <code>hellResizableHandle</code> between sibling
        <code>hellResizablePane</code> elements; the handle drags both at once. After user sizing,
        panes rescale with their container so one pane cannot disappear during window resize.
      </p>

      <h2>Horizontal split</h2>
      <hd-example-tabs [code]="resizableHorizontalSplitExampleCode" flush>
        <app-resizable-horizontal-split-example />
      </hd-example-tabs>

      <h2>Three panes</h2>
      <hd-example-tabs [code]="resizableThreePanesExampleCode" flush>
        <app-resizable-three-panes-example />
      </hd-example-tabs>

      <h2>Vertical split</h2>
      <hd-example-tabs [code]="resizableVerticalSplitExampleCode" flush>
        <app-resizable-vertical-split-example />
      </hd-example-tabs>

      <h2>Grip handle</h2>
      <p>
        Set <code>appearance="grip"</code> for a pill-shaped handle with a three-dot indicator. Use
        this when the handle is the primary affordance — e.g. user-resizable inspector panels — and
        the default hairline reads as decorative.
      </p>
      <hd-example-tabs [code]="resizableGripHandleExampleCode" flush>
        <app-resizable-grip-handle-example />
      </hd-example-tabs>

      <hd-example-tabs [code]="resizableGripHandle5ExampleCode" previewClass="mt-3" flush>
        <app-resizable-grip-handle-5-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellResizable</code>: <code>orientation</code> (<code>horizontal | vertical</code>),
          <code>rescaleOnResize</code>
        </li>
        <li><code>hellResizablePane</code>: <code>initialFlex</code>, <code>minSize</code> (px)</li>
        <li>
          <code>hellResizableHandle</code>: <code>appearance</code> (<code>line | grip</code>) —
          place between two panes; optional <code>aria-controls</code> for controlled pane IDs.
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Set practical <code>minSize</code> on every pane.</li>
        <li>Use grip handles when discoverability matters.</li>
        <li>
          Use <code>hell-split-view</code> for master-detail layouts that should become a compact
          back-button screen below a container breakpoint.
        </li>
        <li>Persist sizes only when users expect layout memory.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't let panes resize below usable content.</li>
        <li>Don't place resize handles where they conflict with scrollbars.</li>
      </ul>
    </article>
  `,
})
export class ResizablePage {
  protected readonly resizableHorizontalSplitExampleCode = resizableHorizontalSplitExampleCodeRaw;
  protected readonly resizableThreePanesExampleCode = resizableThreePanesExampleCodeRaw;
  protected readonly resizableVerticalSplitExampleCode = resizableVerticalSplitExampleCodeRaw;
  protected readonly resizableGripHandleExampleCode = resizableGripHandleExampleCodeRaw;
  protected readonly resizableGripHandle5ExampleCode = resizableGripHandle5ExampleCodeRaw;
}
