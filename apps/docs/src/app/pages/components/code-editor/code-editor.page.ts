import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CodeBlock } from '../../../shared/code-block';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';

import { CodeEditorBasicExample } from './examples/basic.example';
import codeEditorBasicExampleCodeRaw from './examples/basic.example.ts?raw' with { loader: 'text' };
import { CodeEditorConfigEditorExample } from './examples/config-editor.example';
import codeEditorConfigEditorExampleCodeRaw from './examples/config-editor.example.ts?raw' with {
  loader: 'text',
};
import { CodeEditorFormsExample } from './examples/forms.example';
import codeEditorFormsExampleCodeRaw from './examples/forms.example.ts?raw' with {
  loader: 'text',
};
import { CodeEditorLanguageExample } from './examples/language.example';
import codeEditorLanguageExampleCodeRaw from './examples/language.example.ts?raw' with {
  loader: 'text',
};
import { CodeEditorReadOnlyExample } from './examples/read-only.example';
import codeEditorReadOnlyExampleCodeRaw from './examples/read-only.example.ts?raw' with {
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
      @import 'hell-ui/features/code-editor/styles.css';
    `,
  ],
  imports: [
    ExampleTabs,
    CodeBlock,
    PageHeader,
    CodeEditorBasicExample,
    CodeEditorFormsExample,
    CodeEditorReadOnlyExample,
    CodeEditorLanguageExample,
    CodeEditorConfigEditorExample,
    CodeEditorStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Code editor"
        icon="faSolidCode"
        category="Feature"
        status="Experimental"
        importPath="hell-ui/features/code-editor"
        stylesPath="hell-ui/features/code-editor/styles.css"
      >
        A CodeMirror 6 editor with signal-driven value sync, read-only viewer mode, and the hell
        theme baked in — you bring the language extensions.
      </hd-page-header>
      <p>
        <code>hell-code-editor</code> wraps a single CodeMirror 6 <code>EditorView</code> behind a
        signal-based Angular component. Its document text is one Angular model — bind it directly
        (<code>[value]</code> plus <code>(valueChange)</code>), two-way (<code>[(value)]</code>),
        or through forms: it implements Signal Forms' <code>FormValueControl</code> contract for
        <code>[formField]</code>, and the same model drives <code>formControl</code> and
        <code>ngModel</code> through Angular's built-in interoperability. The component owns the
        Code Editor Runtime — bootstrapping the view, syncing external writes, reconfiguring
        extensions and read-only state by transaction, and destroying the view on teardown — so
        cursor, selection, and undo history survive input changes without you touching the
        imperative API. The hell theme, line numbers, fold gutter, history, and default keymap
        ship inside; syntax colors map to hell design tokens so light/dark mode stays aligned with
        the rest of the library.
      </p>
      <p>
        Language modes are deliberately excluded. You pass a CodeMirror language extension (for
        example <code>javascript()</code>) through <code>[extensions]</code>, so apps only bundle
        the languages they actually use. Reach for it in a dense business app wherever a plain
        textarea is not enough: config editors, query builders, template fields, generated-code
        viewers, and audit/diff panels.
      </p>
      <p>
        This is a <strong>kept optional Feature entry point</strong> with a browser-only runtime. It
        needs <code>window</code>/<code>document</code>, so keep it behind lazy/client-only
        rendering boundaries — it is not SSR-safe. Do not re-export it from root, composites, or
        other feature barrels; import it only where the editor is intentionally used.
      </p>
      <p>
        Code editor is experimental: the runtime setup/export contract may still change before a
        public beta. It stays outside the stable API reports until API report policy deliberately promotes it.
      </p>
      <p>
        The feature requires exact CodeMirror peers installed in the consuming app:
        <code>@codemirror/commands</code>, <code>@codemirror/language</code>,
        <code>@codemirror/state</code>, <code>@codemirror/view</code>, and
        <code>@lezer/highlight</code>. Language packages such as
        <code>@codemirror/lang-javascript</code> are installed by the app, never by the library.
      </p>

      <h2>Basic</h2>
      <p>
        Bind <code>[value]</code> for the document text, pass a language through
        <code>[extensions]</code>, and read edits back through <code>(valueChange)</code>. Give
        every editor a stable accessible name via <code>ariaLabel</code>. The host has no intrinsic
        height, so set one (here <code>min-h-40</code>) on the element.
      </p>
      <hd-example-tabs [code]="basicExampleCode" flush>
        <app-code-editor-basic-example />
      </hd-example-tabs>

      <h2>Forms</h2>
      <p>
        The <code>value</code> model is the editor's single committed-document authority, so all
        binding styles observe the same text. With Signal Forms, bind a field via
        <code>[formField]</code>: the field writes into <code>value</code>, each editor-originated
        document change updates the field exactly once, focus leaving the editor marks it touched,
        and the field's <code>disabled()</code> rule maps onto the same read-only editor policy as
        the <code>readOnly</code> input. <code>formControl</code> and <code>[(ngModel)]</code>
        keep working against the same model through Angular's Signal Forms interoperability — no
        <code>ControlValueAccessor</code> is involved anymore.
      </p>
      <p>
        External writes (including form resets) replace the document by transaction: the Code
        Editor Runtime keeps owning editor lifecycle, selection, history, and extensions, so an
        external write never recreates the view or re-emits <code>(valueChange)</code>.
      </p>
      <hd-example-tabs [code]="formsExampleCode" flush>
        <app-code-editor-forms-example />
      </hd-example-tabs>

      <h2>Read-only viewer</h2>
      <p>
        Add <code>readOnly</code> to turn the editor into a viewer: editing is disabled, the shell
        switches to the muted viewer background, the focusable content stays keyboard-reachable, and
        it exposes <code>aria-readonly="true"</code>. Use it for generated code, audit trails, and
        diff panels.
      </p>
      <hd-example-tabs [code]="readOnlyExampleCode" flush>
        <app-code-editor-read-only-example />
      </hd-example-tabs>

      <h2>Supplying a language</h2>
      <p>
        Install the CodeMirror language package in the app and pass its extension to
        <code>[extensions]</code>. The hell package depends on no Angular, JavaScript, JSON, CSS, or
        HTML language modes.
      </p>
      <hd-code-block [code]="supplyingALanguage" />
      <p class="m-0 text-sm text-hell-foreground-muted">
        Because extensions live in a CodeMirror compartment, changing <code>[extensions]</code>
        reconfigures the language in place — the document, cursor, and history are preserved rather
        than the editor being recreated. Switch modes below and note the text stays put.
      </p>
      <hd-example-tabs [code]="languageExampleCode">
        <app-code-editor-language-example />
      </hd-example-tabs>

      <h2>With card, select, and buttons</h2>
      <p>
        A config editor built from Hell composites: a <code>hellCard</code> shell, a
        projection-first <code>[hellSelect]</code> language picker in the header, the editor flush inside the
        body, and a Reset/Apply <code>hellButton</code> pair driven by a dirty-state signal. The
        editor's <code>root</code> part is refined to sit seamlessly inside the card body.
      </p>
      <hd-example-tabs [code]="configEditorExampleCode" flush>
        <app-code-editor-config-editor-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>hell-code-editor</code> follows the module family's Part Style Map. The
        <code>ui</code> string shorthand refines the module's default part (<code>root</code>); the
        <code>[ui]</code> map form refines named parts. Both merge on top of the component's Part
        Recipe through hell's Tailwind merge, so refinements win deterministically over the defaults
        they conflict with. CodeMirror's internal theme colors stay owned by the Code Editor Runtime
        and its <code>hellCodeEditorTheme</code> — <code>ui</code> refines the shell chrome and the
        editor scroll region, not token-level syntax colors.
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
              The <code>&lt;hell-code-editor&gt;</code> host shell — background, border, radius,
              shadow, and the read-only background swap.
            </td>
          </tr>
          <tr>
            <td><code>editor</code></td>
            <td>
              The inner scroll region that hosts the CodeMirror view — height and
              <code>min-height</code> box metrics.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        The example below refines every public part: <code>root</code> gets a rounded, elevated,
        primary-bordered shell, and <code>editor</code> gets a taller minimum height.
      </p>
      <hd-example-tabs [code]="stylingExampleCode">
        <app-code-editor-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>value</code>: <code>ModelSignal&lt;string&gt;</code>. Default <code>''</code>. The
          committed document text; supports <code>[value]</code>, <code>[(value)]</code>, and
          <code>(valueChange)</code>. External writes reconfigure the editor by transaction
          without echoing <code>valueChange</code>.
        </li>
        <li>
          <code>extensions</code>: <code>Extension</code> (CodeMirror). Caller-owned extensions,
          including language support such as <code>javascript()</code>. Default <code>[]</code>.
        </li>
        <li>
          <code>readOnly</code>: <code>boolean</code> (coerced). Disables editing, applies viewer
          styling, and exposes <code>aria-readonly="true"</code>. Default <code>false</code>.
        </li>
        <li>
          <code>disabled</code>: <code>boolean</code> (coerced). Default <code>false</code>. Also
          driven by bound forms; maps onto the same read-only editor policy as
          <code>readOnly</code>.
        </li>
        <li><code>ariaLabel</code>: <code>string | null</code>. Accessible name for the focusable content element. Default <code>null</code>.</li>
        <li><code>ariaLabelledby</code>: <code>string | null</code>. ID reference for a visible label; takes precedence over <code>ariaLabel</code>. Default <code>null</code>.</li>
        <li><code>ariaDescribedby</code>: <code>string | null</code>. ID reference for supporting description text. Default <code>null</code>.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellCodeEditorPart&gt;</code> — a shorthand class
          string for the <code>root</code> part or a <code>HellCodeEditorUi</code> map refining
          <code>root</code> and <code>editor</code>.
        </li>
        <li>
          <code>(valueChange)</code>: <code>string</code>. Emits only user/editor document edits,
          not external <code>value</code> writes.
        </li>
        <li>
          <code>(touch)</code>: emits when focus leaves the editor content; Angular forms use it
          to mark the bound field or control touched.
        </li>
        <li>
          Implements Signal Forms' <code>FormValueControl</code>; <code>formControl</code> and
          <code>ngModel</code> bind through Angular's built-in interoperability.
        </li>
      </ul>
      <ul>
        <li>
          Exported types: <code>HellCodeEditorPart</code> (<code>'root' | 'editor'</code>),
          <code>HellCodeEditorUi</code> (<code>HellUi&lt;HellCodeEditorPart&gt;</code>).
        </li>
        <li>
          <code>hellCodeEditorSetupFactory(document)</code>: the setup export; pass the document or
          shadow-root owner the editor renders into.
        </li>
        <li>
          <code>hellCodeEditorTheme</code>: the token-backed CodeMirror theme extension the runtime
          applies by default.
        </li>
        <li>
          <code>HELL_CODE_EDITOR_RUNTIME_FACTORY</code>: injection token to swap the browser
          CodeMirror runtime in tests or app-specific hosts (experimental seam).
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The runtime sets <code>role="textbox"</code> and <code>aria-multiline="true"</code> on
          CodeMirror's focusable content element, plus <code>aria-readonly</code> mirroring the
          effective read-only/disabled state and <code>spellcheck="false"</code>.
        </li>
        <li>
          Name the editor with <code>ariaLabel</code>, or point <code>ariaLabelledby</code> at a
          visible label element (it wins over <code>ariaLabel</code>). With neither, the runtime
          falls back to <code>"Code editor"</code> when editable and <code>"Code viewer"</code> when
          read-only.
        </li>
        <li>
          Read-only editors set <code>tabindex="0"</code> so viewers stay keyboard-reachable and
          scrollable, even though editing is disabled.
        </li>
        <li>
          Keyboard editing, caret, and selection semantics are handled by CodeMirror's default
          keymap and history bindings shipped in the runtime setup.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Install language packages in the app using the editor, not in the reusable library.</li>
        <li>Give every editor and viewer a stable accessible name via <code>ariaLabel</code> or <code>ariaLabelledby</code>.</li>
        <li>Set an explicit height (or <code>min-height</code>) on the host — it has none by default.</li>
        <li>Lazy-load this kept optional entry point behind client-only boundaries for surfaces that do not always need CodeMirror.</li>
        <li>Use <code>hellCodeEditorSetupFactory</code> instead of module-global setup for shadow DOM, iframe, or after-hydration document contexts.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't bundle every CodeMirror language mode into a shared component package.</li>
        <li>Don't recreate the editor to change value or language — pass new <code>[value]</code> / <code>[extensions]</code> inputs so history and cursor survive.</li>
        <li>Don't render it in SSR/hydration paths without a client-only boundary or a plain-text fallback.</li>
        <li>Don't override CodeMirror's internal syntax colors through <code>ui</code>; use the token-backed theme instead.</li>
      </ul>
    </article>
  `,
})
export class CodeEditorPage {
  protected readonly basicExampleCode = codeEditorBasicExampleCodeRaw;
  protected readonly formsExampleCode = codeEditorFormsExampleCodeRaw;
  protected readonly readOnlyExampleCode = codeEditorReadOnlyExampleCodeRaw;
  protected readonly languageExampleCode = codeEditorLanguageExampleCodeRaw;
  protected readonly configEditorExampleCode = codeEditorConfigEditorExampleCodeRaw;
  protected readonly stylingExampleCode = codeEditorStylingExampleCodeRaw;

  protected readonly supplyingALanguage = `import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';

// Pass the language extension through [extensions] at the call site.
readonly extensions: Extension = javascript({ typescript: true });
`;
}
