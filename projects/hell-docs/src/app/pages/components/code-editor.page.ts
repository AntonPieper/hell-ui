import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellCodeEditor } from 'hell';

@Component({
  selector: 'hd-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCodeEditor],
  template: `
    <article class="hd-prose">
      <h1>Code editor</h1>
      <p>CodeMirror 6 wrapped behind a signal-based Angular component.
        Language packs (JavaScript, TypeScript, JSON, HTML, CSS) are
        dynamically imported. Load this feature lazily.</p>

      <h2>Editable</h2>
      <div class="hd-example" style="padding:0">
        <hell-code-editor
          [value]="snippet()"
          language="typescript"
          (valueChange)="snippet.set($event)"
          style="display:block; min-height:200px"></hell-code-editor>
      </div>
      <p style="font-size:.875rem; opacity:.7">Length: {{ snippet().length }} chars</p>

      <h2>Read-only viewer</h2>
      <div class="hd-example" style="padding:0">
        <hell-code-editor
          [value]="json"
          language="json"
          readOnly
          style="display:block; min-height:160px"></hell-code-editor>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>value</code>: <code>string</code></li>
        <li><code>language</code>: <code>'javascript' | 'typescript' | 'json' | 'html' | 'css' | null</code></li>
        <li><code>readOnly</code>: boolean</li>
        <li><code>valueChange</code>: emits on every edit</li>
      </ul>
    </article>
  `,
})
export class CodeEditorPage {
  readonly snippet = signal(`function greet(name: string) {\n  return \`Hello, \${name}!\`;\n}\n\ngreet('hell');\n`);
  readonly json = `{\n  "name": "hell",\n  "version": "0.1.0"\n}\n`;
}
