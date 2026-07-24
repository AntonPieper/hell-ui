import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_RESIZABLE_IMPORTS } from 'hell-ui/resizable';

@Component({
  selector: 'app-resizable-vertical-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_IMPORTS],
  template: `
    <!-- orientation="vertical" stacks panes and turns the handle into a row divider. -->
    <!-- ui="h-80" overrides the root recipe's h-full so the stack gets real height. -->
    <div hellResizable orientation="vertical" ui="h-80">
      <div
        hellResizablePane
        [initialFlex]="2"
        tabindex="0"
        class="hd-surface-elevated p-hell-4 text-sm"
      >
        Editor
      </div>
      <div hellResizableHandle></div>
      <div
        hellResizablePane
        [initialFlex]="1"
        tabindex="0"
        class="hd-surface-subtle p-hell-4 text-sm"
      >
        Console output
      </div>
    </div>
  `,
})
export class ResizableVerticalExample {}
