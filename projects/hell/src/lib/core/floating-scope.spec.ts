import type { DestroyRef } from '@angular/core';

import {
  HellFloatingDismissController,
  HellFloatingInteractionController,
  HellFloatingScopeRegistry,
  hellDismissOn,
  hellEscapeKey,
  hellOutsideClick,
  hellOutsideFocus,
  hellOutsidePointer,
  hellRegisterFloatingElement,
  hellWithDismissEffect,
} from './floating-scope';

describe('Floating Scope', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers floating elements for the lifetime of a DestroyRef', () => {
    const root = document.createElement('div');
    const overlay = document.createElement('div');
    const child = document.createElement('button');
    overlay.append(child);
    document.body.append(root, overlay);

    const scope = new HellFloatingScopeRegistry(() => root);
    const destroy = createDestroyRef();

    hellRegisterFloatingElement(scope, overlay, destroy.ref);

    expect(scope.containsFloatingTarget(child)).toBe(true);

    destroy.run();

    expect(scope.containsFloatingTarget(child)).toBe(false);
  });

  it('dismisses only when a rule matches an event target outside the Floating Scope', () => {
    const root = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(root, outside);

    const dismissals: string[] = [];
    const destroy = createDestroyRef();
    let enabled = true;
    const controller = new HellFloatingDismissController({
      root: () => root,
      ownerDocument: () => document,
      dismiss: (context) => (enabled ? hellOutsidePointer(context) : null),
      onDismiss: ({ event }) => dismissals.push(event.type),
    });
    controller.connect(destroy.ref);

    root.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(dismissals).toEqual([]);

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(dismissals).toEqual(['pointerdown']);

    enabled = false;
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(dismissals).toEqual(['pointerdown']);

    destroy.run();
  });

  it('does not dismiss without an explicit dismissal rule', () => {
    const root = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(root, outside);

    const dismissals: Event[] = [];
    const destroy = createDestroyRef();
    const controller = new HellFloatingDismissController({
      root: () => root,
      ownerDocument: () => document,
      onDismiss: ({ event }) => dismissals.push(event),
    });
    controller.connect(destroy.ref);

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(dismissals).toEqual([]);

    destroy.run();
  });

  it('composes dismissal rules and fixed effects as the same rule type', () => {
    const root = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(root, outside);

    const dismissals: string[] = [];
    const destroy = createDestroyRef();
    const controller = new HellFloatingDismissController({
      root: () => root,
      ownerDocument: () => document,
      dismiss: hellDismissOn(
        hellOutsideFocus,
        hellWithDismissEffect(hellEscapeKey, { stopPropagation: true }),
      ),
      onDismiss: ({ event, decision }) => {
        dismissals.push(`${event.type}:${decision.stopPropagation ? 'stop' : 'pass'}`);
      },
    });
    controller.connect(destroy.ref);

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(dismissals).toEqual([]);

    outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(dismissals).toEqual(['focusin:pass']);

    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(dismissals).toEqual(['focusin:pass', 'keydown:stop']);

    destroy.run();
  });

  it('handles deferred focus exits without exposing pointer timing to callers', async () => {
    const root = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(root, outside);

    const dismissals: string[] = [];
    const controller = new HellFloatingDismissController({
      root: () => root,
      dismiss: hellOutsideFocus,
      onDismiss: ({ event }) => dismissals.push(event.type),
    });

    controller.handleFocusExit(new FocusEvent('blur'));
    await Promise.resolve();
    expect(dismissals).toEqual(['blur']);

    controller.markPointerDownInside();
    controller.handleFocusExit(new FocusEvent('blur'));
    await Promise.resolve();
    expect(dismissals).toEqual(['blur']);
  });

  it('connects a Floating Interaction surface to its scope and dismissal policy', () => {
    const root = document.createElement('div');
    const surface = document.createElement('div');
    const surfaceChild = document.createElement('button');
    const outside = document.createElement('button');
    surface.append(surfaceChild);
    document.body.append(root, surface, outside);

    const scope = new HellFloatingScopeRegistry(() => root);
    const destroy = createDestroyRef();
    const dismissals: string[] = [];
    const interaction = new HellFloatingInteractionController({
      surface: () => surface,
      scope,
      ownerDocument: () => document,
      dismiss: hellOutsideClick,
      onDismiss: ({ event }) => dismissals.push(event.type),
    });

    interaction.connect(destroy.ref);

    expect(scope.containsFloatingTarget(surfaceChild)).toBe(true);

    surfaceChild.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dismissals).toEqual([]);

    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dismissals).toEqual(['click']);

    destroy.run();

    expect(scope.containsFloatingTarget(surfaceChild)).toBe(false);
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
