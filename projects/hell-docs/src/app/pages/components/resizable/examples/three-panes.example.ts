import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from 'hell/composites';

@Component({
  selector: 'app-resizable-three-panes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <div hellResizable orientation="horizontal" class="h-[200px]">
      <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">Sidebar</div>
      <div hellResizableHandle></div>
      <div hellResizablePane [initialFlex]="3" class="hd-surface-subtle p-4">Main</div>
      <div hellResizableHandle></div>
      <div hellResizablePane [initialFlex]="2" class="hd-surface-elevated p-4">Inspector</div>
    </div>
  `,
})
export class ResizableThreePanesExample {}
