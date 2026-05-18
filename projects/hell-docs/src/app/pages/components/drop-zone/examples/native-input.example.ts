import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDropZone } from '@hell-ui/angular/drop-zone';

@Component({
  selector: 'app-drop-zone-native-input-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <input type="file" data-input #nativeInput />

    <div hellDropzone [nativeInput]="nativeInput" (files)="onFiles($event)">
      <strong>Use a consumer-owned input</strong>
      <span class="hd-muted">Bind <code>nativeInput</code> to an existing file input.</span>
    </div>

    @if (files().length) {
      <div>
        <h3>Picked files</h3>
        <ul>
          @for (f of files(); track f.name) {
            <li><code>{{ f.name }}</code></li>
          }
        </ul>
      </div>
    }
  `,
})
export class DropZoneNativeInputExample {
  protected readonly files = signal<File[]>([]);
  protected onFiles(f: File[]) {
    this.files.set(f);
  }
}
