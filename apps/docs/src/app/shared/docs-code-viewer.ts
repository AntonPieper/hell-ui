import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { HellCodeEditor } from 'hell-ui/features/code-editor';

/**
 * Docs example sources are TypeScript with inline Angular templates; the
 * JavaScript language in TypeScript+JSX mode covers both without a second
 * grammar bundle.
 */
const DOCS_CODE_LANGUAGE = javascript({ typescript: true, jsx: true });

type DocsCodeViewerVariant = 'example' | 'block';

@Component({
  selector: 'hd-docs-code-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      @import 'hell-ui/features/code-editor/styles.css';

      .hd-code-viewer[data-slot='root'] {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
      }

      .hd-example-code[data-slot='root'] > [data-slot='editor'] > .cm-editor,
      .hd-example-code[data-slot='root'] [data-slot='editor'] .cm-scroller {
        min-height: 160px;
      }

      .hd-code-viewer[data-slot='root'] [data-slot='editor'] .cm-scroller {
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
  protected readonly extensions = computed(() => [
    DOCS_CODE_LANGUAGE,
    ...(this.variant() === 'block' ? [EditorView.lineWrapping] : []),
  ]);
}
