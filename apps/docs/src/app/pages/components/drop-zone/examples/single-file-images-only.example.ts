import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDropZone } from '@hell-ui/angular/drop-zone';

@Component({
  selector: 'app-drop-zone-single-file-images-only-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <div hellDropzone [multiple]="false" accept="image/*" (files)="onFiles($event)">
      <strong>Choose an image</strong>
      <span class="hd-muted">PNG / JPG / WebP</span>
    </div>
    @if (files()[0]; as file) {
      <p class="hd-muted">Selected: {{ file.name }}</p>
    }
  `,
})
export class DropZoneSingleFileImagesOnlyExample {
  protected readonly files = signal<File[]>([]);
  protected onFiles(f: File[]) {
    this.files.set(f);
  }
}
