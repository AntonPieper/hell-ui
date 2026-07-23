import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_RESIZABLE_IMPORTS } from 'hell-ui/resizable';

@Component({
  selector: 'app-resizable-min-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_IMPORTS],
  template: `
    <!-- Each handle rebalances only its two adjacent panes; minSize keeps every -->
    <!-- pane usable. Dragging never collapses a neighbour below its minimum. -->
    <div hellResizable class="h-64">
      <div hellResizablePane [initialFlex]="1" [minSize]="140" class="hd-surface-elevated p-hell-4 text-sm">
        Sidebar
      </div>
      <div hellResizableHandle></div>
      <div hellResizablePane [initialFlex]="3" [minSize]="200" class="hd-surface-subtle p-hell-4 text-sm">
        Main
      </div>
      <div hellResizableHandle></div>
      <div hellResizablePane [initialFlex]="2" [minSize]="160" class="hd-surface-elevated p-hell-4 text-sm">
        Inspector
      </div>
    </div>
  `,
})
export class ResizableMinSizesExample {}
