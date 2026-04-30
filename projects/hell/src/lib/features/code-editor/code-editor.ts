import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { type Extension } from '@codemirror/state';
import { HellStyleable } from '../../core/styleable';
import { HellCodeEditorRuntime } from './code-editor.runtime';

export { hellCodeEditorSetup, hellCodeEditorTheme } from './code-editor.runtime';

/**
 * CodeMirror 6 wrapper. Creates one EditorView after render and reconfigures
 * caller-provided extensions / read-only state / external value by transaction,
 * so cursor, selection, and history are preserved across input changes.
 */
@Component({
  selector: 'hell-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-code]': '!unstyled() && !readOnly()',
    '[class.hell-code-viewer]': '!unstyled() && readOnly()',
  },
  template: '<div #host></div>',
})
export class HellCodeEditor extends HellStyleable {
  /** External document text. Updating it reconfigures the editor without echoing `valueChange`. */
  readonly value = input<string>('');
  /** Caller-owned CodeMirror extensions, including language support. */
  readonly extensions = input<Extension>([]);
  readonly readOnly = input(false, { transform: booleanAttribute });
  /** Emits only user/editor document edits, not external `value` writes. */
  readonly valueChange = output<string>();

  private readonly hostRef = viewChild.required<ElementRef<HTMLDivElement>>('host');

  private runtime: HellCodeEditorRuntime | null = null;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.runtime?.destroy());

    afterNextRender(() => {
      this.runtime = new HellCodeEditorRuntime({
        host: this.hostRef().nativeElement,
        value: this.value(),
        extensions: this.extensions(),
        readOnly: this.readOnly(),
        onValueChange: (value) => this.valueChange.emit(value),
      });
    });

    effect(() => this.runtime?.setValue(this.value()));
    effect(() => this.runtime?.setExtensions(this.extensions()));
    effect(() => this.runtime?.setReadOnly(this.readOnly()));
  }
}
