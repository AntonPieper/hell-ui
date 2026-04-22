import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

type LangLoader = () => Promise<{ extension: any }>;

const LANG_LOADERS: Record<string, LangLoader> = {
  javascript: async () => {
    const m = await import('@codemirror/lang-javascript');
    return { extension: m.javascript() };
  },
  typescript: async () => {
    const m = await import('@codemirror/lang-javascript');
    return { extension: m.javascript({ typescript: true }) };
  },
  json: async () => {
    const m = await import('@codemirror/lang-json');
    return { extension: m.json() };
  },
  html: async () => {
    const m = await import('@codemirror/lang-html');
    return { extension: m.html() };
  },
  css: async () => {
    const m = await import('@codemirror/lang-css');
    return { extension: m.css() };
  },
};

/**
 * Lazy-loaded CodeMirror 6 wrapper. Supports both editing and read-only viewer
 * modes via the `readOnly` input. Language packs are dynamically imported so
 * each language is a separate chunk.
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
  readonly language = input<keyof typeof LANG_LOADERS | null>(null);
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();

  private readonly hostRef = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private view: any = null;

  constructor() {
    effect(async () => {
      const lang = this.language();
      const ro = this.readOnly();
      const initial = this.value();
      const host = this.hostRef().nativeElement;

      const [{ EditorView, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection }, { EditorState }, { defaultKeymap, history, historyKeymap }, { keymap }] = await Promise.all([
        import('@codemirror/view'),
        import('@codemirror/state'),
        import('@codemirror/commands'),
        import('@codemirror/view'),
      ]);

      const exts: any[] = [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((u: any) => {
          if (u.docChanged) this.valueChange.emit(u.state.doc.toString());
        }),
        EditorState.readOnly.of(ro),
      ];
      if (lang && LANG_LOADERS[lang]) {
        const { extension } = await LANG_LOADERS[lang]();
        exts.push(extension);
      }

      if (this.view) this.view.destroy();
      this.view = new EditorView({
        doc: initial,
        extensions: exts,
        parent: host,
      });
    });
  }
}
