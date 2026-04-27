import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-resizable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, ...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Resizable</h1>
      <p>
        Pointer-driven resizable panes. Place <code>hellResizableHandle</code> between sibling
        <code>hellResizablePane</code> elements; the handle drags both at once.
      </p>

      <h2>Horizontal split</h2>
      <hd-example-tabs [code]="exampleCodes[0]" flush>
        <div hellResizable orientation="horizontal" class="h-[240px]">
          <div hellResizablePane [initialFlex]="2" class="hd-surface-elevated p-4">Left pane</div>
          <div hellResizableHandle></div>
          <div hellResizablePane [initialFlex]="3" class="hd-surface-subtle p-4">Right pane</div>
        </div>
      </hd-example-tabs>

      <h2>Three panes</h2>
      <hd-example-tabs [code]="exampleCodes[1]" flush>
        <div hellResizable orientation="horizontal" class="h-[200px]">
          <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">Sidebar</div>
          <div hellResizableHandle></div>
          <div hellResizablePane [initialFlex]="3" class="hd-surface-subtle p-4">Main</div>
          <div hellResizableHandle></div>
          <div hellResizablePane [initialFlex]="2" class="hd-surface-elevated p-4">Inspector</div>
        </div>
      </hd-example-tabs>

      <h2>Vertical split</h2>
      <hd-example-tabs [code]="exampleCodes[2]" flush>
        <div hellResizable orientation="vertical" class="flex h-[280px] flex-col">
          <div hellResizablePane [initialFlex]="2" class="hd-surface-elevated p-4">Top pane</div>
          <div hellResizableHandle></div>
          <div hellResizablePane [initialFlex]="1" class="hd-surface-subtle p-4">Bottom pane</div>
        </div>
      </hd-example-tabs>

      <h2>Grip handle</h2>
      <p>
        Set <code>appearance="grip"</code> for a pill-shaped handle with a three-dot indicator. Use
        this when the handle is the primary affordance — e.g. user-resizable inspector panels — and
        the default hairline reads as decorative.
      </p>
      <hd-example-tabs [code]="exampleCodes[3]" flush>
        <div hellResizable orientation="horizontal" class="h-[200px]">
          <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">Sidebar</div>
          <div hellResizableHandle appearance="grip"></div>
          <div hellResizablePane [initialFlex]="2" class="hd-surface-subtle p-4">Main</div>
          <div hellResizableHandle appearance="grip"></div>
          <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">Inspector</div>
        </div>
      </hd-example-tabs>

      <hd-example-tabs [code]="exampleCodes[4]" previewClass="mt-3" flush>
        <div hellResizable orientation="vertical" class="flex h-[260px] flex-col">
          <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">Editor</div>
          <div hellResizableHandle appearance="grip"></div>
          <div hellResizablePane [initialFlex]="1" class="hd-surface-subtle p-4">Console</div>
        </div>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellResizable</code>: <code>orientation</code> (<code>horizontal | vertical</code>)
        </li>
        <li><code>hellResizablePane</code>: <code>initialFlex</code>, <code>minSize</code> (px)</li>
        <li>
          <code>hellResizableHandle</code>: <code>appearance</code> (<code>line | grip</code>) —
          place between two panes
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Set practical <code>minSize</code> on every pane.</li>
        <li>Use grip handles when discoverability matters.</li>
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
  protected readonly exampleCodes = [
    '<div hellResizable orientation="horizontal" class="h-[240px]">\n  <div hellResizablePane [initialFlex]="2" class="hd-surface-elevated p-4">\n    Left pane\n  </div>\n  <div hellResizableHandle></div>\n  <div hellResizablePane [initialFlex]="3" class="hd-surface-subtle p-4">\n    Right pane\n  </div>\n</div>\n',
    '<div hellResizable orientation="horizontal" class="h-[200px]">\n  <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">\n    Sidebar\n  </div>\n  <div hellResizableHandle></div>\n  <div hellResizablePane [initialFlex]="3" class="hd-surface-subtle p-4">\n    Main\n  </div>\n  <div hellResizableHandle></div>\n  <div hellResizablePane [initialFlex]="2" class="hd-surface-elevated p-4">\n    Inspector\n  </div>\n</div>\n',
    '<div hellResizable orientation="vertical" class="flex h-[280px] flex-col">\n  <div hellResizablePane [initialFlex]="2" class="hd-surface-elevated p-4">\n    Top pane\n  </div>\n  <div hellResizableHandle></div>\n  <div hellResizablePane [initialFlex]="1" class="hd-surface-subtle p-4">\n    Bottom pane\n  </div>\n</div>\n',
    '<div hellResizable orientation="horizontal" class="h-[200px]">\n  <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">\n    Sidebar\n  </div>\n  <div hellResizableHandle appearance="grip"></div>\n  <div hellResizablePane [initialFlex]="2" class="hd-surface-subtle p-4">\n    Main\n  </div>\n  <div hellResizableHandle appearance="grip"></div>\n  <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">\n    Inspector\n  </div>\n</div>\n',
    '<div hellResizable orientation="vertical" class="flex h-[260px] flex-col">\n  <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">\n    Editor\n  </div>\n  <div hellResizableHandle appearance="grip"></div>\n  <div hellResizablePane [initialFlex]="1" class="hd-surface-subtle p-4">\n    Console\n  </div>\n</div>\n',
  ] as const;
}
