import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/resizable';

@Component({
  selector: 'app-resizable-horizontal-split-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <div hellResizable orientation="horizontal" ui="h-[240px]">
      <div hellResizablePane [initialFlex]="2" ui="hd-surface-elevated p-4">Left pane</div>
      <div hellResizableHandle></div>
      <div hellResizablePane [initialFlex]="3" ui="hd-surface-subtle p-4">Right pane</div>
    </div>
  `,
})
export class ResizableHorizontalSplitExample {}
