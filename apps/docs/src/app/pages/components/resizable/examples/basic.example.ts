import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_RESIZABLE_IMPORTS } from 'hell-ui/resizable';

@Component({
  selector: 'app-resizable-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_IMPORTS],
  template: `
    <!-- The group fills its container by default (h-full); ui="h-64" gives this -->
    <!-- standalone demo an explicit height through the root Part Style Map. -->
    <div hellResizable ui="h-64">
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
