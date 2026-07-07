import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';
import { HellCodeEditor, type HellCodeEditorUi } from '@hell-ui/angular/features/code-editor';

@Component({
  selector: 'app-code-editor-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCodeEditor],
  template: `
    <!-- HellCodeEditor parts: root (shell chrome), editor (scroll region). -->
    <hell-code-editor
      [value]="source()"
      [extensions]="extensions"
      ariaLabel="Styled editor example"
      [ui]="editorUi"
      (valueChange)="source.set($event)"
    />
  `,
})
export class CodeEditorStylingExample {
  protected readonly extensions: Extension = javascript({ typescript: true });
  protected readonly source = signal(`const releaseChannel = 'beta';\n`);

  protected readonly editorUi: HellCodeEditorUi = {
    root: 'rounded-hell-xl border-2 border-hell-primary bg-hell-surface-elevated shadow-hell-lg',
    editor: 'min-h-40',
  };
}
