import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { DropZoneDisabledExample } from './examples/disabled.example';
import dropZoneDisabledExampleCodeRaw from './examples/disabled.example.ts?raw' with {
  loader: 'text',
};
import { DropZoneExampleExample } from './examples/example.example';
import dropZoneExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text',
};
import { DropZoneSingleFileImagesOnlyExample } from './examples/single-file-images-only.example';
import dropZoneSingleFileImagesOnlyExampleCodeRaw from './examples/single-file-images-only.example.ts?raw' with {
  loader: 'text',
};
import { DropZoneNativeInputExample } from './examples/native-input.example';
import dropZoneNativeInputExampleCodeRaw from './examples/native-input.example.ts?raw' with {
  loader: 'text',
};
import { DropZoneStylingExample } from './examples/styling.example';
import dropZoneStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
@Component({
  selector: 'hd-drop-zone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    DropZoneExampleExample,
    DropZoneNativeInputExample,
    DropZoneSingleFileImagesOnlyExample,
    DropZoneDisabledExample, DropZoneStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Drop zone</h1>
      <p>
        Drag-and-drop file picker. Drop files into the area or click / keyboard-activate to open the
        OS file picker.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="dropZoneExampleExampleCode">
        <app-drop-zone-example-example />
      </hd-example-tabs>

      <h2>Single file, images only</h2>
      <hd-example-tabs [code]="dropZoneSingleFileImagesOnlyExampleCode">
        <app-drop-zone-single-file-images-only-example />
      </hd-example-tabs>

      <h2>Native input seam</h2>
      <hd-example-tabs [code]="dropZoneNativeInputExampleCode">
        <app-drop-zone-native-input-example />
      </hd-example-tabs>

      <h2>Disabled</h2>
      <hd-example-tabs [code]="dropZoneDisabledExampleCode">
        <app-drop-zone-disabled-example />
      </hd-example-tabs>

      <h2>Part style map</h2>
      <p>
        <code>HellDropZoneUi</code> refines the drop zone's <code>root</code> Public Part. Conflicting border and surface utilities replace the recipe defaults while drag, keyboard, and file behavior stay intact.
      </p>
      <hd-example-tabs [code]="dropZoneStylingExampleCode" previewClass="grid max-w-md gap-3">
        <app-drop-zone-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>multiple</code>: allow multiple files (default <code>true</code>)</li>
        <li><code>accept</code>: comma-separated MIME / wildcard / extension filter for picker and emitted files</li>
        <li><code>disabled</code></li>
        <li>
          <code>nativeInput</code>: optional consumer-owned
          <code>HTMLInputElement</code> or host-document
          <code>id</code> of an input to use for file picking
        </li>
        <li><code>(files)</code>: emits picked or dropped files</li>
        <li><code>ui</code>: string or <code>{{ '{' }} root: string {{ '}' }}</code> map</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Keep the native file input path available through click or keyboard.</li>
        <li>Use <code>accept</code> as client-side filtering and validate files again after selection.</li>
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
  protected readonly dropZoneExampleExampleCode = dropZoneExampleExampleCodeRaw;
  protected readonly dropZoneSingleFileImagesOnlyExampleCode =
    dropZoneSingleFileImagesOnlyExampleCodeRaw;
  protected readonly dropZoneNativeInputExampleCode = dropZoneNativeInputExampleCodeRaw;
  protected readonly dropZoneDisabledExampleCode = dropZoneDisabledExampleCodeRaw;
  protected readonly dropZoneStylingExampleCode = dropZoneStylingExampleCodeRaw;
}
