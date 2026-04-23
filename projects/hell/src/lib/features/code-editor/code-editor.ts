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
import {
  Compartment,
  EditorState,
  type Extension,
} from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

type LangKey = 'javascript' | 'typescript' | 'json' | 'html' | 'css';

const LANG_LOADERS: Record<LangKey, () => Promise<Extension>> = {
  javascript: async () => (await import('@codemirror/lang-javascript')).javascript(),
  typescript: async () => (await import('@codemirror/lang-javascript')).javascript({ typescript: true }),
  json: async () => (await import('@codemirror/lang-json')).json(),
  html: async () => (await import('@codemirror/lang-html')).html(),
  css: async () => (await import('@codemirror/lang-css')).css(),
};

/**
 * CodeMirror 6 wrapper. Creates a single `EditorView` after the host renders
 * and reconfigures language / read-only / external value via compartment
 * transactions — never recreates the view, so editor state (cursor,
 * selection, history) is preserved across input changes. Language packs are
 * dynamically imported so each is its own chunk; load this feature lazily.
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
export class HellCodeEditor {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly value = input<string>('');
  readonly language = input<LangKey | null>(null);
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();

  private readonly hostRef = viewChild.required<ElementRef<HTMLDivElement>>('host');

  private view: EditorView | null = null;
  private readonly langCompartment = new Compartment();
  private readonly readOnlyCompartment = new Compartment();

  /** Set when we're updating the doc from the input(), so the
   *  updateListener doesn't echo back. */
  private applyingExternalValue = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.view?.destroy());

    afterNextRender(() => {
      const host = this.hostRef().nativeElement;
      this.view = new EditorView({
        doc: this.value(),
        parent: host,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          highlightActiveLine(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          this.langCompartment.of([]),
          this.readOnlyCompartment.of(EditorState.readOnly.of(this.readOnly())),
          EditorView.updateListener.of((u) => {
            if (u.docChanged && !this.applyingExternalValue) {
              this.valueChange.emit(u.state.doc.toString());
            }
          }),
        ],
      });
      // Apply initial language if set.
      this.applyLanguage(this.language());
    });

    // React to value changes from the outside.
    effect(() => {
      const next = this.value();
      const view = this.view;
      if (!view) return;
      const current = view.state.doc.toString();
      if (current === next) return;
      this.applyingExternalValue = true;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: next },
      });
      this.applyingExternalValue = false;
    });

    // React to language changes.
    effect(() => {
      const lang = this.language();
      if (!this.view) return;
      this.applyLanguage(lang);
    });

    // React to readOnly changes.
    effect(() => {
      const ro = this.readOnly();
      this.view?.dispatch({
        effects: this.readOnlyCompartment.reconfigure(EditorState.readOnly.of(ro)),
      });
    });
  }

  private async applyLanguage(lang: LangKey | null) {
    const ext = lang ? await LANG_LOADERS[lang]() : [];
    if (!this.view) return;
    this.view.dispatch({
      effects: this.langCompartment.reconfigure(ext),
    });
  }
}
