import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import {
  HellCodeEditorRuntime,
  hellCodeEditorSetupFactory,
  type HellCodeEditorRuntimeAccessibilityOptions,
  type HellCodeEditorRuntimeOptions,
} from './code-editor.runtime';

const defaultAccessibility: HellCodeEditorRuntimeAccessibilityOptions = {
  ariaLabel: 'Example source code',
  ariaLabelledby: null,
  ariaDescribedby: null,
  readOnly: false,
};

function runtimeOptions(
  options: Partial<HellCodeEditorRuntimeOptions> & Pick<HellCodeEditorRuntimeOptions, 'host'>,
): HellCodeEditorRuntimeOptions {
  return {
    value: 'alpha',
    extensions: [],
    readOnly: false,
    accessibility: defaultAccessibility,
    onValueChange: () => {},
    ...options,
  };
}

describe('HellCodeEditorRuntime', () => {
  it('creates base setup per document via factory', () => {
    const foreignDocument = document.implementation.createHTMLDocument('hell-code-editor');
    const host = foreignDocument.createElement('div');

    const view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [hellCodeEditorSetupFactory(foreignDocument)],
      }),
      parent: host,
    });

    expect(view.dom.ownerDocument).toBe(foreignDocument);

    view.destroy();
  });

  it('emits user edits but not external value writes', () => {
    const host = document.createElement('div');
    const values: string[] = [];
    const runtime = new HellCodeEditorRuntime(
      runtimeOptions({
        host,
        onValueChange: (value) => values.push(value),
      }),
    );

    runtime.setValue('beta');
    expect(values).toEqual([]);
    expect(runtime.view.state.doc.toString()).toBe('beta');

    runtime.view.dispatch({ changes: { from: 0, to: 4, insert: 'gamma' } });
    expect(values).toEqual(['gamma']);

    runtime.destroy();
  });

  it('reconfigures extensions, read-only state, and accessibility without recreating the view', () => {
    const host = document.createElement('div');
    const runtime = new HellCodeEditorRuntime(runtimeOptions({ host }));
    const view = runtime.view;

    runtime.setExtensions(EditorView.lineWrapping);
    runtime.setReadOnly(true);
    runtime.setAccessibility({
      ariaLabel: 'Read-only example source code',
      ariaLabelledby: null,
      ariaDescribedby: 'code-help',
      readOnly: true,
    });

    expect(runtime.view).toBe(view);
    expect(runtime.view.state.facet(EditorState.readOnly)).toBe(true);
    expect(runtime.view.contentDOM.getAttribute('aria-label')).toBe(
      'Read-only example source code',
    );
    expect(runtime.view.contentDOM.getAttribute('aria-describedby')).toBe('code-help');
    expect(runtime.view.contentDOM.getAttribute('aria-readonly')).toBe('true');
    expect(runtime.view.contentDOM.getAttribute('tabindex')).toBe('0');

    runtime.destroy();
  });

  it('keeps editable content in the tab order with an explicit tabindex', () => {
    const host = document.createElement('div');
    const runtime = new HellCodeEditorRuntime(runtimeOptions({ host }));

    expect(runtime.view.contentDOM.getAttribute('tabindex')).toBe('0');

    runtime.destroy();
  });

  it('prefers aria-labelledby over aria-label for the content element name', () => {
    const host = document.createElement('div');
    const runtime = new HellCodeEditorRuntime(
      runtimeOptions({
        host,
        accessibility: {
          ariaLabel: 'Fallback label',
          ariaLabelledby: 'visible-code-label',
          ariaDescribedby: null,
          readOnly: false,
        },
      }),
    );

    expect(runtime.view.contentDOM.getAttribute('aria-labelledby')).toBe('visible-code-label');
    expect(runtime.view.contentDOM.hasAttribute('aria-label')).toBe(false);

    runtime.destroy();
  });

  it('keeps fold-marker and event setup in the host document realm', () => {
    const foreignDocument = document.implementation.createHTMLDocument('hell-code-editor');
    const host = foreignDocument.createElement('div');

    const runtime = new HellCodeEditorRuntime(runtimeOptions({ host }));

    const root = (runtime.view as unknown as { root: Document | ShadowRoot }).root;
    expect(runtime.view.dom.ownerDocument).toBe(foreignDocument);
    expect(root).toBe(foreignDocument);

    runtime.destroy();
  });

  it('uses ShadowRoot root when the host is slotted into one', () => {
    const host = document.createElement('div');
    const container = document.createElement('div');
    const shadow = container.attachShadow({ mode: 'open' });
    shadow.append(host);
    document.body.append(container);

    const runtime = new HellCodeEditorRuntime(runtimeOptions({ host }));

    const root = (runtime.view as unknown as { root: Document | ShadowRoot }).root;
    expect(root).toBe(shadow);

    runtime.destroy();
    container.remove();
  });
});
