import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from 'hell/composites';

@Component({
  selector: 'app-resizable-vertical-split-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <div hellResizable orientation="vertical" class="flex h-[280px] flex-col">
      <div hellResizablePane [initialFlex]="2" class="hd-surface-elevated p-4">Top pane</div>
      <div hellResizableHandle></div>
      <div hellResizablePane [initialFlex]="1" class="hd-surface-subtle p-4">Bottom pane</div>
    </div>
  `,
})
export class ResizableVerticalSplitExample {}
