import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';
import { ExampleTabs } from '../../../shared/example-tabs';

import { CodeBlock } from '../../../shared/code-block';
import { CodeViewerDemo } from './examples/code-viewer-demo.example';
import codeViewerDemoCode from './examples/code-viewer-demo.example.ts?raw' with { loader: 'text' };
import { EditorDemo } from './examples/editor-demo.example';
import editableAngularTemplateCode from './examples/editor-demo.example.ts?raw' with {
  loader: 'text',
};
@Component({
  selector: 'hd-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, EditorDemo, CodeBlock, CodeViewerDemo],
  template: `
    <article class="hd-prose">
      <h1>Code editor</h1>
      <p>
        CodeMirror 6 wrapped behind a signal-based Angular component. The core editor ships shell,
        history, line numbers, keyboard bindings and the hell theme. Language modes are supplied by
        the caller through <code>[extensions]</code>, so apps only install the languages they use.
      </p>

      <h2>Editable Angular template</h2>
      <hd-example-tabs [code]="editorDemoCode" flush>
        <app-editor-demo />
      </hd-example-tabs>

      <h2>Read-only viewer</h2>
      <hd-example-tabs [code]="codeViewerDemoCode" flush>
        <app-code-viewer-demo />
      </hd-example-tabs>

      <h2>Supplying a language</h2>
      <p class="m-0 text-sm text-hell-foreground-muted">
        Install <code>@codemirror/lang-javascript</code> in the app and pass
        <code>javascript()</code> to <code>[extensions]</code>. The hell package does not depend on
        Angular, JavaScript, JSON, CSS or HTML language modes.
      </p>
      <hd-code-block [code]="supplyingALanguage" />

      <h2>API</h2>
      <ul>
        <li><code>value</code>: editor document as a string.</li>
        <li><code>(valueChange)</code>: emits on user edits.</li>
        <li>
          <code>extensions</code>: CodeMirror <code>Extension</code> supplied by the caller, e.g.
          <code>javascript()</code>.
        </li>
        <li><code>readOnly</code>: disables editing and renders viewer styling.</li>
        <li><code>unstyled</code>: removes hell host classes but keeps CodeMirror setup.</li>
        <li>
          <code>hellCodeEditorSetupFactory(document)</code>: preferred setup export when an app
          needs a specific document or shadow-root owner; <code>hellCodeEditorSetup</code> remains
          as browser-global legacy compatibility.
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Install language packages in the app using the editor, not in the reusable library.</li>
        <li>Keep extension arrays stable when possible so reconfiguration is intentional.</li>
        <li>Use <code>readOnly</code> for docs, audit trails and generated-code viewers.</li>
        <li>Use <code>hellCodeEditorSetupFactory</code> instead of module-global setup for shadow DOM, iframe, or after-hydration document contexts.</li>
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
  protected readonly editorDemoCode = editableAngularTemplateCode;
  protected readonly codeViewerDemoCode = codeViewerDemoCode;
  protected readonly supplyingALanguage = `import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';

readonly javascriptExtensions: Extension = javascript();
`;

  protected readonly javascriptExtensions: Extension = javascript({ jsx: true, typescript: true });
}
