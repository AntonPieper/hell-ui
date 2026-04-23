import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDropZone } from 'hell';

@Component({
  selector: 'hd-drop-zone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDropZone],
  template: `
    <article class="hd-prose">
      <h1>Drop zone</h1>
      <p>Drag-and-drop file picker. Drop files into the area or click /
        keyboard-activate to open the OS file picker.</p>

      <h2>Example</h2>
      <div class="hd-example">
        <div hellDropzone (files)="onFiles($event)">
          <strong>Drop files here</strong>
          <span class="hd-muted">or click to browse</span>
        </div>
      </div>

      @if (files().length) {
        <h3>Picked files</h3>
        <ul>
          @for (f of files(); track f.name) {
            <li><code>{{ f.name }}</code> — {{ (f.size / 1024).toFixed(1) }} KB</li>
          }
        </ul>
      }

      <h2>Single file, images only</h2>
      <div class="hd-example">
        <div hellDropzone [multiple]="false" accept="image/*">
          <strong>Choose an image</strong>
          <span class="hd-muted">PNG / JPG / WebP</span>
        </div>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>multiple</code>: allow multiple files (default <code>true</code>)</li>
        <li><code>accept</code>: native MIME filter</li>
        <li><code>disabled</code></li>
        <li><code>(files)</code>: emits picked or dropped files</li>
      </ul>
    </article>
  `,
})
export class DropZonePage {
  protected readonly files = signal<File[]>([]);
  protected onFiles(f: File[]) {
    this.files.set(f);
  }
}
