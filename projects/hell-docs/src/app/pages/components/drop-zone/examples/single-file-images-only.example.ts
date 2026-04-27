import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDropZone } from 'hell';

@Component({
  selector: 'app-drop-zone-single-file-images-only-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <div hellDropzone [multiple]="false" accept="image/*">
      <strong>Choose an image</strong>
      <span class="hd-muted">PNG / JPG / WebP</span>
    </div>
  `,
})
export class DropZoneSingleFileImagesOnlyExample {
  protected readonly files = signal<File[]>([]);
  protected onFiles(f: File[]) {
    this.files.set(f);
  }
}
