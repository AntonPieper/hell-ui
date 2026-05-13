import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  afterNextRender,
  booleanAttribute,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { type Extension } from '@codemirror/state';
import { HellStyleable } from '../../core/styleable';
import {
  HellCodeEditorRuntime,
  type HellCodeEditorRuntimeOptions,
  type HellCodeEditorRuntimePort,
} from './code-editor.runtime';

export { hellCodeEditorSetup, hellCodeEditorSetupFactory, hellCodeEditorTheme } from './code-editor.runtime';

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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellCodeEditor),
      multi: true,
    },
  ],
  host: {
    '[class.hell-code]': '!unstyled() && !isReadOnly()',
    '[class.hell-code-viewer]': '!unstyled() && isReadOnly()',
  },
  template: '<div #host (focusout)="markTouched()"></div>',
})
export class HellCodeEditor extends HellStyleable implements ControlValueAccessor {
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

  private readonly controlMode = signal(false);
  private readonly controlValue = signal('');
  private readonly controlDisabled = signal(false);
  private onControlChange: (value: string) => void = () => {};
  private onControlTouched: () => void = () => {};
  protected readonly isReadOnly = () => this.readOnly() || this.controlDisabled();

  private runtime: HellCodeEditorRuntimePort | null = null;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.runtime?.destroy());

    afterNextRender(() => {
      this.runtime = this.createRuntime({
        host: this.hostRef().nativeElement,
        value: this.effectiveValue(),
        extensions: this.extensions(),
        readOnly: this.isReadOnly(),
        onValueChange: (value) => this.emitValue(value),
      });
    });

    effect(() => {
      const value = this.effectiveValue();
      this.runtime?.setValue(value);
    });
    effect(() => {
      const extensions = this.extensions();
      this.runtime?.setExtensions(extensions);
    });
    effect(() => {
      const readOnly = this.isReadOnly();
      this.runtime?.setReadOnly(readOnly);
    });
  }

  writeValue(value: string | null): void {
    this.controlMode.set(true);
    this.controlValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onControlChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onControlTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  protected markTouched(): void {
    this.onControlTouched();
  }

  private effectiveValue(): string {
    return this.controlMode() ? this.controlValue() : this.value();
  }

  private emitValue(value: string): void {
    if (this.controlMode()) this.controlValue.set(value);
    this.valueChange.emit(value);
    this.onControlChange(value);
  }
}
