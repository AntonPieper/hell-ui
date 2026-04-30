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
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { HighlightStyle, foldGutter, foldKeymap, syntaxHighlighting } from '@codemirror/language';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { HellStyleable } from '../../core/styleable';

/**
 * Base CodeMirror setup used by hell-code-editor. Language support is
 * intentionally excluded: pass Angular, JS, JSON, or any other CodeMirror
 * language extension through the `extensions` input at the call site.
 */
export const hellCodeEditorSetup: Extension = [
  lineNumbers(),
  foldGutter({
    markerDOM(open) {
      const el = document.createElement('span');
      el.setAttribute('aria-hidden', 'true');
      el.style.display = 'inline-flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.width = '100%';
      el.style.height = '100%';
      el.innerHTML = open
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="8" height="8"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" width="8" height="8"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>';
      return el;
    },
  }),
  highlightActiveLineGutter(),
  history(),
  drawSelection(),
  highlightActiveLine(),
  keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
];

/**
 * hell-flavoured CodeMirror theme. Uses CSS variables so light/dark mode and
 * local token overrides stay aligned with the rest of the component library.
 */
export const hellCodeEditorTheme: Extension = [
  EditorView.theme({
    '&': {
      color: 'var(--color-hell-foreground)',
      backgroundColor: 'var(--color-hell-surface-subtle)',
      fontFamily: 'var(--font-mono)',
      fontSize: '12.5px',
      lineHeight: '1.55',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono)',
    },
    '.cm-content': {
      caretColor: 'var(--color-hell-primary)',
      paddingBlock: 'var(--spacing-hell-4)',
    },
    '.cm-line': {
      paddingInline: 'var(--spacing-hell-4)',
    },
    '.cm-gutters': {
      backgroundColor:
        'color-mix(in oklab, var(--color-hell-surface-subtle) 90%, var(--color-hell-surface-muted))',
      borderRight: '1px solid var(--color-hell-border)',
      color: 'var(--color-hell-foreground-subtle)',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      minWidth: '2.5rem',
      paddingInline: 'var(--spacing-hell-3)',
    },
    '.cm-foldGutter .cm-gutterElement': {
      width: '1.3rem',
      paddingInline: '0',
      color: 'var(--color-hell-foreground-subtle)',
      cursor: 'pointer',
      textAlign: 'center',
    },
    '.cm-foldGutter .cm-gutterElement:hover': {
      color: 'var(--color-hell-foreground)',
      backgroundColor: 'color-mix(in oklab, var(--color-hell-primary) 8%, transparent)',
    },
    '.cm-foldPlaceholder': {
      marginInline: '0.25rem',
      paddingInline: '0.35rem',
      border: '1px solid var(--color-hell-border)',
      borderRadius: 'var(--radius-hell-sm)',
      backgroundColor: 'var(--color-hell-surface-muted)',
      color: 'var(--color-hell-foreground-muted)',
    },
    '.cm-activeLine': {
      backgroundColor: 'color-mix(in oklab, var(--color-hell-primary) 7%, transparent)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'color-mix(in oklab, var(--color-hell-primary) 10%, transparent)',
      color: 'var(--color-hell-foreground)',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'var(--color-hell-primary)',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'color-mix(in oklab, var(--color-hell-info) 24%, transparent)',
    },
    '.cm-matchingBracket, .cm-nonmatchingBracket': {
      backgroundColor: 'color-mix(in oklab, var(--color-hell-warning) 18%, transparent)',
      outline: '1px solid color-mix(in oklab, var(--color-hell-warning) 38%, transparent)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'color-mix(in oklab, var(--color-hell-warning) 30%, transparent)',
      outline: '1px solid color-mix(in oklab, var(--color-hell-warning) 45%, transparent)',
    },
    '.cm-tooltip': {
      border: '1px solid var(--color-hell-border)',
      borderRadius: 'var(--radius-hell-md)',
      backgroundColor: 'var(--color-hell-surface-elevated)',
      boxShadow: 'var(--shadow-hell-lg)',
    },
  }),
  syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.keyword, color: 'var(--color-hell-primary)' },
      {
        tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName],
        color: 'var(--color-hell-danger-strong)',
      },
      {
        tag: [tags.function(tags.variableName), tags.labelName],
        color: 'var(--color-hell-info-strong)',
      },
      {
        tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
        color: 'var(--color-hell-success-strong)',
      },
      { tag: [tags.definition(tags.name), tags.separator], color: 'var(--color-hell-foreground)' },
      {
        tag: [
          tags.typeName,
          tags.className,
          tags.number,
          tags.changed,
          tags.annotation,
          tags.modifier,
          tags.self,
          tags.namespace,
        ],
        color: 'var(--color-hell-primary-hover)',
      },
      {
        tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link],
        color: 'var(--color-hell-info-strong)',
      },
      { tag: [tags.meta, tags.comment], color: 'var(--color-hell-foreground-subtle)' },
      { tag: tags.strong, fontWeight: '700' },
      { tag: tags.emphasis, fontStyle: 'italic' },
      { tag: tags.strikethrough, textDecoration: 'line-through' },
      { tag: tags.link, textDecoration: 'underline' },
      { tag: tags.heading, fontWeight: '700', color: 'var(--color-hell-primary)' },
      {
        tag: [tags.atom, tags.bool, tags.special(tags.variableName)],
        color: 'var(--color-hell-danger)',
      },
      {
        tag: [tags.processingInstruction, tags.string, tags.inserted],
        color: 'var(--color-hell-success-strong)',
      },
      {
        tag: tags.invalid,
        color: 'var(--color-hell-danger)',
        textDecoration: 'underline wavy var(--color-hell-danger)',
      },
    ]),
  ),
];

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
  readonly value = input<string>('');
  readonly extensions = input<Extension>([]);
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();

  private readonly hostRef = viewChild.required<ElementRef<HTMLDivElement>>('host');

  private view: EditorView | null = null;
  private readonly extensionCompartment = new Compartment();
  private readonly readOnlyCompartment = new Compartment();

  /** Set while input() updates editor doc so updateListener does not echo. */
  private applyingExternalValue = false;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.view?.destroy());

    afterNextRender(() => {
      const host = this.hostRef().nativeElement;
      this.view = new EditorView({
        doc: this.value(),
        parent: host,
        extensions: [
          hellCodeEditorSetup,
          hellCodeEditorTheme,
          this.extensionCompartment.of(this.extensions()),
          this.readOnlyCompartment.of(this.readOnlyExtensions(this.readOnly())),
          EditorView.updateListener.of((u) => {
            if (u.docChanged && !this.applyingExternalValue) {
              this.valueChange.emit(u.state.doc.toString());
            }
          }),
        ],
      });
    });

    effect(() => {
      const next = this.value();
      const view = this.view;
      if (!view) return;
      const current = view.state.doc.toString();
      if (current === next) return;
      this.applyingExternalValue = true;
      try {
        view.dispatch({ changes: { from: 0, to: current.length, insert: next } });
      } finally {
        this.applyingExternalValue = false;
      }
    });

    effect(() => {
      const extensions = this.extensions();
      this.view?.dispatch({
        effects: this.extensionCompartment.reconfigure(extensions),
      });
    });

    effect(() => {
      const readOnly = this.readOnly();
      this.view?.dispatch({
        effects: this.readOnlyCompartment.reconfigure(this.readOnlyExtensions(readOnly)),
      });
    });
  }

  private readOnlyExtensions(readOnly: boolean): Extension {
    return [EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)];
  }
}
