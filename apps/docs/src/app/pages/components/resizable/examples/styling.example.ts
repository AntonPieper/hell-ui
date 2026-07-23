import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  HELL_RESIZABLE_IMPORTS,
  type HellResizableHandleUi,
} from 'hell-ui/resizable';

@Component({
  selector: 'app-resizable-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_IMPORTS],
  template: `
    <!-- Each directive owns its own Part Style Map. The group and panes expose a -->
    <!-- single 'root'; the handle exposes 'root' and 'grip', refined via a map. -->
    <div
      hellResizable
      class="h-64"
      ui="rounded-hell-lg border border-hell-border bg-hell-surface-subtle p-hell-1 gap-hell-1"
    >
      <div hellResizablePane ui="rounded-hell-md bg-hell-surface-elevated p-hell-4 text-sm">
        Left pane
      </div>
      <div hellResizableHandle appearance="grip" [ui]="handleUi"></div>
      <div hellResizablePane ui="rounded-hell-md bg-hell-surface-elevated p-hell-4 text-sm">
        Right pane
      </div>
    </div>
  `,
})
export class ResizableStylingExample {
  protected readonly handleUi: HellResizableHandleUi = {
    root: 'rounded-hell-pill bg-hell-primary-soft',
    grip: 'bg-hell-primary',
  };
}
