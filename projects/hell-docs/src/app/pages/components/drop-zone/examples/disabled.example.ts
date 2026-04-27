import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDropZone } from 'hell';

@Component({
  selector: 'app-drop-zone-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <div hellDropzone disabled>
      <strong>Uploads disabled</strong>
      <span class="hd-muted">This area ignores click, keyboard and drop.</span>
    </div>
  `,
})
export class DropZoneDisabledExample {
  protected readonly files = signal<File[]>([]);
  protected onFiles(f: File[]) {
    this.files.set(f);
  }
}
