import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/resizable';

@Component({
  selector: 'app-resizable-grip-handle-5-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <div hellResizable orientation="vertical" ui="h-[260px]">
      <div hellResizablePane [initialFlex]="1" ui="hd-surface-elevated p-4">Editor</div>
      <div hellResizableHandle appearance="grip"></div>
      <div hellResizablePane [initialFlex]="1" ui="hd-surface-subtle p-4">Console</div>
    </div>
  `,
})
export class ResizableGripHandle5Example {}
