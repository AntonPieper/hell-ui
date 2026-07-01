import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
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
import { CodeEditorStylingExample } from './examples/styling.example';
import codeEditorStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
@Component({
  selector: 'hd-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      @import '@hell-ui/angular/features/code-editor/styles.css';
    `,
  ],
  imports: [ExampleTabs, EditorDemo, CodeBlock, CodeViewerDemo, CodeEditorStylingExample],
  template: `
    <article class="hd-prose">
      <h1>Code editor</h1>
      <p>
        CodeMirror 6 wrapped behind a signal-based Angular component. The core editor ships shell,
        history, line numbers, keyboard bindings and the hell theme. Language modes are supplied by
        the caller through <code>[extensions]</code>, so apps only install the languages they use.
      </p>

      <p>
        This feature requires exact CodeMirror peers: <code>@codemirror/commands</code>,
        <code>@codemirror/language</code>, <code>@codemirror/state</code>,
        <code>@codemirror/view</code>, and <code>@lezer/highlight</code>.
      </p>

      <p>
        <code>@hell-ui/angular/features/code-editor</code> is a kept optional entry point. Do not
        re-export it from root, composites, or other feature barrels; import it only where the
        editor is intentionally used.
      </p>

      <p>
        Browser-only runtime: requires <code>window</code> / <code>document</code>. Keep this
        component behind lazy/client-only rendering boundaries when SSR, hydration, or third-party
        runtime risk matters; it is not SSR-safe.
      </p>
      <p>
        Code editor is experimental: the component is importable for browser-only app surfaces, but
        the runtime setup/export contract may still change before a public beta. It stays outside
        stable API reports until API report policy deliberately promotes it.
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

      <h2>Part style map</h2>
      <p>
        <code>HellCodeEditorPart</code> is <code>root | editor</code>. Editor theme colors stay owned by the Code Editor Runtime; <code>ui</code> refines the shell chrome and text metrics.
      </p>
      <hd-example-tabs [code]="codeEditorStylingExampleCode">
        <app-code-editor-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>value</code>: editor document as a string.</li>
        <li><code>(valueChange)</code>: emits on user edits.</li>
        <li>
          <code>extensions</code>: CodeMirror <code>Extension</code> supplied by the caller, e.g.
          <code>javascript()</code>.
        </li>
        <li>
          <code>readOnly</code>: disables editing, renders viewer styling, and exposes
          <code>aria-readonly="true"</code> on the focusable CodeMirror content.
        </li>
        <li>
          <code>ariaLabel</code>, <code>ariaLabelledby</code>, <code>ariaDescribedby</code>: name
          and describe the focusable CodeMirror content element.
        </li>
        <li>
          <code>ui</code>: Part Style Map overrides for the <code>root</code> and
          <code>editor</code> parts via <code>HellCodeEditorUi</code>.
        </li>
        <li>
          <code>hellCodeEditorSetupFactory(document)</code>: preferred setup export when an app
          needs a specific document or shadow-root owner; <code>hellCodeEditorSetup</code> remains
          as deprecated browser-global legacy compatibility.
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Install language packages in the app using the editor, not in the reusable library.</li>
        <li>Keep extension arrays stable when possible so reconfiguration is intentional.</li>
        <li>
          Lazy-load the kept optional entry point for surfaces that do not always need CodeMirror.
        </li>
        <li>
          Use <code>readOnly</code> for docs, audit trails and generated-code viewers, and give each
          viewer a stable accessible name.
        </li>
        <li>
          Use <code>hellCodeEditorSetupFactory</code> instead of module-global setup for shadow DOM,
          iframe, or after-hydration document contexts.
        </li>
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
  protected readonly codeEditorStylingExampleCode = codeEditorStylingExampleCodeRaw;
}
