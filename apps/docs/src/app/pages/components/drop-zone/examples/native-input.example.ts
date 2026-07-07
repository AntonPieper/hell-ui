import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDropZone } from '@hell-ui/angular/drop-zone';

@Component({
  selector: 'app-drop-zone-native-input-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <input type="file" #nativeInput hidden />

    <div hellDropzone [nativeInput]="nativeInput" (files)="onFiles($event)">
      <strong>Bind an existing input</strong>
      <span class="hd-muted">
        <code>nativeInput</code> takes the element (or its <code>id</code>) instead of the
        auto-created fallback.
      </span>
    </div>

    @if (files().length) {
      <ul class="hd-muted">
        @for (file of files(); track file.name) {
          <li>{{ file.name }}</li>
        }
      </ul>
    }
  `,
})
export class DropZoneNativeInputExample {
  protected readonly files = signal<File[]>([]);

  protected onFiles(files: File[]): void {
    this.files.set(files);
  }
}
