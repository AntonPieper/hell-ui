import { TestBed } from '@angular/core/testing';
import { Injector, type DestroyRef } from '@angular/core';

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

  it('re-syncs on resize observer callback and disconnects on destroy', async () => {
    await TestBed.configureTestingModule({}).compileComponents();
    const hostRect = { left: 10, bottom: 40, width: 300 };
    const controlRect = { left: 20, bottom: 60, width: 340 };
    const host = elementWithRect(hostRect);
    const control = elementWithRect(controlRect);
    const destroy = createDestroyRef();
    const win = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      ResizeObserver: TestResizeObserver as unknown as typeof ResizeObserver,
    } as unknown as Window;

    const adapter = new HellOmnibarPositionAdapter({
      host: () => host,
      control: () => control,
      minWidth: () => 320,
      isOpen: () => true,
      destroyRef: destroy.ref,
      injector: TestBed.inject(Injector),
      ownerWindow: () => win,
    });

    adapter.connect();
    const observer = TestResizeObserver.instances.find((instance) =>
      instance.observed.includes(host) && instance.observed.includes(control),
    );
    expect(observer).toBeDefined();
    const updateNow = vi.spyOn(adapter, 'updateNow');

    hostRect.left = 44;
    hostRect.bottom = 72;
    controlRect.left = 14;
    controlRect.bottom = 88;
    controlRect.width = 500;

    observer?.trigger();
    await new Promise((resolve) => setTimeout(resolve));

    expect(updateNow).toHaveBeenCalled();
    expect(adapter.anchorTop()).toBe(92);
    expect(adapter.anchorLeft()).toBe(14);
    expect(adapter.anchorWidth()).toBe(500);

    destroy.run();

    expect(observer?.disconnect).toHaveBeenCalledTimes(1);
  });

  it('does not unobserve a control that becomes the next host target', () => {
    const hostA = elementWithRect({ left: 0, bottom: 0, width: 100 });
    const hostB = elementWithRect({ left: 0, bottom: 0, width: 100 });
    let host = hostA;
    let control: HTMLElement | null = hostB;
    const win = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      ResizeObserver: TestResizeObserver as unknown as typeof ResizeObserver,
    } as unknown as Window;
    const adapter = new HellOmnibarPositionAdapter({
      host: () => host,
      control: () => control,
      minWidth: () => 320,
      isOpen: () => false,
      destroyRef: createDestroyRef().ref,
      injector: {} as Injector,
      ownerWindow: () => win,
    });

    adapter.connect();
    const observer = TestResizeObserver.instances.at(-1);
    expect(observer?.observed).toEqual([hostA, hostB]);

    host = hostB;
    control = null;
    adapter.scheduleUpdate();

    expect(observer?.observed).toEqual([hostB]);
    expect(observer?.unobserved).toEqual([hostA]);
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
  vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => ({
    x: rect.left,
    y: 0,
    width: rect.width,
    height: rect.bottom,
    top: 0,
    right: rect.left + rect.width,
    bottom: rect.bottom,
    left: rect.left,
    toJSON: () => ({}),
  }));
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

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];

  readonly observed: HTMLElement[] = [];
  readonly unobserved: HTMLElement[] = [];
  readonly disconnect = vi.fn();

  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    TestResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    if (!this.observed.includes(element as HTMLElement)) {
      this.observed.push(element as HTMLElement);
    }
  }

  unobserve(element: Element): void {
    this.unobserved.push(element as HTMLElement);
    const index = this.observed.indexOf(element as HTMLElement);
    if (index >= 0) this.observed.splice(index, 1);
  }

  trigger(): void {
    const entry = {} as unknown as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }
}
