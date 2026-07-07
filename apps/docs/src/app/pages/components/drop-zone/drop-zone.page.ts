import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { DropZoneBasicExample } from './examples/basic.example';
import dropZoneBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { DropZoneRestrictedExample } from './examples/restricted.example';
import dropZoneRestrictedExampleCodeRaw from './examples/restricted.example.ts?raw' with {
  loader: 'text',
};
import { DropZoneDisabledExample } from './examples/disabled.example';
import dropZoneDisabledExampleCodeRaw from './examples/disabled.example.ts?raw' with {
  loader: 'text',
};
import { DropZoneNativeInputExample } from './examples/native-input.example';
import dropZoneNativeInputExampleCodeRaw from './examples/native-input.example.ts?raw' with {
  loader: 'text',
};
import { DropZoneUploadQueueExample } from './examples/upload-queue.example';
import dropZoneUploadQueueExampleCodeRaw from './examples/upload-queue.example.ts?raw' with {
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
    PageHeader,
    DropZoneBasicExample,
    DropZoneRestrictedExample,
    DropZoneDisabledExample,
    DropZoneNativeInputExample,
    DropZoneUploadQueueExample,
    DropZoneStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Drop zone"
        icon="faSolidUpload"
        category="Styled primitive"
        importPath="@hell-ui/angular/drop-zone"
        stylesPath="@hell-ui/angular/drop-zone/styles.css"
      >
        Turns any container into a click-or-drop file picker with type filtering and full keyboard
        operability.
      </hd-page-header>
      <p>
        <code>hellDropzone</code> is a directive you attach to a <code>&lt;div&gt;</code> or
        <code>&lt;label&gt;</code>. It manages drag-and-drop state, opens the native OS file
        picker on click or Enter/Space, and emits a single <code>(files)</code> event however the
        files arrived. By default it creates and owns a hidden <code>&lt;input type="file"&gt;</code>
        for you; when you need a form-bound or otherwise consumer-owned input instead, bind
        <code>nativeInput</code> to it and the directive drives that element instead of its
        fallback.
      </p>
      <p>
        Reach for it anywhere a dense business app accepts file uploads: attachment fields,
        document intake, avatar pickers, and bulk-import forms. It owns none of the upload
        itself &mdash; queueing, progress, and network calls stay app-owned &mdash; it only
        normalizes "the user gave me these files" into one event, regardless of pointer or
        keyboard path.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="dropZoneBasicExampleCode">
        <app-drop-zone-basic-example />
      </hd-example-tabs>

      <h2>Restricting file selection</h2>
      <p>
        <code>multiple</code> (default <code>true</code>) caps emitted selections to one file when
        set to <code>false</code>, and <code>accept</code> filters both the native picker and any
        dropped files by extension or MIME type/wildcard. Treat <code>accept</code> as a
        client-side hint only &mdash; a user can still drop a renamed file, so validate again at
        the upload boundary.
      </p>
      <hd-example-tabs [code]="dropZoneRestrictedExampleCode">
        <app-drop-zone-restricted-example />
      </hd-example-tabs>

      <h2>Disabled</h2>
      <p>
        A disabled zone ignores click, keyboard activation, and drag/drop entirely, and clears any
        in-progress drag state immediately.
      </p>
      <hd-example-tabs [code]="dropZoneDisabledExampleCode">
        <app-drop-zone-disabled-example />
      </hd-example-tabs>

      <h2>Native input seam</h2>
      <p>
        Pass an existing <code>HTMLInputElement</code> (or its host-document <code>id</code>) to
        <code>nativeInput</code> to have the directive drive that element &mdash; useful when the
        input must stay in a native <code>&lt;form&gt;</code> or already carries other bindings.
        The directive keeps its picker options (<code>multiple</code>, <code>accept</code>)
        synced onto whichever input is currently bound, and falls back to its auto-created input
        the moment <code>nativeInput</code> becomes <code>null</code>.
      </p>
      <hd-example-tabs [code]="dropZoneNativeInputExampleCode">
        <app-drop-zone-native-input-example />
      </hd-example-tabs>

      <h2>With progress and tag</h2>
      <p>
        A realistic upload queue: dropped files enter a caller-owned list, each with its own
        <code>hellProgress</code> track and a <code>hellTag</code> reflecting status. The drop
        zone stays a thin file source &mdash; all queueing, progress simulation, and removal logic
        lives in the consumer component.
      </p>
      <hd-example-tabs [code]="dropZoneUploadQueueExampleCode">
        <app-drop-zone-upload-queue-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellDropZone</code> exposes exactly one Public Part, <code>root</code> &mdash; the
        host element itself, including its hover, drag, and disabled states. Pass
        <code>ui="..."</code> as shorthand to refine it, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit
        <code>HellDropZoneUi</code> map. Both forms merge on top of the default recipe through
        Hell's Tailwind merge, so refinements win deterministically over the border, background,
        and text-color classes they conflict with.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>root</code></td>
            <td>
              The drop zone host element &mdash; border, background, text color, radius, and
              spacing across resting, drag-active, and disabled states.
            </td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="dropZoneStylingExampleCode" previewClass="grid max-w-md gap-hell-3">
        <app-drop-zone-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>disabled</code>: <code>boolean</code>. Blocks click, keyboard, and drag/drop. Default <code>false</code>.</li>
        <li><code>multiple</code>: <code>boolean</code>. Allows selecting or dropping more than one file. Default <code>true</code>.</li>
        <li>
          <code>accept</code>: <code>string | null</code>. Comma-separated file extensions
          (<code>.pdf</code>), MIME types (<code>image/png</code>), or wildcards
          (<code>image/*</code>) applied to both the native picker and dropped files. Default
          <code>null</code> (no restriction).
        </li>
        <li>
          <code>nativeInput</code>: <code>HTMLInputElement | string | null</code>. A
          consumer-owned file input (element or host-document <code>id</code>) to drive instead of
          the auto-created fallback. Default <code>null</code>.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellDropZonePart&gt;</code> &mdash; a shorthand
          class string or a <code>HellDropZoneUi</code> map (<code>&#123; root: string &#125;</code>)
          that refines the <code>root</code> public part.
        </li>
        <li><code>(files)</code>: <code>EventEmitter&lt;File[]&gt;</code>. Emits accepted files once the user drops or selects them; never emits an empty array.</li>
        <li>
          Exported types: <code>HellDropZonePart</code> (<code>'root'</code>),
          <code>HellDropZoneUi</code> (<code>HellUi&lt;HellDropZonePart&gt;</code>).
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The host renders <code>role="button"</code> with <code>tabindex="0"</code> (or
          <code>-1</code> when disabled), so it participates in the natural tab order like a
          button.
        </li>
        <li>Enter and Space both open the native file picker, mirroring native button activation.</li>
        <li>
          <code>disabled</code> sets both <code>aria-disabled="true"</code> and
          <code>data-disabled="true"</code>, and removes the element from the tab order.
        </li>
        <li>
          Drag state is exposed only through <code>data-active</code> (set while a valid drag is
          over the zone) &mdash; there is no ARIA live announcement, so pair it with visible focus
          and hover styling rather than color alone.
        </li>
        <li>
          The directive supplies no accessible name; give the host visible text content or an
          <code>aria-label</code> describing what to upload.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Always keep the click/keyboard file-picker path available &mdash; never rely on drag and drop alone.</li>
        <li>Treat <code>accept</code> as a client-side hint and re-validate file type/size at the upload boundary.</li>
        <li>Show selected or queued file names outside the drop zone so screen reader users get feedback.</li>
        <li>Use <code>ui</code> instead of conflicting <code>class</code> utilities for visual refinements.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't trust the browser-reported MIME type or file extension as a security boundary.</li>
        <li>Don't nest interactive controls that need their own click handling inside the zone without stopping propagation.</li>
        <li>Don't target private descendants &mdash; <code>root</code> is the only public part.</li>
      </ul>
    </article>
  `,
})
export class DropZonePage {
  protected readonly dropZoneBasicExampleCode = dropZoneBasicExampleCodeRaw;
  protected readonly dropZoneRestrictedExampleCode = dropZoneRestrictedExampleCodeRaw;
  protected readonly dropZoneDisabledExampleCode = dropZoneDisabledExampleCodeRaw;
  protected readonly dropZoneNativeInputExampleCode = dropZoneNativeInputExampleCodeRaw;
  protected readonly dropZoneUploadQueueExampleCode = dropZoneUploadQueueExampleCodeRaw;
  protected readonly dropZoneStylingExampleCode = dropZoneStylingExampleCodeRaw;
}
