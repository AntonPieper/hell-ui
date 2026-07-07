import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/resizable';

@Component({
  selector: 'app-resizable-grip-handle-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <!-- appearance="grip" gives the divider a visible pill with a three-dot indicator. -->
    <div hellResizable class="h-64">
      <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-hell-4 text-sm">
        Navigator
      </div>
      <div hellResizableHandle appearance="grip"></div>
      <div hellResizablePane [initialFlex]="2" class="hd-surface-subtle p-hell-4 text-sm">
        Preview
      </div>
    </div>
  `,
})
export class ResizableGripHandleExample {}
