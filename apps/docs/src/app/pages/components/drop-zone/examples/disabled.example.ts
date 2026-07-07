import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellDropZone } from '@hell-ui/angular/drop-zone';

@Component({
  selector: 'app-drop-zone-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <div hellDropzone disabled>
      <strong>Uploads disabled</strong>
      <span class="hd-muted">This area ignores click, keyboard, and drop while disabled.</span>
    </div>
  `,
})
export class DropZoneDisabledExample {}
