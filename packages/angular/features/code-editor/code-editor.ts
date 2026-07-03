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
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import {
  HellCodeEditorRuntime,
  type HellCodeEditorRuntimeAccessibilityOptions,
  type HellCodeEditorRuntimeOptions,
  type HellCodeEditorRuntimePort,
} from './code-editor.runtime';

export {
  hellCodeEditorSetup,
  hellCodeEditorSetupFactory,
  hellCodeEditorTheme,
} from './code-editor.runtime';

/** Public parts of the HellCodeEditor module, styleable through its Part Style Map. */
export type HellCodeEditorPart = 'root' | 'editor';

/** Part Style Map accepted by the HellCodeEditor `ui` input. */
export type HellCodeEditorUi = HellUi<HellCodeEditorPart>;

const HELL_CODE_EDITOR_RECIPE = {
  root: 'block overflow-hidden rounded-hell-md border border-hell-border bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-hell-surface-subtle)_94%,white),var(--color-hell-surface-subtle))] text-hell-foreground shadow-hell-xs transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-[readonly=true]:bg-hell-surface-subtle',
  editor: 'h-full min-h-[inherit]',
} satisfies HellRecipe<HellCodeEditorPart>;

/**
 * Factory hook for replacing the browser CodeMirror runtime in tests or app-specific hosts.
 *
 * @experimental Runtime seam for the experimental CodeMirror feature entry point.
 */
export type HellCodeEditorRuntimeFactory = (
  options: HellCodeEditorRuntimeOptions,
) => HellCodeEditorRuntimePort;

/**
 * Injection token for the CodeMirror runtime factory.
 *
 * @experimental Runtime seam for the experimental CodeMirror feature entry point.
 */
export const HELL_CODE_EDITOR_RUNTIME_FACTORY = new InjectionToken<HellCodeEditorRuntimeFactory>(
  'HELL_CODE_EDITOR_RUNTIME_FACTORY',
);

/**
 * CodeMirror 6 wrapper. Creates one EditorView after render and reconfigures
 * caller-provided extensions / read-only state / external value by transaction,
 * so cursor, selection, and history are preserved across input changes.
 *
 * @experimental Feature entry point with browser-only CodeMirror runtime seams;
 * app integrations should keep it lazy/client-only until the runtime contract is hardened.
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
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-readonly]': 'isReadOnly() ? "true" : null',
  },
  template: `
    <div #host data-slot="editor" [class]="part('editor')" (focusout)="markTouched()"></div>
  `,
})
export class HellCodeEditor implements ControlValueAccessor {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellCodeEditorPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellCodeEditorPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CODE_EDITOR_RECIPE,
  });

  /** External document text. Updating it reconfigures the editor without echoing `valueChange`. */
  readonly value = input<string>('');
  /** Caller-owned CodeMirror extensions, including language support. */
  readonly extensions = input<Extension>([]);
  readonly readOnly = input(false, { transform: booleanAttribute });
  /** Accessible name applied to CodeMirror's focusable content element. */
  readonly ariaLabel = input<string | null>(null);
  /** Visible label relationship applied to CodeMirror's focusable content element. */
  readonly ariaLabelledby = input<string | null>(null);
  /** Supporting description relationship applied to CodeMirror's focusable content element. */
  readonly ariaDescribedby = input<string | null>(null);
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
    inject(DestroyRef).onDestroy(() => this.runtime?.destroy());

    afterNextRender(() => {
      this.runtime = this.createRuntime({
        host: this.hostRef().nativeElement,
        value: this.effectiveValue(),
        extensions: this.extensions(),
        readOnly: this.isReadOnly(),
        accessibility: this.accessibilityOptions(),
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
    effect(() => {
      const accessibility = this.accessibilityOptions();
      this.runtime?.setAccessibility(accessibility);
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

  private accessibilityOptions(): HellCodeEditorRuntimeAccessibilityOptions {
    const readOnly = this.isReadOnly();
    return {
      ariaLabel: this.ariaLabel(),
      ariaLabelledby: this.ariaLabelledby(),
      ariaDescribedby: this.ariaDescribedby(),
      readOnly,
    };
  }

  private emitValue(value: string): void {
    if (this.controlMode()) this.controlValue.set(value);
    this.valueChange.emit(value);
    this.onControlChange(value);
  }
}
