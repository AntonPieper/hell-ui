import type { DestroyRef, Injector } from '@angular/core';

import { HellOmnibarPositionAdapter } from './omnibar-position.adapter';

describe('HellOmnibarPositionAdapter', () => {
  it('measures the control and exposes anchor CSS-variable state', () => {
    const host = elementWithRect({ left: 10, bottom: 40, width: 200 });
    const control = elementWithRect({ left: 20, bottom: 60, width: 240 });
    const adapter = new HellOmnibarPositionAdapter({
      host: () => host,
      control: () => control,
      minWidth: () => 320,
      isOpen: () => true,
      destroyRef: createDestroyRef().ref,
      injector: {} as Injector,
      ownerWindow: () => null,
    });

    adapter.updateNow();

    expect(adapter.anchorTop()).toBe(64);
    expect(adapter.anchorLeft()).toBe(20);
    expect(adapter.anchorWidth()).toBe(320);
  });

  it('falls back to the host and uses measured width when it exceeds the minimum', () => {
    const host = elementWithRect({ left: 12, bottom: 50, width: 480 });
    const adapter = new HellOmnibarPositionAdapter({
      host: () => host,
      control: () => null,
      minWidth: () => 320,
      isOpen: () => true,
      destroyRef: createDestroyRef().ref,
      injector: {} as Injector,
      ownerWindow: () => null,
    });

    adapter.updateNow();

    expect(adapter.anchorTop()).toBe(54);
    expect(adapter.anchorLeft()).toBe(12);
    expect(adapter.anchorWidth()).toBe(480);
  });

  it('registers viewport listeners until destroy', () => {
    const destroy = createDestroyRef();
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const win = { addEventListener, removeEventListener } as unknown as Window;
    const adapter = new HellOmnibarPositionAdapter({
      host: () => elementWithRect({ left: 0, bottom: 0, width: 0 }),
      control: () => null,
      minWidth: () => 320,
      isOpen: () => true,
      destroyRef: destroy.ref,
      injector: {} as Injector,
      ownerWindow: () => win,
    });

    adapter.connect();

    const resizeHandler = addEventListener.mock.calls.find((call) => call[0] === 'resize')?.[1];
    const scrollHandler = addEventListener.mock.calls.find((call) => call[0] === 'scroll')?.[1];
    expect(addEventListener).toHaveBeenCalledWith('resize', resizeHandler, { passive: true });
    expect(addEventListener).toHaveBeenCalledWith('scroll', scrollHandler, {
      passive: true,
      capture: true,
    });

    destroy.run();

    expect(removeEventListener).toHaveBeenCalledWith('resize', resizeHandler);
    expect(removeEventListener).toHaveBeenCalledWith('scroll', scrollHandler, {
      passive: true,
      capture: true,
    });
  });

  it('treats an explicitly missing window as no viewport listener support', () => {
    const destroy = createDestroyRef();
    const adapter = new HellOmnibarPositionAdapter({
      host: () => elementWithRect({ left: 0, bottom: 0, width: 0 }),
      control: () => null,
      minWidth: () => 320,
      isOpen: () => true,
      destroyRef: destroy.ref,
      injector: {} as Injector,
      ownerWindow: () => null,
    });

    adapter.connect();
    destroy.run();

    expect(adapter.anchorWidth()).toBe(320);
  });
});

function elementWithRect(rect: Pick<DOMRect, 'left' | 'bottom' | 'width'>): HTMLElement {
  const element = document.createElement('div');
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: rect.left,
    y: 0,
    width: rect.width,
    height: rect.bottom,
    top: 0,
    right: rect.left + rect.width,
    bottom: rect.bottom,
    left: rect.left,
    toJSON: () => ({}),
  });
  return element;
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
