import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';
import { HellCodeEditor } from 'hell-ui/features/code-editor';

@Component({
  selector: 'app-code-editor-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCodeEditor],
  template: `
    <hell-code-editor
      class="min-h-40"
      [value]="source()"
      [extensions]="extensions"
      ariaLabel="Feature flag snippet"
      (valueChange)="source.set($event)"
    />
  `,
})
export class CodeEditorBasicExample {
  protected readonly extensions: Extension = javascript({ typescript: true });
  protected readonly source = signal(`export const featureFlags = {
  betaDashboard: true,
  bulkExport: false,
};
`);
}
