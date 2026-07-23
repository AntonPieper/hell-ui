import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';
import { type Extension } from '@codemirror/state';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import {
  HellCodeEditorRuntime,
  type HellCodeEditorRuntimeAccessibilityOptions,
  type HellCodeEditorRuntimeOptions,
  type HellCodeEditorRuntimePort,
} from './code-editor.runtime';

export { hellCodeEditorSetupFactory, hellCodeEditorTheme } from './code-editor.runtime';

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
 * The `value` model is the editor's one Control Value Authority: bind it
 * one-way (`[value]` plus `(valueChange)`), two-way (`[(value)]`), or through
 * Angular forms — Signal Forms `[formField]` via the `FormValueControl`
 * contract, and `formControl`/`ngModel` via Angular's built-in Signal Forms
 * interoperability. The Code Editor Runtime keeps owning editor lifecycle,
 * selection, history, extensions, and read-only policy, and derives document
 * synchronization from that one authority.
 *
 * @experimental Feature entry point with browser-only CodeMirror runtime seams;
 * app integrations should keep it lazy/client-only until the runtime contract is hardened.
 */
@Component({
  selector: 'hell-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-readonly]': 'isReadOnly() ? "true" : null',
  },
  template: `
    <div
      #host
      data-slot="editor"
      [class]="part('editor')"
      (focusout)="markControlTouched()"
    ></div>
  `,
})
export class HellCodeEditor implements FormValueControl<string> {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellCodeEditorPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellCodeEditorPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CODE_EDITOR_RECIPE,
  });

  /**
   * Committed document text — the one Control Value Authority. Editor-originated
   * edits write it exactly once per document change and emit `(valueChange)`;
   * external property, two-way, and form writes reconfigure the editor by
   * transaction without re-emitting, so cursor, selection, and history survive.
   * Expects a `string` binding (no static-attribute coercion). Defaults to `''`.
   */
  readonly value = model('');
  /** Caller-owned CodeMirror extensions, including language support. */
  readonly extensions = input<Extension>([]);
  /** Read-only viewer policy owned by the consumer. Defaults to `false`. */
  readonly readOnly = input(false, { transform: booleanAttribute });
  /**
   * Whether the editor is disabled. Also driven by bound forms; maps onto the
   * same read-only editor policy as `readOnly`. Defaults to `false`.
   */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible name applied to CodeMirror's focusable content element. */
  readonly ariaLabel = input<string | null>(null);
  /** Visible label relationship applied to CodeMirror's focusable content element. */
  readonly ariaLabelledby = input<string | null>(null);
  /** Supporting description relationship applied to CodeMirror's focusable content element. */
  readonly ariaDescribedby = input<string | null>(null);
  /**
   * Emits when focus leaves the editor content. Angular forms listen to this
   * output to mark the bound field or control as touched.
   */
  readonly touch = output<void>();

  private readonly hostRef = viewChild.required<ElementRef<HTMLDivElement>>('host');

  private readonly createRuntime =
    inject(HELL_CODE_EDITOR_RUNTIME_FACTORY, { optional: true }) ??
    ((options: HellCodeEditorRuntimeOptions) => new HellCodeEditorRuntime(options));

  protected readonly isReadOnly = () => this.readOnly() || this.disabled();

  // Classic forms interop can write null through reset()/initial ngModel
  // state; the editor document itself is always a string.
  private readonly documentValue = computed(() => this.value() ?? '');

  private runtime: HellCodeEditorRuntimePort | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.runtime?.destroy());

    afterNextRender(() => {
      this.runtime = this.createRuntime({
        host: this.hostRef().nativeElement,
        value: this.documentValue(),
        extensions: this.extensions(),
        readOnly: this.isReadOnly(),
        accessibility: this.accessibilityOptions(),
        onValueChange: (value) => this.value.set(value),
      });
    });

    // The runtime port's setValue compares against the live document, so the
    // echo of an editor-originated commit resolves to a no-op transaction and
    // selection/history are never destroyed by the model round-trip.
    effect(() => {
      const value = this.documentValue();
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

  /** Emits the `touch` output that marks the editor as touched for Angular forms. */
  protected markControlTouched(): void {
    this.touch.emit();
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
}
