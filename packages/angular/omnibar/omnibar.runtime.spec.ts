import { TestBed } from '@angular/core/testing';

import {
  HellOmnibarActiveItemController,
  type HellOmnibarActiveItemOption,
} from './omnibar.active-item';
import { HellOmnibarRuntime } from './omnibar.runtime';
import type { HellSearchResponse, HellSearchSource } from '@hell-ui/angular/core';

describe('HellOmnibarRuntime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps only the latest async search result and aborts superseded work', async () => {
    await TestBed.configureTestingModule({
      providers: [HellOmnibarRuntime],
    });
    const runtime = TestBed.inject(HellOmnibarRuntime) as HellOmnibarRuntime<{
      readonly id: string;
    }>;
    const first = deferred<HellSearchResponse<{ readonly id: string }>>();
    const second = deferred<HellSearchResponse<{ readonly id: string }>>();
    let firstSignal: AbortSignal | undefined;
    let secondSignal: AbortSignal | undefined;
    const firstSource: HellSearchSource<{ readonly id: string }> = (request) => {
      firstSignal = request.signal;
      return first.promise;
    };
    const secondSource: HellSearchSource<{ readonly id: string }> = (request) => {
      secondSignal = request.signal;
      return second.promise;
    };

    runtime.setQuery('first');
    const firstSearch = runtime.searchNow({ source: firstSource });
    runtime.setQuery('second');
    const secondSearch = runtime.searchNow({ source: secondSource });

    expect(firstSignal?.aborted).toBe(true);
    expect(secondSignal?.aborted).toBe(false);

    second.resolve({ results: [{ item: { id: 'second' }, score: 1 }] });
    await secondSearch;

    expect(runtime.results().map((result) => result.item.id)).toEqual(['second']);
    expect(runtime.loading()).toBe(false);

    first.resolve({ results: [{ item: { id: 'first' }, score: 99 }] });
    await firstSearch;

    expect(runtime.results().map((result) => result.item.id)).toEqual(['second']);
    expect(runtime.loading()).toBe(false);
  });

  it('cancels scheduled searches before the debounce fires', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [HellOmnibarRuntime],
    });
    const runtime = TestBed.inject(HellOmnibarRuntime);
    const source = vi.fn(() => ({ results: [] }));

    runtime.scheduleSearch({ source }, 25);
    vi.advanceTimersByTime(24);
    runtime.cancel();
    vi.advanceTimersByTime(1);

    expect(source).not.toHaveBeenCalled();
    expect(runtime.loading()).toBe(false);
  });
});

describe('HellOmnibarActiveItemController', () => {
  const controller = new HellOmnibarActiveItemController<TestOmnibarActiveItem>();

  it('projects active state through enabled items only', () => {
    const disabled = omnibarItem('disabled', true);
    const alpha = omnibarItem('alpha');
    const beta = omnibarItem('beta');
    const snapshot = { items: [disabled, alpha, beta], activeIndex: 99 };

    expect(controller.activeIndex(snapshot)).toBe(1);
    expect(controller.activeItem(snapshot)).toBe(beta);
    expect(controller.first(snapshot)).toBe(0);
    expect(controller.last(snapshot)).toBe(1);
  });

  it('wraps keyboard movement across enabled items', () => {
    const alpha = omnibarItem('alpha');
    const disabled = omnibarItem('disabled', true);
    const beta = omnibarItem('beta');
    const items = [alpha, disabled, beta];

    expect(controller.move({ items, activeIndex: 0 }, -1)).toEqual({
      activeIndex: 1,
      item: beta,
    });
    expect(controller.move({ items, activeIndex: 1 }, 1)).toEqual({
      activeIndex: 0,
      item: alpha,
    });
  });

  it('does not activate disabled or unregistered items', () => {
    const alpha = omnibarItem('alpha');
    const disabled = omnibarItem('disabled', true);
    const beta = omnibarItem('beta');
    const unregistered = omnibarItem('unregistered');
    const snapshot = { items: [alpha, disabled, beta], activeIndex: 0 };

    expect(controller.setActive(snapshot, disabled)).toBe(0);
    expect(controller.setActive(snapshot, unregistered)).toBe(0);
    expect(controller.setActive(snapshot, beta)).toBe(1);
  });

  it('leaves empty item lists inert', () => {
    const snapshot = { items: [], activeIndex: 4 };

    expect(controller.activeIndex(snapshot)).toBe(-1);
    expect(controller.activeItem(snapshot)).toBeNull();
    expect(controller.move(snapshot, 1)).toEqual({ activeIndex: 4, item: null });
    expect(controller.first(snapshot)).toBe(4);
    expect(controller.last(snapshot)).toBe(4);
  });
});

interface TestOmnibarActiveItem extends HellOmnibarActiveItemOption {
  readonly id: string;
}

function omnibarItem(id: string, disabled = false): TestOmnibarActiveItem {
  return {
    id,
    disabled: () => disabled,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
