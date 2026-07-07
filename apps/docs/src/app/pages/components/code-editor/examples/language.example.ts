import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';
import { HellButton } from '@hell-ui/angular/button';
import { HellCodeEditor } from '@hell-ui/angular/features/code-editor';

type EditorMode = 'javascript' | 'typescript' | 'tsx';

@Component({
  selector: 'app-code-editor-language-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCodeEditor, HellButton],
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex flex-wrap gap-2">
        @for (option of modes; track option) {
          <button
            hellButton
            size="xs"
            [variant]="option === mode() ? 'primary' : 'default'"
            type="button"
            (click)="mode.set(option)"
          >
            {{ option }}
          </button>
        }
      </div>
      <hell-code-editor
        class="min-h-40"
        [value]="source()"
        [extensions]="extensions()"
        ariaLabel="Language mode demo"
        (valueChange)="source.set($event)"
      />
    </div>
  `,
})
export class CodeEditorLanguageExample {
  protected readonly modes: readonly EditorMode[] = ['javascript', 'typescript', 'tsx'];
  protected readonly mode = signal<EditorMode>('typescript');

  protected readonly extensions = computed<Extension>(() =>
    javascript({
      typescript: this.mode() !== 'javascript',
      jsx: this.mode() === 'tsx',
    }),
  );

  protected readonly source = signal(`export function retry<T>(fn: () => Promise<T>, attempts = 3) {
  return fn().catch((error) => {
    if (attempts <= 1) throw error;
    return retry(fn, attempts - 1);
  });
}
`);
}
