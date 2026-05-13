import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import { HellCodeEditorRuntime } from './code-editor.runtime';

describe('HellCodeEditorRuntime', () => {
  it('emits user edits but not external value writes', () => {
    const host = document.createElement('div');
    const values: string[] = [];
    const runtime = new HellCodeEditorRuntime({
      host,
      value: 'alpha',
      extensions: [],
      readOnly: false,
      onValueChange: (value) => values.push(value),
    });

    runtime.setValue('beta');
    expect(values).toEqual([]);
    expect(runtime.view.state.doc.toString()).toBe('beta');

    runtime.view.dispatch({ changes: { from: 0, to: 4, insert: 'gamma' } });
    expect(values).toEqual(['gamma']);

    runtime.destroy();
  });

  it('reconfigures extensions and read-only state without recreating the view', () => {
    const host = document.createElement('div');
    const runtime = new HellCodeEditorRuntime({
      host,
      value: 'alpha',
      extensions: [],
      readOnly: false,
      onValueChange: () => {},
    });
    const view = runtime.view;

    runtime.setExtensions(EditorView.lineWrapping);
    runtime.setReadOnly(true);

    expect(runtime.view).toBe(view);
    expect(runtime.view.state.facet(EditorState.readOnly)).toBe(true);

    runtime.destroy();
  });

  it('keeps fold-marker and event setup in the host document realm', () => {
    const foreignDocument = document.implementation.createHTMLDocument('hell-code-editor');
    const host = foreignDocument.createElement('div');

    const runtime = new HellCodeEditorRuntime({
      host,
      value: 'alpha',
      extensions: [],
      readOnly: false,
      onValueChange: () => {},
    });

    const root = (runtime.view as unknown as { root: Document | ShadowRoot }).root;
    expect(runtime.view.dom.ownerDocument).toBe(foreignDocument);
    expect(root).toBe(foreignDocument);

    runtime.destroy();
  });
});
