import { DOCUMENT } from '@angular/common';
import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HellGlobalKeydownService,
  matchHotkey,
  hellShouldHandleGlobalHotkey,
} from './hotkeys';

describe('Core Hotkeys', () => {
  it('matches requested modifiers and rejects extra strict modifiers', () => {
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }), 'ctrl+k')).toBe(
      true,
    );
    expect(
      matchHotkey(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, altKey: true }),
        'ctrl+k',
      ),
    ).toBe(false);
  });

  it('matches aliases and literal keys', () => {
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'k', metaKey: true }), 'cmd+k')).toBe(
      true,
    );
    expect(matchHotkey(new KeyboardEvent('keydown', { key: '?' }), '?')).toBe(true);
  });

  it('rejects extra shift for unshifted punctuation combos', () => {
    expect(matchHotkey(new KeyboardEvent('keydown', { key: '/', shiftKey: true }), '/')).toBe(
      false,
    );
    expect(matchHotkey(new KeyboardEvent('keydown', { key: '?', shiftKey: true }), '?')).toBe(true);
  });

  it('blocks editor typing unless modifier requested for editable active targets', () => {
    document.body.innerHTML = '<input id="editor">';
    const editor = document.getElementById('editor') as HTMLInputElement;
    editor.focus();

    const plainEvent = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    Object.defineProperty(plainEvent, 'view', { value: document.defaultView });

    expect(hellShouldHandleGlobalHotkey(plainEvent, '/')).toBe(false);

    const withModifierEvent = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(withModifierEvent, 'view', { value: document.defaultView });

    expect(hellShouldHandleGlobalHotkey(withModifierEvent, 'ctrl+k')).toBe(true);
  });

  it('blocks shift-only printable shortcuts from editable active targets', () => {
    document.body.innerHTML = '<input id="editor">';
    const editor = document.getElementById('editor') as HTMLInputElement;
    editor.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'A',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'view', { value: document.defaultView });

    expect(hellShouldHandleGlobalHotkey(event, 'shift+a')).toBe(false);
  });

  it('blocks bare shortcuts from nested contenteditable targets', () => {
    document.body.innerHTML = '<div id="editor" contenteditable="true"><span id="child"></span></div>';
    const child = document.getElementById('child') as HTMLSpanElement;
    const results: boolean[] = [];

    child.addEventListener('keydown', (event) => {
      results.push(hellShouldHandleGlobalHotkey(event, '/'));
      results.push(hellShouldHandleGlobalHotkey(event, 'ctrl+k'));
    });
    child.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }));

    expect(results).toEqual([false, true]);
  });
});

describe('HellGlobalKeydownService', () => {
  let doc: FakeDocument;
  let service: HellGlobalKeydownService;

  beforeEach(() => {
    doc = new FakeDocument();
    TestBed.configureTestingModule({
      providers: [
        HellGlobalKeydownService,
        { provide: DOCUMENT, useValue: doc },
      ],
    });
    service = TestBed.inject(HellGlobalKeydownService);
  });

  it('cleans up keydown listeners on destroy', () => {
    const destroyRef = createDestroyRef();
    const handler = vi.fn((event: KeyboardEvent) => event.preventDefault());

    service.register(handler, destroyRef);
    doc.dispatch(new KeyboardEvent('keydown', { key: 'k', cancelable: true }));
    destroyRef.destroy();
    doc.dispatch(new KeyboardEvent('keydown', { key: 'k', cancelable: true }));

    expect(handler).toHaveBeenCalledOnce();
    expect(doc.addEventListener).toHaveBeenCalledOnce();
    expect(doc.removeEventListener).toHaveBeenCalledOnce();
  });

  it('allows manual unregister without duplicate remove work', () => {
    const destroyRef = createDestroyRef();
    const handler = vi.fn();

    const unregister = service.register(handler, destroyRef);
    unregister();
    unregister();
    destroyRef.destroy();
    doc.dispatch(new KeyboardEvent('keydown', { key: 'k', cancelable: true }));

    expect(handler).not.toHaveBeenCalled();
    expect(doc.removeEventListener).toHaveBeenCalledOnce();
  });

  it('leaves already-prevented app shortcuts alone', () => {
    const destroyRef = createDestroyRef();
    const handler = vi.fn();
    const event = new KeyboardEvent('keydown', { key: 'k', cancelable: true });

    service.register(handler, destroyRef);
    event.preventDefault();
    doc.dispatch(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('keeps multiple instances isolated after one handles a shortcut', () => {
    const destroyA = createDestroyRef();
    const destroyB = createDestroyRef();
    const handlerA = vi.fn((event: KeyboardEvent) => event.preventDefault());
    const handlerB = vi.fn();

    const unregisterA = service.register(handlerA, destroyA);
    service.register(handlerB, destroyB);

    doc.dispatch(new KeyboardEvent('keydown', { key: 'k', cancelable: true }));
    unregisterA();
    doc.dispatch(new KeyboardEvent('keydown', { key: 'k', cancelable: true }));
    destroyB.destroy();
    doc.dispatch(new KeyboardEvent('keydown', { key: 'k', cancelable: true }));

    expect(handlerA).toHaveBeenCalledOnce();
    expect(handlerB).toHaveBeenCalledOnce();
  });
});

class FakeDocument {
  readonly listeners = new Set<EventListener>();
  readonly addEventListener = vi.fn((type: string, listener: EventListener) => {
    if (type === 'keydown') this.listeners.add(listener);
  });
  readonly removeEventListener = vi.fn((type: string, listener: EventListener) => {
    if (type === 'keydown') this.listeners.delete(listener);
  });

  dispatch(event: KeyboardEvent): void {
    for (const listener of [...this.listeners]) listener(event);
  }
}

interface FakeDestroyRef extends DestroyRef {
  destroy(): void;
}

function createDestroyRef(): FakeDestroyRef {
  const callbacks = new Set<() => void>();
  return {
    get destroyed() {
      return callbacks.size === 0;
    },
    onDestroy(callback: () => void): () => void {
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    },
    destroy(): void {
      for (const callback of [...callbacks]) callback();
      callbacks.clear();
    },
  };
}
