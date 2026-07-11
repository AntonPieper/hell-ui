import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FileUploadAdapterExample } from './examples/upload-adapter.example';
import fileUploadAdapterExampleCodeRaw from './examples/upload-adapter.example.ts?raw' with {
  loader: 'text',
};
import { FileUploadSingleFileExample } from './examples/single-file.example';
import fileUploadSingleFileExampleCodeRaw from './examples/single-file.example.ts?raw' with {
  loader: 'text',
};
import { FileUploadStylingExample } from './examples/styling.example';
import fileUploadStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'hd-file-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    FileUploadAdapterExample,
    FileUploadSingleFileExample,
    FileUploadStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="File upload"
        icon="faSolidFileArrowUp"
        category="Composite"
        importPath="@hell-ui/angular/file-upload"
        stylesPath="@hell-ui/angular/file-upload/styles.css"
      >
        A drop zone with a managed file list: users add files by drag-drop or the Browse button,
        invalid files are rejected inline with a readable reason, and each accepted item renders
        the consumer-fed name, size, progress, status, and Remove/Retry affordances.
      </hd-page-header>
      <p>
        <code>hell-file-upload</code> performs no HTTP. It is fully controlled: the consumer holds
        <code>items: HellFileUploadItem[]</code> and feeds per-file transport state
        (<code>status</code>, <code>progress</code>, <code>error</code>) in, while the component
        renders the chrome and emits the four seam outputs —
        <code>filesAdded</code> (validated files), <code>rejected</code> (a file plus a
        machine-readable reason), <code>removed</code>, and <code>retried</code>. The component
        never mutates an item; that is the TanStack-shell split — Hell owns the chrome, the app owns
        the engine.
      </p>
      <p>
        Validation runs identically for the drop and Browse paths: the accept list (extensions such
        as <code>.pdf</code> and MIME types such as <code>image/*</code>), <code>maxBytes</code>,
        and <code>maxFiles</code>. A violation emits <code>rejected</code> and renders a transient
        inline rejection row with the Label Contract reason — not a toast — so the user sees exactly
        which file failed and why. Multi-file is first-class; <code>maxFiles="1"</code> makes the
        control single-file and drops the hidden input's <code>multiple</code> attribute.
      </p>

      <h2>Reference integration: a mock upload adapter</h2>
      <p>
        The component is a controlled shell, so wiring it to a transport is the whole integration.
        This adapter drives each file's <code>status</code> and <code>progress</code> from a
        simulated transfer and hands them back through <code>items</code>; swap the timers for a
        real <code>XMLHttpRequest</code> with an <code>upload.onprogress</code> handler (or a
        <code>fetch</code> with a streamed body) and the template does not change. The session
        starts with one finished upload and one the mock server rejected, so the done and
        error states — and the Retry affordance — are visible immediately. Add an image or PDF to
        watch a live upload; a wrong type or a file over 5&nbsp;MB is rejected inline.
      </p>
      <hd-example-tabs [code]="fileUploadAdapterExampleCode">
        <app-file-upload-adapter-example />
      </hd-example-tabs>
      <p>
        Retry is a signal, not a mutation: the component emits <code>retried</code> with the item
        id and the adapter resets that item to <code>uploading</code> and re-runs the transfer.
        Remove emits <code>removed</code>; the consumer drops the item (canceling any in-flight
        request). Because <code>items</code> is the single source of truth, optimistic UI,
        resumable uploads, and concurrency limits all live in the adapter without touching the
        component.
      </p>

      <h2>Single-file mode</h2>
      <p>
        Set <code>maxFiles="1"</code> for avatar pickers, a fax PDF, or any one-file field. The
        hidden input loses <code>multiple</code>, the list holds at most one item, and a second
        pick while one is present is rejected with the count reason. Everything else — progress,
        Remove, Retry — behaves the same.
      </p>
      <hd-example-tabs [code]="fileUploadSingleFileExampleCode">
        <app-file-upload-single-file-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>hell-file-upload</code> owns twelve Public Parts. Its <code>ui</code> input takes
        either a shorthand class string (applied to <code>root</code>) or a map keyed by the part
        names below; refinements merge deterministically through Hell's Tailwind merge. Per-item
        state is exposed as <code>data-status</code> on the <code>item</code> and
        <code>itemIcon</code> parts (<code>pending</code>, <code>uploading</code>,
        <code>done</code>, <code>error</code>, and <code>rejected</code> for transient rows).
      </p>
      <hd-example-tabs [code]="fileUploadStylingExampleCode">
        <app-file-upload-styling-example />
      </hd-example-tabs>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th><code>data-slot</code></th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>root</code></td><td><code>root</code></td><td>The composite host — the column holding the drop zone, Browse button, and list.</td></tr>
          <tr><td><code>dropzone</code></td><td><code>dropzone</code></td><td>The drag-and-drop area (the composed drop-zone directive's host).</td></tr>
          <tr><td><code>browse</code></td><td><code>browse</code></td><td>The built-in Browse button (the button primitive).</td></tr>
          <tr><td><code>list</code></td><td><code>list</code></td><td>The <code>&lt;ul&gt;</code> of rejection rows and file items.</td></tr>
          <tr><td><code>item</code></td><td><code>item</code></td><td>One list row; carries <code>data-status</code>.</td></tr>
          <tr><td><code>itemIcon</code></td><td><code>itemIcon</code></td><td>The per-file glyph (file, done, error); carries <code>data-status</code>.</td></tr>
          <tr><td><code>itemName</code></td><td><code>itemName</code></td><td>The file name.</td></tr>
          <tr><td><code>itemMeta</code></td><td><code>itemMeta</code></td><td>The size and status text.</td></tr>
          <tr><td><code>itemProgress</code></td><td><code>itemProgress</code></td><td>The progressbar, rendered while uploading (the progress primitive).</td></tr>
          <tr><td><code>itemError</code></td><td><code>itemError</code></td><td>The error message, or a transient rejection reason.</td></tr>
          <tr><td><code>itemRemove</code></td><td><code>itemRemove</code></td><td>The Remove button (built-in × glyph via CSS mask).</td></tr>
          <tr><td><code>itemRetry</code></td><td><code>itemRetry</code></td><td>The Retry button on errored items (built-in refresh glyph via CSS mask).</td></tr>
        </tbody>
      </table>

      <h2>API</h2>
      <ul>
        <li>
          <code>&lt;hell-file-upload&gt;</code> — the owned-anatomy Composite.
          <ul>
            <li>
              <code>items</code>: <code>HellFileUploadItem[]</code> (controlled). Each item carries
              <code>id</code>, optional <code>file</code>, <code>name</code>, <code>size</code>,
              <code>status</code> (<code>'pending' | 'uploading' | 'done' | 'error'</code>),
              optional <code>progress</code> (0–1), and optional <code>error</code>. Default
              <code>[]</code>.
            </li>
            <li>
              <code>accept</code>: <code>string | null</code>. Comma-separated extensions and/or MIME
              types (<code>.pdf</code>, <code>image/png</code>, <code>image/*</code>). Default
              <code>null</code> (any type).
            </li>
            <li>
              <code>maxBytes</code>: <code>number | null</code>. Per-file size limit. Default
              <code>null</code> (no limit).
            </li>
            <li>
              <code>maxFiles</code>: <code>number | null</code>. Maximum item count; also derives the
              hidden input's <code>multiple</code> attribute (<code>1</code> is single-file). Default
              <code>null</code> (no limit).
            </li>
            <li><code>disabled</code>: <code>boolean</code>. Gates the drop zone, Browse, and per-item actions. Default <code>false</code>.</li>
            <li>
              <code>ui</code>: <code>HellUiInput&lt;HellFileUploadPart&gt;</code> where
              <code>HellFileUploadPart</code> is the twelve-part union above. Exports
              <code>HellFileUploadUi</code>.
            </li>
            <li>
              <code>(filesAdded)</code>: <code>File[]</code> — files that passed validation. The
              consumer performs the transfer.
            </li>
            <li>
              <code>(rejected)</code>: <code>HellFileUploadRejection</code> —
              <code>&#123; file, reason &#125;</code> where <code>reason</code> is
              <code>'type' | 'size' | 'count'</code>. Emitted once per rejected file.
            </li>
            <li><code>(removed)</code>, <code>(retried)</code>: <code>string</code> — the id of the item whose Remove/Retry was activated.</li>
          </ul>
        </li>
        <li>
          <code>provideHellFileUploadLabels(overrides)</code> — override any subset of the built-in
          strings, rejection reasons, and announcements (<code>HellFileUploadLabels</code>) for an
          injector scope. Exposed token: <code>HELL_FILE_UPLOAD_LABELS</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          Both entry paths are operable without a pointer: the drop zone is a focusable
          <code>role="button"</code> that opens the picker on Enter/Space, and the Browse button,
          each Remove, and each Retry are focusable native buttons with Label Contract accessible
          names.
        </li>
        <li>
          Additions, rejections, and done/error transitions are announced politely through the CDK
          LiveAnnouncer — the list is not a live region, so it never interrupts typing or produces
          announcement storms.
        </li>
        <li>
          Each uploading item exposes a <code>progressbar</code> with an accessible name and
          <code>aria-valuenow</code>, so "how far along" is perceivable, not visual-only.
        </li>
        <li>
          Status is conveyed as localized text (Pending / Uploading / Done / Failed) alongside the
          glyph and color, so it does not rely on color alone.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Own the transfer in an adapter and feed <code>status</code>/<code>progress</code> back through <code>items</code>.</li>
        <li>Reset the item to <code>uploading</code> when you handle <code>retried</code>; re-validate at the upload boundary.</li>
        <li>Use <code>maxFiles="1"</code> for single-file fields instead of building a separate control.</li>
        <li>Refine layout through the <code>ui</code> Part Style Map rather than conflicting <code>class</code> utilities.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't mutate <code>items</code> from the component's perspective — treat the array as controlled state you own.</li>
        <li>Don't trust <code>accept</code> or the browser MIME type as a security boundary; validate again server-side.</li>
        <li>Don't put upload transport, chunking, or concurrency logic in the template — that is the adapter's job.</li>
      </ul>
    </article>
  `,
})
export class FileUploadPage {
  protected readonly fileUploadAdapterExampleCode = fileUploadAdapterExampleCodeRaw;
  protected readonly fileUploadSingleFileExampleCode = fileUploadSingleFileExampleCodeRaw;
  protected readonly fileUploadStylingExampleCode = fileUploadStylingExampleCodeRaw;
}
