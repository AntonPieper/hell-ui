import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from 'hell';

@Component({
  selector: 'app-resizable-grip-handle-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <div hellResizable orientation="horizontal" class="h-[200px]">
      <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">Sidebar</div>
      <div hellResizableHandle appearance="grip"></div>
      <div hellResizablePane [initialFlex]="2" class="hd-surface-subtle p-4">Main</div>
      <div hellResizableHandle appearance="grip"></div>
      <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">Inspector</div>
    </div>
  `,
})
export class ResizableGripHandleExample {}
