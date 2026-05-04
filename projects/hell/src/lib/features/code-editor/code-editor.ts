import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
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
import {
  HellCodeEditorRuntime,
  type HellCodeEditorRuntimeOptions,
  type HellCodeEditorRuntimePort,
} from './code-editor.runtime';

export { hellCodeEditorSetup, hellCodeEditorTheme } from './code-editor.runtime';

export type HellCodeEditorRuntimeFactory = (
  options: HellCodeEditorRuntimeOptions,
) => HellCodeEditorRuntimePort;

export const HELL_CODE_EDITOR_RUNTIME_FACTORY = new InjectionToken<HellCodeEditorRuntimeFactory>(
  'HELL_CODE_EDITOR_RUNTIME_FACTORY',
);

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

  private readonly createRuntime =
    inject(HELL_CODE_EDITOR_RUNTIME_FACTORY, { optional: true }) ??
    ((options: HellCodeEditorRuntimeOptions) => new HellCodeEditorRuntime(options));

  private runtime: HellCodeEditorRuntimePort | null = null;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.runtime?.destroy());

    afterNextRender(() => {
      this.runtime = this.createRuntime({
        host: this.hostRef().nativeElement,
        value: this.value(),
        extensions: this.extensions(),
        readOnly: this.readOnly(),
        onValueChange: (value) => this.valueChange.emit(value),
      });
    });

    effect(() => {
      const value = this.value();
      this.runtime?.setValue(value);
    });
    effect(() => {
      const extensions = this.extensions();
      this.runtime?.setExtensions(extensions);
    });
    effect(() => {
      const readOnly = this.readOnly();
      this.runtime?.setReadOnly(readOnly);
    });
  }
}
