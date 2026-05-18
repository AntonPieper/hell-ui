import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDropZone } from '@hell-ui/angular/drop-zone';

@Component({
  selector: 'app-drop-zone-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <div hellDropzone (files)="onFiles($event)">
      <strong>Drop files here</strong>
      <span class="hd-muted">or click to browse</span>
    </div>
    @if (files().length) {
      <div>
        <h3>Picked files</h3>
        <ul>
          @for (f of files(); track f.name) {
            <li>
              <code>{{ f.name }}</code> - {{ (f.size / 1024).toFixed(1) }} KB
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class DropZoneExampleExample {
  protected readonly files = signal<File[]>([]);
  protected onFiles(f: File[]) {
    this.files.set(f);
  }
}
