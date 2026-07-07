import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/resizable';

@Component({
  selector: 'app-resizable-vertical-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <!-- orientation="vertical" stacks panes and turns the handle into a row divider. -->
    <div hellResizable orientation="vertical" class="h-80">
      <div hellResizablePane [initialFlex]="2" class="hd-surface-elevated p-hell-4 text-sm">
        Editor
      </div>
      <div hellResizableHandle></div>
      <div hellResizablePane [initialFlex]="1" class="hd-surface-subtle p-hell-4 text-sm">
        Console output
      </div>
    </div>
  `,
})
export class ResizableVerticalExample {}
