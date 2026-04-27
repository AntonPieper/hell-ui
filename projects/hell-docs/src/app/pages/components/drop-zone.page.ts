import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDropZone } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-drop-zone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellDropZone],
  template: `
    <article class="hd-prose">
      <h1>Drop zone</h1>
      <p>
        Drag-and-drop file picker. Drop files into the area or click / keyboard-activate to open the
        OS file picker.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="exampleCodes[0]">
        <div hellDropzone (files)="onFiles($event)">
          <strong>Drop files here</strong>
          <span class="hd-muted">or click to browse</span>
        </div>
      </hd-example-tabs>

      @if (files().length) {
        <h3>Picked files</h3>
        <ul>
          @for (f of files(); track f.name) {
            <li>
              <code>{{ f.name }}</code> — {{ (f.size / 1024).toFixed(1) }} KB
            </li>
          }
        </ul>
      }

      <h2>Single file, images only</h2>
      <hd-example-tabs [code]="exampleCodes[1]">
        <div hellDropzone [multiple]="false" accept="image/*">
          <strong>Choose an image</strong>
          <span class="hd-muted">PNG / JPG / WebP</span>
        </div>
      </hd-example-tabs>

      <h2>Disabled</h2>
      <hd-example-tabs [code]="exampleCodes[2]">
        <div hellDropzone disabled>
          <strong>Uploads disabled</strong>
          <span class="hd-muted">This area ignores click, keyboard and drop.</span>
        </div>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>multiple</code>: allow multiple files (default <code>true</code>)</li>
        <li><code>accept</code>: native MIME filter</li>
        <li><code>disabled</code></li>
        <li><code>(files)</code>: emits picked or dropped files</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Keep the native file input path available through click or keyboard.</li>
        <li>Use <code>accept</code> as a hint and validate files again after selection.</li>
        <li>Show selected file names outside the drop zone.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't rely on drag and drop as the only upload path.</li>
        <li>Don't trust MIME type or extension from the browser.</li>
      </ul>
    </article>
  `,
})
export class DropZonePage {
  protected readonly exampleCodes = [
    '<div hellDropzone>\n  <strong>Drop files here</strong>\n  <span class="hd-muted">or click to browse</span>\n</div>\n',
    '<div hellDropzone [multiple]="false" accept="image/*">\n  <strong>Choose an image</strong>\n  <span class="hd-muted">PNG / JPG / WebP</span>\n</div>\n',
    '<div hellDropzone disabled>\n  <strong>Uploads paused</strong>\n  <span class="hd-muted">Try again later</span>\n</div>\n',
  ] as const;
  protected readonly files = signal<File[]>([]);
  protected onFiles(f: File[]) {
    this.files.set(f);
  }
}
