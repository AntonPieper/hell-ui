import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDropZone } from '@hell-ui/angular/drop-zone';

@Component({
  selector: 'app-drop-zone-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <div hellDropzone (files)="onFiles($event)">
      <strong>Drop files here</strong>
      <span class="hd-muted">or click to browse</span>
    </div>
    @if (files().length) {
      <ul class="hd-muted">
        @for (file of files(); track file.name) {
          <li>{{ file.name }} &mdash; {{ (file.size / 1024).toFixed(1) }} KB</li>
        }
      </ul>
    }
  `,
})
export class DropZoneBasicExample {
  protected readonly files = signal<File[]>([]);

  protected onFiles(files: File[]): void {
    this.files.set(files);
  }
}
