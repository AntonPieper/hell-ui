import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';
import { HellCodeEditor } from '@hell-ui/angular/features/code-editor';

@Component({
  selector: 'app-code-editor-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCodeEditor],
  template: `
    <!-- HellCodeEditorPart: root | editor. -->
    <hell-code-editor
      [value]="snippet()"
      [extensions]="extensions"
      [ariaLabel]="'Styled editor example'"
      [ui]="{ root: 'border-hell-primary', editor: 'text-[13px]' }"
      (valueChange)="snippet.set($event)"
    />
  `,
})
export class CodeEditorStylingExample {
  protected readonly extensions: Extension = javascript({ typescript: true, jsx: true });
  protected readonly snippet = signal(`const releaseChannel = 'beta';\n`);
}
