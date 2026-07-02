import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/resizable';

@Component({
  selector: 'app-resizable-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <!-- class is the docs layout hook; panes and handle render default styling. -->
    <div hellResizable orientation="horizontal" class="h-60">
      <div hellResizablePane [initialFlex]="1">
        <p class="m-0 p-4 text-sm">Left pane</p>
      </div>
      <div hellResizableHandle></div>
      <div hellResizablePane [initialFlex]="1">
        <p class="m-0 p-4 text-sm">Right pane</p>
      </div>
    </div>
  `,
})
export class ResizableBasicExample {}
