import type { DestroyRef } from '@angular/core';

import {
  HellFloatingDismissController,
  HellOverlayScopeRegistry,
  hellRegisterOverlayElement,
} from './overlay-scope';

describe('Floating Scope', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers overlay elements for the lifetime of a DestroyRef', () => {
    const root = document.createElement('div');
    const overlay = document.createElement('div');
    const child = document.createElement('button');
    overlay.append(child);
    document.body.append(root, overlay);

    const scope = new HellOverlayScopeRegistry(() => root);
    const destroy = createDestroyRef();

    hellRegisterOverlayElement(scope, overlay, destroy.ref);

    expect(scope.containsOverlayTarget(child)).toBe(true);

    destroy.run();

    expect(scope.containsOverlayTarget(child)).toBe(false);
  });

  it('dismisses only when enabled and the event target is outside the Floating Scope', () => {
    const root = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(root, outside);

    const dismissals: string[] = [];
    const destroy = createDestroyRef();
    let enabled = true;
    const controller = new HellFloatingDismissController({
      root: () => root,
      ownerDocument: () => document,
      closeOnOutsidePointer: () => enabled,
      onDismiss: ({ reason }) => dismissals.push(reason),
    });
    controller.connect(destroy.ref);

    root.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(dismissals).toEqual([]);

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(dismissals).toEqual(['outside-pointer']);

    enabled = false;
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(dismissals).toEqual(['outside-pointer']);

    destroy.run();
  });
});

function createDestroyRef() {
  const callbacks: (() => void)[] = [];
  return {
    ref: {
      onDestroy(callback: () => void) {
        callbacks.push(callback);
      },
    } as DestroyRef,
    run() {
      for (const callback of callbacks.splice(0)) callback();
    },
  };
}
