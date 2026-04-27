import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { angular } from '@codemirror/lang-angular';
import { type Extension } from '@codemirror/state';
import { HellCodeEditor } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellCodeEditor],
  template: `
    <article class="hd-prose">
      <h1>Code editor</h1>
      <p>
        CodeMirror 6 wrapped behind a signal-based Angular component. The core editor ships shell,
        history, line numbers, keyboard bindings and the hell theme. Language modes are supplied by
        the caller through <code>[extensions]</code>, so apps only install the languages they use.
      </p>

      <h2>Editable Angular template</h2>
      <hd-example-tabs [code]="exampleCodes[0]" flush>
        <hell-code-editor
          [value]="snippet()"
          [extensions]="angularExtensions"
          (valueChange)="snippet.set($event)"
          class="block"
        />
      </hd-example-tabs>
      <p class="hd-note">Length: {{ snippet().length }} chars</p>

      <h2>Read-only viewer</h2>
      <hd-example-tabs [code]="exampleCodes[1]" flush>
        <hell-code-editor
          [value]="viewerCode"
          [extensions]="angularExtensions"
          readOnly
          class="block"
        />
      </hd-example-tabs>

      <h2>Supplying a language</h2>
      <hd-example-tabs [code]="exampleCodes[2]" previewClass="grid gap-2">
        <p class="m-0 text-sm text-hell-foreground-muted">
          Install <code>@codemirror/lang-angular</code> in the app and pass
          <code>angular()</code> to <code>[extensions]</code>. The hell package does not depend on
          Angular, JavaScript, JSON, CSS or HTML language modes.
        </p>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>value</code>: editor document as a string.</li>
        <li><code>(valueChange)</code>: emits on user edits.</li>
        <li>
          <code>extensions</code>: CodeMirror <code>Extension</code> supplied by the caller, e.g.
          <code>angular()</code>.
        </li>
        <li><code>readOnly</code>: disables editing and renders viewer styling.</li>
        <li><code>unstyled</code>: removes hell host classes but keeps CodeMirror setup.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Install language packages in the app using the editor, not in the reusable library.</li>
        <li>Keep extension arrays stable when possible so reconfiguration is intentional.</li>
        <li>Use <code>readOnly</code> for docs, audit trails and generated-code viewers.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't bundle every CodeMirror language mode into a shared component package.</li>
        <li>Don't recreate the editor to change value or language; pass new inputs instead.</li>
      </ul>
    </article>
  `,
})
export class CodeEditorPage {
  protected readonly exampleCodes = [
    "import { Component, signal } from '@angular/core';\nimport { angular } from '@codemirror/lang-angular';\nimport { type Extension } from '@codemirror/state';\nimport { HellCodeEditor } from 'hell';\n\n@Component({\n  selector: 'app-editor-demo',\n  imports: [HellCodeEditor],\n  template: `\n    <hell-code-editor\n      [value]=\"snippet()\"\n      [extensions]=\"angularExtensions\"\n      (valueChange)=\"snippet.set($event)\"\n    />\n  `,\n})\nexport class EditorDemo {\n  readonly angularExtensions: Extension = angular();\n  readonly snippet = signal(`<button hellButton variant=\"primary\">Save</button>\n`);\n}\n",
    "import { Component } from '@angular/core';\nimport { angular } from '@codemirror/lang-angular';\nimport { type Extension } from '@codemirror/state';\nimport { HellCodeEditor } from 'hell';\n\n@Component({\n  selector: 'app-code-viewer-demo',\n  imports: [HellCodeEditor],\n  template: `\n    <hell-code-editor\n      [value]=\"viewerCode\"\n      [extensions]=\"angularExtensions\"\n      readOnly\n    />\n  `,\n})\nexport class CodeViewerDemo {\n  readonly angularExtensions: Extension = angular();\n  readonly viewerCode = `<button hellButton variant=\"primary\">Save</button>\n`;\n}\n",
    "import { angular } from '@codemirror/lang-angular';\nimport { type Extension } from '@codemirror/state';\n\nreadonly angularExtensions: Extension = angular();\n",
  ] as const;

  protected readonly angularExtensions: Extension = angular();
  protected readonly snippet = signal(`<section hellCard>
  <div hellCardHeader>Deploy window</div>
  <div hellCardBody>
    Ship frontend assets after tests pass.
  </div>
</section>
`);
  protected readonly viewerCode = `<button hellButton variant="primary">
  Save changes
</button>
`;
}
