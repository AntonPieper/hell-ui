import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { EditorView } from '@codemirror/view';
import { HellCodeEditor } from '@hell-ui/angular/features/code-editor';

type DocsCodeViewerVariant = 'example' | 'block';

@Component({
  selector: 'hd-docs-code-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      @import '@hell-ui/angular/features/code-editor/styles.css';

      .hd-code-viewer.hell-code-viewer {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
      }

      .hd-example-code.hell-code-viewer > .cm-editor,
      .hd-example-code.hell-code-viewer .cm-scroller {
        min-height: 160px;
      }

      .hd-code-viewer.hell-code-viewer .cm-scroller {
        max-height: min(68vh, 560px);
        overflow: auto;
      }

    `,
  ],
  imports: [HellCodeEditor],
  template: `
    <hell-code-editor
      class="hd-code-viewer"
      [class.hd-example-code]="variant() === 'example'"
      [class.hd-doc-code]="variant() === 'block'"
      [value]="code()"
      [extensions]="extensions()"
      [ariaLabel]="ariaLabel()"
      readOnly
    />
  `,
})
export class DocsCodeViewer {
  readonly code = input.required<string>();
  readonly variant = input<DocsCodeViewerVariant>('example');
  readonly label = input<string>('Example source code');

  protected readonly ariaLabel = computed(() => this.label().trim() || 'Example source code');
  protected readonly extensions = computed(() =>
    this.variant() === 'block' ? EditorView.lineWrapping : [],
  );
}
