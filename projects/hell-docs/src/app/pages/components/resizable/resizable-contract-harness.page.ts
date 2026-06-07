import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/resizable';

@Component({
  selector: 'hd-resizable-contract-harness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <section class="grid gap-6 p-6" data-testid="resizable-contract-harness">
      <h1>Resizable contract harness</h1>

      <section aria-labelledby="resizable-ltr-heading" data-testid="resizable-ltr-section">
        <h2 id="resizable-ltr-heading">LTR horizontal resize</h2>
        <div
          hellResizable
          orientation="horizontal"
          class="h-[180px] max-w-[360px]"
          data-testid="resizable-ltr-group"
        >
          <section
            id="resizable-ltr-before"
            hellResizablePane
            [minSize]="120"
            class="hd-surface-elevated p-4"
            data-testid="resizable-ltr-before"
          >
            Before pane
          </section>
          <div
            hellResizableHandle
            [aria-controls]="['resizable-ltr-before', 'resizable-ltr-after']"
            data-testid="resizable-ltr-handle"
          ></div>
          <section
            id="resizable-ltr-after"
            hellResizablePane
            [minSize]="120"
            class="hd-surface-subtle p-4"
            data-testid="resizable-ltr-after"
          >
            After pane
          </section>
        </div>
      </section>

      <section aria-labelledby="resizable-rtl-heading" data-testid="resizable-rtl-section">
        <h2 id="resizable-rtl-heading">RTL horizontal resize</h2>
        <div
          hellResizable
          orientation="horizontal"
          dir="rtl"
          class="h-[180px] max-w-[360px]"
          data-testid="resizable-rtl-group"
        >
          <section
            id="resizable-rtl-before"
            hellResizablePane
            [minSize]="120"
            class="hd-surface-elevated p-4"
            data-testid="resizable-rtl-before"
          >
            RTL before pane
          </section>
          <div
            hellResizableHandle
            [aria-controls]="['resizable-rtl-before', 'resizable-rtl-after']"
            data-testid="resizable-rtl-handle"
          ></div>
          <section
            id="resizable-rtl-after"
            hellResizablePane
            [minSize]="120"
            class="hd-surface-subtle p-4"
            data-testid="resizable-rtl-after"
          >
            RTL after pane
          </section>
        </div>
      </section>
    </section>
  `,
})
export class ResizableContractHarnessPage {}
