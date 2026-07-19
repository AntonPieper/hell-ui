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

const HELL_CODE_EDITOR_SVG_NS = 'http://www.w3.org/2000/svg';
const HELL_CODE_EDITOR_FOLD_PATH =
  'M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z';
const HELL_CODE_EDITOR_UNFOLD_PATH =
  'M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z';

/**
 * Accessibility attributes for the CodeMirror runtime boundary.
 *
 * @experimental Runtime seam for the experimental CodeMirror feature entry point.
 */
export interface HellCodeEditorRuntimeAccessibilityOptions {
  /** Accessible name for the editor/content element when no labelled-by relationship is used. */
  readonly ariaLabel: string | null;
  /** ID reference for a visible label; takes precedence over `ariaLabel`. */
  readonly ariaLabelledby: string | null;
  /** Optional ID reference for supporting description text. */
  readonly ariaDescribedby: string | null;
  /** Mirrors the effective editor read-only state for assistive technology. */
  readonly readOnly: boolean;
}

/**
 * Construction inputs for the CodeMirror runtime boundary.
 *
 * @experimental Runtime seam for the experimental CodeMirror feature entry point.
 */
export interface HellCodeEditorRuntimeOptions {
  readonly host: HTMLElement;
  readonly value: string;
  /** Caller-owned CodeMirror extensions; language support is passed here. */
  readonly extensions: Extension;
  readonly readOnly: boolean;
  readonly accessibility: HellCodeEditorRuntimeAccessibilityOptions;
  /** Called for editor-originated document edits, not external `setValue` writes. */
  readonly onValueChange: (value: string) => void;
}

/**
 * Imperative port used by the Angular wrapper to keep EditorView state alive.
 *
 * @experimental Runtime seam for the experimental CodeMirror feature entry point.
 */
export interface HellCodeEditorRuntimePort {
  /** Replace document text without echoing through `onValueChange`. */
  setValue(next: string): void;
  /** Reconfigure caller extensions while preserving document and history. */
  setExtensions(extensions: Extension): void;
  /** Toggle the read-only compartment without recreating the editor. */
  setReadOnly(readOnly: boolean): void;
  /** Reconfigure accessible name/description/state attributes on CodeMirror's content element. */
  setAccessibility(options: HellCodeEditorRuntimeAccessibilityOptions): void;
  destroy(): void;
}

function hellCodeEditorFoldMarkerIcon(open: boolean, ownerDocument: Document): SVGSVGElement {
  const svg = ownerDocument.createElementNS(HELL_CODE_EDITOR_SVG_NS, 'svg');
  svg.setAttribute('viewBox', open ? '0 0 512 512' : '0 0 320 512');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('width', '8');
  svg.setAttribute('height', '8');

  const path = ownerDocument.createElementNS(HELL_CODE_EDITOR_SVG_NS, 'path');
  path.setAttribute('d', open ? HELL_CODE_EDITOR_FOLD_PATH : HELL_CODE_EDITOR_UNFOLD_PATH);
  svg.append(path);
  return svg;
}

/**
 * Create the base CodeMirror setup used by hell-code-editor. Language support is
 * intentionally excluded: pass Angular, JS, JSON, or any other CodeMirror
 * language extension through the `extensions` input at the call site.
 *
 * @experimental Setup helper for the experimental CodeMirror feature entry point.
 */
export function hellCodeEditorSetupFactory(ownerDocument: Document): Extension {
  return [
    lineNumbers(),
    foldGutter({
      markerDOM(open) {
        const el = ownerDocument.createElement('span');
        el.setAttribute('aria-hidden', 'true');
        el.style.display = 'inline-flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.width = '100%';
        el.style.height = '100%';
        el.append(hellCodeEditorFoldMarkerIcon(open, ownerDocument));
        return el;
      },
    }),
    highlightActiveLineGutter(),
    history(),
    drawSelection(),
    highlightActiveLine(),
    keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
  ];
}

/**
 * hell-flavoured CodeMirror theme. Uses CSS variables so light/dark mode and
 * local token overrides stay aligned with the rest of the component library.
 *
 * @experimental Theme helper for the experimental CodeMirror feature entry point.
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
      // foreground-muted, not -subtle: 12.5px line numbers need WCAG AA 4.5:1
      // on the subtle gutter background (axe color-contrast).
      color: 'var(--color-hell-foreground-muted)',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      minWidth: '2.5rem',
      paddingInline: 'var(--spacing-hell-3)',
    },
    '.cm-foldGutter .cm-gutterElement': {
      width: '1.3rem',
      paddingInline: '0',
      color: 'var(--color-hell-foreground-muted)',
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

function resolveCodeEditorRoot(host: HTMLElement): Document | ShadowRoot {
  const root = host.getRootNode({ composed: false });
  const ownerWindow = host.ownerDocument.defaultView;

  const documentCtor = ownerWindow?.Document;
  if (isInstanceOfInWindow(root, documentCtor)) return root as Document;

  const shadowRootCtor = ownerWindow?.ShadowRoot;
  if (isInstanceOfInWindow(root, shadowRootCtor)) return root as ShadowRoot;

  if (isDocumentLike(root) || isShadowRootLike(root)) return root as Document | ShadowRoot;

  return host.ownerDocument;
}

function isInstanceOfInWindow(
  value: unknown,
  ctor: ({ new (): object } & { prototype: object }) | undefined,
): value is object {
  if (!ctor || typeof value !== 'object' || value === null) return false;

  try {
    return value instanceof ctor;
  } catch {
    return false;
  }
}

function isDocumentLike(value: unknown): value is Document {
  return (
    typeof value === 'object' &&
    value !== null &&
    'nodeType' in value &&
    (value as Node).nodeType === 9 &&
    'createElement' in value &&
    'defaultView' in value
  );
}

function isShadowRootLike(value: unknown): value is ShadowRoot {
  return (
    typeof value === 'object' &&
    value !== null &&
    'nodeType' in value &&
    (value as Node).nodeType === 11 &&
    'host' in value &&
    'mode' in value
  );
}

export class HellCodeEditorRuntime implements HellCodeEditorRuntimePort {
  readonly view: EditorView;

  private readonly extensionCompartment = new Compartment();
  private readonly readOnlyCompartment = new Compartment();
  private readonly accessibilityCompartment = new Compartment();
  private applyingExternalValue = false;

  constructor(options: HellCodeEditorRuntimeOptions) {
    const root = resolveCodeEditorRoot(options.host);

    this.view = new EditorView({
      doc: options.value,
      parent: options.host,
      root,
      extensions: [
        hellCodeEditorSetupFactory(options.host.ownerDocument),
        hellCodeEditorTheme,
        this.extensionCompartment.of(options.extensions),
        this.readOnlyCompartment.of(this.readOnlyExtensions(options.readOnly)),
        this.accessibilityCompartment.of(this.accessibilityExtensions(options.accessibility)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !this.applyingExternalValue) {
            options.onValueChange(update.state.doc.toString());
          }
        }),
      ],
    });
  }

  setValue(next: string): void {
    const current = this.view.state.doc.toString();
    if (current === next) return;
    this.applyingExternalValue = true;
    try {
      this.view.dispatch({ changes: { from: 0, to: current.length, insert: next } });
    } finally {
      this.applyingExternalValue = false;
    }
  }

  setExtensions(extensions: Extension): void {
    this.view.dispatch({
      effects: this.extensionCompartment.reconfigure(extensions),
    });
  }

  setReadOnly(readOnly: boolean): void {
    this.view.dispatch({
      effects: this.readOnlyCompartment.reconfigure(this.readOnlyExtensions(readOnly)),
    });
  }

  setAccessibility(options: HellCodeEditorRuntimeAccessibilityOptions): void {
    this.view.dispatch({
      effects: this.accessibilityCompartment.reconfigure(this.accessibilityExtensions(options)),
    });
  }

  destroy(): void {
    this.view.destroy();
  }

  private readOnlyExtensions(readOnly: boolean): Extension {
    return [EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)];
  }

  private accessibilityExtensions(options: HellCodeEditorRuntimeAccessibilityOptions): Extension {
    const labelledby = cleanedAttribute(options.ariaLabelledby);
    const describedby = cleanedAttribute(options.ariaDescribedby);
    const attrs: Record<string, string> = {
      role: 'textbox',
      'aria-multiline': 'true',
      'aria-readonly': options.readOnly ? 'true' : 'false',
      spellcheck: 'false',
    };

    if (labelledby) {
      attrs['aria-labelledby'] = labelledby;
    } else {
      attrs['aria-label'] =
        cleanedAttribute(options.ariaLabel) ?? (options.readOnly ? 'Code viewer' : 'Code editor');
    }
    if (describedby) attrs['aria-describedby'] = describedby;
    // Explicit on editable content too: WebKit reports tabIndex -1 for
    // contenteditable elements, dropping the editor from the tab order and
    // failing scrollable-region-focusable checks once content overflows.
    attrs['tabindex'] = '0';

    return EditorView.contentAttributes.of(attrs);
  }
}

function cleanedAttribute(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
