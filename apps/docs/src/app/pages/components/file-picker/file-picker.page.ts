import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { FilePickerBasicExample } from './examples/basic.example';
import filePickerBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { FilePickerDisabledExample } from './examples/disabled.example';
import filePickerDisabledExampleCodeRaw from './examples/disabled.example.ts?raw' with {
  loader: 'text',
};
import { FilePickerStylingExample } from './examples/styling.example';
import filePickerStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { FilePickerValidationExample } from './examples/validation.example';
import filePickerValidationExampleCodeRaw from './examples/validation.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-file-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    FilePickerBasicExample,
    FilePickerDisabledExample,
    FilePickerStylingExample,
    FilePickerValidationExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="File Picker"
        icon="faSolidUpload"
        category="Styled primitive"
        importPath="@hell-ui/angular/file-picker"
        stylesPath="@hell-ui/angular/file-picker/styles.css"
      >
        One directive-first Interface for drop and native browse acquisition, synchronous
        validation, and structured per-batch results.
      </hd-page-header>

      <p>
        Attach <code>hellFilePicker</code> to a consumer-owned host. The directive makes the host
        keyboard-operable, manages drag state, and owns one internal native file input that can be
        opened from the host or through <code>hellFilePicker.open()</code>. Both acquisition paths
        pass through the same validation pipeline and emit the same
        <code>HellFileSelection</code> shape.
      </p>
      <p>
        File Picker stops at acquisition. Upload queues, total workflow capacity, progress,
        retry, removal, requests, and server errors remain application-owned. In particular,
        <code>maxFiles</code> applies independently to each acquired batch; it never reads or
        subtracts from an accumulated queue.
      </p>

      <h2>Drop and browse</h2>
      <p>
        The whole host opens the platform chooser on click, Enter, or Space. Export the directive
        as <code>hellFilePicker</code> when a separate consumer-owned action should call the same
        internal chooser. The internal input is reset after every change so selecting the same
        file again still produces a new acquisition.
      </p>
      <p>
        Keep separate browse actions as siblings of the picker host. Bubbled clicks from projected
        interactive descendants stay with those controls, while ordinary projected text and icons
        still activate the picker. Prefer the sibling shape because the picker host is itself one
        button-like accessible target.
      </p>
      <hd-example-tabs [code]="basicExampleCode" previewClass="grid max-w-xl gap-hell-3">
        <app-file-picker-basic-example />
      </hd-example-tabs>

      <h2>One validation path</h2>
      <p>
        <code>accept</code> matches extensions, exact MIME types, and wildcard MIME families.
        <code>maxBytes</code> is a per-file limit. <code>maxFiles</code> is a per-batch limit, and
        <code>multiple=false</code> makes that effective limit one. A synchronous
        <code>validate</code> function can return a message for application policy failures. Type,
        size, and custom failures are evaluated before count, so invalid files keep their specific
        reasons and do not consume a valid-file slot.
      </p>
      <hd-example-tabs [code]="validationExampleCode" previewClass="grid max-w-xl gap-hell-3">
        <app-file-picker-validation-example />
      </hd-example-tabs>

      <h3>Selection result</h3>
      <pre tabindex="0"><code>interface HellFileSelection &#123;
  readonly accepted: readonly File[];
  readonly rejected: readonly HellFileRejection[];
&#125;

interface HellFileRejection &#123;
  readonly file: File;
  readonly reason: 'type' | 'size' | 'count' | 'custom';
  readonly message?: string;
&#125;</code></pre>
      <p>
        One enabled <code>drop</code> or native <code>change</code> event produces exactly one
        <code>(selection)</code> emission. This includes an all-rejected batch and an empty batch,
        which emits empty <code>accepted</code> and <code>rejected</code> arrays. A platform chooser
        cancel normally does not fire <code>change</code>, so cancel itself produces no event.
      </p>

      <h2>Disabled</h2>
      <p>
        Disabled pickers leave the tab order, clear drag state, keep their internal native input
        disabled, and ignore click, keyboard, native change, and drop acquisition.
      </p>
      <hd-example-tabs [code]="disabledExampleCode" previewClass="grid max-w-xl gap-hell-3">
        <app-file-picker-disabled-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        The directive exposes one stable Public Part, <code>root</code>, with
        <code>data-slot="root"</code>. Use a shorthand <code>ui="..."</code> string or an explicit
        <code>&#123; root?: string &#125;</code> Part Style Map. Stable
        <code>data-dragging="true"</code> and <code>data-disabled="true"</code> attributes let the
        root recipe style behavior without exposing the private native input.
      </p>
      <hd-example-tabs [code]="stylingExampleCode" previewClass="grid max-w-xl gap-hell-3">
        <app-file-picker-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Interface</th>
            <th>Type</th>
            <th>Contract</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>accept</code></td>
            <td><code>string | null</code></td>
            <td>Comma-separated extension, exact MIME, or MIME-family tokens.</td>
          </tr>
          <tr>
            <td><code>multiple</code></td>
            <td><code>boolean</code></td>
            <td>Native chooser hint and effective one-file limit when false. Default true.</td>
          </tr>
          <tr>
            <td><code>maxBytes</code></td>
            <td><code>number | null</code></td>
            <td>Maximum size of each accepted file in bytes.</td>
          </tr>
          <tr>
            <td><code>maxFiles</code></td>
            <td><code>number | null</code></td>
            <td>Maximum valid files accepted from this batch only.</td>
          </tr>
          <tr>
            <td><code>disabled</code></td>
            <td><code>boolean</code></td>
            <td>Blocks every acquisition path. Default false.</td>
          </tr>
          <tr>
            <td><code>validate</code></td>
            <td><code>HellFileValidator | null</code></td>
            <td>Synchronous function; a returned message becomes a custom rejection.</td>
          </tr>
          <tr>
            <td><code>ui</code></td>
            <td><code>HellUiInput&lt;'root'&gt;</code></td>
            <td>Class shorthand or root Part Style Map.</td>
          </tr>
          <tr>
            <td><code>(selection)</code></td>
            <td><code>HellFileSelection</code></td>
            <td>One accepted/rejected result for one drop or native change.</td>
          </tr>
          <tr>
            <td><code>open()</code></td>
            <td><code>() =&gt; void</code></td>
            <td>Opens the internal chooser only while enabled.</td>
          </tr>
        </tbody>
      </table>

      <h2>Labels and announcements</h2>
      <p>
        <code>HELL_FILE_PICKER_LABELS</code> owns built-in rejection messages and polite accepted
        and rejected count announcements. Override any subset with
        <code>provideHellLabels(HELL_FILE_PICKER_LABELS, overrides)</code>. A custom validator owns
        its own returned message; File Picker assigns its structured <code>custom</code> reason.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The host has <code>role="button"</code> and participates in the tab order. Enter and
          Space open the same native chooser used by click and <code>open()</code>.
        </li>
        <li>
          Give the host an accessible name through visible text, <code>aria-label</code>, or
          <code>aria-labelledby</code>. The directive does not replace consumer-owned copy.
        </li>
        <li>
          Disabled state is reflected through <code>aria-disabled="true"</code>,
          <code>data-disabled="true"</code>, and <code>tabindex="-1"</code>.
        </li>
        <li>
          Accepted and rejected counts are announced politely once per non-empty result. Render
          file names and detailed rejection messages in application-owned status content.
        </li>
        <li>
          Keep the browse path available. Drag and drop is an enhancement, never the only way to
          acquire files.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use the structured reasons to render precise, application-owned feedback.</li>
        <li>Use <code>maxFiles</code> for one batch and enforce total queue capacity in your app.</li>
        <li>Validate type, content, and authorization again at the trusted server boundary.</li>
        <li>Use <code>ui</code> and the stable state attributes for visual refinements.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't store upload progress, retry state, or server errors on File Picker.</li>
        <li>Don't use an async validator to turn acquisition into an upload-policy workflow.</li>
        <li>Don't treat extension or browser-reported MIME checks as a security boundary.</li>
        <li>Don't style or query the internal native input; it is a private acquisition seam.</li>
      </ul>
    </article>
  `,
})
export class FilePickerPage {
  protected readonly basicExampleCode = filePickerBasicExampleCodeRaw;
  protected readonly validationExampleCode = filePickerValidationExampleCodeRaw;
  protected readonly disabledExampleCode = filePickerDisabledExampleCodeRaw;
  protected readonly stylingExampleCode = filePickerStylingExampleCodeRaw;
}
