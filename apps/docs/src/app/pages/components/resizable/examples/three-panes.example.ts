import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/resizable';

@Component({
  selector: 'app-resizable-three-panes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <div hellResizable orientation="horizontal" ui="h-[200px]">
      <div hellResizablePane [initialFlex]="1" ui="hd-surface-elevated p-4">Sidebar</div>
      <div hellResizableHandle></div>
      <div hellResizablePane [initialFlex]="3" ui="hd-surface-subtle p-4">Main</div>
      <div hellResizableHandle></div>
      <div hellResizablePane [initialFlex]="2" ui="hd-surface-elevated p-4">Inspector</div>
    </div>
  `,
})
export class ResizableThreePanesExample {}
