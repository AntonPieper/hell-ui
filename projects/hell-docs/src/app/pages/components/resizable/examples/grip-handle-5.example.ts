import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/composites';

@Component({
  selector: 'app-resizable-grip-handle-5-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <div hellResizable orientation="vertical" class="flex h-[260px] flex-col">
      <div hellResizablePane [initialFlex]="1" class="hd-surface-elevated p-4">Editor</div>
      <div hellResizableHandle appearance="grip"></div>
      <div hellResizablePane [initialFlex]="1" class="hd-surface-subtle p-4">Console</div>
    </div>
  `,
})
export class ResizableGripHandle5Example {}
