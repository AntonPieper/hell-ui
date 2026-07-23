import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';
import { FormField, disabled, form } from '@angular/forms/signals';
import { HellCodeEditor } from 'hell-ui/features/code-editor';
import { HellNativeCheckbox } from 'hell-ui/checkbox';

@Component({
  selector: 'app-code-editor-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, HellCodeEditor, HellNativeCheckbox],
  template: `
    <hell-code-editor
      class="min-h-40"
      ariaLabel="Pipeline configuration"
      [extensions]="extensions"
      [formField]="pipelineForm.config"
    />
    <label class="mt-hell-3 flex items-center gap-hell-2 text-hell-sm">
      <input type="checkbox" hellNativeCheckbox [checked]="locked()" (change)="toggleLocked()" />
      Lock configuration
    </label>
    <p class="m-0 mt-hell-2 text-hell-sm text-hell-foreground-muted">
      A <code>disabled()</code> rule follows the lock and turns the editor read-only. Dirty:
      <code>{{ pipelineForm.config().dirty() }}</code> · Touched:
      <code>{{ pipelineForm.config().touched() }}</code> · Length:
      <code>{{ pipelineForm.config().value().length }}</code>
    </p>
  `,
})
export class CodeEditorFormsExample {
  protected readonly extensions: Extension = javascript({ typescript: true });
  protected readonly locked = signal(false);
  protected readonly pipeline = signal({
    config: `export const pipeline = {
  stages: ['lint', 'test', 'build'],
  cache: true,
};
`,
  });
  protected readonly pipelineForm = form(this.pipeline, (path) => {
    disabled(path.config, () => this.locked());
  });

  protected toggleLocked(): void {
    this.locked.update((locked) => !locked);
  }
}
