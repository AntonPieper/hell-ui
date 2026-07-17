import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_RESIZABLE_IMPORTS } from '@hell-ui/angular/resizable';

@Component({
  selector: 'app-resizable-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_IMPORTS],
  template: `
    <!-- The group needs an explicit main-axis size; h-64 is the docs layout hook. -->
    <div hellResizable class="h-64">
      <div hellResizablePane class="p-hell-4">
        <p class="m-0 text-sm">Drag the divider to resize.</p>
      </div>
      <div hellResizableHandle></div>
      <div hellResizablePane class="p-hell-4">
        <p class="m-0 text-sm">Focus it and use the arrow keys.</p>
      </div>
    </div>
  `,
})
export class ResizableBasicExample {}
