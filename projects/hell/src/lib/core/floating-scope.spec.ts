import type { DestroyRef } from '@angular/core';

import {
  HellFloatingDismissController,
  HellFloatingInteractionController,
  HellFloatingScopedInsetsRuntime,
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

  it('writes scoped inset vars to foreign-realm elements without falling back globally', () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const foreignDocument = iframe.contentDocument;
    if (!foreignDocument) throw new Error('Expected iframe document.');

    const root = foreignDocument.createElement('section');
    const overlay = foreignDocument.createElement('div');
    foreignDocument.body.append(root, overlay);
    mockRect(root, { left: 10, top: 20, right: 310, bottom: 220 });

    const runtime = new HellFloatingScopedInsetsRuntime({
      document: foreignDocument,
      rootSelector: '[data-scope-root]',
      variables: {
        top: '--hell-test-top',
        right: '--hell-test-right',
        bottom: '--hell-test-bottom',
        left: '--hell-test-left',
      },
      styleTargets: () => [root, overlay],
    });

    runtime.primeRoot(root);

    expect(root.style.getPropertyValue('--hell-test-left')).toBe('10px');
    expect(overlay.style.getPropertyValue('--hell-test-left')).toBe('10px');
    expect(foreignDocument.documentElement.style.getPropertyValue('--hell-test-left')).toBe('');

    runtime.clear();
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

  it('dismisses Escape key events from a foreign document realm', () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const foreignDocument = iframe.contentDocument;
    const foreignWindow = iframe.contentWindow as (Window & typeof globalThis) | null;
    if (!foreignDocument || !foreignWindow) throw new Error('Expected iframe realm.');

    const root = foreignDocument.createElement('div');
    foreignDocument.body.append(root);

    const dismissals: string[] = [];
    const destroy = createDestroyRef();
    const controller = new HellFloatingDismissController({
      root: () => root,
      ownerDocument: () => foreignDocument,
      dismiss: hellEscapeKey,
      onDismiss: ({ event }) => dismissals.push(event.type),
    });
    controller.connect(destroy.ref);

    root.dispatchEvent(new foreignWindow.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(dismissals).toEqual(['keydown']);

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

  it('restores focus to attached enabled focusable targets', () => {
    const root = document.createElement('div');
    const outside = document.createElement('button');
    const target = document.createElement('button');
    document.body.append(root, outside, target);

    const focusSpy = vi.spyOn(target, 'focus');
    const destroy = createDestroyRef();
    let active = true;
    const controller = new HellFloatingDismissController({
      root: () => root,
      active: () => active,
      dismiss: () => ({ restoreFocus: () => target }),
      onDismiss: () => {
        active = false;
      },
    });
    controller.connect(destroy.ref);

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(focusSpy).toHaveBeenCalledTimes(1);

    focusSpy.mockRestore();
    destroy.run();
  });

  it('does not focus restore targets that are detached, disabled, hidden, or non-focusable', () => {
    const root = document.createElement('div');
    const outside = document.createElement('button');
    const detachedTarget = document.createElement('button');
    const disabledTarget = document.createElement('button');
    const hiddenTarget = document.createElement('button');
    const nonFocusableTarget = document.createElement('div');
    disabledTarget.disabled = true;
    hiddenTarget.hidden = true;
    document.body.append(root, outside, detachedTarget, disabledTarget, hiddenTarget, nonFocusableTarget);

    const cases: HTMLElement[] = [detachedTarget, disabledTarget, hiddenTarget, nonFocusableTarget];

    for (const target of cases) {
      const focusSpy = vi.spyOn(target, 'focus');
      const destroy = createDestroyRef();
      const controller = new HellFloatingDismissController({
        root: () => root,
        dismiss: () => ({ restoreFocus: () => target }),
        onDismiss: () => {},
      });
      controller.connect(destroy.ref);

      if (target === detachedTarget) document.body.removeChild(target);

      expect(() => {
        outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      }).not.toThrow();
      expect(focusSpy).not.toHaveBeenCalled();

      focusSpy.mockRestore();
      destroy.run();
    }
  });

  it('does not process deferred focus exits from a stale blur during quick close/reopen', async () => {
    const root = document.createElement('div');
    const focusedChild = document.createElement('button');
    const outside = document.createElement('button');
    root.append(focusedChild);
    document.body.append(root, outside);

    const dismissals: string[] = [];
    let active = true;
    let activeKey = 1;
    const destroy = createDestroyRef();
    const controller = new HellFloatingDismissController({
      root: () => root,
      active: () => active,
      activeKey: () => activeKey,
      dismiss: hellOutsideFocus,
      onDismiss: ({ event }) => dismissals.push(event.type),
    });
    controller.connect(destroy.ref);

    const focusout = new FocusEvent('focusout', { bubbles: true, relatedTarget: outside });
    focusedChild.addEventListener('focusout', (event) => controller.handleFocusExit(event as FocusEvent));
    focusedChild.dispatchEvent(focusout);
    active = false;
    activeKey++;
    active = true;
    activeKey++;

    await Promise.resolve();
    expect(dismissals).toEqual([]);

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

function mockRect(
  element: HTMLElement,
  rect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom'>,
): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () =>
      ({
        ...rect,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
        x: rect.left,
        y: rect.top,
        toJSON: () => undefined,
      }) as DOMRect,
  });
}

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
